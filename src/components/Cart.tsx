import { Box, List, ListItem, ListItemText, IconButton, Typography, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useCartStore } from '../store/useCartStore';

export default function Cart() {
    const { items, removeItem, getRunningTotal } = useCartStore();
    const total = getRunningTotal();

    return (
        <Box sx={{ mb: 10 }}> {/* Add margin bottom for fixed footer if needed */}
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
                                        <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }}>
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
        </Box>
    );
}
