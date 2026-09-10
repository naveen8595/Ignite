import React, { useState, useEffect } from 'react';

const SafetyModal = ({ onSafe, onTrouble }) => {
  // 120 seconds = 2 minutes total countdown before automated emergency trigger
  const [timeLeft, setTimeLeft] = useState(120);

  // Web Audio API Alarm Generator (Plays a high-pitch pulsing siren tone natively for 10 seconds)
  useEffect(() => {
    let audioCtx = null;
    let alarmInterval = null;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeep = () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch alert
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      };

      playBeep();
      // Repeat the alarm sound every 400ms for a total duration of 10 seconds (25 pulses)
      let count = 0;
      alarmInterval = setInterval(() => {
        count++;
        if (count < 25) {
          playBeep();
        } else {
          clearInterval(alarmInterval);
        }
      }, 400);

    } catch (e) {
      console.log("AudioContext blocked or not supported by browser", e);
    }

    // Cleanup audio context on unmount
    return () => {
      if (alarmInterval) clearInterval(alarmInterval);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, []);

  // Verification timer logic & 30-second interval reminder notifications
  useEffect(() => {
    if (timeLeft <= 0) {
      onTrouble(); // Triggers automated parent WhatsApp dispatch & phone call
      return;
    }

    // Re-send verification notifications/reminders every 30 seconds (at 90s and 60s remaining)
    if (timeLeft === 90 || timeLeft === 60) {
      if (window.Notification && Notification.permission === "granted") {
        new Notification("🚨 SAFETY VERIFICATION PING", { 
          body: "No response detected. Automatic parent emergency call and WhatsApp dispatch pending." 
        });
      } else {
        alert("🚨 SAFETY VERIFICATION PING: Please confirm if you are safe! Emergency action pending.");
      }
    }

    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTrouble]);

  // Request browser notification permissions on mount
  useEffect(() => {
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ border: '2px solid var(--danger)', padding: '32px', textAlign: 'center', maxWidth: '420px', width: '90%' }}>
        
        {/* Red pulsing countdown timer ring */}
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, margin: '0 auto 20px', color: '#ff8a8a', background: 'rgba(239, 68, 68, 0.15)' }}>
          {formatTime(timeLeft)}
        </div>
        
        <h2 style={{ color: '#fff', marginBottom: '12px' }}>🚨 ARE YOU SAFE?</h2>
        <p className="text-secondary mb-4">
          Prolonged inactivity detected (0 km/h). Alarm active for 10s. Notifications will re-ping every 30s. If you do not respond before the countdown hits zero, automated emergency WhatsApp alerts and phone calls will be triggered to your parent contacts.
        </p>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-safe" 
            onClick={onSafe} 
            style={{ padding: '16px', flex: 1, fontSize: '1rem', background: 'var(--safe)', color: '#000', fontWeight: 700 }}
          >
            🟢 I'M SAFE
          </button>
          
          <button 
            className="btn btn-danger" 
            onClick={onTrouble} 
            style={{ padding: '16px', flex: 1, fontSize: '1rem', background: 'var(--danger)', color: '#fff', fontWeight: 700 }}
          >
            🔴 I'M IN TROUBLE
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default SafetyModal;