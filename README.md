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

The shared sheet for this project lives at:

- https://docs.google.com/spreadsheets/d/1JjLe8svmOiJ40zBdcOSXr7rfm-zr1h9U9qh90fsktqU/edit?usp=sharing

Follow these steps to make it ready for syncing trips:

1. Open the sheet link above and go to **Extensions → Apps Script**.
2. Paste the contents of `backend/Code.gs` (replacing any existing code). Save the project.
3. In the Apps Script editor, run the `initializeSheets` function once. This creates the `Store_Master`, `Product_Master`, and `Purchase_History` tabs with header rows if they are missing.
4. Deploy as a **Web App** (select **Anyone** access). Copy the **Current web app URL** from the deployment.
5. Create a `.env` file in the project root with your Web App URL:

    ```bash
    cp .env.example .env
    # edit .env to paste your URL
    ```

6. Update `VITE_GAS_WEB_APP_URL` inside `.env` (in the project root) with the Web App URL you copied so the frontend targets the correct deployment.
7. Restart the dev server so Vite picks up the new environment variable.

## Deployment

This project uses GitHub Actions to automatically deploy to Google Cloud Storage.

The workflow expects `GCP_SA_KEY` and `GCP_BUCKET_NAME` to be configured as repository secrets. If either secret is missing, the
deploy job fails immediately with a clear error so you know to correct the secret configuration.

See `deployment_guide.md` for detailed setup instructions.

## License

MIT
