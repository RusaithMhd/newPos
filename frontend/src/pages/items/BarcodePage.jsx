import React, { useState, useEffect, useReducer, useRef, useMemo, createContext, useContext } from "react";
import JsBarcode from "jsbarcode";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./BarcodePrinter.css";
import ProductCard from "./ProductCard";
import BarcodeLabel from "./BarcodeLabel";

// Context for Barcode Settings
const BarcodeContext = createContext();

const useFetchProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/products");
                setProducts(response.data.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return { products, loading };
};

// Reducer for barcode settings
const barcodeReducer = (state, action) => {
    switch (action.type) {
        case "SET_OPTION":
            return { ...state, [action.field]: action.value };
        default:
            return state;
    }
};

const BarcodePrinter = () => {
    const { products, loading } = useFetchProducts();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [barcodesToPrint, setBarcodesToPrint] = useState([]);
    const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("darkMode")) || false);
    const [settings, dispatch] = useReducer(barcodeReducer, {
        format: "CODE128",
        displayValue: false,
        fontSize: 14,
        height: 40,
        width: 1.5,
        showProductName: true,
        showPrice: true,
        showCompany: true,
    });

    const quantityInputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
    }, [darkMode]);

    const filteredProducts = useMemo(
        () =>
            products.filter(
                (product) =>
                    product.product_id !== selectedProduct?.product_id &&
                    (product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.item_code.toString().includes(searchQuery) ||
                        product.barcode.toString().includes(searchQuery))
            ),
        [products, searchQuery, selectedProduct]
    );

    const handleGenerateBarcodes = () => {
        if (!selectedProduct || quantity < 1) return;
        setBarcodesToPrint(Array.from({ length: quantity }, () => selectedProduct));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <BarcodeContext.Provider value={{ settings, dispatch }}>
            <div className={`barcode-printer-container ${darkMode ? "dark-mode" : ""}`}>
                <h1>Select Product and Print Barcode</h1>

                {loading && <p>Loading products...</p>}

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search by Item Code or Product Name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                        aria-label="Search products"
                    />
                </div>

                {searchQuery && (
                    <div className="product-list">
                        <h3>Available Products</h3>
                        <div className="product-cards">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <ProductCard key={product.product_id} product={product} onSelect={setSelectedProduct} />
                                ))
                            ) : (
                                <p>No products found</p>
                            )}
                        </div>
                    </div>
                )}

                {selectedProduct && (
                    <div className="barcode-preview">
                        <h3>Generated Barcodes</h3>
                        <div className="barcode-grid">
                            {barcodesToPrint.map((product, index) => (
                                <BarcodeLabel key={index} product={product} index={index} />
                            ))}
                        </div>
                        <button onClick={handlePrint} className="print-button">Print Barcodes</button>
                    </div>
                )}
            </div>
        </BarcodeContext.Provider>
    );
};

export default BarcodePrinter;
