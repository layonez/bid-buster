/**
 * File-based cache for API responses.
 * Will be fully implemented in Phase 2.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { sha256 } from "../shared/fs.js";

export class ResponseCache {
  constructor(
    private baseDir: string,
    private enabled: boolean = true,
  ) {}

  async initialize(): Promise<void> {
    if (!this.enabled) return;
    await mkdir(join(this.baseDir, "requests"), { recursive: true });
    await mkdir(join(this.baseDir, "responses"), { recursive: true });
    await mkdir(join(this.baseDir, "details"), { recursive: true });
    await mkdir(join(this.baseDir, "transactions"), { recursive: true });
    await mkdir(join(this.baseDir, "normalized"), { recursive: true });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;
    const path = this.keyToPath(key);
    try {
      await access(path);
      const content = await readFile(path, "utf-8");
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, data: unknown): Promise<void> {
    if (!this.enabled) return;
    const path = this.keyToPath(key);
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  }

  async has(key: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      await access(this.keyToPath(key));
      return true;
    } catch {
      return false;
    }
  }

  private keyToPath(key: string): string {
    const hash = sha256(key);
    return join(this.baseDir, "responses", `${hash}.json`);
  }
}
