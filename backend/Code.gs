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
    const { tripId, storeId, items, store, timestamp } = data;

    if (!tripId || !storeId || !items || !Array.isArray(items)) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Script is not bound to a spreadsheet. Please bind the script to a Google Sheet.');
    }
    const sheets = ensureAllSheets(ss);
    const historySheet = sheets.Purchase_History;
    const storeSheet = sheets.Store_Master;
    const productSheet = sheets.Product_Master;

    // 1. Sync Store if provided
    if (store) {
      const storeData = storeSheet.getDataRange().getValues();
      // Assuming StoreID is column 1 (index 0)
      const storeExists = storeData.some(row => row[0] === store.StoreID);
      
      if (!storeExists) {
        storeSheet.appendRow([
          store.StoreID,
          store.StoreName,
          store.LocationText,
          store.GPS_Lat,
          store.GPS_Lon,
          store.LastUsed
        ]);
      } else {
          // Optional: Update LastUsed if store exists
          // For simplicity, we'll skip updating existing rows for now, 
          // but you could iterate to find the row and update column 6.
      }
    }

    // 2. Sync Products
    const productData = productSheet.getDataRange().getValues();
    const existingProductIds = new Set(productData.map(row => row[0])); // Assuming ProductID is col 1

    items.forEach(item => {
        const product = item.product;
        if (product && !existingProductIds.has(product.ProductID)) {
            productSheet.appendRow([
                product.ProductID,
                product.Barcode || '',
                product.Name,
                product.SizeValue || '',
                product.SizeUnit || '',
                product.IsLoose
            ]);
            existingProductIds.add(product.ProductID);
        }
    });

    // 3. Record Purchase History
    // Use client timestamp if provided, else server time
    const txTimestamp = timestamp || new Date().toISOString();
    
    const rows = items.map(item => {
      return [
        Utilities.getUuid(), // LogID
        tripId,
        txTimestamp,
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

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', rowsAdded: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    // Handle sync via GET (if applicable)
    if (e && e.parameter) {
      if (e.parameter.action === 'sync' && e.parameter.payload) {
        const decoded = Utilities.newBlob(Utilities.base64Decode(e.parameter.payload)).getDataAsString();
        const data = JSON.parse(decoded);
        return handleSync(data);
      }
      
      if (e.parameter.action === 'getData') {
        return handleGetData();
      }
    }

    // Health check / Status
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Script is not bound to a spreadsheet. Please bind the script to a Google Sheet.');
    }
    const sheets = ensureAllSheets(ss);
    const message = 'Grocery Companion API is running';

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ready',
      message,
      sheets: Object.keys(sheets),
    }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doGet Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ensureAllSheets(ss);
  
  // Get Stores
  const storeSheet = sheets.Store_Master;
  const storeRows = storeSheet.getDataRange().getValues();
  const stores = [];
  // Skip header row (index 0)
  for (let i = 1; i < storeRows.length; i++) {
    const row = storeRows[i];
    // ['StoreID', 'StoreName', 'LocationText', 'GPS_Lat', 'GPS_Lon', 'LastUsed']
    if (row[0]) { // Ensure ID exists
      stores.push({
        StoreID: row[0],
        StoreName: row[1],
        LocationText: row[2],
        GPS_Lat: row[3],
        GPS_Lon: row[4],
        LastUsed: row[5]
      });
    }
  }

  // Get Products
  const productSheet = sheets.Product_Master;
  const productRows = productSheet.getDataRange().getValues();
  const products = [];
  // Skip header row
  for (let i = 1; i < productRows.length; i++) {
    const row = productRows[i];
    // ['ProductID', 'Barcode', 'Name', 'SizeValue', 'SizeUnit', 'IsLoose']
    if (row[0]) {
      products.push({
        ProductID: row[0],
        Barcode: row[1],
        Name: row[2],
        SizeValue: row[3],
        SizeUnit: row[4],
        IsLoose: row[5]
      });
    }
  }

  // Get Last Known Prices (by Store + Product)
  const historySheet = sheets.Purchase_History;
  const historyRows = historySheet.getDataRange().getValues();
  const lastPriceMap = {};

  // ['LogID', 'TripID', 'Timestamp', 'StoreID_FK', 'ProductID_FK', 'Quantity', 'Unit_Price', 'Line_Total']
  for (let i = 1; i < historyRows.length; i++) {
    const row = historyRows[i];
    const timestamp = row[2];
    const storeId = row[3];
    const productId = row[4];
    const unitPrice = row[6];

    if (!timestamp || !storeId || !productId || unitPrice === undefined || unitPrice === null || unitPrice === '') {
      continue;
    }

    const key = `${storeId}__${productId}`;
    const existing = lastPriceMap[key];

    if (!existing || new Date(timestamp) > new Date(existing.Timestamp)) {
      lastPriceMap[key] = {
        StoreID_FK: storeId,
        ProductID_FK: productId,
        Unit_Price: Number(unitPrice),
        Timestamp: timestamp,
      };
    }
  }

  const lastPrices = Object.values(lastPriceMap);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    stores: stores,
    products: products,
    lastPrices: lastPrices,
  })).setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  // GAS handles CORS automatically for ContentService, but we can return empty 200 for OPTIONS just in case.
  return ContentService.createTextOutput('');
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
  const { tripId, storeId, items, store, timestamp } = data;

  if (!tripId || !storeId || !items || !Array.isArray(items)) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid payload' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ensureAllSheets(ss);
  const historySheet = sheets.Purchase_History;
  const storeSheet = sheets.Store_Master;
  const productSheet = sheets.Product_Master;

  // 1. Sync Store if provided
  if (store) {
      const storeData = storeSheet.getDataRange().getValues();
      const storeExists = storeData.some(row => row[0] === store.StoreID);
      
      if (!storeExists) {
        storeSheet.appendRow([
          store.StoreID,
          store.StoreName,
          store.LocationText,
          store.GPS_Lat,
          store.GPS_Lon,
          store.LastUsed
        ]);
      }
  }

  // 2. Sync Products
  const productData = productSheet.getDataRange().getValues();
  const existingProductIds = new Set(productData.map(row => row[0]));

  items.forEach(item => {
      const product = item.product;
      if (product && !existingProductIds.has(product.ProductID)) {
          productSheet.appendRow([
              product.ProductID,
              product.Barcode || '',
              product.Name,
              product.SizeValue || '',
              product.SizeUnit || '',
              product.IsLoose
          ]);
          existingProductIds.add(product.ProductID);
      }
  });

  // 3. Record Purchase History
  const txTimestamp = timestamp || new Date().toISOString();
  const rows = items.map(item => {
    return [
      Utilities.getUuid(), // LogID
      tripId,
      txTimestamp,
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

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', rowsAdded: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
