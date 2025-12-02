import { useState } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useCartStore } from '../store/useCartStore';
import type { CartItem } from '../types';

export default function Cart() {
    const { items, removeItem, getRunningTotal, updateItem } = useCartStore();
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    const total = getRunningTotal();

    const openEditDialog = (item: CartItem) => {
        setEditingItem(item);
        setQuantity(item.quantity.toString());
        setUnitPrice(item.unitPrice.toString());
    };

    const handleUpdate = () => {
        if (!editingItem) return;

        const qtyValue = parseFloat(quantity);
        const priceValue = parseFloat(unitPrice);

        if (Number.isNaN(qtyValue) || Number.isNaN(priceValue) || qtyValue <= 0 || priceValue <= 0) {
            return;
        }

        updateItem(editingItem.id, { quantity: qtyValue, unitPrice: priceValue });
        setEditingItem(null);
    };

    const closeDialog = () => {
        setEditingItem(null);
    };

    return (
        <Box sx={{ mb: 10 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'primary.dark', color: 'white' }}>
                <Typography variant="h6" align="center">
                    Total: ${total.toFixed(2)}
                </Typography>
            </Paper>

            {items.length === 0 ? (
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 4 }}>
                    Your cart is empty. Start scanning!
                </Typography>
            ) : (
                <List>
                    {items.map((item) => (
                        <Paper key={item.id} sx={{ mb: 1, overflow: 'hidden' }}>
                            <ListItem
                                secondaryAction={
                                    <Box>
                                        <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }} onClick={() => openEditDialog(item)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton edge="end" aria-label="delete" onClick={() => removeItem(item.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={item.product.Name}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {item.quantity} x ${item.unitPrice.toFixed(2)}
                                            </Typography>
                                            {" = "}${item.lineTotal.toFixed(2)}
                                        </>
                                    }
                                />
                            </ListItem>
                        </Paper>
                    ))}
                </List>
            )}

            <Dialog open={Boolean(editingItem)} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Edit Item</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {editingItem?.product.Name}
                    </Typography>
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Unit Price"
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        helperText="Updates running total immediately"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={handleUpdate} variant="contained" disabled={!editingItem || !quantity || !unitPrice}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
