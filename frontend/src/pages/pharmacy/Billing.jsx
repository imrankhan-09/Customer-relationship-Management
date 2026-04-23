// src/pages/pharmacy/Billing.jsx
import React from 'react';
import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

const medicinesList = [
  { id: 1, name: 'Paracetamol 500mg', price: 25 },
  { id: 2, name: 'Amoxicillin 250mg', price: 85 },
  { id: 3, name: 'Vitamin C 500mg', price: 60 },
];

const Billing = () => {
  const [cart, setCart] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(1);

  const addToCart = () => {
    const med = medicinesList.find(m => m.id === Number(selectedMedicine));
    if (!med) return;
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      setCart(cart.map(item => item.id === med.id ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      setCart([...cart, { ...med, quantity }]);
    }
    setSelectedMedicine('');
    setQuantity(1);
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Billing</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Add Items</h3>
          <div className="flex gap-2 mb-4">
            <select value={selectedMedicine} onChange={e => setSelectedMedicine(e.target.value)} className="flex-1 rounded-xl border"><option value="">Select Medicine</option>{medicinesList.map(m => <option key={m.id} value={m.id}>{m.name} - ₹{m.price}</option>)}</select>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-20 rounded-xl border" />
            <button onClick={addToCart} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Add</button>
          </div>
          <table className="w-full"><thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-left">Qty</th><th className="text-left">Price</th><th></th></tr></thead><tbody>{cart.map(item => (<tr key={item.id} className="border-b"><td className="py-2">{item.name}</td><td>{item.quantity}</td><td>₹{item.price * item.quantity}</td><td><button onClick={() => removeFromCart(item.id)} className="text-red-600"><TrashIcon className="w-4 h-4" /></button></td></tr>))}</tbody></table>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit">
          <h3 className="font-semibold mb-4">Bill Summary</h3>
          <div className="space-y-2"><div className="flex justify-between"><span>Subtotal</span><span>₹{total}</span></div><div className="flex justify-between"><span>Tax (5%)</span><span>₹{(total * 0.05).toFixed(2)}</span></div><div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>₹{(total * 1.05).toFixed(2)}</span></div></div>
          <button className="w-full mt-6 bg-green-600 text-white py-2 rounded-xl">Generate Bill</button>
        </div>
      </div>
    </div>
  );
};

export default Billing;