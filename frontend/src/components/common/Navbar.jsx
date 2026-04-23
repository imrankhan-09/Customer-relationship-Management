// src/components/common/Navbar.jsx
import React from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthProvider';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800 capitalize">
          {user?.role} Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 hover:bg-gray-100 rounded-xl p-2 transition">
              <UserCircleIcon className="w-8 h-8 text-gray-600" />
              <span className="hidden md:block text-sm font-medium">{user?.name}</span>
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
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-lg border border-gray-200 focus:outline-none z-50">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } w-full text-left px-4 py-2 text-sm rounded-lg text-gray-700`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;