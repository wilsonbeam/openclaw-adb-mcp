#!/bin/bash
# Check ADB setup for OpenClaw

echo "=== ADB Setup Check ==="
echo

# Check if ADB is installed
if command -v adb &> /dev/null; then
    echo "✓ ADB installed: $(which adb)"
    echo "  Version: $(adb version | head -1)"
else
    echo "✗ ADB not found"
    echo "  Install with: brew install android-platform-tools (macOS)"
    echo "             or: sudo apt install adb (Linux)"
    exit 1
fi

echo

# Check for connected devices
echo "=== Connected Devices ==="
DEVICES=$(adb devices -l 2>/dev/null | tail -n +2 | grep -v "^$")
if [ -z "$DEVICES" ]; then
    echo "✗ No devices connected"
    echo "  - Connect Android device via USB"
    echo "  - Enable Developer Options → USB Debugging"
    echo "  - Accept authorization prompt on device"
    exit 1
else
    echo "$DEVICES"
    DEVICE_COUNT=$(echo "$DEVICES" | wc -l | tr -d ' ')
    echo
    echo "✓ Found $DEVICE_COUNT device(s)"
fi

echo

# Check if MCP server is available
echo "=== MCP Server ==="
if npm list -g @openclaw/adb-mcp &> /dev/null; then
    echo "✓ @openclaw/adb-mcp installed globally"
elif [ -f "$(npm root -g)/@openclaw/adb-mcp/dist/index.js" ]; then
    echo "✓ @openclaw/adb-mcp available"
else
    echo "○ @openclaw/adb-mcp not installed globally"
    echo "  Install with: npm install -g @openclaw/adb-mcp"
    echo "  Or use npx in config: command: npx, args: ['@openclaw/adb-mcp']"
fi

echo
echo "=== Setup Complete ==="
