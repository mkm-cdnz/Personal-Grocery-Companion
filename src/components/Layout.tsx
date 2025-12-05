import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useCartStore } from '../store/useCartStore';
import { useReferenceStore } from '../store/useReferenceStore';
import StoreSelector from './StoreSelector';
import Cart from './Cart';
import ProductEntry from './ProductEntry';
import { api, SyncError } from '../services/api';

export default function Layout() {
    const { currentStoreId, tripId, items, clearCart } = useCartStore();
    const { stores, setStores, setProducts, setLastPrices } = useReferenceStore();
    const [syncing, setSyncing] = useState(false);
    const [health, setHealth] = useState<{ status: 'idle' | 'ok' | 'error', message?: string }>({ status: 'idle' });
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });



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
                    // Don't block the UI, just log it. User can still add new stores.
                }

            } catch (error) {
                if (!active) return;
                const message = error instanceof SyncError
                    ? `${error.message}${error.responseBody ? ` Response: ${error.responseBody.slice(0, 120)}` : ''}`
                    : (error as Error).message;
                setHealth({ status: 'error', message });
            }
        };

        init();

        return () => {
            active = false;
        };
    }, [setStores, setProducts, setLastPrices]);

    const handleSync = async () => {
        if (!tripId || !currentStoreId) return;

        setSyncing(true);
        try {
            const currentStore = stores.find(s => s.StoreID === currentStoreId);
            const timestamp = new Date().toISOString();

            await api.syncTrip(tripId, currentStoreId, items, currentStore, timestamp);
            setSnackbar({ open: true, message: 'Trip synced successfully!', severity: 'success' });
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

            setSnackbar({ open: true, message, severity: 'error' });
            setSyncing(false);
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
