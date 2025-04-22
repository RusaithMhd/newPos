import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductDetailsModal from '../items/ProductDetailsModal';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString;
  }
};

// Helper function to determine expiry status styling
const getExpiryStatusClass = (expiryDateString) => {
  if (!expiryDateString) return 'text-gray-500';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expiryDateString);
  expiryDate.setHours(0, 0, 0, 0);
  const timeDiff = expiryDate.getTime() - today.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  if (dayDiff < 0) return 'text-red-600 font-semibold';
  if (dayDiff <= 7) return 'text-yellow-600 font-semibold';
  return 'text-green-600';
};

const Expiry = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null); // State for modal

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/products');
        setItems(response.data.data || []);
      } catch (e) {
        console.error('Failed to fetch items:', e);
        setError('Failed to load item data. Please try again later.');
        setItems([]);
        toast.error('Error fetching items: ' + e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Handle opening the modal
  const handleOpenModal = (productId) => {
    setSelectedProductId(productId);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setSelectedProductId(null);
  };

  return (
    <div className="container min-h-screen p-4 mx-auto md:p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <h1 className="mb-6 text-3xl font-bold text-center text-gray-800 md:text-4xl md:mb-8">
        Item Inventory Enquiry
      </h1>

      {isLoading && (
        <div className="py-10 text-center">
          <p className="text-lg text-blue-600 animate-pulse">Loading items...</p>
        </div>
      )}

      {error && (
        <div
          className="relative px-4 py-3 mb-6 text-red-700 bg-red-100 border border-red-400 rounded"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                    Item Name
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                    Expiry Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition duration-150 ease-in-out hover:bg-blue-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 text-xs font-semibold leading-5 text-blue-800 bg-blue-100 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {item.opening_stock_quantity}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${getExpiryStatusClass(
                        item.expiry_date
                      )}`}
                    >
                      {formatDate(item.expiry_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-lg text-gray-500">No items found.</p>
        </div>
      )}

      {/* Render ProductDetailsModal */}
      {selectedProductId && (
        <ProductDetailsModal productId={selectedProductId} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Expiry;