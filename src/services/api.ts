import type { CartItem } from '../types';

// This URL needs to be updated by the user after deployment
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzfiOpEWCvMZuSUbwoj6FAI95iy14N2nwtWSCEkqOEtbsfC4W1vQK1VRDnydvIZi15r/exec';

export const api = {
    syncTrip: async (tripId: string, storeId: string, items: CartItem[]) => {
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
