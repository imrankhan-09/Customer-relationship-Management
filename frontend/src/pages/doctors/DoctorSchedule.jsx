// src/pages/doctor/DoctorSchedule.jsx
import React from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

const dummyAppointments = {
  '2024-03-20': { '10:00 AM': 'John Smith', '02:00 PM': 'Emma Watson' },
  '2024-03-21': { '11:00 AM': 'Robert Brown', '03:00 PM': 'Lisa Ray' },
};

const DoctorSchedule = () => {
  const { id } = useParams();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('2024-03-20');

  const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Monday start
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates(currentWeek);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Doctor Schedule</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeftIcon className="w-5 h-5" /></button>
          <span className="font-medium">{currentWeek.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 font-medium text-gray-500 border-r">Time</div>
          {weekDates.map(date => (
            <div key={date} className={`p-3 text-center font-medium cursor-pointer ${selectedDate === date ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`} onClick={() => setSelectedDate(date)}>
              <div>{new Date(date).toLocaleDateString('default', { weekday: 'short' })}</div>
              <div className="text-sm">{new Date(date).getDate()}</div>
            </div>
          ))}
        </div>
        <div className="divide-y">
          {timeSlots.map(slot => (
            <div key={slot} className="grid grid-cols-8">
              <div className="p-3 text-sm text-gray-500 border-r">{slot}</div>
              {weekDates.map(date => {
                const appointment = dummyAppointments[date]?.[slot];
                return (
                  <div key={date} className={`p-3 text-sm border-r last:border-r-0 ${appointment ? 'bg-green-50' : ''}`}>
                    {appointment ? (
                      <span className="font-medium text-green-800">{appointment}</span>
                    ) : (
                      <button className="text-blue-600 hover:underline text-xs">Book</button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;