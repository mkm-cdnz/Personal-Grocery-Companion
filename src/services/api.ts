import type { CartItem } from '../types';

export class SyncError extends Error {
    status?: number;
    responseBody?: string;

    constructor(message: string, status?: number, responseBody?: string) {
        super(message);
        this.name = 'SyncError';
        this.status = status;
        this.responseBody = responseBody;
    }
}

// Allow overriding via env so the frontend can be pointed at a freshly redeployed Apps Script URL without code edits.
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL
    || 'https://script.google.com/macros/s/AKfycbzPVBa2wNYzRxYaODM43GTijONaG1Jmg6YRxUcg_cddN3fH9UNpdXy7bSjxh-S9xDVg/exec';

const parseResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    // Fall back to text to capture error pages (e.g., HTML) so we can surface meaningful diagnostics.
    return response.text();
};

export const api = {
    checkHealth: async () => {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-store',
        });

        const parsed = await parseResponse(response);
        const bodyText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);

        if (!response.ok) {
            throw new SyncError(`Health check failed (${response.status} ${response.statusText})`, response.status, bodyText);
        }

        return bodyText;
    },
    syncTrip: async (tripId: string, storeId: string, items: CartItem[]) => {
        if (!GAS_WEB_APP_URL) {
            throw new SyncError('Missing GAS Web App URL.');
        }

        // Prefer GET to avoid preflight blocks; POST is used as a secondary path for environments that allow it.
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ tripId, storeId, items }),
            });

            const parsed = await parseResponse(response);
            const result = typeof parsed === 'string' ? { status: 'error', message: parsed } : parsed;
            const bodyText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);

            if (!response.ok) {
                // Common 403 case means the Apps Script deployment is not accessible to "Anyone" or a proxy blocked the call.
                const message = response.status === 403
                    ? 'The Google Apps Script deployment rejected the request (HTTP 403). Confirm the active deployment has "Anyone" access and has been redeployed with the latest Code.gs.'
                    : `Sync request failed (${response.status} ${response.statusText}): ${result?.message || 'Unknown error'}`;
                throw new SyncError(message, response.status, bodyText);
            }

            if (result?.status !== 'success') {
                throw new SyncError(result?.message || 'Sync failed', response.status, bodyText);
            }

            return result;
        } catch (error) {
            console.error('Sync error:', error);
            if (error instanceof SyncError) {
                throw error;
            }

            // Ensure unexpected errors still include context for the snackbar.
            const fallbackMessage = error instanceof Error ? error.message : 'Unknown sync error';
            throw new SyncError(fallbackMessage);
        }
    }
};
