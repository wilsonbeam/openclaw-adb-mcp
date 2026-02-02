#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Import ADB modules
import * as core from "./adb/core.js";
import * as screen from "./adb/screen.js";
import * as phone from "./adb/phone.js";

// Tool definitions
const TOOLS = [
  // === Core ADB Tools ===
  {
    name: "adb_list_devices",
    description: "List all connected Android devices with their status and info",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "adb_shell",
    description: "Execute a shell command on the Android device",
    inputSchema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Shell command to execute" },
        deviceId: { type: "string", description: "Target device ID (optional if only one device)" },
      },
      required: ["command"],
    },
  },
  {
    name: "adb_device_info",
    description: "Get detailed information about an Android device (model, brand, Android version, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_install_app",
    description: "Install an APK file on the device",
    inputSchema: {
      type: "object" as const,
      properties: {
        apkPath: { type: "string", description: "Path to the APK file" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
        reinstall: { type: "boolean", description: "Reinstall the app if it exists" },
        grantPermissions: { type: "boolean", description: "Grant all runtime permissions" },
      },
      required: ["apkPath"],
    },
  },
  {
    name: "adb_uninstall_app",
    description: "Uninstall an app from the device",
    inputSchema: {
      type: "object" as const,
      properties: {
        packageName: { type: "string", description: "Package name of the app (e.g., com.example.app)" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
        keepData: { type: "boolean", description: "Keep app data and cache" },
      },
      required: ["packageName"],
    },
  },
  {
    name: "adb_list_packages",
    description: "List installed packages on the device",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
        filter: {
          type: "string",
          enum: ["system", "third-party", "all"],
          description: "Filter packages by type",
        },
      },
    },
  },
  {
    name: "adb_push_file",
    description: "Push a file from local machine to the Android device",
    inputSchema: {
      type: "object" as const,
      properties: {
        localPath: { type: "string", description: "Local file path" },
        remotePath: { type: "string", description: "Remote path on device" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["localPath", "remotePath"],
    },
  },
  {
    name: "adb_pull_file",
    description: "Pull a file from the Android device to local machine",
    inputSchema: {
      type: "object" as const,
      properties: {
        remotePath: { type: "string", description: "Remote path on device" },
        localPath: { type: "string", description: "Local file path" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["remotePath", "localPath"],
    },
  },
  {
    name: "adb_start_activity",
    description: "Start an activity with the given intent",
    inputSchema: {
      type: "object" as const,
      properties: {
        intent: { type: "string", description: "Intent to start (e.g., -n com.app/.MainActivity)" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["intent"],
    },
  },
  {
    name: "adb_force_stop",
    description: "Force stop an application",
    inputSchema: {
      type: "object" as const,
      properties: {
        packageName: { type: "string", description: "Package name of the app" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["packageName"],
    },
  },
  {
    name: "adb_clear_data",
    description: "Clear all data for an application",
    inputSchema: {
      type: "object" as const,
      properties: {
        packageName: { type: "string", description: "Package name of the app" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["packageName"],
    },
  },

  // === Screen Control Tools ===
  {
    name: "adb_tap",
    description: "Tap on the screen at the specified coordinates",
    inputSchema: {
      type: "object" as const,
      properties: {
        x: { type: "number", description: "X coordinate" },
        y: { type: "number", description: "Y coordinate" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "adb_swipe",
    description: "Swipe from one point to another on the screen",
    inputSchema: {
      type: "object" as const,
      properties: {
        startX: { type: "number", description: "Starting X coordinate" },
        startY: { type: "number", description: "Starting Y coordinate" },
        endX: { type: "number", description: "Ending X coordinate" },
        endY: { type: "number", description: "Ending Y coordinate" },
        durationMs: { type: "number", description: "Duration in milliseconds (default 300)" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["startX", "startY", "endX", "endY"],
    },
  },
  {
    name: "adb_long_press",
    description: "Long press on the screen at the specified coordinates",
    inputSchema: {
      type: "object" as const,
      properties: {
        x: { type: "number", description: "X coordinate" },
        y: { type: "number", description: "Y coordinate" },
        durationMs: { type: "number", description: "Duration in milliseconds (default 1000)" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "adb_type_text",
    description: "Type text into the currently focused input field",
    inputSchema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "Text to type" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["text"],
    },
  },
  {
    name: "adb_press_key",
    description: "Press a key on the device (using Android keycode)",
    inputSchema: {
      type: "object" as const,
      properties: {
        keycode: {
          type: "number",
          description: "Android keycode (e.g., 3=HOME, 4=BACK, 24=VOLUME_UP, 25=VOLUME_DOWN)",
        },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["keycode"],
    },
  },
  {
    name: "adb_screenshot",
    description: "Take a screenshot of the device screen and return as base64 PNG",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_screen_size",
    description: "Get the screen dimensions of the device",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_wake",
    description: "Wake up the device screen",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_press_home",
    description: "Press the home button",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_press_back",
    description: "Press the back button",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },

  // === Phone Tools ===
  {
    name: "adb_make_call",
    description: "Make a phone call to the specified number (dials immediately)",
    inputSchema: {
      type: "object" as const,
      properties: {
        phoneNumber: { type: "string", description: "Phone number to call (can include +, spaces, dashes)" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["phoneNumber"],
    },
  },
  {
    name: "adb_dial_number",
    description: "Open the dialer with a number (does not dial - user must press call)",
    inputSchema: {
      type: "object" as const,
      properties: {
        phoneNumber: { type: "string", description: "Phone number to dial" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["phoneNumber"],
    },
  },
  {
    name: "adb_end_call",
    description: "End the current phone call",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_send_sms",
    description: "Open SMS composer with a pre-filled message (user must press send)",
    inputSchema: {
      type: "object" as const,
      properties: {
        phoneNumber: { type: "string", description: "Recipient phone number" },
        message: { type: "string", description: "SMS message content" },
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
      required: ["phoneNumber", "message"],
    },
  },
  {
    name: "adb_call_state",
    description: "Get the current call state (idle, ringing, or offhook)",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
  {
    name: "adb_answer_call",
    description: "Answer an incoming call",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "string", description: "Target device ID (optional)" },
      },
    },
  },
];

// Create the MCP server
const server = new Server(
  {
    name: "adb-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Core ADB tools
      case "adb_list_devices":
        result = await core.listDevices();
        break;
      case "adb_shell":
        result = await core.shell(args?.command as string, { deviceId: args?.deviceId as string });
        break;
      case "adb_device_info":
        result = await core.getDeviceInfo({ deviceId: args?.deviceId as string });
        break;
      case "adb_install_app":
        result = await core.installApp(args?.apkPath as string, {
          deviceId: args?.deviceId as string,
          reinstall: args?.reinstall as boolean,
          grantPermissions: args?.grantPermissions as boolean,
        });
        break;
      case "adb_uninstall_app":
        result = await core.uninstallApp(args?.packageName as string, {
          deviceId: args?.deviceId as string,
          keepData: args?.keepData as boolean,
        });
        break;
      case "adb_list_packages":
        result = await core.listPackages({
          deviceId: args?.deviceId as string,
          filter: args?.filter as "system" | "third-party" | "all",
        });
        break;
      case "adb_push_file":
        result = await core.pushFile(
          args?.localPath as string,
          args?.remotePath as string,
          { deviceId: args?.deviceId as string }
        );
        break;
      case "adb_pull_file":
        result = await core.pullFile(
          args?.remotePath as string,
          args?.localPath as string,
          { deviceId: args?.deviceId as string }
        );
        break;
      case "adb_start_activity":
        result = await core.startActivity(args?.intent as string, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_force_stop":
        result = await core.forceStopApp(args?.packageName as string, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_clear_data":
        result = await core.clearAppData(args?.packageName as string, {
          deviceId: args?.deviceId as string,
        });
        break;

      // Screen control tools
      case "adb_tap":
        result = await screen.tap(args?.x as number, args?.y as number, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_swipe":
        result = await screen.swipe(
          args?.startX as number,
          args?.startY as number,
          args?.endX as number,
          args?.endY as number,
          (args?.durationMs as number) || 300,
          { deviceId: args?.deviceId as string }
        );
        break;
      case "adb_long_press":
        result = await screen.longPress(
          args?.x as number,
          args?.y as number,
          (args?.durationMs as number) || 1000,
          { deviceId: args?.deviceId as string }
        );
        break;
      case "adb_type_text":
        result = await screen.typeText(args?.text as string, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_press_key":
        result = await screen.pressKey(args?.keycode as number, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_screenshot": {
        const screenshotResult = await screen.screenshot({
          deviceId: args?.deviceId as string,
        });
        if (screenshotResult.success && screenshotResult.base64) {
          return {
            content: [
              {
                type: "image",
                data: screenshotResult.base64,
                mimeType: "image/png",
              },
            ],
          };
        }
        result = screenshotResult;
        break;
      }
      case "adb_screen_size":
        result = await screen.getScreenSize({ deviceId: args?.deviceId as string });
        break;
      case "adb_wake":
        result = await screen.wake({ deviceId: args?.deviceId as string });
        break;
      case "adb_press_home":
        result = await screen.pressHome({ deviceId: args?.deviceId as string });
        break;
      case "adb_press_back":
        result = await screen.pressBack({ deviceId: args?.deviceId as string });
        break;

      // Phone tools
      case "adb_make_call":
        result = await phone.makeCall(args?.phoneNumber as string, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_dial_number":
        result = await phone.dialNumber(args?.phoneNumber as string, {
          deviceId: args?.deviceId as string,
        });
        break;
      case "adb_end_call":
        result = await phone.endCall({ deviceId: args?.deviceId as string });
        break;
      case "adb_send_sms":
        result = await phone.sendSms(
          args?.phoneNumber as string,
          args?.message as string,
          { deviceId: args?.deviceId as string }
        );
        break;
      case "adb_call_state":
        result = await phone.getCallState({ deviceId: args?.deviceId as string });
        break;
      case "adb_answer_call":
        result = await phone.answerCall({ deviceId: args?.deviceId as string });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const err = error as Error;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: err.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ADB MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
