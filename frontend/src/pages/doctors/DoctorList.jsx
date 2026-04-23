// src/pages/doctor/DoctorList.jsx
import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const dummyDoctors = [
  { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Cardiology', qualification: 'MD', experience: 12, available: true },
  { id: 2, name: 'Dr. Michael Chen', specialization: 'Neurology', qualification: 'MD, PhD', experience: 18, available: false },
];

const DoctorList = () => {
  const [search, setSearch] = useState('');
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-xl border" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dummyDoctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(doc => (
          <Link key={doc.id} to={`/doctors/${doc.id}`} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
            <h3 className="font-semibold text-lg">{doc.name}</h3>
            <p className="text-gray-600">{doc.specialization}</p>
            <p className="text-sm text-gray-500">{doc.qualification} • {doc.experience} yrs</p>
            <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${doc.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {doc.available ? 'Available' : 'Unavailable'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DoctorList;