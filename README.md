# Personal Grocery Companion

A Progressive Web App (PWA) to track real-time grocery spend against a budget, utilizing Google Sheets as a free, scalable backend for purchase history and cost-of-living analysis.

## Features

- 🏪 **Store Management**: Track multiple store locations with GPS coordinates
- 🛒 **Real-time Cart**: Running total updates instantly as you shop
- 📱 **Barcode Scanning**: Add items via camera or manual entry
- 📊 **Google Sheets Backend**: All purchase history logged to your own spreadsheet
- 💾 **Offline First**: Works without internet, syncs when connected
- 🎨 **Modern UI**: Dark mode with Material UI components

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Library**: Material UI v5
- **State Management**: Zustand
- **PWA Support**: vite-plugin-pwa
- **Backend**: Google Apps Script (Web App)
- **Database**: Google Sheets

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- A Google account (for Google Sheets backend)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Setup Google Sheets Backend

1. Create a new Google Sheet
2. Go to **Extensions > Apps Script**
3. Copy the content from `backend/Code.gs`
4. Deploy as a **Web App** (Anyone can access)
5. Copy the Web App URL
6. Update `src/services/api.ts` with your URL

## Deployment

This project uses GitHub Actions to automatically deploy to Google Cloud Storage.

See `deployment_guide.md` for detailed setup instructions.

## License

MIT
