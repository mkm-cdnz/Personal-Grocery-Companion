import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store, Product } from '../types';

interface ReferenceState {
    stores: Store[];
    products: Product[];
    setStores: (stores: Store[]) => void;
    setProducts: (products: Product[]) => void;
    addStore: (store: Store) => void;
    storeExists: (name: string, location: string) => boolean;
    updateStoreLastUsed: (storeId: string, lastUsed: string) => void;
    addProduct: (product: Product) => void;
    getProductByBarcode: (barcode: string) => Product | undefined;
}

export const useReferenceStore = create<ReferenceState>()(
    persist(
        (set, get) => ({
            stores: [],
            products: [],

            setStores: (stores) => set({ stores }),
            setProducts: (products) => set({ products }),

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
        }),
        {
            name: 'grocery-reference-storage',
        }
    )
);
