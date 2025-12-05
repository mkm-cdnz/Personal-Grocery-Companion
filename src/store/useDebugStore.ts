import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ErrorLog {
    id: string;
    timestamp: string;
    message: string;
    stack?: string;
    context?: string;
}

interface DebugState {
    errorLogs: ErrorLog[];
    debugPanelOpen: boolean;
    logError: (message: string, error?: Error, context?: string) => void;
    clearLogs: () => void;
    togglePanel: () => void;
    setDebugPanelOpen: (open: boolean) => void;
}

const MAX_LOGS = 10;

export const useDebugStore = create<DebugState>()(
    persist(
        (set) => ({
            errorLogs: [],
            debugPanelOpen: false,

            logError: (message, error, context) => {
                const log: ErrorLog = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    message,
                    stack: error?.stack,
                    context,
                };

                set((state) => ({
                    errorLogs: [log, ...state.errorLogs].slice(0, MAX_LOGS),
                }));
            },

            clearLogs: () => set({ errorLogs: [] }),

            togglePanel: () => set((state) => ({ debugPanelOpen: !state.debugPanelOpen })),

            setDebugPanelOpen: (open) => set({ debugPanelOpen: open }),
        }),
        {
            name: 'grocery-debug-storage',
            partialize: (state) => ({ errorLogs: state.errorLogs }), // Don't persist panel state
        }
    )
);
