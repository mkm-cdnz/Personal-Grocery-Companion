import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDebugStore } from '../store/useDebugStore';
import { useReferenceStore } from '../store/useReferenceStore';
import { useCartStore } from '../store/useCartStore';

interface DebugPanelProps {
    userLocation: { lat: number; lon: number } | null;
    gpsStatus: 'acquiring' | 'ready' | 'denied' | 'unavailable';
}

export default function DebugPanel({ userLocation, gpsStatus }: DebugPanelProps) {
    const { debugPanelOpen, setDebugPanelOpen, errorLogs, clearLogs } = useDebugStore();
    const { stores, products } = useReferenceStore();
    const { currentStoreId, tripId, items } = useCartStore();

    const handleClose = () => setDebugPanelOpen(false);

    const getStorageSize = () => {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return `${(total / 1024).toFixed(1)} KB`;
        } catch {
            return 'Unknown';
        }
    };

    return (
        <Drawer
            anchor="bottom"
            open={debugPanelOpen}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    maxHeight: '80vh',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">🛠️ Debug Panel</Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* GPS Status */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        GPS Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                            label={gpsStatus.toUpperCase()}
                            color={gpsStatus === 'ready' ? 'success' : 'default'}
                            size="small"
                        />
                        {userLocation && (
                            <Typography variant="caption" color="text.secondary">
                                {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Data Stats */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Local Data
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`${stores.length} Stores`} size="small" variant="outlined" />
                        <Chip label={`${products.length} Products`} size="small" variant="outlined" />
                        <Chip label={`Storage: ${getStorageSize()}`} size="small" variant="outlined" />
                    </Box>
                </Box>

                {/* Current Session */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Current Session
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={currentStoreId ? 'Trip Active' : 'No Trip'}
                            size="small"
                            color={currentStoreId ? 'primary' : 'default'}
                        />
                        {currentStoreId && (
                            <>
                                <Chip label={`${items.length} Items`} size="small" variant="outlined" />
                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                    Trip: {tripId?.slice(0, 8)}...
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Error Logs */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Error Logs ({errorLogs.length})
                    </Typography>
                    {errorLogs.length > 0 && (
                        <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={clearLogs}
                            color="error"
                        >
                            Clear
                        </Button>
                    )}
                </Box>

                {errorLogs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No errors logged
                    </Typography>
                ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1 }}>
                        {errorLogs.map((log) => (
                            <ListItem key={log.id} divider>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" color="error">
                                            {log.message}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </Typography>
                                            {log.context && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Context: {log.context}
                                                </Typography>
                                            )}
                                            {log.stack && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.7rem',
                                                        mt: 0.5,
                                                        maxHeight: 60,
                                                        overflow: 'auto',
                                                        whiteSpace: 'pre-wrap',
                                                        bgcolor: 'action.hover',
                                                        p: 0.5,
                                                        borderRadius: 0.5,
                                                    }}
                                                >
                                                    {log.stack}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Drawer>
    );
}
