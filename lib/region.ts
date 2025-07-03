import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import * as zlib from "node:zlib";

const inflate = promisify(zlib.inflate);
import sharp from "sharp";

import {
	BIOME_FOLIAGE_COLORS,
	BIOME_GRASS_COLORS,
	BIOME_WATER_COLORS,
	DECORATION_BLOCKS,
	DECORATION_COLORS,
	FALLBACK_COLORS,
	OVERRIDE_COLORS,
} from "@/constants/color";
import { TEXTURE_MAP } from "@/constants/texture";
import { SOLID_BLOCKS } from "@/constants/block";
import { CONFIG } from "@/constants/config";

import { NBTParser } from "./nbt";
import { hslToRgb, rgbToHsl, unpackPaletteData } from "./utils";

import type { Color } from "./types";

// --- TYPES ---
const EMPTY_Y = -10000;
type ChunkSection = { y: number; blockNames: string[]; biomeNames: string[] };

class ColumnMap {
	public readonly surfaceY: Int16Array;
	public readonly surfaceNameId: Uint16Array;
	public readonly surfaceBiomeId: Uint16Array;
	public readonly floorY: Int16Array;
	public readonly floorNameId: Uint16Array;
	public readonly floorBiomeId: Uint16Array;
	public readonly decorationY: Int16Array;
	public readonly decorationNameId: Uint16Array;
	public readonly decorationBiomeId: Uint16Array;

	constructor() {
		const size = 512 * 512;
		this.surfaceY = new Int16Array(size).fill(EMPTY_Y);
		this.surfaceNameId = new Uint16Array(size);
		this.surfaceBiomeId = new Uint16Array(size);
		this.floorY = new Int16Array(size).fill(EMPTY_Y);
		this.floorNameId = new Uint16Array(size);
		this.floorBiomeId = new Uint16Array(size);
		this.decorationY = new Int16Array(size).fill(EMPTY_Y);
		this.decorationNameId = new Uint16Array(size);
		this.decorationBiomeId = new Uint16Array(size);
	}
}

export class Region {
	private readonly TEXTURE_CACHE: Record<string, Color>;
	private blockNameIds = new Map<string, number>();
	private biomeNameIds = new Map<string, number>();
	private idToBlockName: string[] = [];
	private idToBiomeName: string[] = [];

	private ambientOcclusionMap!: Float32Array;

	// These arrays will hold the FINAL blended color data.
	private blendedGrassR!: Float32Array;
	private blendedGrassG!: Float32Array;
	private blendedGrassB!: Float32Array;
	private blendedFoliageR!: Float32Array;
	private blendedFoliageG!: Float32Array;
	private blendedFoliageB!: Float32Array;
	private blendedWaterR!: Float32Array;
	private blendedWaterG!: Float32Array;
	private blendedWaterB!: Float32Array;

	private readonly loggedMissingBlocks = new Set<string>();
	private readonly loggedMissingDecorations = new Set<string>();

	constructor(private projectRoot: string) {
		this.TEXTURE_CACHE = JSON.parse(
			fs.readFileSync(path.join(projectRoot, "texture_cache.json"), "utf-8"),
		);
	}

	private getBlockId(name: string): number {
		let id = this.blockNameIds.get(name);
		if (id === undefined) {
			id = this.idToBlockName.length;
			this.blockNameIds.set(name, id);
			this.idToBlockName.push(name);
		}
		return id;
	}
	private getBiomeId(name: string): number {
		let id = this.biomeNameIds.get(name);
		if (id === undefined) {
			id = this.idToBiomeName.length;
			this.biomeNameIds.set(name, id);
			this.idToBiomeName.push(name);
		}
		return id;
	}

	private clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	private getBiomeColor(
		biomeName: string,
		colorMap: Record<string, Color>,
	): Color {
		const prefixedName = biomeName.includes(":")
			? biomeName
			: `minecraft:${biomeName}`;
		return colorMap[prefixedName] || colorMap.default;
	}

	private getBlockColor(
		nameId: number,
		biomeId: number,
		x: number,
		z: number,
	): Color | null {
		const blockName = this.idToBlockName[nameId];
		if (OVERRIDE_COLORS[blockName]) return OVERRIDE_COLORS[blockName];

		if (DECORATION_BLOCKS.has(blockName)) {
			const color = DECORATION_COLORS[blockName];
			if (color) return color;
			if (!this.loggedMissingDecorations.has(blockName)) {
				console.warn(
					`[${process.pid}] Color for decoration "${blockName}" not found.`,
				);
				this.loggedMissingDecorations.add(blockName);
			}
			return null;
		}

		const cleanName = blockName.replace("minecraft:", "");

		const biomeDependent =
			cleanName === "grass_block" ||
			cleanName.includes("leaves") ||
			cleanName.includes("grass") ||
			cleanName.includes("fern") ||
			cleanName === "vine" ||
			cleanName === "water";

		if (biomeDependent) {
			if (CONFIG.ENABLE_BIOME_BLENDING) {
				const idx = z * 512 + x;
				if (cleanName === "water")
					return {
						r: this.blendedWaterR[idx],
						g: this.blendedWaterG[idx],
						b: this.blendedWaterB[idx],
					};
				if (cleanName.includes("leaves") || cleanName === "vine")
					return {
						r: this.blendedFoliageR[idx],
						g: this.blendedFoliageG[idx],
						b: this.blendedFoliageB[idx],
					};
				return {
					r: this.blendedGrassR[idx],
					g: this.blendedGrassG[idx],
					b: this.blendedGrassB[idx],
				};
			}
			const biomeName = this.idToBiomeName[biomeId];
			if (cleanName === "water")
				return this.getBiomeColor(biomeName, BIOME_WATER_COLORS);
			const colorMap =
				cleanName.includes("leaves") || cleanName === "vine"
					? BIOME_FOLIAGE_COLORS
					: BIOME_GRASS_COLORS;
			return this.getBiomeColor(biomeName, colorMap);
		}

		const textureName = TEXTURE_MAP[blockName] || cleanName;
		const color = this.TEXTURE_CACHE[textureName];
		if (color) return color;

		if (!this.loggedMissingBlocks.has(blockName)) {
			console.warn(
				`[${process.pid}] WARN: Color for block "${blockName}" (texture: "${textureName}") not found.`,
			);
			this.loggedMissingBlocks.add(blockName);
		}
		return FALLBACK_COLORS.default;
	}

	private calculateBlendedBiomeColors(columnMap: ColumnMap): void {
		const size = 512 * 512;
		const radius = CONFIG.BIOME_BLEND_RADIUS;

		// Create temporary raw color arrays
		const rawGrassR = new Float32Array(size);
		const rawGrassG = new Float32Array(size);
		const rawGrassB = new Float32Array(size);
		const rawFoliageR = new Float32Array(size);
		const rawFoliageG = new Float32Array(size);
		const rawFoliageB = new Float32Array(size);
		const rawWaterR = new Float32Array(size);
		const rawWaterG = new Float32Array(size);
		const rawWaterB = new Float32Array(size);

		// Initialize class-level final arrays
		this.blendedGrassR = new Float32Array(size);
		this.blendedGrassG = new Float32Array(size);
		this.blendedGrassB = new Float32Array(size);
		this.blendedFoliageR = new Float32Array(size);
		this.blendedFoliageG = new Float32Array(size);
		this.blendedFoliageB = new Float32Array(size);
		this.blendedWaterR = new Float32Array(size);
		this.blendedWaterG = new Float32Array(size);
		this.blendedWaterB = new Float32Array(size);

		for (let i = 0; i < size; i++) {
			const biomeId =
				columnMap.decorationY[i] > columnMap.surfaceY[i]
					? columnMap.decorationBiomeId[i]
					: columnMap.surfaceY[i] !== EMPTY_Y
						? columnMap.surfaceBiomeId[i]
						: this.getBiomeId("minecraft:plains");
			const biome = this.idToBiomeName[biomeId];

			const grass = this.getBiomeColor(biome, BIOME_GRASS_COLORS);
			rawGrassR[i] = grass.r;
			rawGrassG[i] = grass.g;
			rawGrassB[i] = grass.b;
			const foliage = this.getBiomeColor(biome, BIOME_FOLIAGE_COLORS);
			rawFoliageR[i] = foliage.r;
			rawFoliageG[i] = foliage.g;
			rawFoliageB[i] = foliage.b;
			const water = this.getBiomeColor(biome, BIOME_WATER_COLORS);
			rawWaterR[i] = water.r;
			rawWaterG[i] = water.g;
			rawWaterB[i] = water.b;
		}

		// This loop is the hot path for blending.
		for (let z = 0; z < 512; z++) {
			for (let x = 0; x < 512; x++) {
				let totalWeight = 0;
				const acc = {
					gR: 0,
					gG: 0,
					gB: 0,
					fR: 0,
					fG: 0,
					fB: 0,
					wR: 0,
					wG: 0,
					wB: 0,
				};

				for (let dz = -radius; dz <= radius; dz++) {
					for (let dx = -radius; dx <= radius; dx++) {
						const sampleX = this.clamp(x + dx, 0, 511);
						const sampleZ = this.clamp(z + dz, 0, 511);
						const idx = sampleZ * 512 + sampleX;
						const weight = 1 / (dx * dx + dz * dz + 1);

						acc.gR += rawGrassR[idx] * weight;
						acc.gG += rawGrassG[idx] * weight;
						acc.gB += rawGrassB[idx] * weight;
						acc.fR += rawFoliageR[idx] * weight;
						acc.fG += rawFoliageG[idx] * weight;
						acc.fB += rawFoliageB[idx] * weight;
						acc.wR += rawWaterR[idx] * weight;
						acc.wG += rawWaterG[idx] * weight;
						acc.wB += rawWaterB[idx] * weight;
						totalWeight += weight;
					}
				}
				const i = z * 512 + x;
				this.blendedGrassR[i] = acc.gR / totalWeight;
				this.blendedGrassG[i] = acc.gG / totalWeight;
				this.blendedGrassB[i] = acc.gB / totalWeight;
				this.blendedFoliageR[i] = acc.fR / totalWeight;
				this.blendedFoliageG[i] = acc.fG / totalWeight;
				this.blendedFoliageB[i] = acc.fB / totalWeight;
				this.blendedWaterR[i] = acc.wR / totalWeight;
				this.blendedWaterG[i] = acc.wG / totalWeight;
				this.blendedWaterB[i] = acc.wB / totalWeight;
			}
		}
	}

