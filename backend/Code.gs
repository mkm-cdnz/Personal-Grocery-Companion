const SHEET_CONFIG = {
  Store_Master: ['StoreID', 'StoreName', 'LocationText', 'GPS_Lat', 'GPS_Lon', 'LastUsed'],
  Product_Master: ['ProductID', 'Barcode', 'Name', 'SizeValue', 'SizeUnit', 'IsLoose'],
  Purchase_History: ['LogID', 'TripID', 'Timestamp', 'StoreID_FK', 'ProductID_FK', 'Quantity', 'Unit_Price', 'Line_Total'],
};

/**
 * Run this once after pasting the script to create all tabs with headers.
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllSheets(ss);
  return 'Sheets initialized';
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Invalid request: missing postData');
    }
    
    const data = JSON.parse(e.postData.contents);
    const { tripId, storeId, items } = data;

    if (!tripId || !storeId || !items || !Array.isArray(items)) {
      return withCors(ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid payload' }))
        .setMimeType(ContentService.MimeType.JSON));
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Script is not bound to a spreadsheet. Please bind the script to a Google Sheet.');
    }
    const historySheet = ensureAllSheets(ss).Purchase_History;

    const timestamp = new Date().toISOString();
    const rows = items.map(item => {
      return [
        Utilities.getUuid(), // LogID
        tripId,
        timestamp,
        storeId,
        item.product.ProductID,
        item.quantity,
        item.unitPrice,
        item.lineTotal
      ];
    });

    if (rows.length > 0) {
      historySheet.getRange(historySheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    return withCors(ContentService.createTextOutput(JSON.stringify({ status: 'success', rowsAdded: rows.length }))
      .setMimeType(ContentService.MimeType.JSON));

  } catch (error) {
    console.error('doPost Error: ' + error.toString());
    return withCors(ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function doGet(e) {
  try {
    // Handle sync via GET (if applicable)
    if (e && e.parameter && e.parameter.action === 'sync' && e.parameter.payload) {
        const decoded = Utilities.newBlob(Utilities.base64Decode(e.parameter.payload)).getDataAsString();
        const data = JSON.parse(decoded);
        return handleSync(data);
    }

    // Health check / Status
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Script is not bound to a spreadsheet. Please bind the script to a Google Sheet.');
    }
    const sheets = ensureAllSheets(ss);
    const message = 'Grocery Companion API is running';

    return withCors(ContentService.createTextOutput(JSON.stringify({
      status: 'ready',
      message,
      sheets: Object.keys(sheets),
    }))
      .setMimeType(ContentService.MimeType.JSON));

  } catch (error) {
    console.error('doGet Error: ' + error.toString());
    return withCors(ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function doOptions() {
  return withCors(ContentService.createTextOutput(''));
}

function withCors(output) {
  return output
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function ensureAllSheets(ss) {
  const created = {};

  Object.entries(SHEET_CONFIG).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    created[name] = sheet;
  });

  return created;
}

function handleSync(data) {
  const { tripId, storeId, items } = data;

  if (!tripId || !storeId || !items || !Array.isArray(items)) {
    return withCors(ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid payload' }))
      .setMimeType(ContentService.MimeType.JSON));
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ensureAllSheets(ss).Purchase_History;

  const timestamp = new Date().toISOString();
  const rows = items.map(item => {
    return [
      Utilities.getUuid(), // LogID
      tripId,
      timestamp,
      storeId,
      item.product.ProductID,
      item.quantity,
      item.unitPrice,
      item.lineTotal
    ];
  });

  if (rows.length > 0) {
    historySheet.getRange(historySheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return withCors(ContentService.createTextOutput(JSON.stringify({ status: 'success', rowsAdded: rows.length }))
    .setMimeType(ContentService.MimeType.JSON));
}
