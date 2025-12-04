import { useState } from 'react';
import {
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Autocomplete
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import StoreIcon from '@mui/icons-material/Store';
import { useReferenceStore } from '../store/useReferenceStore';
import { useCartStore } from '../store/useCartStore';
import type { Store } from '../types';

export default function StoreSelector() {
    const { stores, addStore, storeExists, updateStoreLastUsed } = useReferenceStore();
    const { startTrip } = useCartStore();

    const [open, setOpen] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleStoreSelect = (storeId: string) => {
        updateStoreLastUsed(storeId, new Date().toISOString());
        startTrip(storeId);
    };

    const handleAddStore = () => {
        setOpen(true);
        setNewStoreName('');
        setNewLocation('');
        setLocationError(null);
        setValidationError(null);
    };

    const handleSaveStore = () => {
        if (!newStoreName || !newLocation) return;

        setValidationError(null);
        setLoadingLocation(true);
        setLocationError(null);

        if (storeExists(newStoreName, newLocation)) {
            setValidationError('Store with this name and location already exists.');
            setLoadingLocation(false);
            return;
        }

        if (!navigator.geolocation) {
            saveStoreWithCoords(0, 0); // Fallback if no geo
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                saveStoreWithCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Geo error:", error);
                setLocationError("Could not get location. Saving without GPS.");
                saveStoreWithCoords(0, 0); // Save anyway
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    const saveStoreWithCoords = (lat: number, lon: number) => {
        const newStore: Store = {
            StoreID: crypto.randomUUID(),
            StoreName: newStoreName,
            LocationText: newLocation,
            GPS_Lat: lat,
            GPS_Lon: lon,
            LastUsed: new Date().toISOString(),
        };
        addStore(newStore);
        setLoadingLocation(false);
        setOpen(false);
        startTrip(newStore.StoreID);
    };

    // Sort stores by LastUsed descending
    const sortedStores = [...stores].sort((a, b) =>
        new Date(b.LastUsed).getTime() - new Date(a.LastUsed).getTime()
    );

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
            <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
                Where are you shopping?
            </Typography>

            <Button
                variant="contained"
                fullWidth
                startIcon={<AddLocationIcon />}
                onClick={handleAddStore}
                sx={{ mb: 3, py: 1.5 }}
            >
                Add New Store
            </Button>

            {sortedStores.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                    {sortedStores.map((store) => (
                        <ListItem key={store.StoreID} disablePadding divider>
                            <ListItemButton onClick={() => handleStoreSelect(store.StoreID)}>
                                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                    <StoreIcon color="primary" />
                                </Box>
                                <ListItemText
                                    primary={store.StoreName}
                                    secondary={store.LocationText}
                                    primaryTypographyProps={{ fontWeight: 'bold' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                    No stores saved yet. Add one to get started!
                </Typography>
            )}

            {/* Add Store Dialog */}
            <Dialog open={open} onClose={() => !loadingLocation && setOpen(false)} fullWidth>
                <DialogTitle>Add New Store</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        freeSolo
                        options={stores.map((s) => s.StoreName)}
                        value={newStoreName}
                        onInputChange={(_: React.SyntheticEvent, newValue: string) => setNewStoreName(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                autoFocus
                                margin="dense"
                                label="Store Name (e.g. Countdown)"
                                fullWidth
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                        )}
                    />
                    <TextField
                        margin="dense"
                        label="Location (e.g. City Centre)"
                        fullWidth
                        variant="outlined"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                    />
                    {validationError && (
                        <Alert severity="error" sx={{ mt: 2 }}>{validationError}</Alert>
                    )}
                    {locationError && (
                        <Alert severity="warning" sx={{ mt: 2 }}>{locationError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={loadingLocation}>Cancel</Button>
                    <Button
                        onClick={handleSaveStore}
                        variant="contained"
                        disabled={!newStoreName || !newLocation || loadingLocation}
                    >
                        {loadingLocation ? <CircularProgress size={24} /> : "Save & Start"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
