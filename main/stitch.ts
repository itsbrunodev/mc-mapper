import path from "node:path";
import chalk from "chalk";

import { stitchImages } from "@/lib/stitch";

/**
 * This is a standalone script to manually trigger a full stitch of all
 * rendered images in the 'out' directory into a single 'final_map.png'.
 */
async function runFullStitch() {
	try {
		// 1. Define the paths required by the stitchImages function.
		const outPath = path.resolve("./out");
		const finalMapPath = path.resolve("./final_map.png");

		console.log(chalk.blue("Starting a full map stitch..."));
		console.log(chalk.gray(`Input directory: ${outPath}`));
		console.log(chalk.gray(`Output file: ${finalMapPath}`));

		// 2. Call the updated stitchImages function with the options object.
		// By not providing 'updatedRegionNames', we ensure it performs a full stitch.
		await stitchImages({
			outPath,
			finalMapPath,
		});
	} catch (err) {
		console.error(chalk.red("An error occurred during the stitching process:"));
		console.error(err);
		process.exit(1);
	}
}

// Execute the function
runFullStitch();
