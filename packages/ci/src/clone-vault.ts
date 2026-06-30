import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateRemoteUrl } from "@signoff/vault-core";

const exec = promisify(execFile);

/** Build `git` args to clone `url` into `dest`. Validates the URL (rejects
 *  option-injection / bad scheme). When a token is supplied, auth is passed via
 *  `-c http.extraHeader` (base64 of `x-access-token:<token>`) so it never lands
 *  in a logged URL. `--` ends option parsing. */
export function buildCloneArgs(url: string, dest: string, token?: string): string[] {
  const safe = validateRemoteUrl(url);
  const args: string[] = [];
  if (token) {
    const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
    args.push("-c", `http.extraHeader=AUTHORIZATION: basic ${basic}`);
  }
  args.push("clone", "--depth", "1", "--", safe, dest);
  return args;
}

/** Clone the vault. GIT_TERMINAL_PROMPT=0 so a missing/invalid credential fails
 *  fast instead of hanging on a prompt. Rejects (fails closed) on any git error. */
export async function cloneVaultWithToken(url: string, dest: string, token?: string): Promise<void> {
  const args = buildCloneArgs(url, dest, token);
  await exec("git", args, { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
}
