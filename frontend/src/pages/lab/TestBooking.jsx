// src/pages/lab/TestBooking.jsx
import React from 'react';
import { useState } from 'react';

const TestBooking = () => {
  const [selectedTests, setSelectedTests] = useState([]);
  const [patient, setPatient] = useState({ name: '', phone: '', email: '' });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const availableTests = [
    { id: 1, name: 'CBC', price: 500 },
    { id: 2, name: 'Lipid Profile', price: 800 },
    { id: 3, name: 'HbA1c', price: 600 },
  ];

  const total = selectedTests.reduce((sum, id) => sum + availableTests.find(t => t.id === id)?.price || 0, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking:', { patient, selectedTests, date, time, total });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-6">Book Lab Test</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Patient Name" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} className="rounded-xl border" required />
            <input placeholder="Phone" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} className="rounded-xl border" required />
            <input placeholder="Email" type="email" value={patient.email} onChange={e => setPatient({...patient, email: e.target.value})} className="rounded-xl border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl border" required />
            <select value={time} onChange={e => setTime(e.target.value)} className="rounded-xl border" required><option value="">Select Time</option><option>09:00 AM</option><option>11:00 AM</option><option>02:00 PM</option></select>
          </div>
          <div>
            <h3 className="font-medium mb-3">Select Tests</h3>
            <div className="space-y-2">
              {availableTests.map(test => (
                <label key={test.id} className="flex items-center gap-3 p-3 border rounded-xl">
                  <input type="checkbox" checked={selectedTests.includes(test.id)} onChange={e => { if(e.target.checked) setSelectedTests([...selectedTests, test.id]); else setSelectedTests(selectedTests.filter(id => id !== test.id)); }} className="rounded" />
                  <span className="flex-1">{test.name}</span>
                  <span className="font-medium">₹{test.price}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-bold">Total: ₹{total}</span>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl">Confirm Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestBooking;