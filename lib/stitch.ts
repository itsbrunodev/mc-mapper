import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import chalk from "chalk";

interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Defines the options for the stitching process.
 */
interface StitchOptions {
	/** The directory containing the rendered region .png files. */
	outPath: string;
	/** The full path where the final map image should be saved. */
	finalMapPath: string;
	/** An optional array of specific region file names that have been updated. */
	updatedRegionNames?: string[];
}

export async function stitchImages(
	options: StitchOptions,
): Promise<BoundingBox | null> {
	const { outPath, finalMapPath, updatedRegionNames } = options;

	const allRegionFiles = fs
		.readdirSync(outPath)
		.filter((f) => f.endsWith(".png"));

	if (allRegionFiles.length === 0) {
		console.log(chalk.yellow("No images found in ./out to stitch."));

		return null;
	}

	let minX = Number.POSITIVE_INFINITY;
	let minZ = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxZ = Number.NEGATIVE_INFINITY;

	const allCoords = allRegionFiles
		.map((file) => {
			const parts = file.match(/r\.(-?\d+)\.(-?\d+)\.png/);
			if (!parts) return null;

			const x = Number.parseInt(parts[1]);
			const z = Number.parseInt(parts[2]);

			minX = Math.min(minX, x);
			minZ = Math.min(minZ, z);
			maxX = Math.max(maxX, x);
			maxZ = Math.max(maxZ, z);

			return { x, z, file };
		})
		.filter((c) => c !== null) as { x: number; z: number; file: string }[];

	const isIncrementalStitch =
		updatedRegionNames &&
		updatedRegionNames.length > 0 &&
		fs.existsSync(finalMapPath);

	if (isIncrementalStitch) {
		console.log(
			chalk.cyan(
				`Performing incremental stitch for ${updatedRegionNames.length} region(s)...`,
			),
		);

		let updatedMinX = Number.POSITIVE_INFINITY;
		let updatedMinZ = Number.POSITIVE_INFINITY;
		let updatedMaxX = Number.NEGATIVE_INFINITY;
		let updatedMaxZ = Number.NEGATIVE_INFINITY;

		const compositeOps = updatedRegionNames
			.map((fileName) => {
				const parts = fileName.match(/r\.(-?\d+)\.(-?\d+)\.png/);
				if (!parts) return null;

				const x = Number.parseInt(parts[1]);
				const z = Number.parseInt(parts[2]);

				// update the bounds for the updated area
				updatedMinX = Math.min(updatedMinX, x);
				updatedMinZ = Math.min(updatedMinZ, z);
				updatedMaxX = Math.max(updatedMaxX, x);
				updatedMaxZ = Math.max(updatedMaxZ, z);

				return {
					input: path.join(outPath, fileName),
					left: (x - minX) * 512,
					top: (z - minZ) * 512,
				};
			})
			.filter((op) => op !== null) as sharp.OverlayOptions[];

		if (compositeOps.length === 0) {
			console.log(chalk.yellow("No valid updated regions to apply."));

			return null;
		}

		// define a path for a temporary output file
		const tempMapPath = `${finalMapPath}.tmp`;

		try {
			// read the existing map into a buffer.
			const existingMapBuffer = await fs.promises.readFile(finalMapPath);

			// use the buffer as input and write the result to the temporary file
			// this avoids the input/output file conflict
			await sharp(existingMapBuffer)
				.composite(compositeOps)
				.toFile(tempMapPath);

			// if the write was successful, rename the temporary file
			// to the final destination, overwriting the old map
			await fs.promises.rename(tempMapPath, finalMapPath);

			console.log(
				chalk.green(`✓ Success! Updated final map saved to: ${finalMapPath}`),
			);

			const updatedArea: BoundingBox = {
				x: (updatedMinX - minX) * 512,
				y: (updatedMinZ - minZ) * 512,
				width: (updatedMaxX - updatedMinX + 1) * 512,
				height: (updatedMaxZ - updatedMinZ + 1) * 512,
			};

			return updatedArea;
		} catch (error) {
			// if anything fails, try to clean up the temporary file if it exists.
			if (fs.existsSync(tempMapPath)) {
				await fs.promises.unlink(tempMapPath);
			}

			// te-throw the error so the calling process knows something went wrong
			throw error;
		}
	} else {
		console.log(
			chalk.cyan(
				"Performing a full stitch of all images in the 'out' directory...",
			),
		);

		const mapWidth = (maxX - minX + 1) * 512;
		const mapHeight = (maxZ - minZ + 1) * 512;

		const compositeOps = allCoords.map(({ x, z, file }) => ({
			input: path.join(outPath, file),
			left: (x - minX) * 512,
			top: (z - minZ) * 512,
		}));

		await sharp({
			create: {
				width: mapWidth,
				height: mapHeight,
				channels: 3,
				background: { r: 12, g: 12, b: 12 },
			},
		})
			.composite(compositeOps)
			.png({ palette: false, dither: 0 })
			.toFile(finalMapPath);

		console.log(chalk.green(`✓ Success! Final map saved to: ${finalMapPath}`));

		return null;
	}
}
