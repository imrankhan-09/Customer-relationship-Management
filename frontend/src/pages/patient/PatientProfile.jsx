// src/pages/patient/PatientProfile.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { UserIcon, CalendarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const dummyPatient = {
  id: 1,
  name: 'John Smith',
  age: 45,
  gender: 'Male',
  bloodGroup: 'O+',
  email: 'john.smith@example.com',
  phone: '555-0103',
  address: '456 Oak Avenue, Springfield',
  medicalHistory: [
    { condition: 'Hypertension', diagnosed: '2020' },
    { condition: 'Type 2 Diabetes', diagnosed: '2022' },
  ],
  insurance: {
    provider: 'HealthGuard Insurance',
    policyNo: 'HG-2024-7890',
    validTill: '2025-12-31',
  },
};

const PatientProfile = () => {
  const { id } = useParams();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-4 rounded-full"><UserIcon className="w-10 h-10 text-gray-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{dummyPatient.name}</h1>
            <p className="text-gray-500">{dummyPatient.gender}, {dummyPatient.age} years • Blood Group: {dummyPatient.bloodGroup}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2"><EnvelopeIcon className="w-5 h-5 text-gray-500" /> {dummyPatient.email}</div>
          <div className="flex items-center gap-2"><PhoneIcon className="w-5 h-5 text-gray-500" /> {dummyPatient.phone}</div>
          <div className="col-span-2"><p className="text-gray-600">{dummyPatient.address}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Medical History</h3>
          <ul className="space-y-2">
            {dummyPatient.medicalHistory.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b pb-2">
                <span className="font-medium">{item.condition}</span>
                <span className="text-sm text-gray-500">Since {item.diagnosed}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Insurance Details</h3>
          <dl className="space-y-2">
            <div><dt className="text-sm text-gray-500">Provider</dt><dd className="font-medium">{dummyPatient.insurance.provider}</dd></div>
            <div><dt className="text-sm text-gray-500">Policy Number</dt><dd>{dummyPatient.insurance.policyNo}</dd></div>
            <div><dt className="text-sm text-gray-500">Valid Till</dt><dd>{dummyPatient.insurance.validTill}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;