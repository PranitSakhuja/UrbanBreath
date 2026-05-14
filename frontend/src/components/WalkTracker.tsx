import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  Bike,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  PersonStanding,
  Play,
  Route,
  Square,
  Timer,
  Wind,
  Zap,
  TrendingUp,
} from 'lucide-react';
import type { WalkPoint, WalkSession, ActivityPreset } from '../types';
import { fetchAirQuality } from '../lib/api';
import { calcBreathLoad, liveBreathLoad, storeCrowdPoint } from '../lib/exposure';
import { totalDistanceKm } from '../lib/geo';
import { aqiColor } from '../lib/aqi';
import { ACTIVITIES, DEFAULT_ACTIVITY } from '../lib/activities';

interface Props {
  userLat: number;
  userLon: number;
  onSessionUpdate: (session: WalkSession | null) => void;
  onWalkEnd: (session: WalkSession) => void;
}

export default function WalkTracker({ userLat, userLon, onSessionUpdate, onWalkEnd }: Props) {
  const [activity, setActivity]   = useState<ActivityPreset>(DEFAULT_ACTIVITY);
  const [isWalking, setIsWalking] = useState(false);
  const [session, setSession]     = useState<WalkSession | null>(null);
  const [status, setStatus]       = useState('');
  const [now, setNow]             = useState(() => Date.now());

  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef    = useRef<WalkSession | null>(null);
  const onUpdateRef   = useRef(onSessionUpdate);
  const coordsRef     = useRef({ lat: userLat, lon: userLon });
  const activityRef   = useRef(activity);

  useEffect(() => {
    onUpdateRef.current = onSessionUpdate;
  }, [onSessionUpdate]);

  useEffect(() => {
    coordsRef.current = { lat: userLat, lon: userLon };
  }, [userLat, userLon]);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  function startWalk() {
    const s: WalkSession = { id: Date.now().toString(), startTime: Date.now(), points: [], activity };
    sessionRef.current = s;
    setSession(s);
    setIsWalking(true);
    onUpdateRef.current(s);
    setStatus('Fetching first reading…');
  }

  function stopWalk() {
    const cur = sessionRef.current;
    if (!cur) return;
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    const endTime    = Date.now();
    const breathLoad = calcBreathLoad(cur.points, activityRef.current, endTime, cur.startTime);
    const completed  = { ...cur, endTime, breathLoad };
    sessionRef.current = null;
    setIsWalking(false);
    setSession(null);
    onUpdateRef.current(null);
    onWalkEnd(completed);
  }

  useEffect(() => {
    if (!isWalking) return;
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isWalking]);

  useEffect(() => {
    if (!isWalking) return;
    async function poll() {
      const { lat, lon } = coordsRef.current;
      if (!lat || !lon) { setStatus('Waiting for GPS…'); return; }
      setStatus('Updating…');
      try {
        const aq = await fetchAirQuality(lat, lon);
        const pt: WalkPoint = { lat, lon, timestamp: Date.now(), aqi: aq.aqi, pm25: aq.pm25, color: aq.color };
        storeCrowdPoint({ lat, lon, aqi: aq.aqi });
        setSession(prev => {
          if (!prev) return prev;
          const updated: WalkSession = { ...prev, points: [...prev.points, pt] };
          sessionRef.current = updated;
          onUpdateRef.current(updated);
          return updated;
        });
        setStatus(`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · AQI ${Math.round(aq.aqi)}${aq.isFallback ? ' (demo)' : ''}`);
      } catch {
        setStatus('AQ fetch failed — retrying…');
      }
    }
    poll();
    pollRef.current = setInterval(poll, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isWalking]);

  const pts        = session?.points ?? [];
  const elapsedMs  = session ? now - session.startTime : 0;
  const elapsedMin = elapsedMs / 60000;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const distKm     = totalDistanceKm(pts);
  const avgAqi     = pts.length ? pts.reduce((s, p) => s + p.aqi,  0) / pts.length : 0;
  const avgPm25    = pts.length ? pts.reduce((s, p) => s + p.pm25, 0) / pts.length : 0;
  const cur        = pts.length ? pts[pts.length - 1] : null;
  const worstAqi   = pts.length ? Math.max(...pts.map(p => p.aqi)) : 0;
  const { airInhaledM3, pm25InhaledUg } = liveBreathLoad(pts, elapsedMin, activity.breathingRateLPerMin);
  const qualityColor = cur ? cur.color : aqiColor(avgAqi || 0);

  return (
    <div className="walk-panel slide-up">

      {/* ── Header ── */}
      <div className="walk-hero">
        <div className="walk-hero__title">
          <div className="walk-hero__icon">
            <ActivityIcon id={activity.id} size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>Walk</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
              {isWalking ? 'Live exposure tracking' : 'Choose pace and start clean-air tracking'}
            </p>
          </div>
        </div>
        {isWalking && (
          <div className="walk-live-pill">
            <span className="pulse-dot" />
            Live
          </div>
        )}
      </div>

      {/* ── Activity selector ── */}
      <div className="walk-section">
        <div className="walk-section__label" style={{ fontSize: 12, letterSpacing: '0.06em' }}>Activity</div>
        <div className="activity-grid">
          {ACTIVITIES.map(a => {
            const sel = activity.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => { if (!isWalking) setActivity(a); }}
                disabled={isWalking}
                className={`activity-chip scale-press ${sel ? 'activity-chip--active' : ''}`}
                style={{ minHeight: 90 }}
              >
                <ActivityIcon id={a.id} size={22} />
                <span style={{ fontSize: 13 }}>{a.label}</span>
                <small style={{ fontSize: 11 }}>{a.breathingRateLPerMin} L/min</small>
              </button>
            );
          })}
        </div>
      </div>

      {isWalking && session ? (
        <>
          {/* ── Live overview ── */}
          <div className="walk-live-card" style={{ ['--quality' as string]: qualityColor }}>
            <div>
              <div className="metric-label" style={{ fontSize: 12, letterSpacing: '0.06em' }}><Timer size={14} /> Time</div>
              <div className="walk-time mono" style={{ fontSize: 'clamp(48px, 13vw, 76px)' }}>{formatElapsed(elapsedSec)}</div>
              <div className="walk-subline" style={{ fontSize: 13 }}>{status || 'Collecting first AQI sample'}</div>
            </div>
            <div className="walk-aqi-orb">
              <span style={{ fontSize: 12 }}>Current AQI</span>
              <strong className="mono" style={{ fontSize: 46 }}>{cur ? Math.round(cur.aqi) : '...'}</strong>
              {cur && <AqiBadge aqi={cur.aqi} />}
            </div>
          </div>

          <div className="walk-metric-grid">
            <MetricTile icon={<Footprints size={15} />} label="Distance" value={distKm >= 1 ? distKm.toFixed(2) : (distKm * 1000).toFixed(0)} unit={distKm >= 1 ? 'km' : 'm'} accent="#8b5cf6" />
            <MetricTile icon={<Gauge size={15} />} label="Avg AQI" value={pts.length ? Math.round(avgAqi).toString() : '...'} unit={`${pts.length} reads`} accent={aqiColor(avgAqi || 0)} />
            <MetricTile icon={<Wind size={15} />} label="PM2.5" value={pts.length ? avgPm25.toFixed(1) : '...'} unit="ug/m3 avg" accent="#f97316" />
            <MetricTile icon={<Flame size={15} />} label="Inhaled" value={pm25InhaledUg.toFixed(2)} unit="ug est." accent="#fb7185" />
          </div>

          {/* ── Breath Load (hero) ── */}
          <div className="walk-section walk-section--split">
            <div>
              <div className="walk-section__label" style={{ fontSize: 12, letterSpacing: '0.06em' }}><HeartPulse size={14} /> Breath load</div>
              <p className="walk-copy" style={{ fontSize: 14 }}>
                {activity.label} pace at {activity.breathingRateLPerMin} L/min. Worst AQI so far is <strong style={{ color: aqiColor(worstAqi) }}>{pts.length ? Math.round(worstAqi) : '...'}</strong>.
              </p>
            </div>
            <PollutantStat label="Air Inhaled" value={airInhaledM3.toFixed(3)} unit="m3" color="var(--text-1)" />
          </div>

          {/* ── AQI mini sparkline ── */}
          {pts.length > 2 && (
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>
                  <TrendingUp size={14} color="var(--teal)" /> AQI Over Walk
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{pts.length} readings</span>
              </div>
              <WalkSparkline pts={pts} />
            </div>
          )}

          {/* ── Live status ── */}
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={12} color="var(--text-3)" />
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{status}</p>
            </div>
          )}

          {/* ── Stop button ── */}
          <button
            onClick={stopWalk}
            className="walk-action walk-action--stop scale-press"
            style={{ fontSize: 18, minHeight: 62 }}
          >
            <Square size={18} fill="currentColor" /> Stop & See Summary
          </button>
        </>
      ) : (
        <>
          {/* ── Pre-walk idle card ── */}
          <div className="walk-ready-card">
            <div className="walk-ready-card__icon">
              <ActivityIcon id={activity.id} size={34} />
            </div>
            <div>
              <p style={{ fontSize: 15 }}>{activity.label} mode</p>
              <strong style={{ fontSize: 16 }}>{activity.breathingRateLPerMin} L/min</strong>
              <span style={{ fontSize: 13 }}>GPS and AQI sampled every 8 seconds</span>
            </div>
          </div>

          <button
            onClick={startWalk}
            className="walk-action walk-action--start scale-press"
            style={{ fontSize: 18, minHeight: 62 }}
          >
            <Play size={19} fill="currentColor" /> Start Walk
          </button>

          <p className="walk-fineprint" style={{ fontSize: 13 }}>
            Estimates based on modelled air-quality data & typical breathing rates.
            Not a medical device.
          </p>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function PollutantStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '12px 14px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p className="mono" style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{unit}</p>
    </div>
  );
}

