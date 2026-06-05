# RVCE Captive Portal Auto-Login

A lightweight, modern Google Chrome Extension built to automate credential entry and form submission for the **RV Institutions Secure Internet Access Gateway**. 

Say goodbye to manually typing your SRN and password every time you connect to the campus Wi-Fi!

## 🚀 Features

- **Zero-Click Login**: Detects the captive portal and automatically logs you in instantly upon page load.
- **Dynamic Router Support**: Seamlessly works across various campus gateway IPs (dynamically targets `172.16.*.*`).
- **Privacy First**: Your credentials are saved securely in your local browser sandbox using `chrome.storage.local`. No data ever leaves your device.
- **Infinite-Loop Prevention**: Gracefully halts execution if invalid credentials are provided to prevent annoying page reload loops.
- **Sleek UI**: Modern, dark-mode configuration popup to easily manage your credentials.

## 🛠️ Installation

Since this extension isn't on the Chrome Web Store yet, you can install it manually in a few easy steps:

1. **Download the Extension:**
   - Clone this repository or download the source code as a `.zip` file and extract it.

2. **Open Extension Management in Chrome:**
   - Type `chrome://extensions/` in your Chrome address bar and hit **Enter**.

3. **Enable Developer Mode:**
   - Toggle the **Developer mode** switch in the top-right corner to **ON**.

4. **Load the Extension:**
   - Click the **Load unpacked** button that appears in the top-left corner.
   - Select the extracted folder containing the extension files.

5. **Pin the Extension (Recommended):**
   - Click the puzzle piece icon (🧩) in your Chrome toolbar.
   - Find **RVCE Auto-Login** and click the pin icon (📌) to keep it visible.

## 💡 How to Use

1. Click the extension icon in your Chrome toolbar.
2. Enter your **Username / SRN** and **Password**.
3. Click **Save Credentials**. 
4. You're all set! The next time you connect to the campus Wi-Fi and are redirected to the login page, the extension will handle it automatically.

## 🔒 Security & Privacy

Your credentials are never sent to any external servers or telemetry systems. They remain entirely within your browser's secure local storage environment. If you update them, the previous values are overwritten instantly.
