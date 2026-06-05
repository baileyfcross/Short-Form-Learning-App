import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const runLocalCommand = async (
  binary: string,
  args: string[],
  options: { timeoutMs?: number; cwd?: string } = {}
) => {
  const { stdout, stderr } = await execFileAsync(binary, args, {
    cwd: options.cwd,
    timeout: options.timeoutMs ?? 120_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20
  });

  return { stdout: String(stdout), stderr: String(stderr) };
};
