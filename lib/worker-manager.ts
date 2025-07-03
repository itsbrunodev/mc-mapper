import os from "node:os";
import path from "node:path";
import { fork, type ChildProcess } from "node:child_process";
import chalk from "chalk";

import { formatDuration, getFileName } from "./utils";
import type { Task, WorkerMessage, ManagerMessage } from "./types";

export async function workerManager(
	tasks: Task[],
	projectRoot: string,
): Promise<Task[]> {
	const totalTasks = tasks.length;
	if (totalTasks === 0) {
		return [];
	}

	const numWorkers = Math.min(os.cpus().length, totalTasks);
	let completedCount = 0;
	const completedTasks: Task[] = [];
	const startTime = Date.now();

	console.log(
		`Spawning a pool of ${numWorkers} worker(s) to process ${totalTasks} region files...`,
	);

	const taskQueue = [...tasks];

	await new Promise<void>((resolve, reject) => {
		let activeWorkers = numWorkers;

		const assignTask = (worker: ChildProcess) => {
			const task = taskQueue.pop();
			if (task) {
				worker.send({ type: "task", task } as ManagerMessage);
			} else {
				worker.send({ type: "exit" } as ManagerMessage);
			}
		};

		const handleWorkerMessage = (msg: WorkerMessage, worker: ChildProcess) => {
			switch (msg.status) {
				case "done":
					completedCount++;
					if (msg.task) {
						completedTasks.push(msg.task);
						console.log(
							chalk.green(
								`✓ Processed: ${getFileName(msg.task.filePath)} (${completedCount}/${totalTasks})`,
							),
						);
					}
					assignTask(worker);
					break;
				case "skip":
					completedCount++;
					console.log(
						chalk.yellow(
							`! Skipped: ${getFileName(msg.file)} (${completedCount}/${totalTasks})`,
						),
					);
					assignTask(worker);
					break;
				case "error":
					completedCount++;
					console.log(
						chalk.red(
							`✗ Error: ${getFileName(msg.file)} - ${msg.error || "Unknown error"} (${completedCount}/${totalTasks})`,
						),
					);
					assignTask(worker);
					break;
			}
		};

		for (let i = 0; i < numWorkers; i++) {
			const worker = fork(path.join(".", "main", "worker.ts"));

			worker.on("message", (msg: WorkerMessage) =>
				handleWorkerMessage(msg, worker),
			);
			worker.on("error", reject);
			worker.on("exit", (code) => {
				if (code !== 0) {
					console.error(
						chalk.red(`Worker exited unexpectedly with code ${code}.`),
					);
					// Depending on desired robustness, you might want to reject the promise here.
				}
				activeWorkers--;
				if (activeWorkers === 0) {
					resolve();
				}
			});

			// Initialize worker and immediately assign its first task, removing the "ready" handshake.
			worker.send({ type: "init", projectRoot } as ManagerMessage);
			assignTask(worker);
		}
	});

	const elapsedSecs = (Date.now() - startTime) / 1000;
	console.log(
		chalk.green(`✓ All tasks completed in ${formatDuration(elapsedSecs)}.`),
	);

	return completedTasks;
}
