import React, { useState } from 'react';
import { motion } from 'framer-motion';

const DiscountScheam = () => {
    const [schemes, setSchemes] = useState([]);
    const [form, setForm] = useState({
        name: '',
        type: 'percentage',
        value: '',
        appliesTo: 'product',
        target: '',
        startDate: '',
        endDate: '',
        active: true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSchemes([...schemes, { ...form, id: Date.now() }]);
        setForm({
            name: '',
            type: 'percentage',
            value: '',
            appliesTo: 'product',
            target: '',
            startDate: '',
            endDate: '',
            active: true,
        });
    };

    const formatCurrency = (amount) =>
        `Rs. ${parseFloat(amount).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const inputStyle =
        'p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white border border-gray-300 text-black placeholder-gray-500 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder-gray-400';

    return (
        <div className=" min-h-screen max-w-5xl py-10 px-4 transition-colors duration-500 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
            <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                <div className="mb-6">
                    <motion.h1
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-bold"
                    >
                        Discount Scheme and Promotions
                    </motion.h1>
                </div>

                {/* FORM SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white shadow-2xl rounded-2xl p-8 mb-12 border dark:border-gray-700 border-gray-200"
                >
                    <h2 className="text-2xl font-semibold mb-6">Create New Discount Scheme</h2>
                    <form onSubmit={handleSubmit} className=" bg-transparent grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Scheme Name"
                            className={inputStyle}
                            required
                        />

                        <select name="type" value={form.type} onChange={handleChange} className={inputStyle}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="amount">Fixed Amount (LKR)</option>
                        </select>

                        <input
                            type="number"
                            name="value"
                            value={form.value}
                            onChange={handleChange}
                            placeholder={form.type === 'percentage' ? 'Discount %' : 'Amount in LKR'}
                            className={inputStyle}
                            required
                        />

                        <select name="appliesTo" value={form.appliesTo} onChange={handleChange} className={inputStyle}>
                            <option value="product">Specific Product</option>
                            <option value="category">Category</option>
                            <option value="customerGroup">Customer Group</option>
                        </select>

                        <input
                            type="text"
                            name="target"
                            value={form.target}
                            onChange={handleChange}
                            placeholder={`Enter ${form.appliesTo}`}
                            className={inputStyle}
                        />

                        <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputStyle} />
                        <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputStyle} />

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="active"
                                checked={form.active}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-500"
                            />
                            <span className="text-sm font-medium">Active Scheme</span>
                        </label>

                        <button
                            type="submit"
                            className="col-span-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 transition"
                        >
                            Add Discount Scheme
                        </button>
                    </form>
                </motion.div>

                {/* SCHEME LIST SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="bg-gray-100 dark:bg-gray-800 shadow-xl rounded-2xl p-8 border dark:border-gray-700 border-gray-200"
                >
                    <h2 className="text-2xl font-semibold mb-6">Active Discount Schemes</h2>
                    {schemes.length === 0 ? (
                        <p className="italic opacity-75">No discount schemes created yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-200 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Value</th>
                                        <th className="px-4 py-3">Applies To</th>
                                        <th className="px-4 py-3">Target</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schemes.map((scheme) => (
                                        <motion.tr
                                            key={scheme.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <td className="px-4 py-3">{scheme.name}</td>
                                            <td className="px-4 py-3 capitalize">{scheme.type}</td>
                                            <td className="px-4 py-3">
                                                {scheme.type === 'percentage' ? `${scheme.value}%` : formatCurrency(scheme.value)}
                                            </td>
                                            <td className="px-4 py-3 capitalize">{scheme.appliesTo}</td>
                                            <td className="px-4 py-3">{scheme.target}</td>
                                            <td className="px-4 py-3">
                                                {scheme.startDate} → {scheme.endDate}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${scheme.active
                                                        ? 'bg-green-700 text-green-200'
                                                        : 'bg-gray-600 text-gray-400'
                                                        }`}
                                                >
                                                    {scheme.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default DiscountScheam;
