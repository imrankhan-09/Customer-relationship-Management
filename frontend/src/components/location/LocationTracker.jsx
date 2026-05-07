import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import { MapPinIcon, PlayIcon, StopIcon, ShieldCheckIcon, ShieldExclamationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix Leaflet marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const LocationTracker = ({ user }) => {
  const [isTracking, setIsTracking] = useState(user?.is_tracking_enabled || false);
  const [lastLocation, setLastLocation] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [geofenceStatus, setGeofenceStatus] = useState(user?.current_geofence_status || 'UNKNOWN');
  const [city, setCity] = useState(user?.start_city || null);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();
  
  const watchId = useRef(null);
  const lastSyncTime = useRef(0);
  const lastLocationRef = useRef(null);
  const isInitialMount = useRef(true);

  const fetchCity = async (lat, lon) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, { timeout: 5000 });
      const cityName = res.data.address.city || res.data.address.town || res.data.address.village || 'Unknown';
      setCity(cityName);
      return cityName;
    } catch (err) {
      console.error('Frontend geocoding error:', err);
      return city || 'Unknown';
    }
  };

  const sendUpdate = useCallback(async (isToggle = false, status = null, manualLoc = null) => {
    const loc = manualLoc || lastLocationRef.current;
    if (!loc) return;

    try {
      if (isToggle) {
        const currentCity = city || await fetchCity(loc.latitude, loc.longitude);
        const response = await api.post('/location/toggle', {
          is_tracking_enabled: status,
          latitude: loc.latitude,
          longitude: loc.longitude
        });
        if (response.data.success) {
          setCity(response.data.city);
        }
      } else {
        const now = Date.now();
        // Prevent sending updates too frequently (min 7 seconds) unless it's a toggle
        if (now - lastSyncTime.current < 7000) return;
        
        const response = await api.post('/location/update', {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          city: city
        });
        
        if (response.data.success) {
          setGeofenceStatus(response.data.geofence_status);
          lastSyncTime.current = now;
        }
      }
    } catch (err) {
      console.error('Location sync error:', err);
    }
  }, [city]);

  const startTracking = async () => {
    if (!navigator.geolocation) {
      showError('Geolocation not supported');
      return;
    }

    setError(null);
    let firstFix = true;

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          time: new Date()
        };
        
        setLastLocation(newLoc);
        lastLocationRef.current = newLoc;
        
        if (firstFix) {
          firstFix = false;
          setIsTracking(true);
          // Get city for the first fix
          const cityName = await fetchCity(newLoc.latitude, newLoc.longitude);
          await sendUpdate(true, true, newLoc);
          showSuccess('Tracking started');
        } else {
          // Regular update (throttled inside sendUpdate)
          sendUpdate(false);
        }
      },
      (err) => {
        let msg = 'Location error';
        if (err.code === 1) msg = 'Permission denied. Please enable location.';
        else if (err.code === 2) msg = 'Position unavailable. Check your GPS.';
        else if (err.code === 3) msg = 'Location request timed out.';
        setError(msg);
        showError(msg);
        setIsTracking(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0 
      }
    );
  };

  const stopTracking = async () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    await sendUpdate(true, false);
    setIsTracking(false);
    setGeofenceStatus('UNKNOWN');
    // Keep city for the display until next start
    showSuccess('Tracking stopped');
  };

  useEffect(() => {
    const fetchGeofence = async () => {
      try {
        const res = await api.get('/location/my-geofence');
        if (res.data.success) setGeofence(res.data.data);
      } catch (err) {}
    };
    
    fetchGeofence();
    
    if (user?.is_tracking_enabled && !watchId.current) {
      startTracking();
    }

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []);

  // Handle prop changes (e.g. if tracking was enabled from elsewhere)
  useEffect(() => {
      if (isInitialMount.current) {
          isInitialMount.current = false;
          return;
      }
      if (user?.is_tracking_enabled && !isTracking && !watchId.current) {
          startTracking();
      }
  }, [user?.is_tracking_enabled]);

  return (
    <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/80 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isTracking ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            <MapPinIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Geo-Tracking</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isTracking ? <span className="text-emerald-600">Active</span> : <span className="text-slate-500">Disabled</span>}
              </p>
              {city && <span className="text-[9px] font-black text-slate-400 uppercase"> • {city}</span>}
              {isTracking && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${geofenceStatus === 'INSIDE' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                  {geofenceStatus === 'INSIDE' ? <ShieldCheckIcon className="w-3 h-3" /> : <ShieldExclamationIcon className="w-3 h-3" />}
                  {geofenceStatus}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${isTracking ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-900 text-white'}`}
        >
          {isTracking ? <><StopIcon className="w-4 h-4" /> Stop</> : <><PlayIcon className="w-4 h-4" /> Start</>}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[10px] font-bold italic animate-pulse">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {error}
        </div>
      )}

      {isTracking && lastLocation && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lat</p>
              <p className="text-[11px] font-bold text-slate-700">{lastLocation.latitude.toFixed(6)}</p>
            </div>
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lng</p>
              <p className="text-[11px] font-bold text-slate-700">{lastLocation.longitude.toFixed(6)}</p>
            </div>
          </div>

          <div className="h-[180px] w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner z-0 relative">
            <MapContainer center={[lastLocation.latitude, lastLocation.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[lastLocation.latitude, lastLocation.longitude]} />
              {geofence && (
                <Circle center={[parseFloat(geofence.latitude), parseFloat(geofence.longitude)]} radius={parseFloat(geofence.radius)} pathOptions={{ color: geofenceStatus === 'INSIDE' ? '#10b981' : '#f43f5e', fillOpacity: 0.1 }} />
              )}
              <RecenterMap position={[lastLocation.latitude, lastLocation.longitude]} />
            </MapContainer>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400">Continuous Tracking Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTracker;
