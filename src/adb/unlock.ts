import { executeAdbShell, AdbOptions } from "./executor.js";

/**
 * Pattern grid (3x3):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 * 
 * Example: "L" shape = "0367" or [0,3,6,7]
 */

// Default grid coordinates for 1080x2340 screen (adjust as needed)
const DEFAULT_PATTERN_GRID = {
  width: 1080,
  height: 2340,
  // Pattern area typically in middle-lower portion of screen
  startX: 150,
  startY: 1400,
  cellWidth: 260,
  cellHeight: 260,
};

function getPatternCoordinates(
  point: number,
  grid = DEFAULT_PATTERN_GRID
): { x: number; y: number } {
  const row = Math.floor(point / 3);
  const col = point % 3;
  return {
    x: grid.startX + col * grid.cellWidth + grid.cellWidth / 2,
    y: grid.startY + row * grid.cellHeight + grid.cellHeight / 2,
  };
}

export async function wakeScreen(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_WAKEUP = 224
  const result = await executeAdbShell("input keyevent 224", options);
  return { success: result.success, error: result.error };
}

export async function isLocked(
  options: AdbOptions = {}
): Promise<{ success: boolean; locked: boolean; error?: string }> {
  const result = await executeAdbShell(
    "dumpsys window | grep mDreamingLockscreen",
    options
  );

  if (!result.success) {
    return { success: false, locked: true, error: result.error };
  }

  const locked = result.stdout.includes("mDreamingLockscreen=true");
  return { success: true, locked };
}

export async function unlockWithPassword(
  password: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // Wake screen, dismiss lock screen, type password, press enter
  const commands = [
    "input keyevent 224", // Wake
    "sleep 0.3",
    "input keyevent 82",  // Menu to show password field
    "sleep 0.3",
    `input text '${password.replace(/'/g, "'\\''")}'`, // Type password
    "input keyevent 66",  // Enter
    "sleep 0.5",
  ].join(" && ");

  const result = await executeAdbShell(commands, options);

  if (!result.success) {
    return { success: false, message: "Failed to execute unlock sequence", error: result.error };
  }

  // Verify unlock
  const lockState = await isLocked(options);
  if (lockState.locked) {
    return { success: false, message: "Device still locked - wrong password?" };
  }

  return { success: true, message: "Device unlocked successfully" };
}

export async function unlockWithPIN(
  pin: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // PIN unlock is same as password for most devices
  return unlockWithPassword(pin, options);
}

export async function unlockWithPattern(
  pattern: string | number[],
  options: AdbOptions & { grid?: typeof DEFAULT_PATTERN_GRID } = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // Convert string pattern to array if needed
  const points: number[] = typeof pattern === "string"
    ? pattern.split("").map(Number)
    : pattern;

  if (points.length < 4) {
    return { success: false, message: "Pattern must have at least 4 points", error: "Invalid pattern" };
  }

  if (points.some((p) => p < 0 || p > 8 || isNaN(p))) {
    return { success: false, message: "Pattern points must be 0-8", error: "Invalid pattern" };
  }

  const grid = options.grid || DEFAULT_PATTERN_GRID;

  // Wake screen first
  await executeAdbShell("input keyevent 224", options);
  await executeAdbShell("sleep 0.3", options);
  
  // Swipe up to reveal pattern
  await executeAdbShell("input swipe 540 1800 540 800 200", options);
  await executeAdbShell("sleep 0.3", options);

  // Build swipe command for pattern
  // Pattern is drawn as a continuous swipe through all points
  const coords = points.map((p) => getPatternCoordinates(p, grid));
  
  // Use sendevent for precise pattern drawing or multi-point swipe
  // For simplicity, we'll chain swipes between consecutive points
  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i];
    const to = coords[i + 1];
    const duration = 100; // Fast swipe between points
    
    if (i === 0) {
      // First point: start the swipe
      await executeAdbShell(
        `input swipe ${from.x} ${from.y} ${to.x} ${to.y} ${duration}`,
        options
      );
    } else {
      // Continue from last point
      await executeAdbShell(
        `input swipe ${from.x} ${from.y} ${to.x} ${to.y} ${duration}`,
        options
      );
    }
  }

  await executeAdbShell("sleep 0.5", options);

  // Verify unlock
  const lockState = await isLocked(options);
  if (lockState.locked) {
    return { success: false, message: "Device still locked - wrong pattern?" };
  }

  return { success: true, message: "Device unlocked successfully" };
}

export async function unlock(
  credential: {
    type: "password" | "pin" | "pattern" | "none";
    value?: string | number[];
  },
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // Check if already unlocked
  const lockState = await isLocked(options);
  if (!lockState.locked) {
    return { success: true, message: "Device already unlocked" };
  }

  switch (credential.type) {
    case "none":
      // Just swipe to unlock
      await wakeScreen(options);
      await executeAdbShell("sleep 0.2", options);
      await executeAdbShell("input swipe 540 1800 540 800 200", options);
      const afterSwipe = await isLocked(options);
      return afterSwipe.locked
        ? { success: false, message: "Swipe unlock failed" }
        : { success: true, message: "Device unlocked with swipe" };

    case "password":
      if (!credential.value || typeof credential.value !== "string") {
        return { success: false, message: "Password required", error: "Missing credential" };
      }
      return unlockWithPassword(credential.value, options);

    case "pin":
      if (!credential.value || typeof credential.value !== "string") {
        return { success: false, message: "PIN required", error: "Missing credential" };
      }
      return unlockWithPIN(credential.value, options);

    case "pattern":
      if (!credential.value) {
        return { success: false, message: "Pattern required", error: "Missing credential" };
      }
      return unlockWithPattern(credential.value, options);

    default:
      return { success: false, message: `Unknown lock type: ${credential.type}`, error: "Invalid type" };
  }
}

export async function lock(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_SLEEP = 223 or KEYCODE_POWER = 26
  const result = await executeAdbShell("input keyevent 223", options);
  return { success: result.success, error: result.error };
}
