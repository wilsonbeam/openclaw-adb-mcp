import { executeAdbShell, AdbOptions } from "./executor.js";

export async function makeCall(
  phoneNumber: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // Clean the phone number - remove spaces, dashes, etc. but keep + for international
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
  
  // Use ACTION_CALL to directly dial
  const result = await executeAdbShell(
    `am start -a android.intent.action.CALL -d tel:${cleanNumber}`,
    options
  );

  if (result.success) {
    return {
      success: true,
      message: `Initiating call to ${phoneNumber}`,
    };
  }

  return {
    success: false,
    message: result.stderr || result.stdout,
    error: result.error || "Failed to initiate call",
  };
}

export async function dialNumber(
  phoneNumber: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // Clean the phone number
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
  
  // Use ACTION_DIAL to open dialer (doesn't auto-dial - requires user to press call)
  const result = await executeAdbShell(
    `am start -a android.intent.action.DIAL -d tel:${cleanNumber}`,
    options
  );

  if (result.success) {
    return {
      success: true,
      message: `Opened dialer with ${phoneNumber}`,
    };
  }

  return {
    success: false,
    message: result.stderr || result.stdout,
    error: result.error || "Failed to open dialer",
  };
}

export async function endCall(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_ENDCALL = 6
  const result = await executeAdbShell("input keyevent 6", options);
  return { success: result.success, error: result.error };
}

export async function sendSms(
  phoneNumber: string,
  message: string,
  options: AdbOptions = {}
): Promise<{ success: boolean; message: string; error?: string }> {
  // Clean the phone number
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
  
  // Escape special characters in the message
  const escapedMessage = message
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/`/g, "\\`");

  // Open SMS composer with the message pre-filled
  const result = await executeAdbShell(
    `am start -a android.intent.action.SENDTO -d sms:${cleanNumber} --es sms_body "${escapedMessage}" --ez exit_on_sent true`,
    options
  );

  if (result.success) {
    return {
      success: true,
      message: `Opened SMS to ${phoneNumber} with message. User needs to press send.`,
    };
  }

  return {
    success: false,
    message: result.stderr || result.stdout,
    error: result.error || "Failed to open SMS",
  };
}

export async function getCallState(
  options: AdbOptions = {}
): Promise<{
  success: boolean;
  state?: "idle" | "ringing" | "offhook";
  error?: string;
}> {
  const result = await executeAdbShell(
    "dumpsys telephony.registry | grep mCallState",
    options
  );

  if (result.success) {
    const output = result.stdout.toLowerCase();
    
    if (output.includes("2") || output.includes("offhook")) {
      return { success: true, state: "offhook" };
    } else if (output.includes("1") || output.includes("ringing")) {
      return { success: true, state: "ringing" };
    } else {
      return { success: true, state: "idle" };
    }
  }

  return { success: false, error: result.error || "Failed to get call state" };
}

export async function answerCall(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // KEYCODE_CALL = 5
  const result = await executeAdbShell("input keyevent 5", options);
  return { success: result.success, error: result.error };
}

export async function toggleSpeaker(
  options: AdbOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // This uses the media service to toggle speaker
  const result = await executeAdbShell(
    "am broadcast -a android.media.action.SPEAKERPHONE_TOGGLE",
    options
  );
  return { success: result.success, error: result.error };
}
