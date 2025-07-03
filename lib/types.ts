export interface Color {
	r: number;
	g: number;
	b: number;
}

export interface Task {
	filePath: string;
	regionX: number;
	regionZ: number;
}

// Data passed to a new worker thread during its creation
export interface WorkerInitData {
	projectRoot: string;
}

// A message sent FROM the manager TO a worker
export type ManagerMessage =
	| { type: "init"; projectRoot: string }
	| { type: "task"; task: Task }
	| { type: "exit" };

// A message sent FROM a worker TO the manager
export type WorkerMessage =
	| { status: "ready" }
	| { status: "done"; task: Task }
	| { status: "skip"; file: string }
	| { status: "error"; file: string; error?: string };
