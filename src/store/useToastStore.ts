import { create } from 'zustand';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    severity: ToastSeverity;
}

interface ToastState {
    toasts: Toast[];
    currentToast: Toast | null;
    showToast: (message: string, severity: ToastSeverity) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
    clearCurrentToast: () => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
    toasts: [],
    currentToast: null,

    showToast: (message, severity) => {
        const toast: Toast = {
            id: crypto.randomUUID(),
            message,
            severity,
        };

        set((state) => {
            // Add to queue
            const newToasts = [...state.toasts, toast];

            // If no current toast, show this one immediately
            if (!state.currentToast) {
                return {
                    toasts: newToasts.slice(1), // Remove from queue
                    currentToast: toast,
                };
            }

            // Otherwise just add to queue
            return { toasts: newToasts };
        });
    },

    showSuccess: (message) => get().showToast(message, 'success'),
    showError: (message) => get().showToast(message, 'error'),
    showInfo: (message) => get().showToast(message, 'info'),

    clearCurrentToast: () => {
        set((state) => {
            // If there's a queued toast, show it next
            if (state.toasts.length > 0) {
                const [nextToast, ...remainingToasts] = state.toasts;
                return {
                    currentToast: nextToast,
                    toasts: remainingToasts,
                };
            }

            // Otherwise, clear current
            return { currentToast: null };
        });
    },
}));
