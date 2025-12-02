import { useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useCartStore } from '../store/useCartStore';
import StoreSelector from './StoreSelector';
import Cart from './Cart';
import ProductEntry from './ProductEntry';
import { api } from '../services/api';

export default function Layout() {
    const { currentStoreId, tripId, items, clearCart } = useCartStore();
    const [syncing, setSyncing] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleSync = async () => {
        if (!tripId || !currentStoreId) return;

        setSyncing(true);
        try {
            await api.syncTrip(tripId, currentStoreId, items);
            setSnackbar({ open: true, message: 'Trip synced successfully!', severity: 'success' });
            // Delay clearing to show success state
            setTimeout(() => {
                clearCart();
                setSyncing(false);
            }, 1500);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Sync failed. Please try again.', severity: 'error' });
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
