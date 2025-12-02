function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { tripId, storeId, items } = data;

    if (!tripId || !storeId || !items || !Array.isArray(items)) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let historySheet = ss.getSheetByName('Purchase_History');
    
    // Create sheet if not exists
    if (!historySheet) {
      historySheet = ss.insertSheet('Purchase_History');
      historySheet.appendRow(['LogID', 'TripID', 'Timestamp', 'StoreID_FK', 'ProductID_FK', 'Quantity', 'Unit_Price', 'Line_Total']);
    }

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

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', rowsAdded: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ready', message: 'Grocery Companion API is running' }))
      .setMimeType(ContentService.MimeType.JSON);
}