	private calculateAmbientOcclusion(columnMap: ColumnMap): void {
		const heightGrid = new Int16Array(512 * 512);
		for (let i = 0; i < heightGrid.length; i++) {
			const surfaceY = columnMap.surfaceY[i];
			if (surfaceY === EMPTY_Y) {
				heightGrid[i] = EMPTY_Y;
				continue;
			}
			const floorY = columnMap.floorY[i];
			if (
				CONFIG.ENABLE_WATER_DEPTH_EFFECT &&
				this.idToBlockName[columnMap.surfaceNameId[i]] === "minecraft:water" &&
				floorY !== EMPTY_Y
			) {
				heightGrid[i] = floorY;
			} else {
				heightGrid[i] = Math.max(surfaceY, columnMap.decorationY[i]);
			}
		}

		this.ambientOcclusionMap = new Float32Array(512 * 512).fill(1.0);
		const radius = CONFIG.AMBIENT_OCCLUSION_RADIUS;
		const neighborCount = (radius * 2 + 1) ** 2 - 1;

		for (let z = 0; z < 512; z++) {
			for (let x = 0; x < 512; x++) {
				const centerIdx = z * 512 + x;
				const centerHeight = heightGrid[centerIdx];
				if (centerHeight === EMPTY_Y) continue;

				let occludingNeighbors = 0;
				for (let dz = -radius; dz <= radius; dz++) {
					for (let dx = -radius; dx <= radius; dx++) {
						if (dx === 0 && dz === 0) continue;
						const sampleX = this.clamp(x + dx, 0, 511);
						const sampleZ = this.clamp(z + dz, 0, 511);
						if (heightGrid[sampleZ * 512 + sampleX] > centerHeight) {
							occludingNeighbors++;
						}
					}
				}
				if (occludingNeighbors > 0) {
					this.ambientOcclusionMap[centerIdx] =
						1.0 -
						(occludingNeighbors / neighborCount) *
							CONFIG.AMBIENT_OCCLUSION_STRENGTH;
				}
			}
		}
	}

