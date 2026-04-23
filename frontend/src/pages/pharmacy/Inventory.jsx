// src/pages/pharmacy/Inventory.jsx
import React from 'react';
import { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const dummyMedicines = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 120, price: 25, expiry: '2025-06-30' },
  { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotic', stock: 45, price: 85, expiry: '2024-12-15' },
  { id: 3, name: 'Metformin 500mg', category: 'Diabetes', stock: 200, price: 30, expiry: '2025-03-10' },
  { id: 4, name: 'Atorvastatin 10mg', category: 'Cardiac', stock: 15, price: 120, expiry: '2024-08-20' },
];

const Inventory = () => {
  const [search, setSearch] = useState('');
  const filtered = dummyMedicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Pharmacy Inventory</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl"><PlusIcon className="w-5 h-5" /> Add Medicine</button>
      </div>
      <div className="relative max-w-md"><MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-xl border w-full" /></div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th></tr></thead><tbody className="divide-y">{filtered.map(m => (<tr key={m.id}><td className="px-6 py-4 font-medium">{m.name}</td><td className="px-6 py-4">{m.category}</td><td className={`px-6 py-4 ${m.stock < 20 ? 'text-red-600 font-medium' : ''}`}>{m.stock}</td><td className="px-6 py-4">₹{m.price}</td><td className="px-6 py-4">{m.expiry}</td></tr>))}</tbody></table>
      </div>
    </div>
  );
};

export default Inventory;