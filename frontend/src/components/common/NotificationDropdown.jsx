// src/components/common/NotificationDropdown.jsx
import React from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';

const notifications = [
  { id: 1, text: 'New lead assigned to you', time: '5 min ago' },
  { id: 2, text: 'Follow-up scheduled with Dr. Smith', time: '1 hour ago' },
  { id: 3, text: 'Lab report uploaded', time: '3 hours ago' },
];

const NotificationDropdown = () => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
        <BellIcon className="w-6 h-6 text-gray-600" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-xl shadow-lg border border-gray-200 focus:outline-none z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <Menu.Item key={n.id}>
                {({ active }) => (
                  <div className={`px-4 py-3 ${active ? 'bg-gray-50' : ''} border-b last:border-0`}>
                    <p className="text-sm text-gray-800">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                  </div>
                )}
              </Menu.Item>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all notifications
            </button>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationDropdown;