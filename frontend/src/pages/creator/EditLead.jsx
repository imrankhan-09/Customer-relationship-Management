import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  IdentificationIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const EditLead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [type, setType] = useState('doctor');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'pending',
    pipeline_stage: 'new'
  });
  const [extraData, setExtraData] = useState({});
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await api.get(`/leads/${id}`);
        const lead = response.data;
        setFormData({
          name: lead.name,
          phone: lead.phone || '',
          email: lead.email || '',
          status: lead.status,
          pipeline_stage: lead.pipeline_stage
        });
        setType(lead.type);
        setExtraData(lead.extra_data || {});
        setNotes(lead.notes || '');
        setRejectionReason(lead.rejection_reason || '');
      } catch (err) {
        console.error('Error fetching lead:', err);
        alert('Failed to load lead data.');
        navigate('/creator/my-leads');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLead();
  }, [id, navigate]);

  const leadTypes = [
    { id: 'doctor', name: 'Doctor', icon: UserIcon },
    { id: 'patient', name: 'Patient', icon: IdentificationIcon },
    { id: 'lab', name: 'Lab', icon: BeakerIcon },
    { id: 'pharmacy', name: 'Pharmacy', icon: ShoppingBagIcon },
    { id: 'hospital', name: 'Hospital', icon: BuildingOfficeIcon },
  ];

  // Dynamic field definitions
  const dynamicFields = {
    doctor: [
      { name: 'doctor_name', label: 'Doctor Full Name', type: 'text' },
      { name: 'clinic_name', label: 'Clinic/Hospital Name', type: 'text' },
      { name: 'specialization', label: 'Specialization', type: 'text' },
      { name: 'qualification', label: 'Qualification', type: 'text' },
      { name: 'experience', label: 'Experience (Years)', type: 'number' },
      { name: 'consultation_fee', label: 'Consultation Fee', type: 'number' },
      { name: 'registration_number', label: 'Registration Number', type: 'text' },
      { name: 'clinic_type', label: 'Clinic Type', type: 'select', options: ['Private', 'Government'] },
      { name: 'available_time', label: 'Available Time', type: 'text' },
      { name: 'clinic_address', label: 'Clinic Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ],
    patient: [
      { name: 'patient_name', label: 'Patient Full Name', type: 'text' },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { name: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { name: 'disease', label: 'Current Disease/Issue', type: 'text' },
      { name: 'medical_history', label: 'Medical History', type: 'textarea' },
      { name: 'insurance_details', label: 'Insurance Details', type: 'text' },
      { name: 'emergency_contact', label: 'Emergency Contact Number', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ],
    lab: [
      { name: 'lab_name', label: 'Lab Name', type: 'text' },
      { name: 'owner_name', label: 'Owner Name', type: 'text' },
      { name: 'lab_type', label: 'Lab Type', type: 'select', options: ['Retail', 'Wholesale'] },
      { name: 'gst_number', label: 'GST Number', type: 'text' },
      { name: 'license_number', label: 'License Number', type: 'text' },
      { name: 'home_collection', label: 'Home Collection Available?', type: 'checkbox' },
      { name: 'test_types', label: 'Available Tests', type: 'text' },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'lab_address', label: 'Lab Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ],
    pharmacy: [
      { name: 'shop_name', label: 'Pharmacy Name', type: 'text' },
      { name: 'owner_name', label: 'Owner Name', type: 'text' },
      { name: 'pharmacy_type', label: 'Pharmacy Type', type: 'select', options: ['Retail', 'Wholesale'] },
      { name: 'gst_number', label: 'GST Number', type: 'text' },
      { name: 'drug_license_number', label: 'Drug License Number', type: 'text' },
      { name: 'available_medicines', label: 'Key Medicines Available', type: 'text' },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'address', label: 'Shop Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ],
    hospital: [
      { name: 'hospital_name', label: 'Hospital Name', type: 'text' },
      { name: 'registration_number', label: 'Registration Number', type: 'text' },
      { name: 'bed_capacity', label: 'Bed Capacity', type: 'number' },
      { name: 'icu_beds', label: 'ICU Beds', type: 'number' },
      { name: 'operation_theaters', label: 'Operation Theaters', type: 'number' },
      { name: 'emergency_available', label: 'Emergency Available?', type: 'checkbox' },
      { name: 'departments', label: 'Departments', type: 'text' },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'address', label: 'Hospital Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ]
  };

  const handleBasicChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleExtraChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setExtraData({ ...extraData, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/leads/${id}`, {
        ...formData,
        type,
        extra_data: extraData
      });
      navigate('/creator/my-leads');
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Failed to update lead.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold">Fetching lead data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-blue-600 border border-transparent hover:border-slate-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Lead</h1>
            <p className="text-slate-500 text-sm font-medium">Modify details for {formData.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
               <BriefcaseIcon className="w-5 h-5 text-blue-600" />
               Lead Category & Status
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                 <select
                   value={type}
                   onChange={(e) => setType(e.target.value)}
                   className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                 >
                   <option value="doctor">Doctor</option>
                   <option value="patient">Patient</option>
                   <option value="lab">Lab</option>
                   <option value="pharmacy">Pharmacy</option>
                   <option value="hospital">Hospital</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center justify-between ml-1">
                   <label className="text-sm font-bold text-slate-700">Current Status</label>
                   {formData.status === 'rejected' ? (
                     <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 animate-pulse">
                        Rejected
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                       <LockClosedIcon className="w-3 h-3" />
                       Read-only
                     </span>
                   )}
                 </div>
                 <div className="relative">
                   <select
                     name="status"
                     value={formData.status}
                     disabled
                     className={`w-full px-4 py-3 border rounded-2xl outline-none focus:ring-0 transition-all appearance-none cursor-not-allowed font-bold ${
                       formData.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-100/80 border-slate-200 text-slate-500'
                     }`}
                   >
                     <option value="pending">Pending</option>
                     <option value="approved">Approved</option>
                     <option value="rejected">Rejected</option>
                     <option value="converted">Converted</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                     <LockClosedIcon className="w-4 h-4" />
                   </div>
                 </div>
                 
                 {formData.status === 'rejected' ? (
                   <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Rejection Reason</p>
                      <p className="text-sm font-bold text-rose-700 italic">"{rejectionReason || 'Please fill correct information'}"</p>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'pending' })}
                        className="mt-2 w-full py-2 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                      >
                        Resubmit for Approval
                      </button>
                   </div>
                 ) : (
                   <p className="text-[10px] text-slate-400 font-medium ml-1 mt-1 italic">* Status updates require Approver role.</p>
                 )}

                 {notes && (
                   <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latest Internal Notes</p>
                      <p className="text-xs text-slate-600 font-medium">{notes}</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
               <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
               Pipeline Stage
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <div className="flex items-center justify-between ml-1">
                   <label className="text-sm font-bold text-slate-700">Current Stage</label>
                   <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                     <LockClosedIcon className="w-3 h-3" />
                     Read-only
                   </span>
                 </div>
                 <div className="relative">
                   <select
                     name="pipeline_stage"
                     value={formData.pipeline_stage}
                     disabled
                     className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200 rounded-2xl outline-none focus:ring-0 transition-all appearance-none cursor-not-allowed text-slate-500 font-bold"
                   >
                     <option value="new">New</option>
                     <option value="contacted">Contacted</option>
                     <option value="demo">Demo</option>
                     <option value="negotiation">Negotiation</option>
                     <option value="won">Won</option>
                     <option value="lost">Lost</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                     <LockClosedIcon className="w-4 h-4" />
                   </div>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium ml-1 mt-1 italic">* Pipeline stages are managed by Approvers.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Lead Name *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleBasicChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleBasicChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleBasicChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Type Specific Details ({type})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicFields[type]?.map((field) => (
              <div key={field.name} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                <label className="text-sm font-bold text-slate-700 ml-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={extraData[field.name] || ''}
                    onChange={handleExtraChange}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={extraData[field.name] || ''}
                    onChange={handleExtraChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                  />
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center h-12 gap-3 pl-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={extraData[field.name] || false}
                      onChange={handleExtraChange}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-600">{field.label}</span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={extraData[field.name] || ''}
                    onChange={handleExtraChange}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Section */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-3.5 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-10 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Mock Beaker and ShoppingBag icons
const BeakerIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v1.244c0 .462.202.9.553 1.2l1.493 1.278c.35.3.553.738.553 1.2v1.244m-9.143 0L3 11.25v1.244c0 .462.202.9.553 1.2l1.493 1.278c.35.3.553.738.553 1.2v1.244m15.143 0L21 11.25v1.244c0 .462-.202.9-.553 1.2l-1.493 1.278c-.35.3-.553.738-.553 1.2v1.244M9 21h6" />
  </svg>
);

const ShoppingBagIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export default EditLead;
