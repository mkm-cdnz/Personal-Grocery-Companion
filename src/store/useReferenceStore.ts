import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store, Product, LastPriceSnapshot } from '../types';

const buildPriceKey = (storeId: string, productId: string) => `${storeId}__${productId}`;

interface ReferenceState {
    stores: Store[];
    products: Product[];
    lastPrices: Record<string, LastPriceSnapshot>;
    setStores: (stores: Store[]) => void;
    setProducts: (products: Product[]) => void;
    setLastPrices: (prices: LastPriceSnapshot[]) => void;
    addStore: (store: Store) => void;
    storeExists: (name: string, location: string) => boolean;
    updateStoreLastUsed: (storeId: string, lastUsed: string) => void;
    addProduct: (product: Product) => void;
    getProductByBarcode: (barcode: string) => Product | undefined;
    getLastPrice: (storeId: string, productId: string) => LastPriceSnapshot | undefined;
    recordLastPrice: (storeId: string, productId: string, unitPrice: number, timestamp: string) => void;
}

export const useReferenceStore = create<ReferenceState>()(
    persist(
        (set, get) => ({
            stores: [],
            products: [],
            lastPrices: {},

            setStores: (stores) => set({ stores }),
            setProducts: (products) => set({ products }),
            setLastPrices: (prices) => {
                const mapped = prices.reduce<Record<string, LastPriceSnapshot>>((acc, price) => {
                    if (price.storeId && price.productId) {
                        acc[buildPriceKey(price.storeId, price.productId)] = price;
                    }
                    return acc;
                }, {});
                set({ lastPrices: mapped });
            },

            addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),

            storeExists: (name, location) => {
                const normalizedName = name.trim().toLowerCase();
                const normalizedLocation = location.trim().toLowerCase();
                return get().stores.some((store) =>
                    store.StoreName.trim().toLowerCase() === normalizedName &&
                    store.LocationText.trim().toLowerCase() === normalizedLocation
                );
            },

            updateStoreLastUsed: (storeId, lastUsed) => {
                set((state) => ({
                    stores: state.stores.map((store) =>
                        store.StoreID === storeId ? { ...store, LastUsed: lastUsed } : store
                    ),
                }));
            },

            addProduct: (product) => set((state) => ({ products: [...state.products, product] })),

            getProductByBarcode: (barcode) => {
                const target = barcode.trim();
                return get().products.find((p) => p.Barcode && String(p.Barcode).trim() === target);
            },

            getLastPrice: (storeId, productId) => {
                const key = buildPriceKey(storeId, productId);
                return get().lastPrices[key];
            },

            recordLastPrice: (storeId, productId, unitPrice, timestamp) => {
                const key = buildPriceKey(storeId, productId);
                const snapshot: LastPriceSnapshot = { storeId, productId, unitPrice, timestamp };
                set((state) => ({
                    lastPrices: {
                        ...state.lastPrices,
                        [key]: snapshot
                    }
                }));
            }
        }),
        {
            name: 'grocery-reference-storage',
        }
    )
);
