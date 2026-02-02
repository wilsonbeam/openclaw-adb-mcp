import { executeAdbShell, executeAdbWithBinary, AdbOptions } from "./executor.js";

export async function tap(
  x: number,
  y: number,
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const result = await executeAdbShell(`input tap ${x} ${y}`, options);
  return { success: result.success, error: result.error };
}

export async function swipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs: number = 300,
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const result = await executeAdbShell(
    `input swipe ${startX} ${startY} ${endX} ${endY} ${durationMs}`,
    options
  );
  return { success: result.success, error: result.error };
}

export async function longPress(
  x: number,
  y: number,
  durationMs: number = 1000,
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // Long press is implemented as a swipe from the same point to itself
  const result = await executeAdbShell(
    `input swipe ${x} ${y} ${x} ${y} ${durationMs}`,
    options
  );
  return { success: result.success, error: result.error };
}

export async function typeText(
  text: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // Escape special characters for shell
  const escapedText = text.replace(/(['"\\$`!])/g, "\\$1").replace(/ /g, "%s");
  const result = await executeAdbShell(`input text "${escapedText}"`, options);
  return { success: result.success, error: result.error };
}

export async function pressKey(
  keycode: string | number,
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const result = await executeAdbShell(`input keyevent ${keycode}`, options);
  return { success: result.success, error: result.error };
}

export async function screenshot(
  options: AdbOptions = {}
): Promise<{ success: boolean; data?: Buffer; base64?: string; error?: string }> {
  // Take screenshot and output to stdout as PNG
  const result = await executeAdbWithBinary(
    ["exec-out", "screencap", "-p"],
    options
  );

  if (result.success && result.data.length > 0) {
    return {
      success: true,
      data: result.data,
      base64: result.data.toString("base64"),
    };
  }

  return {
    success: false,
    error: result.error || "Screenshot failed",
  };
}

export async function getScreenSize(
  options: AdbOptions = {}
): Promise<{
  success: boolean;
  width?: number;
  height?: number;
  error?: string;
}> {
  const result = await executeAdbShell("wm size", options);

  if (result.success) {
    const match = result.stdout.match(/(\d+)x(\d+)/);
    if (match) {
      return {
        success: true,
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10),
      };
    }
  }

  return { success: false, error: result.error || "Failed to get screen size" };
}

export async function wake(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_WAKEUP = 224
  const result = await executeAdbShell("input keyevent 224", options);
  return { success: result.success, error: result.error };
}

export async function unlock(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_MENU = 82 (often unlocks when screen is on)
  await wake(options);
  const result = await executeAdbShell("input keyevent 82", options);
  return { success: result.success, error: result.error };
}

export async function pressHome(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_HOME = 3
  return pressKey(3, options);
}

export async function pressBack(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_BACK = 4
  return pressKey(4, options);
}

export async function pressRecent(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_APP_SWITCH = 187
  return pressKey(187, options);
}

// Common Android keycodes for reference
export const KEYCODES = {
  HOME: 3,
  BACK: 4,
  CALL: 5,
  ENDCALL: 6,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  CAMERA: 27,
  ENTER: 66,
  DELETE: 67,
  MENU: 82,
  SEARCH: 84,
  APP_SWITCH: 187,
  WAKEUP: 224,
  SLEEP: 223,
} as const;
