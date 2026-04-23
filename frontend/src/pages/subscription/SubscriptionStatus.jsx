// src/pages/subscription/SubscriptionStatus.jsx
import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const currentPlan = {
  name: 'Pro',
  status: 'Active',
  validTill: '2024-12-31',
  nextBilling: '2025-01-01',
  amount: 79,
  features: ['Unlimited leads', 'Priority support', 'Advanced analytics', 'API access'],
};

const invoices = [
  { id: 'INV-001', date: '2024-03-01', amount: 79, status: 'Paid' },
  { id: 'INV-002', date: '2024-02-01', amount: 79, status: 'Paid' },
  { id: 'INV-003', date: '2024-01-01', amount: 79, status: 'Paid' },
];

const SubscriptionStatus = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Subscription Status</h1>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div><h3 className="text-lg font-semibold">{currentPlan.name} Plan</h3><p className="text-gray-500">Valid till {currentPlan.validTill}</p></div>
          <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"><CheckCircleIcon className="w-4 h-4" /> {currentPlan.status}</span>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between"><span>Next billing date</span><span className="font-medium">{currentPlan.nextBilling}</span></div>
          <div className="flex justify-between mt-2"><span>Amount</span><span className="font-medium">${currentPlan.amount}</span></div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl">Change Plan</button>
          <button className="border border-red-300 text-red-600 px-4 py-2 rounded-xl">Cancel Subscription</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4">Billing History</h3>
        <table className="w-full"><thead><tr className="border-b"><th className="text-left py-2">Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{invoices.map(inv => (<tr key={inv.id} className="border-b"><td className="py-2">{inv.id}</td><td>{inv.date}</td><td>${inv.amount}</td><td><span className="text-green-600">{inv.status}</span></td></tr>))}</tbody></table>
      </div>
    </div>
  );
};

export default SubscriptionStatus;