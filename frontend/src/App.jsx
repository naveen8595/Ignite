import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import LiveMap from './components/LiveMap';
import ParentDashboard from './components/ParentDashboard';
import { Shield, LayoutDashboard, MapPin, ShieldAlert, History, Bell, Settings, LogOut, ArrowLeft } from 'lucide-react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');
  const [journeyId, setJourneyId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [transportMode, setTransportMode] = useState('bike');
  const [destination, setDestination] = useState(null); 
  const [startLocationName, setStartLocationName] = useState('Current Location');

  // Receives the full destination object {lat, lng, name}
  const handleStartJourney = (id, mode, destObj, startName) => {
    setJourneyId(id);
    setTransportMode(mode);
    setDestination(destObj); 
    if (startName) setStartLocationName(startName);
    setCurrentView('live');
  };

  if (currentView === 'landing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <h1 className="landing-title">WALK WITH ME</h1>
        <p className="text-secondary mb-4" style={{ fontSize: '1.2rem' }}>Your AI-powered safety companion.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '300px' }}>
          <button className="btn btn-primary" style={{ padding: '16px' }} onClick={() => { setAuthMode('login'); setCurrentView('auth'); }}>GET STARTED</button>
          <button className="btn" style={{ padding: '16px' }} onClick={() => { setAuthMode('parent'); setCurrentView('auth'); }}>PARENT LOGIN</button>
        </div>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '32px 24px' }}>
          <div className="flex items-center gap-2 mb-4">
            <button className="btn" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setCurrentView('landing')}><ArrowLeft size={20}/></button>
            <h2 style={{ margin: 0 }}>{authMode === 'signup' ? 'Create Account' : authMode === 'parent' ? 'Parent Login' : 'User Login'}</h2>
          </div>
          <div className="auth-tabs">
            <div className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Login</div>
            <div className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => setAuthMode('signup')}>Sign Up</div>
            <div className={`auth-tab ${authMode === 'parent' ? 'active' : ''}`} onClick={() => setAuthMode('parent')}>Parent</div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setCurrentView(authMode === 'parent' ? 'parent' : 'dashboard'); }}>
            {authMode === 'signup' && (
              <>
                <label className="text-secondary" style={{ fontSize: '0.85rem' }}>Full Name</label>
                <input className="form-input" placeholder="Naveen Kumar" required />
              </>
            )}
            <label className="text-secondary" style={{ fontSize: '0.85rem' }}>{authMode === 'parent' ? 'Parent Email / Phone' : 'Email'}</label>
            <input className="form-input" type="text" placeholder="you@example.com" required />
            <label className="text-secondary" style={{ fontSize: '0.85rem' }}>Password</label>
            <input className="form-input" type="password" placeholder="••••••••" required />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', marginTop: '16px' }}>
              {authMode === 'signup' ? 'Create Account' : authMode === 'parent' ? 'Parent Login' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', paddingLeft: '12px' }}>
          <Shield /> Walk with Me
        </div>
        <div className="text-xs text-secondary mt-2 mb-2 pl-2">USER APP</div>
        <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}><LayoutDashboard size={20}/> Dashboard</div>
        <div className={`nav-item ${currentView === 'live' ? 'active' : ''}`} onClick={() => setCurrentView('live')}><MapPin size={20}/> Live Journey</div>
        <div className="nav-item"><ShieldAlert size={20}/> Nearby Police</div>
        <div className="nav-item"><History size={20}/> History</div>
        <div className="nav-item"><Bell size={20}/> Notifications</div>
        <div className="nav-item"><Settings size={20}/> Settings</div>
        
        <div className="text-xs text-secondary mt-4 mb-2 pl-2">PARENT APP</div>
        <div className={`nav-item ${currentView === 'parent' ? 'active' : ''}`} onClick={() => setCurrentView('parent')}><ShieldAlert size={20}/> Parent Monitor</div>
        <div style={{ flex: 1 }}></div>
        <div className="nav-item" onClick={() => setCurrentView('landing')}><LogOut size={20}/> Logout</div>
      </aside>

      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard onStartJourney={handleStartJourney} currentLocation={currentLocation} setCurrentLocation={setCurrentLocation} />}
        {currentView === 'live' && <LiveMap journeyId={journeyId} currentLocation={currentLocation} setCurrentLocation={setCurrentLocation} transportMode={transportMode} destination={destination} startLocationName={startLocationName} />}
        {currentView === 'parent' && <ParentDashboard />}
      </main>
    </div>
  );
}

export default App;