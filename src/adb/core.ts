import { executeAdb, executeAdbShell, AdbOptions, AdbResult } from "./executor.js";

export interface DeviceInfo {
  deviceId: string;
  state: string;
  product?: string;
  model?: string;
  device?: string;
  transportId?: string;
}

export async function listDevices(): Promise<{
  success: boolean;
  devices: DeviceInfo[];
  error?: string;
}> {
  const result = await executeAdb(["devices", "-l"]);

  if (!result.success) {
    return { success: false, devices: [], error: result.error };
  }

  const lines = result.stdout.split("\n").slice(1); // Skip header
  const devices: DeviceInfo[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;

    const device: DeviceInfo = {
      deviceId: parts[0],
      state: parts[1],
    };

    // Parse additional properties like product:xxx model:yyy
    for (let i = 2; i < parts.length; i++) {
      const [key, value] = parts[i].split(":");
      if (key && value) {
        (device as unknown as Record<string, string>)[key] = value;
      }
    }

    devices.push(device);
  }

  return { success: true, devices };
}

export async function shell(
  command: string,
  options: AdbOptions = {}
): Promise<AdbResult> {
  return executeAdbShell(command, options);
}

export async function getDeviceInfo(
  options: AdbOptions = {}
): Promise<{
  success: boolean;
  info: Record<string, string>;
  error?: string;
}> {
  const props = [
    "ro.product.model",
    "ro.product.brand",
    "ro.product.name",
    "ro.build.version.release",
    "ro.build.version.sdk",
    "ro.serialno",
  ];

  const info: Record<string, string> = {};

  for (const prop of props) {
    const result = await executeAdbShell(`getprop ${prop}`, options);
    if (result.success && result.stdout) {
      info[prop] = result.stdout;
    }
  }

  return { success: true, info };
}

export async function installApp(
  apkPath: string,
  options: AdbOptions & { reinstall?: boolean; grantPermissions?: boolean } = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const args = ["install"];

  if (options.reinstall) args.push("-r");
  if (options.grantPermissions) args.push("-g");

  args.push(apkPath);

  const result = await executeAdb(args, options);

  if (result.success && result.stdout.includes("Success")) {
    return { success: true, message: "App installed successfully" };
  }

  return {
    success: false,
    message: result.stdout || result.stderr,
    error: result.error || "Installation failed",
  };
}

export async function uninstallApp(
  packageName: string,
  options: AdbOptions & { keepData?: boolean } = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const args = ["uninstall"];

  if (options.keepData) args.push("-k");

  args.push(packageName);

  const result = await executeAdb(args, options);

  if (result.success && result.stdout.includes("Success")) {
    return { success: true, message: "App uninstalled successfully" };
  }

  return {
    success: false,
    message: result.stdout || result.stderr,
    error: result.error || "Uninstallation failed",
  };
}

export async function listPackages(
  options: AdbOptions & { filter?: "system" | "third-party" | "all" } = {}
): Promise<{ success: boolean; packages: string[]; error?: string }> {
  let cmd = "pm list packages";

  if (options.filter === "system") cmd += " -s";
  else if (options.filter === "third-party") cmd += " -3";

  const result = await executeAdbShell(cmd, options);

  if (!result.success) {
    return { success: false, packages: [], error: result.error };
  }

  const packages = result.stdout
    .split("\n")
    .map((line) => line.replace("package:", "").trim())
    .filter((pkg) => pkg.length > 0);

  return { success: true, packages };
}

export async function pushFile(
  localPath: string,
  remotePath: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const result = await executeAdb(["push", localPath, remotePath], options);

  if (result.success) {
    return { success: true, message: result.stdout || "File pushed successfully" };
  }

  return {
    success: false,
    message: result.stderr,
    error: result.error || "Push failed",
  };
}

export async function pullFile(
  remotePath: string,
  localPath: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const result = await executeAdb(["pull", remotePath, localPath], options);

  if (result.success) {
    return { success: true, message: result.stdout || "File pulled successfully" };
  }

  return {
    success: false,
    message: result.stderr,
    error: result.error || "Pull failed",
  };
}

export async function startActivity(
  intent: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const result = await executeAdbShell(`am start ${intent}`, options);

  return {
    success: result.success,
    message: result.stdout || result.stderr,
    error: result.error,
  };
}

export async function forceStopApp(
  packageName: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const result = await executeAdbShell(`am force-stop ${packageName}`, options);

  return {
    success: result.success,
    message: result.stdout || "App stopped",
    error: result.error,
  };
}

export async function clearAppData(
  packageName: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  const result = await executeAdbShell(`pm clear ${packageName}`, options);

  if (result.success && result.stdout.includes("Success")) {
    return { success: true, message: "App data cleared" };
  }

  return {
    success: false,
    message: result.stdout || result.stderr,
    error: result.error || "Failed to clear app data",
  };
}
