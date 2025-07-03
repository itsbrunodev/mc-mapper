import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { promisify } from "node:util";

import chalk from "chalk";

import { NBTParser } from "@/lib/nbt";
import { workerManager } from "@/lib/worker-manager";
import type { Task } from "@/lib/types";
import { stitchImages } from "@/lib/stitch";
import { getFileName } from "@/lib/utils";

const gunzip = promisify(zlib.gunzip);

async function parseLevelDat(worldPath: string) {
	const levelDatPath = path.join(worldPath, "level.dat");
	try {
		const compressedData = await fs.promises.readFile(levelDatPath);
		const uncompressedData = await gunzip(compressedData);
		const nbtData = new NBTParser(uncompressedData).parse();
		const dataVersion = nbtData.Data?.DataVersion;
		console.log(`Found level.dat. DataVersion: ${dataVersion || "Unknown"}`);
	} catch (err) {
		console.warn(chalk.yellow("WARN: Could not read or parse level.dat."));
	}
}

async function main() {
	console.log("mc-mapper v0.0.0");

	const isIncremental = process.argv.includes("--incremental");
	const worldPath = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
	const projectRoot = ".";

	if (!fs.existsSync(path.resolve(projectRoot, "texture_cache.json"))) {
		console.error(
			chalk.red(
				"`texture_cache.json` not found. Please run `bun precache` first!",
			),
		);
		process.exit(1);
	}
	if (!worldPath) {
		console.error(
			chalk.red("Usage: bun start <path_to_minecraft_world> [--incremental]"),
		);
		process.exit(1);
	}

	await parseLevelDat(worldPath);

	const outPath = path.resolve(projectRoot, "out");
	const regionDir = path.join(worldPath, "region");

	if (!fs.existsSync(regionDir)) {
		console.error(chalk.red(`Region directory not found at ${regionDir}`));
		process.exit(1);
	}

	if (!isIncremental && fs.existsSync(outPath)) {
		console.log(
			"Performing a full render. Deleting existing 'out' directory...",
		);
		await fs.promises.rm(outPath, { recursive: true, force: true });
	}
	await fs.promises.mkdir(outPath, { recursive: true });

	const files = await fs.promises.readdir(regionDir);
	let tasks: Task[] = files
		.filter((f) => f.endsWith(".mca"))
		.map((file) => ({
			filePath: path.join(regionDir, file),
			regionX: Number.parseInt(file.split(".")[1]),
			regionZ: Number.parseInt(file.split(".")[2]),
		}));

	if (isIncremental) {
		console.log(
			chalk.cyan("Incremental mode: checking for existing regions..."),
		);
		const initialCount = tasks.length;
		tasks = tasks.filter((task) => {
			const expectedImagePath = path.join(
				outPath,
				`r.${task.regionX}.${task.regionZ}.png`,
			);
			return !fs.existsSync(expectedImagePath);
		});
		const skippedCount = initialCount - tasks.length;
		if (skippedCount > 0) {
			console.log(
				chalk.green(
					`Skipped ${skippedCount} of ${initialCount} already rendered regions.`,
				),
			);
		}
	}

	let processedTasks: Task[] = [];
	if (tasks.length === 0) {
		console.log(chalk.green("No new regions to process."));
	} else {
		processedTasks = await workerManager(tasks, projectRoot);
		console.log("All new regions processed.");
	}

	const finalMapPath = path.resolve(projectRoot, "final_map.png");

	const updatedRegionNames =
		isIncremental && processedTasks.length > 0
			? processedTasks.map((task) =>
					getFileName(task.filePath).replace(".mca", ".png"),
				)
			: undefined;

	await stitchImages({
		outPath,
		finalMapPath,
		updatedRegionNames,
	}).catch((err) => {
		console.error(chalk.red("Error stitching images:"), err);
		process.exit(1);
	});
}

main().catch((err) => {
	console.error(chalk.red("A fatal error occurred in the main process:"), err);
	process.exit(1);
});
