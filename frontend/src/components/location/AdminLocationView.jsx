import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { 
  MapPinIcon, 
  ClockIcon, 
  UserCircleIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to center map on selection
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const AdminLocationView = () => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching live locations...');
      const res = await api.get('/admin/live-locations');
      console.log('Live locations response:', res.data);
      setWorkers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching live locations:', err);
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (userId) => {
    setIsHistoryLoading(true);
    try {
      const res = await api.get(`/admin/location-history/${userId}`);
      const historyData = res.data.data || [];
      setHistory(historyData);
      
      const worker = workers.find(w => String(w.id) === String(userId));
      setSelectedWorker(worker);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 20000); // Refresh every 20 seconds
    return () => clearInterval(interval);
  }, []);

  // Prepare trail coordinates
  const trailPath = history
    .filter(p => p.latitude && p.longitude)
    .map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

  // Get current map center
  const getMapCenter = () => {
    if (selectedWorker && selectedWorker.last_latitude && selectedWorker.last_longitude) {
      return [parseFloat(selectedWorker.last_latitude), parseFloat(selectedWorker.last_longitude)];
    }
    // Default center (can be dynamic based on all workers)
    if (workers.length > 0 && workers[0].last_latitude) {
      return [parseFloat(workers[0].last_latitude), parseFloat(workers[0].last_longitude)];
    }
    return [20.5937, 78.9629]; // Default to India center or any default
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[700px]">
      {/* Workers List */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-black text-slate-900">Field Force</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time status</p>
          </div>
          <button 
            onClick={fetchWorkers}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
          >
            <ArrowPathIcon className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[650px] pr-2 custom-scrollbar">
          {workers.map((worker) => (
            <div 
              key={worker.id}
              onClick={() => fetchHistory(worker.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                selectedWorker?.id === worker.id 
                  ? 'bg-slate-900 border-slate-900 shadow-xl' 
                  : 'bg-white/60 border-white/80 hover:bg-white hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    selectedWorker?.id === worker.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <UserCircleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-black tracking-tight ${
                      selectedWorker?.id === worker.id ? 'text-white' : 'text-slate-900'
                    }`}>{worker.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${worker.is_tracking_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        selectedWorker?.id === worker.id ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {worker.is_tracking_enabled ? 'Live' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className={`w-4 h-4 ${
                  selectedWorker?.id === worker.id ? 'text-white/40' : 'text-slate-300'
                }`} />
              </div>
              
              {worker.last_latitude && (
                <div className={`mt-3 pt-3 border-t ${
                  selectedWorker?.id === worker.id ? 'border-white/10' : 'border-slate-100'
                }`}>
                  <p className={`text-[9px] font-bold flex items-center gap-1.5 ${
                    selectedWorker?.id === worker.id ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <ClockIcon className="w-3 h-3" />
                    Last seen: {new Date(worker.last_location_time).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))}

          {workers.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-white/40 rounded-3xl border border-dashed border-slate-200">
               <MapPinIcon className="w-10 h-10 text-slate-200 mx-auto mb-4" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No field data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Map / History View */}
      <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-6 flex flex-col gap-6">
        {workers.filter(w => w.last_latitude).length === 0 && !isLoading && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <ClockIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-amber-800">
              No live location data received yet. Workers need to enable tracking and share their location.
            </p>
          </div>
        )}
        
        {/* Real Leaflet Map */}
        <div className="flex-1 bg-slate-100 rounded-3xl overflow-hidden relative shadow-inner min-h-[400px] border border-white/80">
          <MapContainer 
            center={getMapCenter()} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <RecenterMap position={getMapCenter()} />

            {/* Plot all workers */}
            {workers.map(worker => {
              const lat = parseFloat(worker.last_latitude);
              const lng = parseFloat(worker.last_longitude);
              
              if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Invalid coordinates for worker ${worker.name}:`, worker.last_latitude, worker.last_longitude);
                return null;
              }

              console.log(`Rendering marker for ${worker.name} at [${lat}, ${lng}]`);

              return (
                <Marker 
                  key={worker.id} 
                  position={[lat, lng]}
                  icon={DefaultIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-black text-slate-900">{worker.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{worker.role}</p>
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
                        <div className={`w-1.5 h-1.5 rounded-full ${worker.is_tracking_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">
                          {worker.is_tracking_enabled ? 'Currently Live' : 'Last Seen'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">{new Date(worker.last_location_time).toLocaleString()}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Draw trail for selected worker */}
            {selectedWorker && trailPath.length > 0 && (
              <Polyline 
                positions={trailPath} 
                color="#3B82F6" 
                weight={4} 
                opacity={0.6}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        </div>

        {selectedWorker && (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/80 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h4 className="text-lg font-black text-slate-900 tracking-tight">{selectedWorker.name}'s Trail</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Location Logs (Last 100)</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">
                      {history.length} Data Points
                   </span>
                </div>
             </div>

             <div className="space-y-3 overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
                {isHistoryLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : history.map((point, idx) => (
                  <div key={point.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-transparent hover:border-blue-100 transition-all text-[10px]">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                        {history.length - idx}
                      </div>
                      <div>
                        <p className="font-bold text-slate-600">
                          {parseFloat(point.latitude).toFixed(6)}, {parseFloat(point.longitude).toFixed(6)}
                        </p>
                        <p className="text-[9px] text-slate-400">{new Date(point.recorded_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="font-black text-slate-400 uppercase">±{parseFloat(point.accuracy).toFixed(1)}m</span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && !isHistoryLoading && (
                  <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase italic">No history trail found</p>
                )}
             </div>
          </div>
        )}

        {!selectedWorker && (
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <MapPinIcon className="w-48 h-48" />
             </div>
             <div className="relative z-10">
                <h4 className="text-xl font-black mb-3 italic">Operational Overview</h4>
                <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md">
                   The map displays live positions of all active field workers. Select a worker from the sidebar to visualize their movement history and precise location trail.
                </p>
                <div className="mt-8 flex items-center gap-6">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Tracking</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Offline / Last Known</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLocationView;
