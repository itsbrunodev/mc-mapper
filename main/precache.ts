import * as fs from "node:fs";
import * as path from "node:path";

import sharp from "sharp";

const assetsPath = path.resolve(".", "assets", "block");
const cachePath = path.resolve(".", "texture_cache.json");

async function createTextureCache() {
	console.log("Starting texture cache creation...");
	if (!fs.existsSync(assetsPath)) {
		console.error(`Assets path not found at ${assetsPath}`);
		process.exit(1);
	}

	const files = fs.readdirSync(assetsPath).filter((f) => f.endsWith(".png"));
	const cache: Record<string, { r: number; g: number; b: number }> = {};
	let processed = 0;

	console.log(`Found ${files.length} textures to process...`);

	for (const file of files) {
		const blockName = path.basename(file, ".png");
		const texturePath = path.join(assetsPath, file);

		try {
			// crop animated textures to the top 16x16 frame
			const imageProcessor = sharp(texturePath).extract({
				left: 0,
				top: 0,
				width: 16,
				height: 16,
			});
			const { data, info } = await imageProcessor
				.raw()
				.toBuffer({ resolveWithObject: true });

			let r_sum = 0;
			let g_sum = 0;
			let b_sum = 0;
			let count = 0;

			for (let i = 0; i < data.length; i += info.channels) {
				if (info.channels === 4 && data[i + 3] < 128) continue;
				r_sum += data[i];
				g_sum += data[i + 1];
				b_sum += data[i + 2];
				count++;
			}
			if (count > 0) {
				cache[blockName] = {
					r: Math.floor(r_sum / count),
					g: Math.floor(g_sum / count),
					b: Math.floor(b_sum / count),
				};
			}
			processed++;
		} catch (error) {
			console.warn(`Could not process ${file}. Skipping.`);
		}
	}

	fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
	console.log(`Success! Processed ${processed} textures.`);
	console.log(`Texture cache saved to: ${cachePath}`);
}

createTextureCache();
