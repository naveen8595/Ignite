import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const MapUpdater = ({ destination }) => {
  const map = useMap();
  useEffect(() => {
    if (destination) map.flyTo([destination.lat, destination.lng], 15, { animate: true, duration: 1.5 });
  }, [destination, map]);
  return null;
};

const MapClickHandler = ({ setDestination, setSearchQuery }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setDestination({ lat, lng, name: "Resolving address..." });
      setSearchQuery("Resolving address...");
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`);
        let addressName = res.data.display_name;
        if (res.data.address) {
            const a = res.data.address;
            const parts = [a.road || a.suburb || a.neighbourhood, a.city || a.town || a.county].filter(Boolean);
            if (parts.length > 0) addressName = parts.join(', ');
        }
        const finalName = addressName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setDestination({ lat, lng, name: finalName });
        setSearchQuery(finalName);
      } catch (err) {
        const fallbackName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setDestination({ lat, lng, name: fallbackName });
        setSearchQuery(fallbackName);
      }
    },
  });
  return null;
};

const Dashboard = ({ onStartJourney, currentLocation, setCurrentLocation }) => {
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState(null);
  const [startName, setStartName] = useState("Fetching your location...");
  const [transportMode, setTransportMode] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng });
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`);
          let addressName = res.data.display_name;
          if (res.data.address) {
              const a = res.data.address;
              const parts = [a.road || a.suburb, a.city || a.town].filter(Boolean);
              if (parts.length > 0) addressName = parts.join(', ');
          }
          setStartName(addressName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch (error) { setStartName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); }
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (res.data && res.data.length > 0) {
        const { lat, lon, display_name } = res.data[0];
        setDestination({ lat: parseFloat(lat), lng: parseFloat(lon), name: display_name });
        setSearchQuery(display_name);
      } else {
        alert("Location not found. Try a more specific address or city.");
      }
    } catch (err) {
      alert("Error searching for location.");
    }
    setSearchLoading(false);
  };

  const startJourney = async () => {
    if (!currentLocation) return alert("Waiting for your location...");
    if (!destination || !destination.lat) return alert("Please search or tap on the map to set a destination first!");
    if (!transportMode) return alert("Please select a transport mode (Bike, Car, etc.)!");
    
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/journey/start', {
        email: "hackathon@example.com",
        start_lat: currentLocation.lat, start_lng: currentLocation.lng,
        dest_lat: destination.lat, dest_lng: destination.lng
      });
      
      // CRITICAL FIX: Passing the full destination object directly
      onStartJourney(response.data.journey_id, transportMode, destination, startName);
      
    } catch (error) {
      alert("Backend error. Is Django running?");
    }
    setLoading(false);
  };

  const VehicleButton = ({ type, icon, label }) => (
    <div onClick={() => setTransportMode(type)} style={{ flex: 1, padding: '14px 8px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', background: transportMode === type ? 'rgba(0, 200, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)', border: `1px solid ${transportMode === type ? 'var(--primary)' : 'var(--glass-border)'}`, color: transportMode === type ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s ease-in-out' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2>Good evening, User 👋</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="status-dot status-safe"></span><span style={{ fontWeight: 600 }}>You're Safe</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid mb-4">
        <div className="glass-card stat-card"><span className="stat-label">Current Safety</span><span className="stat-value" style={{ color: 'var(--safe)' }}>You're Safe</span></div>
        <div className="glass-card stat-card"><span className="stat-label">Active Journey</span><span className="stat-value" style={{ fontSize: '1.2rem' }}>None</span></div>
        <div className="glass-card stat-card"><span className="stat-label">Distance</span><span className="stat-value">0.00 km</span></div>
        <div className="glass-card stat-card"><span className="stat-label">ETA</span><span className="stat-value">—</span></div>
        <div className="glass-card stat-card"><span className="stat-label">Speed</span><span className="stat-value">0 km/h</span></div>
        <div className="glass-card stat-card"><span className="stat-label">Last Updated</span><span className="stat-value" style={{ fontSize: '1.2rem' }}>—</span></div>
        <div className="glass-card stat-card" style={{ gridColumn: 'span 2' }}><span className="stat-label">Parent</span><span className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--safe)' }}>🟢 Connected</span></div>
      </div>

      <div className="glass-card mb-4" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Start a Journey</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>FROM (your current location)</label>
            <input className="form-input" style={{ margin: 0 }} readOnly value={`📍 ${startName}`} />
          </div>
          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>TO (Search or tap map)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" style={{ margin: 0, flex: 1, borderColor: destination ? 'var(--safe)' : 'var(--glass-border)' }} placeholder="🏠 Enter destination address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <button className="btn btn-primary" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} style={{ padding: '0 20px', borderRadius: '16px' }}>
                {searchLoading ? "🔍..." : "🔍 Search"}
              </button>
            </div>
            {destination && <div style={{ fontSize: '0.75rem', color: 'var(--safe)', marginTop: '6px', paddingLeft: '4px' }}>✓ Selected: {destination.name}</div>}
          </div>
        </div>

        <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>TRANSPORT MODE</label>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <VehicleButton type="bike" icon="🏍️" label="Bike" />
          <VehicleButton type="car" icon="🚗" label="Car" />
          <VehicleButton type="bus" icon="🚌" label="Bus" />
          <VehicleButton type="walk" icon="🚶" label="Walk" />
        </div>
        
        <button className="btn btn-primary" onClick={startJourney} disabled={loading || !currentLocation || !destination || !transportMode} style={{ width: '100%', padding: '16px', opacity: (!currentLocation || !destination || !transportMode) ? 0.5 : 1 }}>
          {loading ? "STARTING..." : "🚀 START JOURNEY"}
        </button>
      </div>

      <div id="dashboard-map-container" className="glass-card mb-4" style={{ padding: 0, overflow: 'hidden', height: '400px' }}>
        {currentLocation ? (
          <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
            <Marker position={[currentLocation.lat, currentLocation.lng]} />
            <MapClickHandler setDestination={setDestination} setSearchQuery={setSearchQuery} />
            <MapUpdater destination={destination} />
            {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
          </MapContainer>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading Map...</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;