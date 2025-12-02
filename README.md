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

1. Open the sheet link above and make sure you have edit access (if not, use **File → Make a copy** into your Drive).
2. Go to **Extensions → Apps Script**, paste the contents of `backend/Code.gs` (replacing any existing code), and save the project.
3. In the Apps Script editor, select and run the `initializeSheets` function once. It will report which tabs were created and which headers were added in the execution log. The `Store_Master`, `Product_Master`, and `Purchase_History` tabs should appear in your sheet; rerun if you delete any of them.
4. Deploy as a **Web App** (select **Anyone** access). Copy the **Current web app URL** from the deployment.
5. Create a `.env` file in the project root with your Web App URL:

    ```bash
    cp .env.example .env
    # edit .env to paste your URL
    ```

6. Update `VITE_GAS_WEB_APP_URL` inside `.env` with the Web App URL you copied.
7. Restart the dev server so Vite picks up the new environment variable.

### Troubleshooting `initializeSheets`

- Make sure you opened Apps Script **from within the Sheet** (`Extensions → Apps Script`). Running the script from https://script.google.com without being bound to the Sheet will not have an active spreadsheet to edit.
- Confirm you have **edit access** to the Sheet (view-only access will silently skip tab creation). If needed, **File → Make a copy** and run the script in the copy.
- In Apps Script, select the `initializeSheets` function in the toolbar, click **Run**, and accept the permissions prompt. Check the **Executions** panel and the **Logs** tab for the summary message.
- After running, your Sheet should contain the `Store_Master`, `Product_Master`, and `Purchase_History` tabs with headers. If not, rerun and watch for an error about "No active spreadsheet found"—this indicates the script isn't bound to the Sheet you expect.


## Deployment

This project uses GitHub Actions to automatically deploy to Google Cloud Storage.

See `deployment_guide.md` for detailed setup instructions.

## License

MIT
