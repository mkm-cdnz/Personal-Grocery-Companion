import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

interface CartState {
    items: CartItem[];
    currentStoreId: string | null;
    tripId: string | null;
    addItem: (product: Product, storeId: string, quantity: number, unitPrice: number) => void;
    updateItem: (itemId: string, updates: Partial<CartItem>) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    setStore: (storeId: string) => void;
    startTrip: (storeId: string) => void;
    getRunningTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            currentStoreId: null,
            tripId: null,

            addItem: (product, storeId, quantity, unitPrice) => {
                const newItem: CartItem = {
                    id: crypto.randomUUID(),
                    product,
                    storeId,
                    quantity,
                    unitPrice,
                    lineTotal: quantity * unitPrice,
                };
                set((state) => ({ items: [...state.items, newItem] }));
            },

            updateItem: (itemId, updates) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.id === itemId) {
                            const updatedItem = { ...item, ...updates };
                            // Recalculate line total if quantity or price changed
                            if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
                                updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice;
                            }
                            return updatedItem;
                        }
                        return item;
                    }),
                }));
            },

            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== itemId),
                }));
            },

            clearCart: () => {
                set({ items: [], currentStoreId: null, tripId: null });
            },

            setStore: (storeId) => {
                set({ currentStoreId: storeId });
            },

            startTrip: (storeId) => {
                set({
                    currentStoreId: storeId,
                    items: [],
                    tripId: crypto.randomUUID()
                });
            },

            getRunningTotal: () => {
                return get().items.reduce((total, item) => total + item.lineTotal, 0);
            },
        }),
        {
            name: 'grocery-cart-storage',
        }
    )
);
