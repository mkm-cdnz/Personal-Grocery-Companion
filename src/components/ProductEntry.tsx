import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, FormControlLabel, Switch, InputAdornment, Typography, Autocomplete, ToggleButtonGroup, ToggleButton } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCartStore } from '../store/useCartStore';
import { useReferenceStore } from '../store/useReferenceStore';
import type { Product } from '../types';

export default function ProductEntry() {
    const { addItem, currentStoreId } = useCartStore();
    const { addProduct, getProductByBarcode, products } = useReferenceStore();

    const [open, setOpen] = useState(false);
    const [tabIndex, setTabIndex] = useState(0); // 0 = Scan, 1 = Manual
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
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

    const onScanSuccess = useCallback((decodedText: string) => {
        setBarcode(decodedText);
        const existingProduct = getProductByBarcode(decodedText);
        if (existingProduct) {
            setName(existingProduct.Name);
            setIsLoose(existingProduct.IsLoose);
            setSizeValue(existingProduct.SizeValue?.toString() || '');
            setSizeUnit(existingProduct.SizeUnit || 'g');
        }
        setTabIndex(1); // Switch to manual/confirm view
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    }, [getProductByBarcode]);

    const onScanFailure = useCallback(() => {
        // Silently ignore scan failures
    }, []);

    // Use a callback ref to initialize the scanner once the element is in the DOM
    const measureRef = useCallback((node: HTMLDivElement | null) => {
        if (node !== null && open && tabIndex === 0) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }

            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }
    }, [open, tabIndex, onScanSuccess, onScanFailure]);

    // Cleanup on unmount or when dialog closes/tab changes
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [open, tabIndex]);

    // Cleanup scanner when component unmounts
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

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

    // Get unique product names for autocomplete
    const productNames = Array.from(new Set(products.map(p => p.Name))).sort();

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
                            <div id="reader" ref={measureRef} style={{ width: '100%' }}></div>
                            <Typography align="center" variant="caption" display="block" sx={{ mt: 1 }}>
                                Point camera at barcode
                            </Typography>
                        </Box>
                    )}

                    {tabIndex === 1 && (
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            {barcode && <Typography variant="caption">Barcode: {barcode}</Typography>}

                            <Autocomplete
                                freeSolo
                                options={productNames}
                                value={name}
                                onInputChange={(_, newValue) => setName(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Product Name"
                                        autoFocus
                                    />
                                )}
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
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Size"
                                        type="number"
                                        value={sizeValue}
                                        onChange={(e) => setSizeValue(e.target.value)}
                                        fullWidth
                                    />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                            Unit
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={sizeUnit}
                                            exclusive
                                            onChange={(_, newUnit) => {
                                                if (newUnit !== null) {
                                                    setSizeUnit(newUnit);
                                                }
                                            }}
                                            fullWidth
                                            size="small"
                                        >
                                            <ToggleButton value="g">g</ToggleButton>
                                            <ToggleButton value="kg">kg</ToggleButton>
                                            <ToggleButton value="mL">mL</ToggleButton>
                                            <ToggleButton value="L">L</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
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
