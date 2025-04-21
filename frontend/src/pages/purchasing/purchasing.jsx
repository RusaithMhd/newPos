// src/pages/purchasing/PurchasingEntryForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaFilter, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";

const PurchasingEntryForm = () => {
  // Date range setup
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const lastMonth = oneMonthAgo.toISOString().split("T")[0];

  // State for UI and data
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState(lastMonth);
  const [toDate, setToDate] = useState(today);
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suppliersRes, storesRes, itemsRes, purchasesRes] =
        await Promise.all([
          axios.get("/api/suppliers"),
          axios.get("/api/store-locations"),
          axios.get("/api/products"),
          axios.get("/api/purchases", { params: { fromDate, toDate } }),
        ]);
      setSuppliers(suppliersRes.data.data || []);
      setStores(storesRes.data.data || []);
      setItems(itemsRes.data.data || []);
      // Flatten purchase items for the table
      const purchaseItems = purchasesRes.data.data.flatMap((purchase) =>
        purchase.items.map((item, index) => ({
          id: `${purchase.id}-${index}`,
          product_name:
            itemsRes.data.data.find((i) => i.id === item.product_id)
              ?.product_name || "Unknown",
          quantity: item.quantity,
          buyingCost: item.buying_cost,
          sellingPrice: item.selling_price || 0,
          mrp: item.mrp || 0,
          minimumPrice: item.minimum_price || 0,
          discountPercentage: item.discount_percentage || 0,
          discountAmount: item.discount_amount || 0,
          tax: item.tax || 0,
          expiryDate: item.expiry_date || "",
          totalPrice:
            item.quantity * item.buying_cost -
            (item.discount_amount || 0) +
            (item.tax || 0),
          purchaseId: purchase.id,
          billNumber: purchase.bill_number,
          invoiceNumber: purchase.invoice_number,
          date: purchase.date_of_purchase,
          supplier:
            suppliersRes.data.data.find((s) => s.id === purchase.supplier_id)
              ?.supplier_name || "Unknown",
          supplierId: purchase.supplier_id,
          store:
            storesRes.data.data.find((s) => s.id === purchase.store_id)
              ?.store_name || "Unknown",
          storeId: purchase.store_id,
          paymentMethod: purchase.payment_method,
          status: purchase.status || "pending",
        }))
      );
      setPurchasedItems(purchaseItems);
    } catch (error) {
      setNotification("Error fetching data: " + error.message);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter items based on search term
  const filteredItems = purchasedItems.filter(
    (item) =>
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = purchasedItems.reduce(
      (acc, item) => acc + item.quantity * item.buyingCost,
      0
    );
    const totalDiscount = purchasedItems.reduce(
      (acc, item) => acc + (item.discountAmount || 0),
      0
    );
    const totalTax = purchasedItems.reduce(
      (acc, item) => acc + (item.tax || 0),
      0
    );
    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item, index) => ({
        "S.No": index + 1,
        "Bill Number": item.billNumber,
        "Invoice Number": item.invoiceNumber,
        Supplier: item.supplier,
        Store: item.store,
        Item: item.product_name,
        Quantity: item.quantity,
        "Buying Cost": item.buyingCost,
        Discount: item.discountAmount,
        Tax: item.tax,
        Total: item.totalPrice,
        Date: item.date,
        Status: item.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PurchaseEntries");
    XLSX.writeFile(
      workbook,
      `Purchase_Entries_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Open modal for editing an item
  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Open PurchaseInvoiceForm for editing an invoice
  const openEditInvoice = (item) => {
    const invoiceItems = purchasedItems
      .filter((i) => i.purchaseId === item.purchaseId)
      .map((i) => ({
        id: i.id.split("-")[1],
        productId: items.find((prod) => prod.product_name === i.product_name)
          ?.id,
        description: i.product_name,
        quantity: i.quantity,
        freeItems: 0, // Assuming freeItems not stored in API
        buyingCost: i.buyingCost,
        discountPercentage: i.discountPercentage,
        discountAmount: i.discountAmount,
        tax: i.tax,
        total: i.totalPrice,
      }));
    setEditingInvoice({
      billNumber: item.billNumber,
      invoiceNumber: item.invoiceNumber,
      purchaseDate: item.date,
      paymentMethod: item.paymentMethod,
      supplierId: item.supplierId,
      storeId: item.storeId,
      items: invoiceItems,
      total: invoiceItems.reduce((sum, i) => sum + i.total, 0),
      status: item.status,
      id: item.purchaseId,
    });
    setIsInvoiceFormOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Update item in the purchased items table
  const updateItem = async (e) => {
    e.preventDefault();
    const totalPrice =
      editingItem.quantity * parseFloat(editingItem.buyingCost || 0) -
      parseFloat(editingItem.discountAmount || 0) +
      parseFloat(editingItem.tax || 0);
    const updatedItem = { ...editingItem, totalPrice };

    try {
      setLoading(true);
      await axios.put(
        `/api/purchases/${updatedItem.purchaseId}/items/${updatedItem.id}`,
        updatedItem
      );
      setPurchasedItems(
        purchasedItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      setNotification("Item updated successfully!");
    } catch (error) {
      setNotification("Error updating item: " + error.message);
      console.error("Error updating item:", error);
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  // Handle invoice submission (create or update)
  const handleGenerateInvoice = async (newInvoice) => {
    try {
      setLoading(true);
      const invoiceData = {
        date_of_purchase: newInvoice.purchaseDate,
        bill_number: newInvoice.billNumber,
        invoice_number: newInvoice.invoiceNumber,
        payment_method: newInvoice.paymentMethod,
        supplier_id: parseInt(newInvoice.supplierId),
        store_id: parseInt(newInvoice.storeId),
        items: newInvoice.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          buying_cost: item.buyingCost,
          discount_percentage: item.discountPercentage,
          discount_amount: item.discountAmount,
          tax: item.tax,
        })),
        total: newInvoice.total,
        status: newInvoice.status || "pending",
      };

      if (newInvoice.id) {
        // Update existing invoice
        await axios.put(`/api/purchases/${newInvoice.id}`, invoiceData);
        setNotification("Purchase invoice updated successfully!");
      } else {
        // Create new invoice
        await axios.post("/api/purchases", invoiceData);
        setNotification("Purchase invoice recorded successfully!");
      }
      fetchData();
      setIsInvoiceFormOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      setNotification("Error recording purchase invoice: " + error.message);
      console.error("Error recording purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete an invoice
  const deleteInvoice = async (purchaseId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/purchases/${purchaseId}`);
      setPurchasedItems(
        purchasedItems.filter((item) => item.purchaseId !== purchaseId)
      );
      setNotification("Purchase invoice deleted successfully!");
    } catch (error) {
      setNotification("Error deleting purchase invoice: " + error.message);
      console.error("Error deleting purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-4 min-h-screen flex flex-col bg-transparent">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800 text-white text-center py-3 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold">PURCHASE ENTRY DASHBOARD</h1>
        <p className="text-sm opacity-90">
          View and manage your purchase entries
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-2 mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
          {notification}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search items, bill number, supplier..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsInvoiceFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Purchase Entry
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FaFilter /> Purchase Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Purchase Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-blue-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Subtotal
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-blue-400">
              {formatCurrency(calculateTotals().subtotal)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-red-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Total Discount
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-red-400">
              {formatCurrency(calculateTotals().totalDiscount)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-yellow-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Total Tax
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-yellow-400">
              {formatCurrency(calculateTotals().totalTax)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-green-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Grand Total
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-green-400">
              {formatCurrency(calculateTotals().grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Purchased Items Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
              <thead className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">S.No</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Store</th>
                  <th className="px-6 py-3 text-left font-semibold">Item</th>
                  <th className="px-6 py-3 text-left font-semibold">Qty</th>
                  <th className="px-6 py-3 text-left font-semibold">Cost</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Tax</th>
                  <th className="px-6 py-3 text-left font-semibold">Total</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No purchase entries found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                          expandedRow === index
                            ? "bg-blue-50 dark:bg-slate-700"
                            : ""
                        }`}
                        onClick={() => toggleRow(index)}
                      >
                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.billNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.supplier}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.store}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {formatCurrency(item.buyingCost)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {formatCurrency(item.discountAmount)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {formatCurrency(item.tax)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.status === "paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
                              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                              Edit Item
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditInvoice(item);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit Invoice
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteInvoice(item.purchaseId);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(index);
                              }}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                              {expandedRow === index ? (
                                <FiChevronUp size={18} />
                              ) : (
                                <FiChevronDown size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === index && (
                        <tr className="bg-gray-50 dark:bg-slate-700">
                          <td colSpan={14} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Item Details
                                </h4>
                                <div className="grid grid-cols-2 gap-y-1 text-sm">
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Selling Price:
                                  </div>
                                  <div className="text-gray-900 dark:text-white font-medium">
                                    {formatCurrency(item.sellingPrice)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    MRP:
                                  </div>
                                  <div className="text-gray-900 dark:text-white font-medium">
                                    {formatCurrency(item.mrp)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Minimum Price:
                                  </div>
                                  <div className="text-gray-900 dark:text-white font-medium">
                                    {formatCurrency(item.minimumPrice)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Expiry Date:
                                  </div>
                                  <div className="text-gray-900 dark:text-white font-medium">
                                    {item.expiryDate || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase Invoice Form Modal */}
      {isInvoiceFormOpen && (
        <PurchaseInvoiceForm
          onGenerateInvoice={handleGenerateInvoice}
          onCancel={() => {
            setIsInvoiceFormOpen(false);
            setEditingInvoice(null);
          }}
          existingInvoice={editingInvoice}
        />
      )}

      {/* Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Item
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={updateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Buying Cost
                  </label>
                  <input
                    type="number"
                    value={editingItem.buyingCost}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        buyingCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Buying Cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    value={editingItem.discountAmount}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        discountAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Discount Amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Tax
                  </label>
                  <input
                    type="number"
                    value={editingItem.tax}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        tax: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Tax"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        expiryDate: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Expiry Date"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasingEntryForm;
