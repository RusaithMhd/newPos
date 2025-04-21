import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { createProductionCategory, updateProductionCategory } from '../../services/productionapi'; // Adjust the import path as necessary

function ProductionCategoryModal({ onClose, onSubmit, editingCategory }) {
    const [formData, setFormData] = useState({
        name: editingCategory?.name || '',
        batch_number: editingCategory?.batch_number || '',
        production_date: editingCategory?.production_date || '',
        is_active: editingCategory?.is_active ?? true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const updated = await updateProductionCategory(editingCategory.id, formData);
                onSubmit(updated.data);
            } else {
                const created = await createProductionCategory(formData);
                onSubmit(created.data);
            }
            onClose();
        } catch (error) {
            console.error('Error saving production category:', error);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-xl z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col border border-gray-300 dark:border-gray-700"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                        {editingCategory ? 'Edit Production Category' : 'Add Production Category'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                {/* Form (Scrollable) */}
                <div className="overflow-y-auto flex-grow p-4">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-4 rounded-lg space-y-4">
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="bg-gray-100 dark:bg-gray-700 rounded-md w-full focus:ring-2 focus:ring-blue-500 dark:text-white text-lg p-2"
                                required
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Batch Number *
                            </label>
                            <input
                                type="text"
                                name="batch_number"
                                value={formData.batch_number}
                                onChange={handleChange}
                                className="bg-gray-100 dark:bg-gray-700 rounded-md w-full focus:ring-2 focus:ring-blue-500 dark:text-white text-lg p-2"
                                required
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Production Date
                            </label>
                            <input
                                type="date"
                                name="production_date"
                                value={formData.production_date}
                                onChange={handleChange}
                                className="bg-gray-100 dark:bg-gray-700 rounded-md w-full focus:ring-2 focus:ring-blue-500 dark:text-white text-lg p-2"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="block text-sm font-medium mr-2">Active</label>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5"
                            />
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-2 border-t pt-3 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-lg transition"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ProductionCategoryModal;