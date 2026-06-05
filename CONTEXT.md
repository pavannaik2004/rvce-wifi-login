# RVCE Captive Portal Auto-Login Extension

## Project Context
This project is a Google Chrome Extension (Manifest V3) designed to automate the credential entry and form submission for the RV Institutions Secure Internet Access Gateway. It allows students to bypass manual login pages when connecting to campus routers.

## Goals & Requirements
- **Dynamic Scope**: Operates on `*://172.16.*/*` to support varying gateway IPs.
- **Immediate Execution**: Detects gateway, verifies identity, auto-fills credentials, and submits.
- **Configurable UI**: Extension popup lets users securely save credentials locally.
- **Safety**: 
  - Prevents infinite loops by halting execution if error text (like "Invalid Credentials") is found.
  - Verifies DOM for "RV Institutions" string before executing.

## File Structure
- `manifest.json`: Configuration, permissions, matching patterns.
- `popup.html`: The user interface for the extension config with modern dark-mode aesthetics.
- `popup.js`: Logic to handle loading/saving to `chrome.storage.local`.
- `content.js`: Main logic that runs on portal pages (verification, filling, clicking).

## Logs & Updates

### Update - Date: 2026-06-05
- Added `icon128.png` and updated `manifest.json` to include the new extension icon. Chrome will automatically scale this 128x128 image down for other required sizes (16x16, 48x48, etc.).

### Fix - Date: 2026-06-05
- Fixed an `Invalid host wildcard` error in `manifest.json`. Chrome extensions do not support wildcards in the middle of IPs in match patterns. Changed `manifest.json` to match `http://*/*` and `https://*/*`, and added an IP filter (`window.location.hostname.startsWith('172.16.')`) at the top of `content.js` to ensure the script terminates immediately on non-target IPs.

### Initialization - Date: 2026-06-05
- Bootstrapped project.
- Created `manifest.json` configured for Manifest V3 with storage permissions and specific IP pattern matching.
- Developed `popup.html` and `popup.js` with sleek, modern UI for entering credentials.
- Developed `content.js` featuring safety checks (DOM verification and infinite-loop prevention) alongside flexible form field targeting for robust automation across possible router portal variants.
- Established this `CONTEXT.md` file as the source of truth for further updates.
