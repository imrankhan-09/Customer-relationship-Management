// src/components/opportunity/ProductTable.jsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProductTable = ({ products, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">₹ {product.mrp}</td>
              <td className="px-6 py-4 whitespace-nowrap">{product.discount}%</td>
              <td className="px-6 py-4 whitespace-nowrap">₹ {product.finalPrice}</td>
              <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
              <td className="px-6 py-4 whitespace-nowrap font-semibold">₹ {product.total}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-800 mr-2"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(idx)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;