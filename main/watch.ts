// import { exec } from "node:child_process";
import path from "node:path";

import chalk from "chalk";
import chokidar from "chokidar";

import { workerManager } from "@/lib/worker-manager";
import { stitchImages } from "@/lib/stitch";

import type { Task } from "@/lib/types";

import { CONFIG } from "@/constants/config";

if (process.argv.length < 3) {
	console.error(chalk.red("Usage: bun watch <path_to_minecraft_world>"));
	process.exit(1);
}

const worldPath = process.argv[2];
const projectRoot = ".";
const outPath = path.resolve(projectRoot, "out");
const finalMapPath = path.resolve(projectRoot, "final_map.png");

// this holds a map of file paths to their task data to automatically handle duplicates
const changeQueue = new Map<string, Task>();

let isProcessing = false;

// --- Chokidar Watcher Setup ---
const watcher = chokidar.watch(path.join(worldPath, "region"), {
	persistent: true,
	awaitWriteFinish: {
		// Wait for writes to complete before firing event
		stabilityThreshold: 2000,
		pollInterval: 100,
	},
});

console.log(
	chalk.cyan(`Watching for changes in: ${path.join(worldPath, "region")}`),
);
console.log(
	chalk.cyan(
		`Will process changes after a ${CONFIG.WATCH_DEBOUNCE_SECONDS}-second debounce period.`,
	),
);

watcher
	.on("change", (p) => {
		const filePath = path.normalize(p);
		if (!filePath.endsWith(".mca")) return;

		const fileName = path.basename(filePath);

		const date = new Date();
		const time = `[${String(date.getHours()).padStart(2, "0")}:${String(
			date.getMinutes(),
		).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}]`;

		console.log(`${time} ${chalk.yellow(`! Change detected: ${fileName}`)}`);

		const parts = fileName.match(/r\.(-?\d+)\.(-?\d+)\.mca/);
		if (!parts) return;

		// add or update the file in our queue, map handles uniqueness automatically
		changeQueue.set(filePath, {
			filePath,
			regionX: Number.parseInt(parts[1]),
			regionZ: Number.parseInt(parts[2]),
		});
	})
	.on("error", (error) => {
		console.error(chalk.red("Watcher error:"), error);
	});

/* function runTilegen(
	area: { x: number; y: number; width: number; height: number } | null,
) {
	console.log(chalk.cyan("Running tilegen to update map tiles..."));

	const tilesOutputPath =
		"tiles";

	let command = `tilegen -t 256 -f webp -m 4 -i ${finalMapPath} -o ${tilesOutputPath}`;

	if (area) {
		const areaString = `${area.x},${area.y},${area.width},${area.height}`;
		command += ` --area "${areaString}"`;
	}

	return new Promise<void>((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				console.error(chalk.red(`tilegen error: ${error.message}`));

				if (stderr) console.error(chalk.red(`stderr: ${stderr}`));

				return reject(error);
			}

			if (stdout) console.log(chalk.gray(stdout));

			resolve();
		});
	});
} */

setInterval(async () => {
	// don't process if the queue is empty or if we're already processing a batch
	if (changeQueue.size === 0 || isProcessing) {
		return;
	}

	isProcessing = true; // set lock to prevent concurrent runs

	// take all tasks currently in the queue and clear it for the next batch
	const tasksToProcess = Array.from(changeQueue.values());

	changeQueue.clear();

	try {
		// the worker manager now returns the list of tasks it successfully completed
		const processedTasks = await workerManager(tasksToProcess, projectRoot);

		if (processedTasks.length > 0) {
			console.log(chalk.cyan("Stitching updated images..."));

			// convert the list of completed tasks to just the .png filenames
			const updatedRegionNames = processedTasks.map((task) =>
				path.basename(task.filePath).replace(".mca", ".png"),
			);

			// call stitchImages with the correct options object for an incremental update
			/* const updatedArea = */ await stitchImages({
				outPath,
				finalMapPath,
				updatedRegionNames, // provide the list of changes
			});

			// await runTilegen(updatedArea);
		} else {
			console.log(
				chalk.yellow("No tasks were successfully processed in this batch."),
			);
		}
	} catch (error) {
		console.error(
			chalk.red("An error occurred during the watch cycle:"),
			error,
		);
	} finally {
		console.log(chalk.cyan("\nWatching for changes..."));
		isProcessing = false; // release the lock to allow concurrent runs again
	}
}, CONFIG.WATCH_DEBOUNCE_SECONDS * 1000);
