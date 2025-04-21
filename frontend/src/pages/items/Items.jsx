import React, { useState, useEffect } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ItemForm from "../../components/item Form/ItemForm";
import ProductDetailsModal from "./ProductDetailsModal";
import ConfirmationModal from "./ConfirmationModal";
import { useAuth } from "../../context/NewAuthContext"; // Import your auth context


const Items = () => {
  const { currentUser } = useAuth(); // Get current user from auth context
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedFile, setSelectedFile] = useState(null);

  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
      Authorization: `Bearer ${currentUser?.token}`,
      "Content-Type": "application/json",
    },
  });

  useEffect(() => {
    fetchItems();
  }, [currentPage]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get("/products");
      setItems(response.data.data);
      setFilteredItems(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        // You might want to redirect to login here
      } else {
        toast.error("Error fetching items: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (Array.isArray(items)) {
      setFilteredItems(
        items.filter((item) =>
          item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, items]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      toast.success("File selected: " + file.name);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post("/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(response.data.message);
      setSelectedFile(null);
      fetchItems();
    } catch (error) {
      console.error("Error importing items:", error);
      toast.error(
        "Error importing items: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleExport = () => {
    if (!Array.isArray(items) || items.length === 0) {
      toast.error("No items to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
    XLSX.writeFile(workbook, "items_list.xlsx");
  };
  const handleEditItem = (item) => {
    if (item && item.product_id) {
      setSelectedItem(item);
      setShowForm(true);
    } else {
      console.error("Selected item does not have an ID:", item);
    }
  };

  const handleAddItem = async (newItem) => {
    try {
      const response = selectedItem
        ? await api.put(`/products/${selectedItem.id}`, newItem)
        : await api.post("/products", newItem);

      toast.success(response.data.message);
      setShowForm(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      toast.error("Error saving item: " + error.message);
    }
  };

  const handleDeleteItem = async (product_id) => {
    try {
      await api.delete(`/products/${product_id}`);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      toast.error("Error deleting item: " + error.message);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalItems = filteredItems.length;
  const totalOpeningQty = filteredItems.reduce((sum, item) => sum + item.opening_stock_quantity, 0);
  const totalOpeningCost = filteredItems.reduce((sum, item) => sum + (item.opening_stock_quantity * item.buying_cost), 0);
  const totalSellingPrice = filteredItems.reduce((sum, item) => sum + (item.opening_stock_quantity * item.sales_price), 0);
  const profitMargin = totalSellingPrice - totalOpeningCost;
  const profitMarginPercentage = ((profitMargin / totalOpeningCost) * 100).toFixed(2);

  const formatNumber = (number) => {
    return number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  return (
    <div className="flex flex-col gap-6 p-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedItem(null); // Reset selected item when adding a new item
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <Search className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="fileInput"
          />
          <button
            onClick={() => document.getElementById('fileInput').click()}
            className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg cursor-pointer hover:bg-green-700"
          >
            Select Excel File
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile}
            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg ${selectedFile ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Import Selected File
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedItem ? "Edit Item" : "Add New Item"}
            </h2>
            <ItemForm
              onSubmit={handleAddItem}
              initialData={selectedItem} // Pass selected item data to the form
              onClose={() => {
                setShowForm(false);
                setSelectedItem(null); // Reset selected item when closing the form
              }}
            />
          </div>
        </div>
      )}

      {showDetailsModal && (
        <ProductDetailsModal
          product={selectedItem}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDeleteItem(selectedItem.product_id)}
          message="Are you sure you want to delete this item?"
        />
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-700 text-white sticky top-0">
            <tr>
              <th className="p-2 text-xs text-center uppercase">No</th>
              <th className="p-2 text-xs text-center uppercase">Name</th>
              <th className="p-2 text-xs text-center uppercase">Category</th>
              <th className="p-2 text-xs text-center uppercase">Buying Price</th>
              <th className="p-2 text-xs text-center uppercase">Selling Price</th>
              <th className="p-2 text-xs text-center uppercase">Opening Qty</th>
              <th className="p-2 text-xs text-center uppercase">Opening Value</th>
              <th className="p-2 text-xs text-center uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-500 hover:text-emerald-300">
                    <td className="px-4 py-2 text-xs text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-4 py-2 text-xs text-left">{item.product_name}</td>
                    <td className="px-4 py-2 text-xs text-center">{item.category}</td>
                    <td className="px-4 py-2 text-xs text-right">LKR {formatNumber(item.buying_cost)}</td>
                    <td className="px-4 py-2 text-xs text-right">LKR {formatNumber(item.sales_price)}</td>
                    <td className="px-4 py-2 text-xs text-right">{(item.opening_stock_quantity)}</td>
                    <td className="px-4 py-2 text-xs text-right">
                      LKR {formatNumber(item.opening_stock_quantity * item.buying_cost)}
                    </td>
                    <td className="flex justify-center gap-2 p-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item.product_id);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditItem(item)} // Trigger edit functionality
                        className="text-green-600 hover:text-green-900"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`px-4 py-2 ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              } rounded-lg`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="bg-transparent rounded-lg shadow-lg text-center p-4 mt-4">
        <h2 className="text-xl font-bold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-cyan-800 p-4 rounded-lg">
            <p className="text-sm text-cyan-500">Total Items</p>
            <p className="text-2xl text-cyan-300 font-bold">{totalItems}</p>
          </div>
          <div className="bg-rose-800 p-4 rounded-lg">
            <p className="text-sm text-pink-500">Total Opening Qty</p>
            <p className="text-2xl text-pink-300 font-bold">{totalOpeningQty}</p>
          </div>
          <div className="bg-lime-800 p-4 rounded-lg">
            <p className="text-sm text-lime-500">Total Opening Cost</p>
            <p className="text-2xl text-lime-300 font-bold">LKR {formatNumber(totalOpeningCost)}</p>
          </div>
          <div className="bg-fuchsia-800 p-4 rounded-lg">
            <p className="text-sm text-fuchsia-500">Total Selling Price</p>
            <p className="text-2xl text-fuchsia-300 font-bold">LKR {formatNumber(totalSellingPrice)}</p>
          </div>
          <div className="bg-purple-800 p-4 rounded-lg">
            <p className="text-sm text-purple-500">Profit Margin</p>
            <p className="text-2xl text-purple-300 font-bold">{profitMarginPercentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Items;