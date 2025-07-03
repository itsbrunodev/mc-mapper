import type { Color } from "./types";

export function hexToRgb(hex: string): Color {
	return {
		r: Number.parseInt(hex.slice(1, 3), 16),
		g: Number.parseInt(hex.slice(3, 5), 16),
		b: Number.parseInt(hex.slice(5, 7), 16),
	};
}

export function processHexColorMap(
	map: Record<string, string>,
): Record<string, Color> {
	const result: Record<string, Color> = {};
	for (const key in map) {
		result[key] = hexToRgb(map[key]);
	}
	return result;
}

export function rgbToHsl(
	r: number,
	g: number,
	b: number,
): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): Color {
	let r: number;
	let g: number;
	let b: number;
	if (s === 0) {
		r = g = b = l;
	} else {
		const hueToRgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hueToRgb(p, q, h + 1 / 3);
		g = hueToRgb(p, q, h);
		b = hueToRgb(p, q, h - 1 / 3);
	}
	return { r: r * 255, g: g * 255, b: b * 255 };
}

export function unpackPaletteData(
	container: { palette: (string | { Name: string })[]; data?: bigint[] },
	size: number,
	minBits: number,
): string[] {
	const palette = container.palette.map((p) =>
		typeof p === "string" ? p : p.Name,
	);
	if (!palette || palette.length === 0)
		return Array(size).fill("minecraft:air");
	if (palette.length === 1 || !container.data)
		return Array(size).fill(palette[0]);
	const data = container.data;
	const bitsPerEntry = Math.max(minBits, Math.ceil(Math.log2(palette.length)));
	const entriesPerLong = Math.floor(64 / bitsPerEntry);
	const mask = (1n << BigInt(bitsPerEntry)) - 1n;
	const indices: number[] = [];
	for (const long of data) {
		for (let i = 0; i < entriesPerLong && indices.length < size; i++) {
			indices.push(Number((long >> (BigInt(i) * BigInt(bitsPerEntry))) & mask));
		}
	}
	return indices.map((idx) => palette[idx] || "minecraft:air");
}

export function formatDuration(sec: number): string {
	const hrs = Math.floor(sec / 3600);
	const mins = Math.floor((sec % 3600) / 60);
	const secs = Math.floor(sec % 60);
	return [
		hrs.toString().padStart(2, "0"),
		mins.toString().padStart(2, "0"),
		secs.toString().padStart(2, "0"),
	].join(":");
}

export function getFileName(path: string): string {
	return path.split("\\").pop() || path.split("/").pop() || path;
}
