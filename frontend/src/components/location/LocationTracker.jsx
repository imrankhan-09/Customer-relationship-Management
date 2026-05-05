import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import { MapPinIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';

const LocationTracker = ({ user }) => {
  const [isTracking, setIsTracking] = useState(user?.is_tracking_enabled || false);
  const [lastLocation, setLastLocation] = useState(null);
  const { showSuccess, showError } = useNotification();
  const watchId = useRef(null);
  const updateInterval = useRef(null);

  // Sync with user prop if it changes
  useEffect(() => {
    if (user) {
      setIsTracking(user.is_tracking_enabled);
    }
  }, [user]);

  const startTracking = async () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    try {
      await api.post('/location/toggle', { is_tracking_enabled: true });
      setIsTracking(true);
      showSuccess('Location tracking started');
      
      // Start watching position
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setLastLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            time: new Date()
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          showError('Failed to get location');
        },
        { enableHighAccuracy: true }
      );

      // Send location update every 20 seconds if we have a location
      updateInterval.current = setInterval(sendLocationUpdate, 20000);
      
    } catch (err) {
      console.error('Error starting tracking:', err);
      showError('Failed to start tracking');
    }
  };

  const stopTracking = async () => {
    try {
      await api.post('/location/toggle', { is_tracking_enabled: false });
      setIsTracking(false);
      showSuccess('Location tracking stopped');
      
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    } catch (err) {
      console.error('Error stopping tracking:', err);
      showError('Failed to stop tracking');
    }
  };

  const sendLocationUpdate = async () => {
    if (!lastLocation) return;

    try {
      await api.post('/location/update', {
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        accuracy: lastLocation.accuracy
      });
    } catch (err) {
      console.error('Error sending location update:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (updateInterval.current) clearInterval(updateInterval.current);
    };
  }, []);

  // Initialize tracking if it was already enabled on mount
  useEffect(() => {
    if (isTracking && !watchId.current) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        startTracking();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/80 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isTracking ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            <MapPinIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Location Tracking</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Status: {isTracking ? <span className="text-emerald-600">Active</span> : <span className="text-slate-500">Disabled</span>}
            </p>
          </div>
        </div>
        
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 ${
            isTracking 
              ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white shadow-rose-100' 
              : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200'
          }`}
        >
          {isTracking ? (
            <>
              <StopIcon className="w-4 h-4" />
              Stop Tracking
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              Start Tracking
            </>
          )}
        </button>
      </div>

      {isTracking && lastLocation && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
              <p className="text-xs font-bold text-slate-700">{lastLocation.latitude.toFixed(6)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
              <p className="text-xs font-bold text-slate-700">{lastLocation.longitude.toFixed(6)}</p>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 mt-3 flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Last updated: {lastLocation.time.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationTracker;
