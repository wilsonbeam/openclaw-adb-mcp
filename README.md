# @openclaw/adb-mcp

Give AI agents full control of real Android phones via MCP (Model Context Protocol).

## Features

**Core ADB**
- List connected devices
- Execute shell commands
- Get device info (model, brand, Android version)
- Install/uninstall apps
- Push/pull files
- Start activities, force stop, clear app data

**Screen Control**
- Tap, swipe, long press
- Type text
- Press keys (home, back, volume, etc.)
- Take screenshots (returns base64 PNG)
- Get screen dimensions
- Wake/unlock device

**Phone Functions**
- Make phone calls (dials immediately)
- Open dialer with number
- End calls
- Send SMS (opens composer)
- Get call state
- Answer incoming calls

## Installation

```bash
npm install @openclaw/adb-mcp
```

## Prerequisites

1. **ADB installed**: `brew install android-platform-tools` (macOS) or [download SDK tools](https://developer.android.com/studio/releases/platform-tools)
2. **USB debugging enabled** on your Android device
3. **Device connected** and authorized

Verify with:
```bash
adb devices
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "adb": {
      "command": "npx",
      "args": ["@openclaw/adb-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "adb": {
      "command": "adb-mcp"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `adb_list_devices` | List all connected Android devices |
| `adb_shell` | Execute shell command on device |
| `adb_device_info` | Get device model, brand, Android version |
| `adb_install_app` | Install APK file |
| `adb_uninstall_app` | Uninstall app by package name |
| `adb_list_packages` | List installed packages |
| `adb_push_file` | Push file to device |
| `adb_pull_file` | Pull file from device |
| `adb_start_activity` | Start an activity intent |
| `adb_force_stop` | Force stop an app |
| `adb_clear_data` | Clear app data |
| `adb_tap` | Tap screen coordinates |
| `adb_swipe` | Swipe between coordinates |
| `adb_long_press` | Long press at coordinates |
| `adb_type_text` | Type text into focused field |
| `adb_press_key` | Press Android keycode |
| `adb_screenshot` | Take screenshot (returns base64 PNG) |
| `adb_screen_size` | Get screen dimensions |
| `adb_wake` | Wake device screen |
| `adb_press_home` | Press home button |
| `adb_press_back` | Press back button |
| `adb_make_call` | Make phone call |
| `adb_dial_number` | Open dialer with number |
| `adb_end_call` | End current call |
| `adb_send_sms` | Open SMS composer |
| `adb_call_state` | Get current call state |
| `adb_answer_call` | Answer incoming call |

### Multiple Devices

All tools accept an optional `deviceId` parameter. If omitted and multiple devices are connected, ADB will error. Get device IDs with `adb_list_devices`.

## Example Interactions

**"What Android devices are connected?"**
→ Uses `adb_list_devices`

**"Take a screenshot of my phone"**
→ Uses `adb_screenshot`, returns PNG image

**"Call +1-555-123-4567"**
→ Uses `adb_make_call` with the phone number

**"Open Settings app"**
→ Uses `adb_start_activity` with `-n com.android.settings/.Settings`

**"Install the APK at /path/to/app.apk"**
→ Uses `adb_install_app`

## Development

```bash
git clone https://github.com/openclaw/openclaw-adb-mcp
cd openclaw-adb-mcp
npm install
npm run build
npm run dev  # Build and run
```

## License

MIT

## Author

Wilson Beam / OpenClaw
