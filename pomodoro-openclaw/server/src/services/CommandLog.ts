import type { CommandEntry } from '../types.js';

const MAX_SIZE = 100;

class CommandLog {
  private buffer: CommandEntry[] = [];

  push(entry: CommandEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > MAX_SIZE) {
      this.buffer.shift();
    }
  }

  getRecent(n = 20): CommandEntry[] {
    return this.buffer.slice(-n);
  }
}

export const commandLog = new CommandLog();
