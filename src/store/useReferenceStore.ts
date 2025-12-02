import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store, Product } from '../types';

interface ReferenceState {
    stores: Store[];
    products: Product[];
    setStores: (stores: Store[]) => void;
    setProducts: (products: Product[]) => void;
    addStore: (store: Store) => void;
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
            addProduct: (product) => set((state) => ({ products: [...state.products, product] })),

            getProductByBarcode: (barcode) => {
                return get().products.find((p) => p.Barcode === barcode);
            },
        }),
        {
            name: 'grocery-reference-storage',
        }
    )
);
