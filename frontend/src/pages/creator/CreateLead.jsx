import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
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
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CreateLead = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [type, setType] = useState('doctor');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [extraData, setExtraData] = useState({});

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
      { name: 'available_time', label: 'Available Time', type: 'text', placeholder: 'e.g. 10 AM - 5 PM' },
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
      { name: 'test_types', label: 'Available Tests (Comma separated)', type: 'text' },
      { name: 'contact_person', label: 'Contact Person Name', type: 'text' },
      { name: 'lab_address', label: 'Lab Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ],
    pharmacy: [
      { name: 'shop_name', label: 'Pharmacy/Shop Name', type: 'text' },
      { name: 'owner_name', label: 'Owner Name', type: 'text' },
      { name: 'pharmacy_type', label: 'Pharmacy Type', type: 'select', options: ['Retail', 'Wholesale'] },
      { name: 'gst_number', label: 'GST Number', type: 'text' },
      { name: 'drug_license_number', label: 'Drug License Number', type: 'text' },
      { name: 'available_medicines', label: 'Key Medicines Available (Comma separated)', type: 'text' },
      { name: 'contact_person', label: 'Contact Person Name', type: 'text' },
      { name: 'address', label: 'Shop Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ],
    hospital: [
      { name: 'hospital_name', label: 'Hospital Name', type: 'text' },
      { name: 'registration_number', label: 'Registration Number', type: 'text' },
      { name: 'bed_capacity', label: 'Total Bed Capacity', type: 'number' },
      { name: 'icu_beds', label: 'ICU Beds', type: 'number' },
      { name: 'operation_theaters', label: 'Operation Theaters', type: 'number' },
      { name: 'emergency_available', label: '24/7 Emergency Available?', type: 'checkbox' },
      { name: 'departments', label: 'Departments (Comma separated)', type: 'text' },
      { name: 'contact_person', label: 'Admin Contact Person', type: 'text' },
      { name: 'address', label: 'Hospital Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
    ]
  };

  const [isSuccess, setIsSuccess] = useState(false);
  const [createdLead, setCreatedLead] = useState(null);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError('');
  };

  const handleExtraChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setExtraData({ ...extraData, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const nextErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      nextErrors.name = 'Name is required';
    }
    if (trimmedPhone && !/^[0-9]{10}$/.test(trimmedPhone)) {
      nextErrors.phone = 'Invalid phone';
    }
    if (trimmedEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmedEmail)) {
      nextErrors.email = 'Invalid email';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/leads', {
        ...formData,
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        type,
        extra_data: extraData
      });
      setCreatedLead(response.data);
      showSuccess('Lead Created Successfully');
      setIsSuccess(true);
    } catch (err) {
      console.error('Error creating lead:', err);
      const msg = err?.response?.data?.message || 'Failed to create lead. Please try again.';
      setSubmitError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && createdLead) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircleIcon className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">Lead Created Successfully!</h2>
            <p className="text-emerald-700 font-medium">The new {type} lead has been added to your database.</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Lead Summary</h3>
            <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">{type}</span>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-lg font-bold text-slate-800">{createdLead.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                <p className="text-lg font-bold text-slate-800">{createdLead.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-lg font-bold text-slate-800">{createdLead.email || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Dynamic Details (extra_data)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(createdLead.extra_data || {}).map(([key, value]) => (
                  <div key={key} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-bold text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
            <button 
              onClick={() => {
                setIsSuccess(false);
                setFormData({ name: '', phone: '', email: '' });
                setExtraData({});
              }}
              className="px-8 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
            >
              Create Another
            </button>
            <button 
              onClick={() => navigate('/creator/my-leads')}
              className="px-10 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Go to My Leads
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
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
            <h1 className="text-2xl font-bold text-slate-900">Create New Lead</h1>
            <p className="text-slate-500 text-sm font-medium">Add a new prospective contact to the system</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {submitError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {submitError}
          </div>
        )}
        {/* Type Selection */}
        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
            Select Lead Type
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {leadTypes.map((t) => {
              const Icon = t.icon;
              const isActive = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setType(t.id);
                    setExtraData({}); // Reset extra data when type changes
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basic Information */}
        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
            Basic Information
          </h3>
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
                  placeholder="Lead display name"
                />
              </div>
              {fieldErrors.name && <p className="text-xs font-semibold text-rose-600">{fieldErrors.name}</p>}
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
                  placeholder="+91 00000 00000"
                />
              </div>
              {fieldErrors.phone && <p className="text-xs font-semibold text-rose-600">{fieldErrors.phone}</p>}
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
                  placeholder="contact@email.com"
                />
              </div>
              {fieldErrors.email && <p className="text-xs font-semibold text-rose-600">{fieldErrors.email}</p>}
            </div>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="glass-card rounded-3xl p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
            {type.charAt(0).toUpperCase() + type.slice(1)} Specific Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicFields[type].map((field) => (
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
                    placeholder={`Enter ${field.label.toLowerCase()}`}
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
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Section */}
        <div className="flex justify-end gap-4 pb-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-3.5 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-10 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transform transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>Save Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Mock Beaker and ShoppingBag icons since they aren't imported
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

export default CreateLead;