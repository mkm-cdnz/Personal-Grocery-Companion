export interface Store {
  StoreID: string;
  StoreName: string;
  LocationText: string;
  GPS_Lat: number;
  GPS_Lon: number;
  LastUsed: string; // ISO Date string
}

export interface Product {
  ProductID: string;
  Barcode: string | null;
  Name: string;
  SizeValue: number | null;
  SizeUnit: string | null;
  IsLoose: boolean;
}

export interface CartItem {
  id: string; // Unique ID for the cart entry (could be UUID)
  product: Product;
  storeId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface LastPriceSnapshot {
  storeId: string;
  productId: string;
  unitPrice: number;
  timestamp: string;
}

export interface PurchaseLog {
  LogID?: string;
  TripID: string;
  Timestamp: string;
  StoreID_FK: string;
  ProductID_FK: string;
  Quantity: number;
  Unit_Price: number;
  Line_Total: number;
}

export interface SyncPayload {
  tripId: string;
  storeId: string;
  items: CartItem[];
}
