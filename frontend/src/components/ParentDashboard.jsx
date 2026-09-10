import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ParentDashboard = () => {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Poll the backend every 5 seconds for live updates
  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/journey/latest');
        setJourneyData(response.data);
      } catch (err) {
        console.error("No active journey found or backend error.");
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
    const interval = setInterval(fetchJourney, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading Parent Dashboard...</div>;
  if (!journeyData) return <div style={{ padding: '20px' }}>No active journeys to monitor right now.</div>;

  const isEmergency = journeyData.status === 'emergency';

  return (
    <div>
      <h2 className="mb-4">Parent Safety Monitor</h2>

      {/* Emergency Banner */}
      {isEmergency && (
        <div className="glass-card p-4 mb-4" style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)' }}>🚨 EMERGENCY ALERT</h3>
          <p className="mb-2"><strong>{journeyData.user_name} may need assistance.</strong></p>
          <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
            <a href={`tel:${journeyData.user_phone}`} className="btn btn-danger" style={{ padding: '12px' }}>
              📞 CALL USER
            </a>
            <button className="btn btn-safe" style={{ padding: '12px' }}>
              ✓ MARK RESPONDED
            </button>
          </div>
        </div>
      )}

      {/* Status Grid */}
      <div className="glass-card p-4 mb-4">
        <h3>{journeyData.user_name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className={`status-dot ${isEmergency ? 'status-danger' : 'status-safe'}`}></span>
          <strong>{isEmergency ? '🔴 Emergency' : '🟢 Safe'}</strong>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <div>
            <span className="text-secondary text-xs">Journey ID</span>
            <p>#{journeyData.id}</p>
          </div>
          <div>
            <span className="text-secondary text-xs">Current Location</span>
            <p>{journeyData.current_lat.toFixed(4)}, {journeyData.current_lng.toFixed(4)}</p>
          </div>
          <div>
            <span className="text-secondary text-xs">Started At</span>
            <p>{new Date(journeyData.start_time).toLocaleTimeString()}</p>
          </div>
          <div>
            <span className="text-secondary text-xs">Status</span>
            <p>{journeyData.status.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Parent Map View */}
      <div className="glass-card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="map-container" style={{ height: '300px', width: '100%' }}>
          <MapContainer 
            center={[journeyData.current_lat, journeyData.current_lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
            <Marker position={[journeyData.current_lat, journeyData.current_lng]}>
              <Popup>{journeyData.user_name}'s Location</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;