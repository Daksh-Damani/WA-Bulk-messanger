# Antigravity MassSender - WhatsApp Bulk Messenger

A powerful, user-friendly Chrome extension for sending bulk WhatsApp messages with media support, smart delays, and error resilience.

![Screenshot](assets/screenshot.png)

## Features

### Core Messaging
- **Unlimited Volume**: Send 100-10,000+ messages sequentially without crashes
- **Media Support**: Attach images, videos, PDFs, Word documents (up to 10 files, 16MB each)
- **Personalization**: Use placeholders `{{name}}`, `{{number}}`, `{{date}}`, `{{time}}`
- **Message Repetition**: Repeat messages 1-100 times per contact

### Smart Sending
- **Randomized Delays**: Variable intervals (0.5x-2x) to mimic human behavior
- **Delay Presets**: Fast (1-3s), Normal (3-8s), Safe (5-15s), Stealth (10-30s)
- **Batch Processing**: Configurable batch sizes with pauses between batches
- **Rate Limit Protection**: Automatic pause on WhatsApp warnings

### User Experience
- **Welcome Tour**: Interactive guide for first-time users
- **Drag & Drop Media**: Easy file attachment with previews
- **Live Preview**: See exactly how your message will look
- **Real-time Progress**: Visual progress bar with sent/failed/pending counts
- **Activity Logs**: Filterable logs (success, errors, warnings, info)
- **Session Resume**: Automatically saves progress, resume after browser restart

### Data Management
- **CSV Import**: Load contacts from CSV files (with or without headers)
- **Configuration Save/Load**: Export and import your settings as JSON
- **Results Export**: Download logs as text or CSV reports
- **Dark Mode**: Automatic system preference detection

### Safety Features
- **Continue on Failure**: Skip failed numbers and keep sending
- **Pause on Errors**: Auto-pause after 3+ consecutive failures
- **Human Typing Simulation**: Optional typing animation
- **Contact Randomization**: Shuffle order to avoid patterns
- **Session Persistence**: Never lose progress

## Quick Start

### Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `antigravity-massesender` folder
5. Extension icon appears in toolbar

### First Use
1. **Open WhatsApp Web**: Go to `https://web.whatsapp.com` and scan QR code
2. **Click Extension**: Open the Antigravity MassSender popup
3. **Follow the Tour**: Click "Quick Tour" for a guided walkthrough
4. **Add Contacts**: Paste numbers or load from CSV
5. **Write Message**: Use placeholders for personalization
6. **Set Delays**: Choose a preset (Safe recommended for bulk)
7. **Validate & Start**: Click "Validate Numbers" then "Start Sending"

## User Interface

### Main Tab
- **Phone Numbers**: Paste one per line or comma-separated. Include country codes (+1, +91, +44)
- **Message Content**: Write your template with placeholders
- **Delay Settings**: Min/Max delay, batch size, batch delay
- **Delay Presets**: One-click safe delay configurations

### Media Tab
- **Drag & Drop**: Drop files directly or click to browse
- **File Preview**: See thumbnails, names, and sizes
- **Media Settings**: Send media first, auto-compress, send as document

### Settings Tab
- **Sending Behavior**: Skip failed, auto-close chat, randomize, human typing
- **Rate Limit Protection**: Respect WhatsApp limits, pause on errors
- **Browser & Session**: Keep awake, auto-close on complete, save session
- **Data Management**: Save/load config, export logs, export CSV, clear all

### Logs Tab
- **Filter**: All, Success, Errors, Warnings, Info
- **Real-time**: Live updates during sending
- **Export**: Download logs for analysis

## CSV Format

```csv
+1234567890
+1234567891,Johnny bhai
+1234567892,Khiladi bhai
```

With headers:
```csv
phone,name
+1234567890,Johnny bhai
+1234567891,Khiladi bhai
```

Supported columns: `phone`, `number`, `mobile`, `name`, `contact_name`

## Message Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{name}}` | Contact name | "Hello Johnny bhai" |
| `{{number}}` | Phone number | "+1234567890" |
| `{{date}}` | Current date | "Jul 16, 2026" |
| `{{time}}` | Current time | "2:30 PM" |

## Delay Presets

| Preset | Min Delay | Max Delay | Best For |
|--------|-----------|-----------|----------|
| **Fast** | 1s | 3s | Low volume, trusted contacts |
| **Normal** | 3s | 8s | Standard bulk messaging |
| **Safe** | 5s | 15s | Higher volume, avoid limits |
| **Stealth** | 10s | 30s | Maximum safety |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Start sending |
| `Ctrl/Cmd + Space` | Pause/Resume |
| `Ctrl/Cmd + S` | Save configuration |
| `Ctrl/Cmd + E` | Export logs |
| `F1` | Open Settings tab |
| `Escape` | Close preview/modal |

## Session Resume

The extension automatically saves your session:
- Progress (sent/failed counts)
- Remaining numbers
- Current configuration
- Media attachments

If browser closes or crashes, click **"Resume Session"** on next open to continue where you left off.

## Export Data

- **Logs (TXT)**: Full activity log with timestamps
- **Results (CSV)**: Phone number, status, timestamp, error details
- **Config (JSON)**: All settings for backup/sharing

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not loading | Reload in `chrome://extensions/` |
| WhatsApp not detected | Refresh WhatsApp Web tab |
| Messages not sending | Check console for errors, verify selectors |
| Media upload fails | File size < 16MB, valid format |
| Rate limited | Increase delays, enable "Rate Limit Respect" |
| Numbers invalid | Include country code (+1, +91, +44) |

## Safety Guidelines

- **Respect WhatsApp ToS**: Don't spam, respect opt-outs
- **Test First**: Send to 5-10 contacts before bulk
- **Recommended Delays**: 5-15 seconds between messages
- **Hourly Limits**: Don't exceed 100-200 messages/hour per account
- **Monitor Logs**: Watch for errors and rate limit warnings

## File Structure

```
antigravity-massesender/
├── manifest.json
├── background/
│   └── background.js      # Service worker, queue management
├── content/
│   ├── content.js         # WhatsApp Web DOM interaction
│   └── content.css        # Injected styles
├── popup/
│   ├── popup.html         # Main UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Styling
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── assets/                # Web accessible resources
```

## Technical Details

- **Manifest V3** with service worker background
- **Asynchronous queue** with batched processing
- **DOM-based WhatsApp Web interaction** (no official API needed)
- **Data URLs for media** (base64 encoded)
- **Chrome Storage API** for settings persistence
- **Content Security Policy** compliant

## Development

```bash
# Load in Chrome
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select this directory

# Reload after changes
Click refresh icon on extension card
```

## Permissions

- `activeTab` - Access current WhatsApp Web tab
- `scripting` - Inject content scripts
- `storage` - Save settings and sessions
- `tabs` - Detect WhatsApp Web tabs
- `downloads` - Export logs/CSV
- `notifications` - Show status alerts
- `alarms` - Keep-alive during sending
- `host_permissions` - WhatsApp Web access

## License

MIT License - Use at your own risk. Comply with WhatsApp Terms of Service.

---

**Built with ❤️ for efficient, responsible messaging**