function MetricTile({ icon, label, value, unit, accent }: { icon: ReactNode; label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="metric-tile" style={{ ['--accent' as string]: accent }}>
      <div className="metric-label" style={{ fontSize: 12, letterSpacing: '0.06em' }}>{icon}{label}</div>
      <div>
        <strong className="mono" style={{ fontSize: 'clamp(22px, 6vw, 28px)' }}>{value}</strong>
        <span style={{ fontSize: 12 }}>{unit}</span>
      </div>
    </div>
  );
}

function ActivityIcon({ id, size = 20 }: { id: string; size?: number }) {
  const props = { size, strokeWidth: 2 } as const;
  if (id === 'rest') return <PersonStanding {...props} />;
  if (id === 'walk') return <Footprints {...props} />;
  if (id === 'brisk') return <Route {...props} />;
  if (id === 'jog') return <Gauge {...props} />;
  if (id === 'run') return <Zap {...props} />;
  if (id === 'cycling') return <Bike {...props} />;
  return <Activity {...props} />;
}

function AqiBadge({ aqi }: { aqi: number }) {
  const label = aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Sensitive' : aqi <= 200 ? 'Unhealthy' : 'Danger';
  const color = aqiColor(aqi);
  return (
    <span style={{
      display: 'inline-block', marginTop: 6, fontSize: 12, padding: '4px 12px', borderRadius: 20,
      background: `${color}18`, border: `1px solid ${color}33`, color,
    }}>
      {label}
    </span>
  );
}

function WalkSparkline({ pts }: { pts: WalkPoint[] }) {
  const slice = pts.slice(-60);
  if (slice.length < 2) return null;
  const max   = Math.max(...slice.map(p => p.aqi), 1);
  const W = 200, H = 40;
  const coords = slice.map((p, i) => {
    const x = (i / (slice.length - 1)) * W;
    const y = H - 4 - ((p.aqi / max) * (H - 8));
    return [x, y] as [number, number];
  });
  const linePts  = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const fillPts  = [...coords.map(([x, y]) => `${x},${y}`), `${W},${H}`, `0,${H}`].join(' ');
  const lastPt   = coords[coords.length - 1];
  const lastColor = slice[slice.length - 1].color;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="wsg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lastColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lastColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#wsg)" />
      <polyline points={linePts} fill="none" stroke={lastColor} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={lastColor} />
    </svg>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