	public async processRegionFile(
		filePath: string,
		regionX: number,
		regionZ: number,
	): Promise<"processed" | "skipped"> {
		const regionBuffer = await fs.promises.readFile(filePath);
		const { columnMap, hasRenderableContent } =
			await this._buildColumnMap(regionBuffer);

		if (!hasRenderableContent) return "skipped";
		if (CONFIG.ENABLE_AMBIENT_OCCLUSION)
			this.calculateAmbientOcclusion(columnMap);
		if (CONFIG.ENABLE_BIOME_BLENDING)
			this.calculateBlendedBiomeColors(columnMap);

		const imageData = this._renderImageFromMap(columnMap);
		const outPath = path.join(this.projectRoot, "out");
		await fs.promises.mkdir(outPath, { recursive: true });
		const outputPath = path.join(outPath, `r.${regionX}.${regionZ}.png`);

		await sharp(imageData, { raw: { width: 512, height: 512, channels: 3 } })
			.png({ palette: false, dither: 0 })
			.toFile(outputPath);
		return "processed";
	}

	private async _buildColumnMap(
		regionBuffer: Buffer,
	): Promise<{ columnMap: ColumnMap; hasRenderableContent: boolean }> {
		const columnMap = new ColumnMap();
		const promises = Array.from({ length: 1024 }, (_, i) =>
			this._processChunk(i, regionBuffer, columnMap),
		);
		const totalRenderableBlocksFound = (await Promise.all(promises)).reduce(
			(sum, count) => sum + count,
			0,
		);
		return { columnMap, hasRenderableContent: totalRenderableBlocksFound > 0 };
	}

	private async _processChunk(
		chunkIndex: number,
		regionBuffer: Buffer,
		columnMap: ColumnMap,
	): Promise<number> {
		const location = regionBuffer.readUInt32BE(chunkIndex * 4);
		if (location === 0) return 0;
		const chunkOffset = (location >> 8) * 4096;
		const chunkDataLength = regionBuffer.readUInt32BE(chunkOffset);
		if (chunkDataLength <= 1) return 0;
		const chunkBuffer = regionBuffer.subarray(
			chunkOffset + 5,
			chunkOffset + 4 + chunkDataLength,
		);

		try {
			const inflated = await inflate(chunkBuffer);
			const nbtData = new NBTParser(inflated).parse();
			if (!nbtData.sections?.length) return 0;

			const chunkSections: ChunkSection[] = [];
			for (const section of nbtData.sections) {
				if (section.block_states?.palette) {
					chunkSections.push({
						y: section.Y,
						blockNames: unpackPaletteData(section.block_states, 4096, 4),
						biomeNames: section.biomes?.palette
							? unpackPaletteData(section.biomes, 64, 1)
							: [],
					});
				}
			}
			if (chunkSections.length === 0) return 0;

			chunkSections.sort((a, b) => b.y - a.y);
			let lastValidBiomes: string[] | null = null;
			for (const section of chunkSections) {
				if (section.biomeNames?.some((b) => b && b !== "minecraft:air")) {
					lastValidBiomes = section.biomeNames;
				} else if (lastValidBiomes) {
					section.biomeNames = lastValidBiomes;
				}
			}

			const chunkX = chunkIndex % 32;
			const chunkZ = Math.floor(chunkIndex / 32);
			let renderableBlocksInChunk = 0;

			for (let secZ = 0; secZ < 16; secZ++) {
				for (let secX = 0; secX < 16; secX++) {
					const mapX = chunkX * 16 + secX;
					const mapZ = chunkZ * 16 + secZ;
					const mapIdx = mapZ * 512 + mapX;

					for (const section of chunkSections) {
						if (
							columnMap.floorY[mapIdx] !== EMPTY_Y ||
							(columnMap.surfaceY[mapIdx] !== EMPTY_Y &&
								this.idToBlockName[columnMap.surfaceNameId[mapIdx]] !==
									"minecraft:water")
						) {
							break;
						}
						for (let secY = 15; secY >= 0; secY--) {
							const blockName =
								section.blockNames[secY * 256 + secZ * 16 + secX];
							if (blockName === "minecraft:air") continue;
							const y = section.y * 16 + secY;
							const biomeName = this.getBiomeNameForBlock(
								section,
								secX,
								secY,
								secZ,
							);
							const blockId = this.getBlockId(blockName);
							const biomeId = this.getBiomeId(biomeName);
							if (
								columnMap.decorationY[mapIdx] === EMPTY_Y &&
								DECORATION_BLOCKS.has(blockName)
							) {
								columnMap.decorationY[mapIdx] = y;
								columnMap.decorationNameId[mapIdx] = blockId;
								columnMap.decorationBiomeId[mapIdx] = biomeId;
								continue;
							}
							if (columnMap.surfaceY[mapIdx] === EMPTY_Y) {
								if (
									SOLID_BLOCKS.has(blockName) ||
									blockName === "minecraft:lava"
								) {
									columnMap.surfaceY[mapIdx] = y;
									columnMap.surfaceNameId[mapIdx] = blockId;
									columnMap.surfaceBiomeId[mapIdx] = biomeId;
									renderableBlocksInChunk++;
									if (blockName !== "minecraft:water") break;
								}
							} else if (columnMap.floorY[mapIdx] === EMPTY_Y) {
								if (
									blockName !== "minecraft:water" &&
									(SOLID_BLOCKS.has(blockName) ||
										blockName === "minecraft:lava")
								) {
									columnMap.floorY[mapIdx] = y;
									columnMap.floorNameId[mapIdx] = blockId;
									columnMap.floorBiomeId[mapIdx] = biomeId;
									break;
								}
							}
						}
					}
				}
			}
			return renderableBlocksInChunk;
		} catch {
			return 0;
		}
	}

	private _renderImageFromMap(columnMap: ColumnMap): Buffer {
		const imageData = Buffer.alloc(512 * 512 * 3);
		const workColor: Color = { r: 0, g: 0, b: 0 };
		const {
			HEIGHT_TINT_START_Y,
			HEIGHT_TINT_END_Y,
			HEIGHT_TINT_COLOR,
			HEIGHT_TINT_STRENGTH,
		} = CONFIG;

		for (let z = 0; z < 512; z++) {
			for (let x = 0; x < 512; x++) {
				const mapIdx = z * 512 + x;
				const surfaceY = columnMap.surfaceY[mapIdx];
				if (surfaceY === EMPTY_Y) continue;

				const surfaceNameId = columnMap.surfaceNameId[mapIdx];
				const surfaceName = this.idToBlockName[surfaceNameId];
				const floorY = columnMap.floorY[mapIdx];
				const decorationY = columnMap.decorationY[mapIdx];
				let baseColor: Color | null;
				let entityToShadeY = surfaceY;

				const isLava = surfaceName === "minecraft:lava";
				const isUnderwater =
					CONFIG.ENABLE_WATER_DEPTH_EFFECT &&
					surfaceName === "minecraft:water" &&
					floorY !== EMPTY_Y;

				if (isUnderwater) {
					const waterColor = this.getBlockColor(
						surfaceNameId,
						columnMap.surfaceBiomeId[mapIdx],
						x,
						z,
					);
					const floorColor = this.getBlockColor(
						columnMap.floorNameId[mapIdx],
						columnMap.floorBiomeId[mapIdx],
						x,
						z,
					);
					if (waterColor && floorColor) {
						const northIdx = z > 0 ? (z - 1) * 512 + x : mapIdx;
						const hN =
							columnMap.floorY[northIdx] !== EMPTY_Y
								? columnMap.floorY[northIdx]
								: floorY;
						let floorLightFactor = 1.0;
						if (floorY > hN)
							floorLightFactor *= CONFIG.SHADING_HIGHLIGHT_FACTOR;
						else if (floorY < hN)
							floorLightFactor *= CONFIG.SHADING_SHADOW_FACTOR;
						if (CONFIG.ENABLE_AMBIENT_OCCLUSION)
							floorLightFactor *= this.ambientOcclusionMap[mapIdx];
						const waterDepth = surfaceY - floorY;
						const depthRange =
							CONFIG.DEEP_WATER_DEPTH - CONFIG.SHALLOW_WATER_DEPTH;
						const progress = this.clamp(
							(waterDepth - CONFIG.SHALLOW_WATER_DEPTH) / depthRange,
							0,
							1,
						);
						const waterOpacity = this.clamp(
							CONFIG.MIN_WATER_OPACITY +
								progress ** CONFIG.WATER_OPACITY_CURVE_FACTOR *
									(1.0 - CONFIG.MIN_WATER_OPACITY),
							CONFIG.MIN_WATER_OPACITY,
							1.0,
						);
						workColor.r =
							waterColor.r * waterOpacity +
							floorColor.r * floorLightFactor * (1 - waterOpacity);
						workColor.g =
							waterColor.g * waterOpacity +
							floorColor.g * floorLightFactor * (1 - waterOpacity);
						workColor.b =
							waterColor.b * waterOpacity +
							floorColor.b * floorLightFactor * (1 - waterOpacity);
						baseColor = workColor;
					} else {
						baseColor = waterColor || floorColor;
					}
				} else {
					baseColor = this.getBlockColor(
						surfaceNameId,
						columnMap.surfaceBiomeId[mapIdx],
						x,
						z,
					);
				}
				if (!baseColor) continue;
				workColor.r = baseColor.r;
				workColor.g = baseColor.g;
				workColor.b = baseColor.b;

				if (decorationY >= surfaceY) {
					const decorationColor = this.getBlockColor(
						columnMap.decorationNameId[mapIdx],
						columnMap.decorationBiomeId[mapIdx],
						x,
						z,
					);
					if (decorationColor) {
						workColor.r = decorationColor.r;
						workColor.g = decorationColor.g;
						workColor.b = decorationColor.b;
						entityToShadeY = decorationY;
					}
				}

				if (!isLava) {
					if (!isUnderwater) {
						let lightFactor = 1.0;
						const northIdx = z > 0 ? (z - 1) * 512 + x : mapIdx;
						const h = entityToShadeY;
						const nSurfaceY = columnMap.surfaceY[northIdx];
						const nDecorationY = columnMap.decorationY[northIdx];
						const hN =
							nDecorationY > nSurfaceY
								? nDecorationY
								: nSurfaceY === EMPTY_Y
									? h
									: nSurfaceY;
						if (h > hN) lightFactor *= CONFIG.SHADING_HIGHLIGHT_FACTOR;
						else if (h < hN) lightFactor *= CONFIG.SHADING_SHADOW_FACTOR;
						if (CONFIG.ENABLE_AMBIENT_OCCLUSION)
							lightFactor *= this.ambientOcclusionMap[mapIdx];
						if (lightFactor !== 1.0) {
							workColor.r *= lightFactor;
							workColor.g *= lightFactor;
							workColor.b *= lightFactor;
						}
					}
					if (
						CONFIG.ENABLE_HEIGHT_TINTING &&
						entityToShadeY > HEIGHT_TINT_START_Y
					) {
						const progress = this.clamp(
							(entityToShadeY - HEIGHT_TINT_START_Y) /
								(HEIGHT_TINT_END_Y - HEIGHT_TINT_START_Y),
							0,
							1,
						);
						const blendAmount = progress * HEIGHT_TINT_STRENGTH;
						workColor.r =
							workColor.r * (1 - blendAmount) +
							HEIGHT_TINT_COLOR.r * blendAmount;
						workColor.g =
							workColor.g * (1 - blendAmount) +
							HEIGHT_TINT_COLOR.g * blendAmount;
						workColor.b =
							workColor.b * (1 - blendAmount) +
							HEIGHT_TINT_COLOR.b * blendAmount;
					}
					/* @ts-expect-error */
					if (CONFIG.SATURATION_MULTIPLIER !== 1.0) {
						const [h, s, l] = rgbToHsl(workColor.r, workColor.g, workColor.b);
						const newS = this.clamp(s * CONFIG.SATURATION_MULTIPLIER, 0, 1);
						const newRgb = hslToRgb(h, newS, l);
						workColor.r = newRgb.r;
						workColor.g = newRgb.g;
						workColor.b = newRgb.b;
					}
				}

				const outIdx = mapIdx * 3;
				imageData[outIdx] = this.clamp(workColor.r, 0, 255);
				imageData[outIdx + 1] = this.clamp(workColor.g, 0, 255);
				imageData[outIdx + 2] = this.clamp(workColor.b, 0, 255);
			}
		}
		return imageData;
	}

	private getBiomeNameForBlock(
		section: ChunkSection,
		secX: number,
		secY: number,
		secZ: number,
	): string {
		if (!section.biomeNames?.length) return "minecraft:plains";
		const biomeX = Math.floor(secX / 4);
		const biomeY = Math.floor(secY / 4);
		const biomeZ = Math.floor(secZ / 4);
		const biomeIndex = (biomeY * 4 + biomeZ) * 4 + biomeX;
		const biomeName = section.biomeNames[biomeIndex];
		return biomeName && biomeName !== "minecraft:air"
			? biomeName
			: "minecraft:plains";
	}
}
