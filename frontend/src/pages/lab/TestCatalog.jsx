// src/pages/lab/TestCatalog.jsx
import React from 'react';
import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const dummyTests = [
  { id: 1, name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 500, turnaround: '24 hours' },
  { id: 2, name: 'Lipid Profile', category: 'Biochemistry', price: 800, turnaround: '24 hours' },
  { id: 3, name: 'HbA1c', category: 'Diabetes', price: 600, turnaround: '24 hours' },
  { id: 4, name: 'Thyroid Profile (T3,T4,TSH)', category: 'Endocrinology', price: 1200, turnaround: '48 hours' },
  { id: 5, name: 'Vitamin D Total', category: 'Vitamins', price: 1500, turnaround: '72 hours' },
  { id: 6, name: 'Liver Function Test', category: 'Biochemistry', price: 900, turnaround: '24 hours' },
];

const TestCatalog = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...new Set(dummyTests.map(t => t.category))];
  const filteredTests = dummyTests.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'All' || t.category === category)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Test Catalog</h1>
        <div className="flex gap-2">
          <div className="relative"><MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-xl border" /></div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border"><option>All</option>{categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map(test => (
          <div key={test.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-800">{test.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{test.category}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xl font-bold text-blue-600">₹{test.price}</span>
              <span className="text-xs text-gray-400">TAT: {test.turnaround}</span>
            </div>
            <button className="mt-3 w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">Book Test</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCatalog;