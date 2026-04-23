// src/components/documents/DocumentUpload.jsx
import { useState } from 'react';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

const DocumentUpload = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true); else setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files)); };
  const handleFileChange = (e) => { if (e.target.files) setFiles(Array.from(e.target.files)); };

  const handleUpload = () => { console.log('Uploading:', files); onUpload?.(files); setFiles([]); };

  return (
    <div className="space-y-4">
      <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-xl p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Drag & drop files here, or <label className="text-blue-600 cursor-pointer hover:underline">browse<input type="file" multiple onChange={handleFileChange} className="hidden" /></label></p>
        <p className="text-xs text-gray-400 mt-2">Supports PDF, DOC, JPG up to 10MB</p>
      </div>
      {files.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium mb-2">Selected Files</h4>
          <ul className="space-y-2">{files.map((file, i) => (<li key={i} className="flex items-center gap-2 text-sm"><DocumentIcon className="w-4 h-4 text-gray-500" />{file.name} ({(file.size/1024).toFixed(1)} KB)</li>))}</ul>
          <button onClick={handleUpload} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl">Upload {files.length} file(s)</button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;