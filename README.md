# @wilsonbeam/openclaw-adb-mcp

Give AI agents full control of real Android phones.

**MCP Server** + **OpenClaw Skill** for Android device automation via ADB.

## What Can It Do?

- 📱 **Screen Control** — tap, swipe, type text, take screenshots
- 📞 **Phone Functions** — make calls, send SMS, check call state  
- 📦 **App Management** — install, uninstall, list packages
- 🔧 **Device Control** — shell commands, push/pull files, wake screen

## Quick Start

### 1. Install ADB

```bash
# macOS
brew install android-platform-tools

# Linux  
sudo apt install adb

# Windows
# Download from developer.android.com/tools/releases/platform-tools
```

### 2. Connect Your Android Device

1. Enable **Developer Options** on your phone
2. Enable **USB Debugging**
3. Connect via USB cable
4. Accept the authorization prompt on your phone

Verify:
```bash
adb devices
# Should show: XXXXX device
```

### 3. Add to OpenClaw

Add to your `~/.openclaw/config.yaml`:

```yaml
mcp:
  servers:
    adb:
      command: npx
      args: ["@wilsonbeam/openclaw-adb-mcp"]
```

Or install globally first:
```bash
npm install -g @wilsonbeam/openclaw-adb-mcp
```

Then:
```yaml
mcp:
  servers:
    adb:
      command: openclaw-adb-mcp
```

### 4. Install the Skill (Optional but Recommended)

The skill teaches your AI agent how to use the ADB tools effectively.

```bash
# From clawhub.com (coming soon)
openclaw skill install adb

# Or manually copy the skill folder
cp -r skill/ ~/.openclaw/skills/adb/
```

## Available Tools (26 total)

### Core ADB
| Tool | Description |
|------|-------------|
| `adb_list_devices` | List connected Android devices |
| `adb_shell` | Execute shell command |
| `adb_device_info` | Get model, brand, Android version |
| `adb_install_app` | Install APK file |
| `adb_uninstall_app` | Uninstall app |
| `adb_list_packages` | List installed packages |
| `adb_push_file` | Push file to device |
| `adb_pull_file` | Pull file from device |
| `adb_start_activity` | Start activity/intent |
| `adb_force_stop` | Force stop app |
| `adb_clear_data` | Clear app data |

### Screen Control
| Tool | Description |
|------|-------------|
| `adb_tap` | Tap at coordinates |
| `adb_swipe` | Swipe gesture |
| `adb_long_press` | Long press |
| `adb_type_text` | Type into focused field |
| `adb_press_key` | Press Android keycode |
| `adb_screenshot` | Capture screen (returns base64 PNG) |
| `adb_screen_size` | Get screen dimensions |
| `adb_wake` | Wake device screen |
| `adb_press_home` | Press home button |
| `adb_press_back` | Press back button |

### Phone Functions
| Tool | Description |
|------|-------------|
| `adb_make_call` | Make phone call (dials immediately) |
| `adb_dial_number` | Open dialer with number |
| `adb_end_call` | End current call |
| `adb_send_sms` | Open SMS composer |
| `adb_call_state` | Get call state (idle/ringing/offhook) |
| `adb_answer_call` | Answer incoming call |

## Example Conversations

**"Take a screenshot of my phone"**
→ Agent uses `adb_screenshot`, returns the image

**"Call Mom at +1-555-123-4567"**
→ Agent uses `adb_make_call`

**"Open Chrome and search for weather"**
→ Agent uses `adb_start_activity` to launch Chrome, `adb_tap` on search bar, `adb_type_text` to enter query

**"Install the APK I just downloaded"**
→ Agent uses `adb_install_app` with the APK path

## Project Structure

```
openclaw-adb-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   └── adb/
│       ├── executor.ts   # Low-level ADB execution
│       ├── core.ts       # Device, app, file operations
│       ├── screen.ts     # Tap, swipe, screenshot
│       └── phone.ts      # Call, SMS functions
├── skill/
│   ├── SKILL.md          # OpenClaw skill definition
│   └── scripts/
│       └── check-setup.sh
├── package.json
└── tsconfig.json
```

## Multiple Devices

All tools accept optional `deviceId`. If omitted with multiple devices connected, ADB errors. Use `adb_list_devices` to get device IDs.

## Development

```bash
git clone https://github.com/wilsonbeam/openclaw-adb-mcp
cd openclaw-adb-mcp
npm install
npm run build
npm run dev  # Build and run
```

## Troubleshooting

**No devices found**
- Check USB cable and connection
- Enable USB debugging on device
- Run `adb kill-server && adb start-server`

**Device unauthorized**
- Accept the RSA key prompt on your phone screen

**Screenshot fails**
- Wake the screen first with `adb_wake`
- Some devices need screen unlock

## License

MIT

## Author

Wilson Beam / OpenClaw
