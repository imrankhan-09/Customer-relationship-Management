// src/pages/subscription/Plans.jsx
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const plans = [
  { name: 'Basic', price: 29, features: ['Up to 100 leads', 'Email support', 'Basic reports'], color: 'gray' },
  { name: 'Pro', price: 79, features: ['Unlimited leads', 'Priority support', 'Advanced analytics', 'API access'], color: 'blue', popular: true },
  { name: 'Enterprise', price: 199, features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA'], color: 'purple' },
];

const Plans = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 text-center">Subscription Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map(plan => (
          <div key={plan.name} className={`bg-white rounded-2xl shadow-sm border p-6 relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-4"><span className="text-3xl font-bold">${plan.price}</span><span className="text-gray-500">/month</span></p>
            <ul className="mt-6 space-y-3">
              {plan.features.map(f => (<li key={f} className="flex items-center gap-2"><CheckIcon className="w-5 h-5 text-green-500" /><span className="text-gray-600">{f}</span></li>))}
            </ul>
            <button className={`mt-6 w-full py-2 rounded-xl font-medium ${plan.popular ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Subscribe</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;