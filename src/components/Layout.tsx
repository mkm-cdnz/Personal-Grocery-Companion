import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useCartStore } from '../store/useCartStore';
import { useReferenceStore } from '../store/useReferenceStore';
import { useDebugStore } from '../store/useDebugStore';
import { useToastStore } from '../store/useToastStore';
import StoreSelector from './StoreSelector';
import Cart from './Cart';
import ProductEntry from './ProductEntry';
import DebugPanel from './DebugPanel';
import { api, SyncError } from '../services/api';

const APP_VERSION = '1.0.0'; // TODO: Sync with package.json or use env var

export default function Layout() {
    const { currentStoreId, tripId, items, clearCart } = useCartStore();
    const { stores, setStores, setProducts, setLastPrices } = useReferenceStore();
    const { logError, setDebugPanelOpen } = useDebugStore();
    const { currentToast, clearCurrentToast } = useToastStore();

    const [syncing, setSyncing] = useState(false);
    const [health, setHealth] = useState<{ status: 'idle' | 'ok' | 'error', message?: string }>({ status: 'idle' });

    // Debug panel tap counter
    const [versionTapCount, setVersionTapCount] = useState(0);
    const [tapTimeout, setTapTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    // GPS state for debug panel
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'ready' | 'denied' | 'unavailable'>('acquiring');



    // GPS tracking for debug panel
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus('unavailable');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setGpsStatus('ready');
            },
            (error) => {
                console.log('Location access denied or error:', error);
                setGpsStatus('denied');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        let active = true;

        const init = async () => {
            try {
                // 1. Check Health
                const healthResult = await api.checkHealth();
                if (!active) return;
                setHealth({ status: 'ok', message: healthResult });

                // 2. Fetch Data (Stores & Products)
                try {
                    const data = await api.fetchData();
                    if (active && data.status === 'success') {
                        if (data.stores) setStores(data.stores);
                        if (data.products) {
                            // Ensure Barcode is always a string for consistent comparison
                            const normalizedProducts = data.products.map((p: any) => ({
                                ...p,
                                Barcode: p.Barcode ? String(p.Barcode) : null
                            }));
                            setProducts(normalizedProducts);
                        }
                        if (data.lastPrices) {
                            const normalizedPrices = data.lastPrices
                                .map((p: any) => ({
                                    storeId: p.StoreID_FK ? String(p.StoreID_FK) : '',
                                    productId: p.ProductID_FK ? String(p.ProductID_FK) : '',
                                    unitPrice: Number(p.Unit_Price),
                                    timestamp: p.Timestamp || ''
                                }))
                                .filter((p: any) => p.storeId && p.productId && !Number.isNaN(p.unitPrice));
                            setLastPrices(normalizedPrices);
                        }
                    }
                } catch (fetchErr) {
                    console.warn('Failed to fetch initial data:', fetchErr);
                    logError('Failed to fetch initial data', fetchErr as Error, 'Layout init');
                    // Don't block the UI, just log it. User can still add new stores.
                }

            } catch (error) {
                if (!active) return;
                const message = error instanceof SyncError
                    ? `${error.message}${error.responseBody ? ` Response: ${error.responseBody.slice(0, 120)}` : ''}`
                    : (error as Error).message;
                setHealth({ status: 'error', message });
                logError('Health check failed', error as Error, 'Layout init');
            }
        };

        init();

        return () => {
            active = false;
        };
    }, [setStores, setProducts, setLastPrices, logError]);

    const handleSync = async () => {
        if (!tripId || !currentStoreId) return;

        setSyncing(true);
        try {
            const currentStore = stores.find(s => s.StoreID === currentStoreId);
            const timestamp = new Date().toISOString();

            await api.syncTrip(tripId, currentStoreId, items, currentStore, timestamp);
            // Toast is shown by useToastStore in StoreSelector or elsewhere
            // Delay clearing to show success state
            setTimeout(() => {
                clearCart();
                setSyncing(false);
            }, 1500);
        } catch (error) {
            console.error(error);
            let message = 'Sync failed. Please try again.';

            if (error instanceof SyncError) {
                const responseDetails = error.responseBody ? ` Response: ${error.responseBody.slice(0, 200)}` : '';
                message = `${error.message}${responseDetails}`;
            } else if (error instanceof Error) {
                message = error.message;
            }

            logError(message, error as Error, 'Sync trip');
            setSyncing(false);
        }
    };

    const handleVersionTap = () => {
        if (tapTimeout) clearTimeout(tapTimeout);

        const newCount = versionTapCount + 1;
        setVersionTapCount(newCount);

        if (newCount >= 5) {
            setDebugPanelOpen(true);
            setVersionTapCount(0);
        } else {
            const timeout = setTimeout(() => setVersionTapCount(0), 2000);
            setTapTimeout(timeout);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" color="primary" enableColorOnDark>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                        <ShoppingCartIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Grocery Companion
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container component="main" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
                {health.status === 'error' && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Sync endpoint is unreachable from this session. {health.message}
                        {' '}Ensure the deployed Google Apps Script contains the latest Code.gs (including CORS headers and doOptions), then redeploy the web app with access set to "Anyone". Update VITE_GAS_WEB_APP_URL if the URL changed.
                    </Alert>
                )}
                {health.status === 'ok' && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Sync endpoint responded successfully. You can proceed with syncing trips.
                    </Alert>
                )}

                {!currentStoreId ? (
                    <StoreSelector />
                ) : (
                    <Box>
                        <Cart />
                        <ProductEntry />

                        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                                onClick={handleSync}
                                disabled={syncing || items.length === 0}
                                fullWidth
                                sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                                {syncing ? "Syncing..." : "Finish & Sync Trip"}
                            </Button>

                            <Button
                                variant="text"
                                color="error"
                                onClick={() => clearCart()}
                                disabled={syncing}
                            >
                                Cancel Trip
                            </Button>
                        </Box>
                    </Box>
                )}
            </Container>

            {/* Footer with version */}
            <Box
                component="footer"
                sx={{
                    py: 2,
                    px: 2,
                    mt: 'auto',
                    backgroundColor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider',
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="caption"
                    color="text.secondary"
                    onClick={handleVersionTap}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                    Grocery Companion v{APP_VERSION}
                </Typography>
            </Box>

            {/* Toast Notifications */}
            <Snackbar
                open={!!currentToast}
                autoHideDuration={4000}
                onClose={clearCurrentToast}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={currentToast?.severity || 'info'} sx={{ width: '100%' }} onClose={clearCurrentToast}>
                    {currentToast?.message}
                </Alert>
            </Snackbar>

            {/* Debug Panel */}
            <DebugPanel userLocation={userLocation} gpsStatus={gpsStatus} />
        </Box>
    );
}
