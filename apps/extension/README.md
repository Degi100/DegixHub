# DegixHub Browser Extension

Browser extension for quickly saving links to your DegixHub instance.

## Features

- 🚀 Quick save current tab as a link
- 🔐 Secure authentication with your DegixHub instance
- 🎨 Dark mode UI
- 📝 Auto-fill page title and URL
- 🏷️ Categorize links
- ⚡ Fast and lightweight

## Installation

### For Development

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `apps/extension` directory

### For Production

1. Build the extension (icons will be needed)
2. Load the built extension in your browser

## Setup

1. Click the DegixHub extension icon
2. Enter your DegixHub API URL (e.g., `http://localhost:3000`)
3. Login with your username and password
4. Start saving links!

## Usage

1. Navigate to any webpage you want to save
2. Click the DegixHub extension icon
3. The title and URL will be auto-filled
4. Choose a category and add an optional description
5. Click "Save Link"

## Configuration

The extension stores:
- API URL
- Session ID (encrypted in browser storage)

To change your DegixHub instance, click "Logout" and login again with a different API URL.

## Development

### Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and API communication
- `background.js` - Background service worker
- `icons/` - Extension icons (placeholder)

### API Communication

The extension communicates with your DegixHub instance via:
- `POST /api/auth/login` - Authentication
- `POST /api/trpc/links.create` - Create link

### Security

- Session IDs are stored in Chrome's encrypted storage
- API communication uses secure fetch with credentials
- No sensitive data is logged

## TODO

- [ ] Add extension icons
- [ ] Add context menu integration (right-click to save)
- [ ] Add keyboard shortcuts
- [ ] Add quick actions (save to favorites, etc.)
- [ ] Add offline support with sync queue

## Support

For issues or feature requests, visit the main DegixHub repository.
