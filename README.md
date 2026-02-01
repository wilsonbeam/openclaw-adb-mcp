# OpenClaw ADB MCP

🤖📱 **ADB MCP Server & OpenClaw Plugin** — Give AI agents control of real Android phones.

## What is this?

An MCP (Model Context Protocol) server that exposes Android Debug Bridge (ADB) commands to AI agents, plus an OpenClaw plugin for seamless integration.

Let your AI assistant:
- 📱 Control real Android devices
- 📸 Take screenshots and analyze UI
- ⌨️ Type text, tap, swipe, scroll
- 📲 Install/uninstall apps
- 📁 Push/pull files
- 🔍 Inspect device state

## Status

🚧 **Under Development** — First release coming soon!

## Installation

```bash
# Coming soon
npm install -g @openclaw/adb-mcp
```

## Usage

### As MCP Server

```bash
adb-mcp serve
```

### With OpenClaw

Add to your OpenClaw config:

```yaml
plugins:
  - name: adb
    package: "@openclaw/adb-mcp"
```

## Prerequisites

- Android device with USB debugging enabled
- ADB installed (`brew install android-platform-tools` on macOS)
- Node.js 18+

## Roadmap

- [ ] Core ADB command wrappers
- [ ] Screenshot & UI analysis
- [ ] Touch/gesture simulation  
- [ ] App lifecycle management
- [ ] File transfer operations
- [ ] OpenClaw plugin packaging
- [ ] Multi-device support

## License

MIT

---

Built with ⚡ by [Wilson Beam](https://x.com/WilsonBeamX) @ [Loqu, Inc.](https://loqu.co)
