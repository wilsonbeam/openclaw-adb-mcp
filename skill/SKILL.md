---
name: adb
description: Control real Android phones via ADB. Use when automating Android devices, taking screenshots, making phone calls, sending SMS, installing apps, typing text, tapping/swiping the screen, or any Android device interaction. Requires physical device connected via USB with debugging enabled.
---

# ADB - Android Device Control

Control real Android phones from OpenClaw via ADB (Android Debug Bridge).

## Prerequisites

1. **ADB installed**:
   ```bash
   # macOS
   brew install android-platform-tools
   
   # Linux
   sudo apt install adb
   
   # Windows: download from developer.android.com/tools/releases/platform-tools
   ```

2. **Device connected** with USB debugging enabled:
   - Settings → Developer Options → USB Debugging → ON
   - Connect via USB cable
   - Authorize the computer when prompted on device

3. **Verify connection**:
   ```bash
   adb devices
   # Should show your device with "device" status
   ```

## OpenClaw Configuration

Add to your OpenClaw gateway config (`~/.openclaw/config.yaml`):

```yaml
mcp:
  servers:
    adb:
      command: npx
      args: ["@wilsonbeam/openclaw-adb-mcp"]
```

Or if installed globally (`npm install -g @wilsonbeam/openclaw-adb-mcp`):

```yaml
mcp:
  servers:
    adb:
      command: openclaw-adb-mcp
```

## Available Tools

### Core ADB
| Tool | Purpose |
|------|---------|
| `adb_list_devices` | List connected devices |
| `adb_shell` | Run shell command |
| `adb_device_info` | Get model, brand, Android version |
| `adb_install_app` | Install APK |
| `adb_uninstall_app` | Uninstall by package name |
| `adb_list_packages` | List installed apps |
| `adb_push_file` | Copy file to device |
| `adb_pull_file` | Copy file from device |
| `adb_start_activity` | Launch activity/intent |
| `adb_force_stop` | Kill app |
| `adb_clear_data` | Wipe app data |

### Screen Control
| Tool | Purpose |
|------|---------|
| `adb_tap` | Tap at x,y coordinates |
| `adb_swipe` | Swipe from point to point |
| `adb_long_press` | Long press at coordinates |
| `adb_type_text` | Type into focused field |
| `adb_press_key` | Press keycode (home, back, etc.) |
| `adb_screenshot` | Capture screen as PNG |
| `adb_screen_size` | Get dimensions |
| `adb_wake` | Wake screen |
| `adb_press_home` | Home button |
| `adb_press_back` | Back button |

### Phone Functions
| Tool | Purpose |
|------|---------|
| `adb_make_call` | Dial number immediately |
| `adb_dial_number` | Open dialer (user presses call) |
| `adb_end_call` | Hang up |
| `adb_send_sms` | Open SMS composer |
| `adb_call_state` | Check if idle/ringing/offhook |
| `adb_answer_call` | Answer incoming call |

## Common Keycodes

```
HOME=3, BACK=4, CALL=5, ENDCALL=6
VOLUME_UP=24, VOLUME_DOWN=25, POWER=26
ENTER=66, DELETE=67, MENU=82
```

## Examples

**Take screenshot and analyze it:**
```
Use adb_screenshot to capture the screen, then describe what you see.
```

**Open an app:**
```
adb_shell with command: "am start -n com.android.chrome/com.google.android.apps.chrome.Main"
```

**Make a phone call:**
```
adb_make_call with phoneNumber: "+1-555-123-4567"
```

**Type in a search field:**
```
1. adb_tap on the search field coordinates
2. adb_type_text with the search query
3. adb_press_key with keycode 66 (ENTER)
```

**Scroll down:**
```
adb_swipe from (540, 1500) to (540, 500) with durationMs: 300
```

## Multiple Devices

If multiple devices connected, pass `deviceId` to any tool. Get IDs from `adb_list_devices`.

## Troubleshooting

**"no devices/emulators found"**: Check USB connection, enable USB debugging, run `adb kill-server && adb start-server`

**"unauthorized"**: Accept the authorization prompt on the device screen

**Screenshot fails**: Some devices need screen to be on. Use `adb_wake` first.

**Typing special characters**: Use `adb_shell` with `input text` for complex input, or tap the keyboard directly.
