import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { readComments, writeComments, addThread, addReply, setResolved, type CommentsFile } from "../src/comments.js";

let tmp: string, vaultPath: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "comments-"));
  vaultPath = path.join(tmp, ".signoff");
  await fs.mkdir(vaultPath, { recursive: true });
});
afterEach(async () => { await fs.rm(tmp, { recursive: true, force: true }); });

describe("comments", () => {
  it("returns an empty file when none exists", async () => {
    expect(await readComments(vaultPath, "f", "spec")).toEqual({ version: 1, threads: [] });
  });
  it("round-trips through write/read", async () => {
    const file: CommentsFile = { version: 1, threads: [{ id: "t1", section: "goals", line: 10, resolved: false, comments: [{ id: "c1", by: "a@o.c", at: "t", body: "why?" }] }] };
    await writeComments(vaultPath, "f", "spec", file);
    expect(await readComments(vaultPath, "f", "spec")).toEqual(file);
  });
  it("addThread / addReply / setResolved are pure and correct", () => {
    let f: CommentsFile = { version: 1, threads: [] };
    f = addThread(f, { id: "t1", section: "goals", line: 10, resolved: false, comments: [{ id: "c1", by: "a@o.c", at: "t", body: "q" }] });
    f = addReply(f, "t1", { id: "c2", by: "b@o.c", at: "t2", body: "answer" });
    expect(f.threads[0].comments).toHaveLength(2);
    f = setResolved(f, "t1", true);
    expect(f.threads[0].resolved).toBe(true);
  });
});
