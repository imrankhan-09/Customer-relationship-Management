// src/components/documents/VerificationStatus.jsx
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

const documents = [
  { name: 'Medical License', status: 'Approved', date: '2024-01-15' },
  { name: 'ID Proof', status: 'Pending', date: '2024-03-10' },
  { name: 'Address Proof', status: 'Rejected', date: '2024-02-20', reason: 'Document expired' },
  { name: 'Education Certificate', status: 'Approved', date: '2024-01-20' },
];

const statusIcon = {
  Approved: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  Pending: <ClockIcon className="w-5 h-5 text-yellow-500" />,
  Rejected: <XCircleIcon className="w-5 h-5 text-red-500" />,
};

const ApprovalStatus = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Document Approval Status</h3>
      <div className="space-y-3">
        {documents.map((doc, idx) => (
          <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
            <div className="flex items-center gap-3">
              {statusIcon[doc.status]}
              <div><p className="font-medium">{doc.name}</p><p className="text-xs text-gray-500">Submitted: {doc.date}</p></div>
            </div>
            <div><span className={`text-sm ${doc.status === 'Approved' ? 'text-green-600' : doc.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>{doc.status}</span>{doc.reason && <p className="text-xs text-red-500">{doc.reason}</p>}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalStatus;