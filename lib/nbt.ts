export class NBTParser {
	private offset = 0;
	private buffer: Buffer;

	constructor(data: Buffer) {
		this.buffer = data;
	}

	private read(
		type: "Byte" | "UByte" | "Short" | "Int" | "Float" | "Double" | "Long",
	): number | bigint {
		switch (type) {
			case "Byte":
				this.offset++;
				return this.buffer.readInt8(this.offset - 1);
			case "UByte":
				this.offset++;
				return this.buffer.readUInt8(this.offset - 1);
			case "Short":
				this.offset += 2;
				return this.buffer.readInt16BE(this.offset - 2);
			case "Int":
				this.offset += 4;
				return this.buffer.readInt32BE(this.offset - 4);
			case "Float":
				this.offset += 4;
				return this.buffer.readFloatBE(this.offset - 4);
			case "Double":
				this.offset += 8;
				return this.buffer.readDoubleBE(this.offset - 8);
			case "Long":
				this.offset += 8;
				return this.buffer.readBigInt64BE(this.offset - 8);
		}
	}

	private readString(): string {
		const length = this.read("Short") as number;

		if (length <= 0) return "";

		const value = this.buffer.toString(
			"utf8",
			this.offset,
			this.offset + length,
		);

		this.offset += length;

		return value;
	}

	/* biome-ignore lint/suspicious/noExplicitAny: <> */
	private readValue(type: number): any {
		switch (type) {
			case 0:
				return null;
			case 1:
				return this.read("Byte");
			case 2:
				return this.read("Short");
			case 3:
				return this.read("Int");
			case 4:
				return this.read("Long");
			case 5:
				return this.read("Float");
			case 6:
				return this.read("Double");
			case 7: {
				const len = this.read("Int") as number;
				const arr = this.buffer.subarray(this.offset, this.offset + len);
				this.offset += len;
				return arr;
			}
			case 8:
				return this.readString();
			case 9: {
				const listType = this.read("UByte") as number;
				const len = this.read("Int") as number;
				const list = [];
				for (let i = 0; i < len; i++) list.push(this.readValue(listType));
				return list;
			}
			case 10:
				return this.readCompound();
			case 11: {
				const len = this.read("Int") as number;
				const arr = [];
				for (let i = 0; i < len; i++) arr.push(this.read("Int"));
				return arr;
			}
			case 12: {
				const len = this.read("Int") as number;
				const arr = [];
				for (let i = 0; i < len; i++) arr.push(this.read("Long"));
				return arr;
			}
			default:
				throw new Error(`Unknown NBT tag type: ${type}`);
		}
	}

	/* biome-ignore lint/suspicious/noExplicitAny: <> */
	private readCompound(): any {
		/* biome-ignore lint/suspicious/noExplicitAny: <> */
		const compound: { [key: string]: any } = {};

		while (true) {
			const type = this.read("UByte") as number;

			if (type === 0) break;

			const name = this.readString();
			compound[name] = this.readValue(type);
		}
		return compound;
	}

	/* biome-ignore lint/suspicious/noExplicitAny: <> */
	public parse(): any {
		const rootType = this.read("UByte") as number;

		if (rootType !== 10) throw new Error("Root tag must be a TAG_Compound");

		this.readString();

		return this.readCompound();
	}
}
