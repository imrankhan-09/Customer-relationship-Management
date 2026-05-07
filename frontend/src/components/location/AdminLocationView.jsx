import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/api';
import { io } from 'socket.io-client';
import { 
  MapPinIcon, 
  ClockIcon, 
  UserCircleIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  FlagIcon,
  StopCircleIcon
} from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Icons for Start, End and Live
const liveIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const endIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const RecenterMap = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
        map.setView(position, zoom || map.getZoom(), { animate: true });
    }
  }, [position, map, zoom]);
  return null;
};

const AdminLocationView = () => {
  const [workers, setWorkers] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const socket = useRef(null);
  const selectedWorkerRef = useRef(null);

  const selectedWorker = workers.find(w => String(w.id) === String(selectedWorkerId));
  selectedWorkerRef.current = selectedWorker;

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/live-locations');
      setWorkers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching live locations:', err);
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGeofences = async () => {
    try {
      const res = await api.get('/admin/geofences');
      setGeofences(res.data.data || []);
    } catch (err) {}
  };

  const fetchHistory = async (userId) => {
    if (String(selectedWorkerId) === String(userId)) return;
    
    setSelectedWorkerId(userId);
    setIsHistoryLoading(true);
    try {
      const res = await api.get(`/admin/location-history/${userId}`);
      setHistory(res.data.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchGeofences();

    // Socket Setup
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    socket.current = io(socketUrl, { withCredentials: true });

    socket.current.on('location_update', (data) => {
        setWorkers(prev => prev.map(worker => {
            if (String(worker.id) === String(data.userId)) {
                return {
                    ...worker,
                    last_latitude: data.latitude,
                    last_longitude: data.longitude,
                    last_location_time: data.recorded_at,
                    current_geofence_status: data.geofence_status,
                };
            }
            return worker;
        }));

        // Update history if this worker is selected
        if (selectedWorkerRef.current && String(selectedWorkerRef.current.id) === String(data.userId)) {
            setHistory(prev => [
                {
                    id: Date.now(),
                    latitude: data.latitude,
                    longitude: data.longitude,
                    city: data.city,
                    geofence_status: data.geofence_status,
                    recorded_at: data.recorded_at
                },
                ...prev
            ].slice(0, 100));
        }
    });

    socket.current.on('worker_status_change', (data) => {
        // Refresh all workers to get new start/end points
        fetchWorkers();
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  const getMapCenter = () => {
    if (selectedWorker?.last_latitude) return [parseFloat(selectedWorker.last_latitude), parseFloat(selectedWorker.last_longitude)];
    if (workers.length > 0 && workers[0].last_latitude) return [parseFloat(workers[0].last_latitude), parseFloat(workers[0].last_longitude)];
    return [28.6139, 77.2090];
  };

  const getStatusBadge = (status) => {
    if (status === 'INSIDE') return <span className="flex items-center gap-1 text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100"><ShieldCheckIcon className="w-2.5 h-2.5" /> INSIDE</span>;
    if (status === 'OUTSIDE') return <span className="flex items-center gap-1 text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100"><ShieldExclamationIcon className="w-2.5 h-2.5" /> OUTSIDE</span>;
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[700px]">
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-black text-slate-900">Field Force</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time status</p>
          </div>
          <button onClick={fetchWorkers} className="p-2 hover:bg-slate-100 rounded-lg bg-white shadow-sm border border-slate-100">
            <ArrowPathIcon className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[650px] pr-2 custom-scrollbar">
          {workers.map((worker) => (
            <div key={worker.id} onClick={() => fetchHistory(worker.id)} className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${selectedWorkerId === worker.id ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white/60 border-white/80 hover:bg-white hover:shadow-lg'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedWorkerId === worker.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <UserCircleIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-black tracking-tight ${selectedWorkerId === worker.id ? 'text-white' : 'text-slate-900'}`}>{worker.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${worker.is_tracking_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${selectedWorkerId === worker.id ? 'text-slate-400' : 'text-slate-500'}`}>{worker.is_tracking_enabled ? 'Live' : 'Offline'}</span>
                      {getStatusBadge(worker.current_geofence_status)}
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className={`w-4 h-4 ${selectedWorkerId === worker.id ? 'text-white/40' : 'text-slate-300'}`} />
              </div>
              
              {(worker.start_city || worker.end_city) && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100/10 pt-3">
                   {worker.start_city && (
                     <div className="flex items-center gap-1.5">
                        <FlagIcon className="w-3 h-3 text-emerald-500" />
                        <p className={`text-[8px] font-bold truncate ${selectedWorkerId === worker.id ? 'text-slate-400' : 'text-slate-500'}`}>{worker.start_city}</p>
                     </div>
                   )}
                   {worker.end_city && (
                     <div className="flex items-center gap-1.5">
                        <StopCircleIcon className="w-3 h-3 text-rose-500" />
                        <p className={`text-[8px] font-bold truncate ${selectedWorkerId === worker.id ? 'text-slate-400' : 'text-slate-500'}`}>{worker.end_city}</p>
                     </div>
                   )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-6 flex flex-col gap-6">
        <div className="flex-1 bg-slate-100 rounded-3xl overflow-hidden relative shadow-inner min-h-[400px] border border-white/80">
          <MapContainer center={getMapCenter()} zoom={12} style={{ height: '100%', width: '100%' }} className="z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap position={getMapCenter()} />

            {geofences.map(gf => (
              <Circle key={gf.id} center={[parseFloat(gf.latitude), parseFloat(gf.longitude)]} radius={parseFloat(gf.radius)} pathOptions={{ color: '#64748b', fillColor: '#cbd5e1', fillOpacity: 0.1, dashArray: '5, 5' }} />
            ))}

            {workers.map(worker => {
              const lat = parseFloat(worker.last_latitude);
              const lng = parseFloat(worker.last_longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker key={worker.id} position={[lat, lng]} icon={liveIcon}>
                  <Popup>
                    <div className="p-2 min-w-[150px]">
                      <p className="font-black text-slate-900">{worker.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${worker.is_tracking_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{worker.is_tracking_enabled ? 'Live' : 'Offline'}</span>
                        {getStatusBadge(worker.current_geofence_status)}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 italic font-medium">Last Update: {new Date(worker.last_location_time).toLocaleString()}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {selectedWorker && (
              <>
                {selectedWorker.start_latitude && (
                  <Marker position={[parseFloat(selectedWorker.start_latitude), parseFloat(selectedWorker.start_longitude)]} icon={startIcon}>
                    <Popup><div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Start Point: {selectedWorker.start_city}</div></Popup>
                  </Marker>
                )}
                {selectedWorker.end_latitude && (
                  <Marker position={[parseFloat(selectedWorker.end_latitude), parseFloat(selectedWorker.end_longitude)]} icon={endIcon}>
                    <Popup><div className="text-[10px] font-black uppercase tracking-widest text-rose-600">End Point: {selectedWorker.end_city}</div></Popup>
                  </Marker>
                )}
                {history.length > 1 && (
                  <Polyline positions={history.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)])} color="#3B82F6" weight={3} opacity={0.6} dashArray="5, 10" />
                )}
              </>
            )}
          </MapContainer>
        </div>

        {selectedWorker && (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/80">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h4 className="text-lg font-black text-slate-900 tracking-tight">{selectedWorker.name}'s History</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Logs with City & Geo-fence data</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Start Time</p>
                      <p className="text-[10px] font-bold text-emerald-600">{selectedWorker.start_time ? new Date(selectedWorker.start_time).toLocaleTimeString() : 'N/A'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">End Time</p>
                      <p className="text-[10px] font-bold text-rose-600">{selectedWorker.end_time ? new Date(selectedWorker.end_time).toLocaleTimeString() : 'Active'}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-2 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <ArrowPathIcon className="w-6 h-6 text-slate-300 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">Loading history...</p>
                  </div>
                ) : history.length > 0 ? (
                  history.map((point, idx) => (
                    <div key={point.id || idx} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-transparent hover:border-blue-100 transition-all text-[10px]">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-white ${point.is_tracking_start ? 'bg-emerald-500' : point.is_tracking_end ? 'bg-rose-500' : 'bg-slate-300'}`}>
                          {point.is_tracking_start ? 'S' : point.is_tracking_end ? 'E' : history.length - idx}
                        </div>
                        <div>
                          <p className="font-bold text-slate-600 flex items-center gap-2">
                            {point.city || 'Unknown Location'}
                            {getStatusBadge(point.geofence_status)}
                          </p>
                          <p className="text-[9px] text-slate-400 italic">{parseFloat(point.latitude).toFixed(4)}, {parseFloat(point.longitude).toFixed(4)} • {new Date(point.recorded_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">No history recorded for this session</div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLocationView;
