import { useState, useEffect } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, FormControlLabel, Switch, InputAdornment, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCartStore } from '../store/useCartStore';
import { useReferenceStore } from '../store/useReferenceStore';
import type { Product } from '../types';

export default function ProductEntry() {
    const { addItem, currentStoreId } = useCartStore();
    const { addProduct, getProductByBarcode } = useReferenceStore();

    const [open, setOpen] = useState(false);
    const [tabIndex, setTabIndex] = useState(0); // 0 = Scan, 1 = Manual
    const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

    // Form State
    const [barcode, setBarcode] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [price, setPrice] = useState('');
    const [isLoose, setIsLoose] = useState(false);
    const [sizeValue, setSizeValue] = useState('');
    const [sizeUnit, setSizeUnit] = useState('g');

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        if (scanner) {
            scanner.clear().catch(console.error);
            setScanner(null);
        }
        resetForm();
    };

    const resetForm = () => {
        setBarcode('');
        setName('');
        setQuantity('1');
        setPrice('');
        setIsLoose(false);
        setSizeValue('');
        setSizeUnit('g');
    };

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        if (open && tabIndex === 0) {
            // Wait for Dialog to fully render the #reader div
            timeoutId = setTimeout(() => {
                if (!document.getElementById('reader')) {
                    console.warn("Scanner element 'reader' not found");
                    return;
                }

                try {
                    const newScanner = new Html5QrcodeScanner(
                        "reader",
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        /* verbose= */ false
                    );
                    newScanner.render(onScanSuccess, onScanFailure);
                    setScanner(newScanner);
                } catch (e) {
                    console.error("Failed to initialize scanner", e);
                }
            }, 300); // 300ms delay for Dialog transition
        } else if (scanner) {
            scanner.clear().catch(console.error);
            setScanner(null);
        }

        return () => {
            clearTimeout(timeoutId);
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, [open, tabIndex]);

    const onScanSuccess = (decodedText: string) => {
        setBarcode(decodedText);
        const existingProduct = getProductByBarcode(decodedText);
        if (existingProduct) {
            setName(existingProduct.Name);
            setIsLoose(existingProduct.IsLoose);
            setSizeValue(existingProduct.SizeValue?.toString() || '');
            setSizeUnit(existingProduct.SizeUnit || 'g');
            // TODO: Look up last price from history (mocked for now)
        }
        setTabIndex(1); // Switch to manual/confirm view
        if (scanner) {
            scanner.clear().catch(console.error);
            setScanner(null);
        }
    };

    const onScanFailure = (_error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const handleAdd = () => {
        if (!name || !price || !currentStoreId || !quantity) return;

        const quantityValue = parseFloat(quantity);
        const priceValue = parseFloat(price);

        if (Number.isNaN(quantityValue) || Number.isNaN(priceValue) || quantityValue <= 0 || priceValue <= 0) {
            return;
        }

        let product: Product | undefined = undefined;

        // Check if product exists (by barcode or name for loose items)
        if (barcode) {
            product = getProductByBarcode(barcode);
        }

        if (!product) {
            // Create new product
            product = {
                ProductID: crypto.randomUUID(),
                Barcode: barcode || null,
                Name: name,
                SizeValue: sizeValue ? parseFloat(sizeValue) : null,
                SizeUnit: sizeUnit || null,
                IsLoose: isLoose
            };
            addProduct(product);
        }

        const unitPrice = isLoose ? priceValue / quantityValue : priceValue;

        addItem(product, currentStoreId, quantityValue, unitPrice);
        handleClose();
    };

    const priceLabel = isLoose ? 'Line Total' : 'Unit Price';
    const helperText = isLoose
        ? 'Enter the total from the scale/deli. Unit price will be calculated.'
        : 'Price per individual unit or package.';

    const isAddDisabled = !name || !price || !quantity || Number(quantity) <= 0 || Number(price) <= 0;

    return (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, left: 16 }}>
            <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<QrCodeScannerIcon />}
                onClick={handleOpen}
                sx={{ borderRadius: 8, py: 2, fontSize: '1.1rem' }}
            >
                Add Item
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Add Item</DialogTitle>
                <DialogContent>
                    <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} centered sx={{ mb: 2 }}>
                        <Tab label="Scan" />
                        <Tab label="Manual" />
                    </Tabs>

                    {tabIndex === 0 && (
                        <Box>
                            <div id="reader" style={{ width: '100%' }}></div>
                            <Typography align="center" variant="caption" display="block" sx={{ mt: 1 }}>
                                Point camera at barcode
                            </Typography>
                        </Box>
                    )}

                    {tabIndex === 1 && (
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            {barcode && <Typography variant="caption">Barcode: {barcode}</Typography>}

                            <TextField
                                label="Product Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                autoFocus
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label={priceLabel}
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    helperText={helperText}
                                />
                                <TextField
                                    label="Quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    fullWidth
                                />
                            </Box>

                            <FormControlLabel
                                control={<Switch checked={isLoose} onChange={(e) => setIsLoose(e.target.checked)} />}
                                label="Loose Item (Produce/Deli)"
                            />

                            {!isLoose && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Size"
                                        type="number"
                                        value={sizeValue}
                                        onChange={(e) => setSizeValue(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Unit"
                                        value={sizeUnit}
                                        onChange={(e) => setSizeUnit(e.target.value)}
                                        sx={{ width: 100 }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleAdd} variant="contained" disabled={isAddDisabled}>
                        Add to Cart
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
