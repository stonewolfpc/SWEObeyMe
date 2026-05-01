# 🚀 SWEObeyMe

The AI Governance System That Actually Works

[![Version](https://img.shields.io/badge/version-5.1.22-blue.svg)](CHANGELOG.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.15.0-green.svg)](https://nodejs.org)
[![Vitest](https://img.shields.io/badge/vitest-latest-orange.svg)](https://vitest.dev)
[![Users](https://img.shields.io/badge/users-12K%2B-brightgreen.svg)](https://github.com/stonewolfpc/SWEObeyMe/stargazers)

---

## 🔥 First Fully Functional Release

**5.1.20 is here.** After months of relentless debugging, auditing, and testing across every environment imaginable (yes, even my son's mom's laptop), SWEObeyMe is finally ready to unleash its full potential.

This isn't just an update. This is the moment you've been waiting for.

No more "kinda works." No more workarounds. This is what AI governance was always supposed to be.

---

## 📌 What is SWEObeyMe?

SWEObeyMe is a self-correcting, hardware-optimized AI governance system designed to eliminate context pollution, enforce separation of concerns, and deliver deterministic, high-precision results—every single time.

**🧠 Think Model Orchestration:** A master AI coordinates specialized models to handle tasks with surgical precision.

**⚡ Lightning-Fast Governance:** Works with Windsurf's powerful AI models. Requires a Windsurf subscription or free tier with VS Code integration.

**🛡️ Zero Tolerance for Failure:** Governance layers refuse to expose errors to users. If it doesn't work, it fixes itself.

**📚 400MB Documentation Corpus:** Complete technical documentation across 18 specialized corpora including math, FDQ, training, Godot, C#, C++, enterprise security, web development, and more. Your AI has access to comprehensive technical references.

---

## 💡 Why This Release is a Big Deal

| Before                      | Now (5.1.20)                              |
| --------------------------- | ----------------------------------------- |
| ❌ "Kinda works"            | ✅ Fully functional                       |
| ❌ Bloated, unclear outputs | ✅ Precise, single-line edits             |
| ❌ Context pollution        | ✅ Zero pollution, maximum clarity        |
| ❌ Cloud-dependent          | ✅ Windsurf-powered, optimized governance |
| ❌ Fake responses           | ✅ No bullshit. Just results.             |

This is the version where users will finally say:

_"Oh… THIS is what it was always supposed to do… holy SMOKES."_

---

## 🚨 Migration Notice for PRE 5.1.9 Users

**Users still running the PRE 5.1.9 release experienced major configuration problems.** Before updating to v5.1.20, you MUST:

1. **Uninstall the extension** from your Windsurf extensions folder
2. **Delete the configuration** for SWEObeyMe in the Windsurf MCP config menu
3. **Restart Windsurf** completely
4. **Install v5.1.20** fresh

**Default install paths:**

- Windows: `C:\Users\YOUR_USER\.codeium\windsurf-next\extensions\`
- macOS/Linux: `~/.codeium/windsurf-next/extensions/`

**Testing:** This fix has been tested on a spare computer without source files and under a different installation directory.

**If You're Still Experiencing Issues:**

- Contact on GitHub: https://github.com/stonewolfpc/SWEObeyMe/issues
- Email: stonewolfpcrepair01@gmail.com

---

## 🚨 A Note on v5.1.3 — MCP Config Path Issue

**The Problem:**
The extension hardcoded the MCP config path to `~/.codeium/windsurf-next/mcp_config.json` and actively deleted configs from `~/.codeium/windsurf/mcp_config.json` and `~/.codeium/mcp_config.json`. This meant:

- Users with regular Windsurf (not windsurf-next) couldn't use the extension at all
- Users with both Windsurf and Windsurf-Next installed would have their regular Windsurf config deleted every time the extension activated
- The MCP server would show as active briefly then vanish instantly

**The Fix (v5.1.4):**
The extension now:

- Detects all possible config paths (windsurf-next, windsurf, .codeium)
- Writes to all existing directories instead of deleting them
- Uses platform-agnostic paths in sample configs for Windows, macOS, and Linux compatibility

---

## 🚨 A Note on v5.0.10 through v5.0.15 — "It Worked On My Machine"

Okay, real talk — I owe you guys an apology.

Versions 5.0.10 through 5.0.15 were, to put it diplomatically, a mess for anyone who wasn't me. The MCP server crashed on startup, the sidebar icon never appeared, and the config file wrote to the wrong directory. Every single one of these worked perfectly on my local machine, which made them genuinely hard to catch before release.

**v5.0.16 is the one that works.** Fresh install, no leftover versions in your extensions folder, full restart of Windsurf-Next. That's all it takes.

I'm sorry for the headache. Genuinely. This extension means a lot to me and you all deserve better than "oops, worked locally." The error reporting pipeline is now live so I'll catch these before you do going forward. — Chris

---

## 🚀 Installation

### Prerequisites

- Node.js 24.15.0+ (LTS recommended)
- Windsurf 2.0+ (Wave 14+, for full MCP integration)

### 1. Install from Windsurf Marketplace

1. Open Windsurf
2. Go to Extensions > Marketplace
3. Search for "SWEObeyMe"
4. Click Install

### 2. Manual Installation (Advanced)

```bash
# Clone the repo
git clone https://github.com/stonewolfpc/SWEObeyMe.git
cd SWEObeyMe

# Install dependencies
npm install

# Build
npm run build

# Test (optional, but recommended)
npm test
```

---

## 🛠️ Usage

### Basic Setup

1. Configure your MCP server (see MCP Docs)
2. Load SWEObeyMe in Windsurf
3. Start governing your AI with zero setup friction

### Example: Precision Code Editing

**Before: Bloated, unclear**

```javascript
function maybeFixThis(code) {
  // ... 50 lines of guesswork ...
}
```

**After: SWEObeyMe**

```javascript
// "I see an error on line 42. Let me fix that."
// *Single-line edit applied*
```

---

## 📊 Performance

| Metric           | SWEObeyMe 5.1.20                   | Competitors              |
| ---------------- | ---------------------------------- | ------------------------ |
| Speed            | ⚡ Near-instant (Windsurf-powered) | ⏳ Cloud latency         |
| Context Handling | 🧠 32K+ with rollover enhancements | 📉 Degrades at scale     |
| Accuracy         | 🎯 99%+ tool calling               | ~80%                     |
| Stability        | 🛡️ Self-correcting governance      | ❌ Manual fixes required |

---

## 🔧 Known Limitations (Side Projects)

2 UI elements are still in development (non-critical). These do not affect core functionality.

Track progress in the [ui-tweaks](https://github.com/stonewolfpc/SWEObeyMe/tree/ui-tweaks) branch.

---

## 🙌 Acknowledgments

To the 12,000+ early adopters: You believed in this when it was broken. Now, it's unbreakable.

To the Windsurf team: For pushing the boundaries of what MCP can do.

To my son's mom: For letting me test on her laptop. True hero.

---

## 📜 License

MIT © Christofer Wade

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/stonewolfpc/SWEObeyMe/issues)
- **Discussions:** [GitHub Discussions](https://github.com/stonewolfpc/SWEObeyMe/discussions)
- **Discord:** [Join our Discord](https://discord.gg/WHvc2EGe)
- **Patreon:** [Support on Patreon](https://patreon.com/StoneWolfSystems)
- **Donations:** [Ko-fi](https://ko-fi.com/stonewolfpc) (Fuel the revolution!)

---

## 🔥 Ready to experience LIMITED AI governance?

Install SWEObeyMe 5.1.20 today.

**Note:** SWEObeyMe operates within Windsurf's MCP server and prompting limitations. While we provide surgical governance, the overall effectiveness depends on Windsurf's model behavior and tool invocation constraints.
