// src/pages/professional/ProfessionalProfile.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { StarIcon, MapPinIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

const dummyProfessional = {
  id: 1,
  name: 'Sarah Johnson',
  specialization: 'Consultant',
  qualification: 'Expert Certification',
  experience: 12,
  email: 'sarah.johnson@example.com',
  phone: '+1 555-0101',
  address: '123 Business Plaza, Enterprise City',
  about: 'Experienced consultant with expertise in strategic planning and operational excellence.',
  rating: 4.8,
  availability: 'Mon - Fri, 9 AM - 5 PM',
  education: [
    { degree: 'Masters in Management', institute: 'Harvard', year: '2015' },
    { degree: 'Bachelors in Economics', institute: 'Yale', year: '2012' },
  ],
};

const ProfessionalProfile = () => {
  const { id } = useParams();
  // Use id to fetch, but using dummy for now
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-600">{dummyProfessional.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{dummyProfessional.name}</h1>
            <p className="text-blue-600 font-medium">{dummyProfessional.specialization}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-yellow-500">
                <StarIcon className="w-4 h-4 fill-current" />
                <span className="ml-1 text-sm font-medium">{dummyProfessional.rating}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{dummyProfessional.experience} years exp.</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-gray-600"><EnvelopeIcon className="w-5 h-5" /> {dummyProfessional.email}</div>
              <div className="flex items-center gap-2 text-gray-600"><PhoneIcon className="w-5 h-5" /> {dummyProfessional.phone}</div>
              <div className="flex items-center gap-2 text-gray-600 col-span-2"><MapPinIcon className="w-5 h-5" /> {dummyProfessional.address}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-3">About</h3>
          <p className="text-gray-600">{dummyProfessional.about}</p>
          <h3 className="font-semibold text-gray-800 mt-6 mb-3">Education & Qualifications</h3>
          <ul className="space-y-2">
            {dummyProfessional.education.map((edu, idx) => (
              <li key={idx} className="border-l-4 border-blue-500 pl-3">
                <p className="font-medium">{edu.degree}</p>
                <p className="text-sm text-gray-500">{edu.institute}, {edu.year}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Availability</h3>
          <p className="text-gray-600">{dummyProfessional.availability}</p>
          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">Schedule Session</button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfile;