import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppScreen, AirQualityData, WalkSession, Settings, AqiGridPoint } from './types';
import { supabase } from './lib/supabase';
import { fetchAirQuality } from './lib/api';
import AirQualityCard from './components/AirQualityCard';
import AuthScreen from './components/AuthScreen';
import LiveMap from './components/LiveMap';
import WalkTracker from './components/WalkTracker';
import WalkSummary from './components/WalkSummary';
import SettingsPanel from './components/SettingsPanel';
import BottomNav from './components/BottomNav';
import './index.css';

const DEFAULT_SETTINGS: Settings = { aqiUnit: 'us' };
const WALK_HISTORY_KEY = 'urbanbreath_walk_history';

/* ── Auth gate wrapper ───────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session ?? null))
      .catch(() => setSession(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <AuthScreen />;
  return <AppContent />;
}

/* ── Main app (authenticated) ───────────────────────────────── */
function AppContent() {
  const [screen, setScreen]               = useState<AppScreen>('map');
  const [userLat, setUserLat]             = useState(0);
  const [userLon, setUserLon]             = useState(0);
  const [locationError, setLocationError] = useState(() => (
    navigator.geolocation ? '' : 'Geolocation not supported.'
  ));
  const [airQuality, setAirQuality]       = useState<AirQualityData | null>(null);
  const [aqLoading, setAqLoading]         = useState(false);
  const [aqiGrid, setAqiGrid]             = useState<AqiGridPoint[]>([]);
  const [activeSession, setActiveSession] = useState<WalkSession | null>(null);
  const [walkHistory, setWalkHistory]     = useState<WalkSession[]>(() => {
    const raw = localStorage.getItem(WALK_HISTORY_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [completedSession, setCompletedSession] = useState<WalkSession | null>(() => walkHistory[0] ?? null);
  const [settings, setSettings]           = useState<Settings>(() => {
    const s = localStorage.getItem('urbanbreath_settings');
    if (!s) return DEFAULT_SETTINGS;
    try { return JSON.parse(s); } catch { return DEFAULT_SETTINGS; }
  });

  const aqPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function saveSettings(s: Settings) {
    setSettings(s);
    localStorage.setItem('urbanbreath_settings', JSON.stringify(s));
  }

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); setLocationError(''); },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // AQI at user position (map screen, every 2 min)
  const fetchAq = useCallback(async () => {
    if (!userLat || !userLon) return;
    setAqLoading(true);
    try {
      const data = await fetchAirQuality(userLat, userLon);
      setAirQuality(data);
    } finally {
      setAqLoading(false);
    }
  }, [userLat, userLon]);

  useEffect(() => {
    let firstFetch: ReturnType<typeof setTimeout> | null = null;
    if (screen === 'map' && userLat && userLon) {
      firstFetch = setTimeout(fetchAq, 0);
      aqPollRef.current = setInterval(fetchAq, 120000);
    }
    return () => {
      if (firstFetch) clearTimeout(firstFetch);
      if (aqPollRef.current) clearInterval(aqPollRef.current);
    };
  }, [screen, userLat, userLon, fetchAq]);

  function handleWalkEnd(session: WalkSession) {
    const nextHistory = [session, ...walkHistory.filter((walk) => walk.id !== session.id)].slice(0, 20);
    setWalkHistory(nextHistory);
    localStorage.setItem(WALK_HISTORY_KEY, JSON.stringify(nextHistory));
    setCompletedSession(session);
    setScreen('summary');
  }

  const isWalking = !!activeSession;
  const summarySession = completedSession ?? walkHistory[0] ?? null;

  return (
    <div style={{ position: 'relative', height: '100dvh', background: 'var(--bg-void)', overflow: 'hidden' }}>

      {/* ── Map layer (always mounted so every screen can sit over it) ── */}
      <div
        style={{
          position: 'absolute', inset: 0,
        }}
      >
        <LiveMap
          userLat={userLat}
          userLon={userLon}
          airQuality={airQuality}
          walkPoints={activeSession?.points ?? []}
          aqiGrid={aqiGrid}
          onAqiGridChange={setAqiGrid}
        />

        {/* ── Floating top bar ── */}
        <div className="map-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(20,184,166,0.4)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#020c1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              UrbanBreath
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {locationError && (
              <span className="status-pill status-pill--warn">No GPS</span>
            )}
            {isWalking && (
              <span className="status-pill status-pill--live">
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                Tracking
              </span>
            )}
            {airQuality && !airQuality.isFallback && (
              <span className="status-pill status-pill--teal">Live</span>
            )}
            {airQuality?.isFallback && (
              <span className="status-pill status-pill--demo">Demo</span>
            )}
          </div>
        </div>

        {/* ── AQI card overlay ── */}
        {screen === 'map' && (
          <div style={{ position: 'absolute', bottom: 'var(--nav-reserve)', left: 0, right: 0, padding: '0 14px', zIndex: 900 }}>
            <AirQualityCard data={airQuality} loading={aqLoading && !airQuality} />
          </div>
        )}

        {/* ── Walk overlay ── */}
        {screen === 'walk' && (
          <div className="walk-overlay">
            <WalkTracker
              userLat={userLat}
              userLon={userLon}
              onSessionUpdate={setActiveSession}
              onWalkEnd={handleWalkEnd}
            />
          </div>
        )}

        {/* ── Walk summary overlay ── */}
        {screen === 'summary' && (
          <div className="walk-overlay screen-overlay">
            {summarySession ? (
              <WalkSummary
                session={summarySession}
                history={walkHistory}
                onClose={() => { setCompletedSession(null); setScreen('map'); }}
              />
            ) : (
              <div className="screen-empty">
                <div className="summary-empty-copy">
                  <h2>Ready for your first clean-air walk?</h2>
                  <p>Start tracking now and this screen will turn into your exposure dashboard.</p>
                </div>
                <button className="summary-empty-cta scale-press" onClick={() => setScreen('walk')}>
                  Start a walk
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Settings overlay ── */}
        {screen === 'settings' && (
          <div className="walk-overlay screen-overlay">
            <SettingsPanel settings={settings} onChange={saveSettings} />
          </div>
        )}
      </div>

      <BottomNav current={screen} onChange={setScreen} isWalking={isWalking} />
    </div>
  );
}
