# Google Sheets Data Model (ERD)

This project uses three Google Sheets tabs as a lightweight database. The diagram below shows their relationships and key fields.

```mermaid
erDiagram
  STORE_MASTER {
    string StoreID PK
    string StoreName
    string LocationText
    number GPS_Lat
    number GPS_Lon
    datetime LastUsed
  }

  PRODUCT_MASTER {
    string ProductID PK
    string Barcode
    string Name
    number SizeValue
    string SizeUnit
    boolean IsLoose
  }

  PURCHASE_HISTORY {
    string LogID PK
    string TripID
    datetime Timestamp
    string StoreID_FK FK
    string ProductID_FK FK
    number Quantity
    number Unit_Price
    number Line_Total
  }

  STORE_MASTER ||--o{ PURCHASE_HISTORY : "StoreID → StoreID_FK"
  PRODUCT_MASTER ||--o{ PURCHASE_HISTORY : "ProductID → ProductID_FK"
```

## Table Details

- **Store_Master**: One row per store, including optional GPS coordinates and last-used timestamp for recency tracking.
- **Product_Master**: One row per product or barcode; supports loose items via `IsLoose` and size metadata.
- **Purchase_History**: Transaction line items keyed by `LogID`, referencing stores and products while storing quantities and pricing for each purchase event.

The sheet headers originate from `SHEET_CONFIG` in `backend/Code.gs`, which seeds tabs and validates the expected schema during sync operations.【F:backend/Code.gs†L1-L40】
