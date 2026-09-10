import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SafetyModal from './SafetyModal';
import { ArrowLeft } from 'lucide-react';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom icon for the destination marker (Green)
const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const LiveMap = ({ journeyId, currentLocation, setCurrentLocation, transportMode, destination, startLocationName }) => {
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [vehicle, setVehicle] = useState(transportMode || 'bike'); 
  const [routeLine, setRouteLine] = useState([]);
  const [zeroSpeedSeconds, setZeroSpeedSeconds] = useState(0);
  
  // Dynamic Route Stats
  const [routeStats, setRouteStats] = useState({ distance: "0.0 km", eta: "0 min" });

  const PARENT_PHONE = "919876543210"; 

  // 30-Second Inactivity Timer Loop (Triggers verification modal when speed = 0 for 30s)
  useEffect(() => {
    if (showSafetyCheck) return;

    const timer = setInterval(() => {
      const currentSpeed = 0; // Mocked speed=0 for demonstration of verification flow
      if (currentSpeed === 0) {
        setZeroSpeedSeconds(prev => {
          const newTime = prev + 1;
          if (newTime >= 30) {
            setShowSafetyCheck(true); // Triggers SafetyModal & 10s alarm
            return 0;
          }
          return newTime;
        });
      } else {
        setZeroSpeedSeconds(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [showSafetyCheck]);

  // Fetch real route geometry from OSRM and compute unique ETA per transport mode
  useEffect(() => {
    if (!currentLocation || !destination) return;

    let osrmProfile = 'driving';
    if (vehicle === 'bike') osrmProfile = 'bike';
    if (vehicle === 'walk') osrmProfile = 'foot';
    if (vehicle === 'bus') osrmProfile = 'driving';

    axios.get(`https://router.project-osrm.org/route/v1/${osrmProfile}/${currentLocation.lng},${currentLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`)
      .then(res => {
        if (res.data.routes && res.data.routes.length > 0) {
          const route = res.data.routes[0];
          const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteLine(coords);

          let distKm = route.distance / 1000;
          let durationSec = route.duration;

          if (vehicle === 'walk') {
            durationSec = (distKm / 4.5) * 3600; 
          } else if (vehicle === 'bike') {
            durationSec = (distKm / 18) * 3600;  
          } else if (vehicle === 'bus') {
            durationSec = (distKm / 24) * 3600;  
          } else if (vehicle === 'car') {
            durationSec = (distKm / 35) * 3600;  
          }

          const etaMin = Math.max(1, Math.round(durationSec / 60));
          setRouteStats({ distance: `${distKm.toFixed(1)} km`, eta: `${etaMin} min` });
        }
      }).catch(err => console.error("OSRM Error", err));
  }, [currentLocation, destination, vehicle]);

  useEffect(() => {
    if (!journeyId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(newPos);

        try {
          await axios.post('http://127.0.0.1:8000/api/journey/update', {
            journey_id: journeyId,
            lat: newPos.lat,
            lng: newPos.lng,
            speed: pos.coords.speed || 0 
          });
        } catch (err) {
          console.error("Failed to sync location", err);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [journeyId]);

  // Automated Parent Escalation Sequence (Triggered if timer expires or panic button is clicked)
  const triggerSOS = async () => {
    setShowSafetyCheck(false);
    
    try { 
      await axios.post('http://127.0.0.1:8000/api/sos', { journey_id: journeyId }); 
    } catch(e) {}

    const message = `🚨 AUTOMATED EMERGENCY ALERT! 🚨\nNaveen did not respond to safety verification checks after prolonged inactivity (0 km/h).\nLive Location: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
    
    // Automatically dispatch WhatsApp notification with coordinates
    window.open(`https://wa.me/${PARENT_PHONE}?text=${encodeURIComponent(message)}`, '_blank');

    // Automatically initiate telephone call to parent contact
    window.location.href = `tel:+${PARENT_PHONE}`;
  };

  // Reset verification cycle when user confirms safety
  const handleSafe = () => {
    setShowSafetyCheck(false);
    setZeroSpeedSeconds(0); 
  };

  const VehicleButton = ({ type, icon, label }) => (
    <div 
      onClick={() => setVehicle(type)}
      style={{
        flex: 1, padding: '12px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center',
        background: vehicle === type ? 'rgba(0, 200, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${vehicle === type ? 'var(--primary)' : 'var(--glass-border)'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        color: vehicle === type ? 'var(--primary)' : 'var(--text-secondary)',
        fontSize: '0.8rem',
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: '1.4rem', display: 'block' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', margin: '-36px -44px -60px -44px', background: '#0a0f18' }}>
      
      <div style={{ padding: '16px 20px', background: 'rgba(10, 15, 25, 0.95)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="btn" style={{ padding: '10px', borderRadius: '50%' }}><ArrowLeft size={20}/></div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Navigating</div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {startLocationName || "Current Location"} → {destination?.name || "Destination"}
          </div>
        </div>
        <div className="status-dot status-safe pulse-safe"></div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {currentLocation && destination ? (
          <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={13} style={{ height: '100%', width: '100%', background: '#0a0f18' }}>
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
            <Marker position={[currentLocation.lat, currentLocation.lng]}><Popup>You are here</Popup></Marker>
            <Marker position={[destination.lat, destination.lng]} icon={destIcon}><Popup>Destination</Popup></Marker>
            {routeLine.length > 0 ? <Polyline positions={routeLine} color="#0077ff" weight={6} opacity={0.85} /> : null}
          </MapContainer>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading Map...</div>
        )}
      </div>

      <div style={{ background: 'rgba(10, 15, 25, 0.95)', borderTop: '1px solid var(--glass-border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>
               {routeStats.distance}
             </h1>
             <div style={{ fontSize: '0.85rem', fontWeight: 600, color: zeroSpeedSeconds > 20 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                Speed 0 km/h: {zeroSpeedSeconds}s / 30s
             </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ETA</div><div style={{ fontWeight: 600 }}>{routeStats.eta}</div></div>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remaining</div><div style={{ fontWeight: 600 }}>{routeStats.distance}</div></div>
          </div>
        </div>

        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: '20%', height: '100%', background: 'linear-gradient(90deg, #00c8ff, #0077ff)', borderRadius: '6px' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <VehicleButton type="bike" icon="🏍️" label="Bike" />
          <VehicleButton type="car" icon="🚗" label="Car" />
          <VehicleButton type="bus" icon="🚌" label="Bus" />
          <VehicleButton type="walk" icon="🚶" label="Walk" />
        </div>

        <button onClick={triggerSOS} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ff8a8a', padding: '16px', borderRadius: '40px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
          🆘 SOS — Emergency
        </button>

      </div>

      {showSafetyCheck && (
        <SafetyModal onSafe={handleSafe} onTrouble={triggerSOS} />
      )}
    </div>
  );
};

export default LiveMap;