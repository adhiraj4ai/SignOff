import { simpleGit } from "simple-git";

export async function initVaultRepo(vaultPath: string): Promise<void> {
  const git = simpleGit(vaultPath);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    await git.init();
  }
}

export async function stageAndCommit(
  vaultPath: string,
  files: string[],
  message: string,
  authorEmail: string,
  authorName: string
): Promise<string> {
  const git = simpleGit(vaultPath);
  await git.add(files);
  await git.commit(message, undefined, {
    "--author": `${authorName} <${authorEmail}>`,
  });
  return getHeadSha(vaultPath);
}

export async function pullLatest(vaultPath: string): Promise<void> {
  const git = simpleGit(vaultPath);
  await git.pull();
}

export async function pushToRemote(vaultPath: string): Promise<void> {
  const git = simpleGit(vaultPath);
  await git.push();
}

export async function getHeadSha(vaultPath: string): Promise<string> {
  const git = simpleGit(vaultPath);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash ?? "";
}
