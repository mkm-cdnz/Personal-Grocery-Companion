import type { CartItem } from '../types';

export class SyncError extends Error {
    originalError?: unknown;

    constructor(message: string, originalError?: unknown) {
        super(message);
        this.name = 'SyncError';
        this.originalError = originalError;
    }
}

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbxpor4UO2g7Xwc5EUn0IdqO-VGvRSCK7NxubVyI9eL_BBx_cY7tpG7RHEEr2euo2nV6/exec';

export const api = {
    syncTrip: async (tripId: string, storeId: string, items: CartItem[]) => {
        if (!GAS_WEB_APP_URL) {
            throw new SyncError('Missing GAS Web App URL configuration.');
        }

        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ tripId, storeId, items }),
            });

            if (!response.ok) {
                throw new SyncError(`Network error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 'error') {
                throw new SyncError(`App error: ${data.message}`);
            }

            return data;
        } catch (error) {
            console.error("Sync error:", error);
            if (error instanceof SyncError) {
                throw error;
            }
            // Wrap unknown errors
            throw new SyncError('Failed to sync trip.', error);
        }
    }
};
