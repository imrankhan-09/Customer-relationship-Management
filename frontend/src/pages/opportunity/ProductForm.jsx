// src/components/opportunity/ProductForm.jsx
import React from 'react';
import { useState } from 'react';

const ProductForm = ({ onSave, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    mrp: initialData.mrp || '',
    discount: initialData.discount || '',
    quantity: initialData.quantity || 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const finalPrice = formData.mrp ? (formData.mrp * (1 - (formData.discount || 0) / 100)).toFixed(2) : 0;
  const total = (finalPrice * formData.quantity).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, finalPrice, total });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
          <input name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleChange} required className="mt-1 block w-full rounded-xl border-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
          <input name="discount" type="number" min="0" max="100" value={formData.discount} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Final Price (per unit)</label>
          <div className="mt-1 p-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">₹ {finalPrice}</div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Total</label>
        <div className="mt-1 p-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 font-semibold">₹ {total}</div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Save Product</button>
      </div>
    </form>
  );
};

export default ProductForm;