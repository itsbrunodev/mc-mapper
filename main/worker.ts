import { Region } from "@/lib/region";
import type { ManagerMessage, Task, WorkerMessage } from "@/lib/types";

let processor: Region | undefined;

async function processTask(task: Task) {
	// Safeguard to ensure the worker is initialized before processing.
	if (!processor) {
		process.send?.({
			status: "error",
			file: task.filePath,
			error: "Worker received task before it was initialized.",
		} as WorkerMessage);
		return;
	}

	try {
		const resultStatus = await processor.processRegionFile(
			task.filePath,
			task.regionX,
			task.regionZ,
		);

		if (resultStatus === "processed") {
			process.send?.({ status: "done", task } as WorkerMessage);
		} else if (resultStatus === "skipped") {
			process.send?.({ status: "skip", file: task.filePath } as WorkerMessage);
		}
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e);
		process.send?.({
			status: "error",
			file: task.filePath,
			error,
		} as WorkerMessage);
	}
}

// The worker's main message handler
process.on("message", async (msg: ManagerMessage) => {
	switch (msg.type) {
		case "init":
			// Initialize the processor. The "ready" message is no longer needed.
			processor = new Region(msg.projectRoot);
			break;
		case "task":
			await processTask(msg.task);
			break;
		case "exit":
			process.exit(0);
	}
});
