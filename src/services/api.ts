import type { CartItem } from '../types';

// Set VITE_GAS_WEB_APP_URL in a .env file after deploying the Apps Script Web App.
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL as string | undefined;

export const api = {
    syncTrip: async (tripId: string, storeId: string, items: CartItem[]) => {
        if (!GAS_WEB_APP_URL) {
            throw new Error('Missing GAS Web App URL. Set VITE_GAS_WEB_APP_URL in your .env file.');
        }
        try {
            await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // GAS Web Apps often require no-cors for simple POSTs from different origins unless configured perfectly
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tripId, storeId, items }),
            });

            // With no-cors, we can't read the response, so we assume success if no network error.
            // For a robust app, we might use a proxy or different CORS setup, but for this MVP:
            return { status: 'success' };
        } catch (error) {
            console.error("Sync error:", error);
            throw error;
        }
    }
};
