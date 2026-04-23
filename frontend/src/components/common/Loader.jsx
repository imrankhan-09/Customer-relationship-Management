// src/components/common/Loader.jsx
import React from 'react';
const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
  </div>
);
export default Loader;