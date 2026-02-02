import { execFile, spawn } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface AdbResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface AdbOptions {
  deviceId?: string;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000;

export async function executeAdb(
  args: string[],
  options: AdbOptions = {}
): Promise<AdbResult> {
  const { deviceId, timeout = DEFAULT_TIMEOUT } = options;

  const fullArgs = deviceId ? ["-s", deviceId, ...args] : args;

  try {
    const { stdout, stderr } = await execFileAsync("adb", fullArgs, {
      timeout,
      maxBuffer: 50 * 1024 * 1024, // 50MB for screenshots
    });

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      stdout: err.stdout?.trim() || "",
      stderr: err.stderr?.trim() || "",
      error: err.message || "Unknown error",
    };
  }
}

export async function executeAdbShell(
  command: string,
  options: AdbOptions = {}
): Promise<AdbResult> {
  return executeAdb(["shell", command], options);
}

export async function executeAdbWithBinary(
  args: string[],
  options: AdbOptions = {}
): Promise<{ success: boolean; data: Buffer; error?: string }> {
  const { deviceId, timeout = DEFAULT_TIMEOUT } = options;

  const fullArgs = deviceId ? ["-s", deviceId, ...args] : args;

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const proc = spawn("adb", fullArgs, {
      timeout,
    });

    proc.stdout.on("data", (chunk) => chunks.push(chunk));

    proc.on("close", (code) => {
      const data = Buffer.concat(chunks);
      resolve({
        success: code === 0,
        data,
        error: code !== 0 ? `Process exited with code ${code}` : undefined,
      });
    });

    proc.on("error", (err) => {
      resolve({
        success: false,
        data: Buffer.alloc(0),
        error: err.message,
      });
    });
  });
}
