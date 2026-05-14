import { ArrowLeft, CalendarDays, Flame, Footprints, Gauge, Leaf, MapPin, Route, TrendingUp, Wind } from 'lucide-react';
import type { WalkSession } from '../types';
import { aqiColor, aqiGuidance } from '../lib/aqi';

interface Props {
  session: WalkSession;
  history: WalkSession[];
  onClose: () => void;
}

export default function WalkSummary({ session, history, onClose }: Props) {
  const bl = session.breathLoad;
  if (!bl) return null;

  const totalMin = bl.durationMin;
  const dur = `${Math.floor(totalMin)}m ${Math.round((totalMin % 1) * 60)}s`;
  const aqi = Math.round(bl.avgAqi);
  const aColor = aqiColor(aqi);
  const completedWalks = history.filter((walk) => walk.breathLoad);
  const bestWalk = completedWalks.reduce<WalkSession | null>((best, walk) => {
    if (!walk.breathLoad) return best;
    if (!best?.breathLoad) return walk;
    return walk.breathLoad.pm25InhaledUg < best.breathLoad.pm25InhaledUg ? walk : best;
  }, null);
  const totalDistance = completedWalks.reduce((sum, walk) => sum + (walk.breathLoad?.distanceKm ?? 0), 0);
  const totalPm25 = completedWalks.reduce((sum, walk) => sum + (walk.breathLoad?.pm25InhaledUg ?? 0), 0);

  return (
    <div className="screen-shell fade-in">
      {/* Header */}
      <div className="screen-titlebar">
        <div>
          <h2>Walk Summary</h2>
          <p>{completedWalks.length} saved walk{completedWalks.length === 1 ? '' : 's'} · detailed exposure analytics.</p>
        </div>
        <button onClick={onClose} className="floating-control scale-press" style={{ padding: '8px 14px', fontSize: 13 }}>
          <ArrowLeft size={13} /> Clear
        </button>
      </div>

      {/* Hero — PM2.5 Breath Load */}
      <div className="summary-hero glass-teal" style={{ ['--summary-accent' as string]: '#f97316' }}>
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="panel-title summary-hero__label">
          <Flame size={16} />
          <span>Estimated PM2.5 Breath Load</span>
        </div>
        <p className="summary-hero__value mono">
          {bl.pm25InhaledUg.toFixed(2)}
        </p>
        <p className="summary-hero__sub">micrograms of PM2.5 inhaled</p>
        <p className="summary-hero__meta">
          {bl.activity.icon} {bl.activity.label} · {bl.activity.breathingRateLPerMin} L/min
        </p>
      </div>

      <div className="summary-kpi-strip">
        <MiniKpi icon={<Route size={14} />} label="All walks" value={completedWalks.length.toString()} unit="saved" color="var(--teal-bright)" />
        <MiniKpi icon={<Footprints size={14} />} label="Distance" value={totalDistance.toFixed(2)} unit="km total" color="#38bdf8" />
        <MiniKpi icon={<Flame size={14} />} label="PM2.5" value={totalPm25.toFixed(2)} unit="ug total" color="#f97316" />
        <MiniKpi icon={<Leaf size={14} />} label="Best" value={bestWalk?.breathLoad?.pm25InhaledUg.toFixed(2) ?? '...'} unit="ug lowest" color="#34d399" />
      </div>

      {/* Stats grid */}
      <div className="summary-stat-grid">
        {[
          { label: 'Duration',    value: dur,                              color: 'var(--text-1)' },
          { label: 'Distance',    value: `${bl.distanceKm.toFixed(2)} km`, color: 'var(--text-1)' },
          { label: 'Avg AQI',     value: aqi.toString(),                   color: aColor },
          { label: 'Avg PM2.5',   value: `${bl.avgPm25.toFixed(1)}`,       color: '#f97316', unit: 'µg/m³' },
          { label: 'Air Inhaled', value: `${bl.airInhaledM3.toFixed(3)}`,  color: 'var(--text-2)', unit: 'm³' },
          { label: 'Clean Bonus', value: `${bl.cleanSavingsPct.toFixed(0)}%`, color: '#34d399', note: 'vs worst zone' },
        ].map(({ label, value, color, unit, note }) => (
          <div key={label} className="summary-stat map-panel">
            <p>{label}</p>
            <strong className="mono" style={{ color }}>
              {value}
              {unit && <span>{unit}</span>}
            </strong>
            {note && <em>{note}</em>}
          </div>
        ))}
      </div>

      <div className="summary-graph-grid">
        <div className="map-panel summary-chart-card">
          <div className="summary-chart-card__head">
            <div className="panel-title"><TrendingUp size={14} color="var(--teal)" /> AQI Route Trace</div>
            <span>{session.points.length} reads</span>
          </div>
          <AqiRouteChart session={session} />
        </div>

        <div className="map-panel summary-chart-card">
          <div className="summary-chart-card__head">
            <div className="panel-title"><Wind size={14} color="var(--teal)" /> Exposure Mix</div>
            <span>{dur}</span>
          </div>
          <ExposureBars session={session} />
        </div>
      </div>

      <div className="map-panel summary-chart-card">
        <div className="summary-chart-card__head">
          <div className="panel-title"><CalendarDays size={14} color="var(--teal)" /> Previous Walks</div>
          <span>Last {Math.min(completedWalks.length, 8)}</span>
        </div>
        <HistoryBars walks={completedWalks.slice(0, 8)} activeId={session.id} />
      </div>

      {/* Insights */}
      <div className="map-panel summary-insights">
        <h3>
          <Gauge size={14} color="var(--teal)" /> Health Insights
        </h3>
        <div className="summary-insights__list">
          <Insight icon={<Wind size={13} />} text={<>Walked <strong style={{color:'var(--text-1)'}}>{bl.distanceKm.toFixed(2)} km</strong> in {dur}.</>} />
          <Insight icon={<Gauge size={13} />} text={<>Average AQI <strong style={{color:aColor}}>{aqi}</strong> — {aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy for sensitive groups' : 'Unhealthy'}.</>} />
          <Insight icon={<Flame size={13} color="#f97316" />} text={<>PM2.5 Breath Load: <strong style={{color:'#f97316'}}>{bl.pm25InhaledUg.toFixed(2)} µg</strong> from {bl.airInhaledM3.toFixed(3)} m³ at {bl.avgPm25.toFixed(1)} µg/m³ avg.</>} />
          {bl.worstPoint && (
            <Insight icon={<MapPin size={13} color="#f87171" />} text={<>Worst zone: AQI <strong style={{color:aqiColor(bl.worstPoint.aqi)}}>{Math.round(bl.worstPoint.aqi)}</strong> near [{bl.worstPoint.lat.toFixed(4)}, {bl.worstPoint.lon.toFixed(4)}].</>} />
          )}
          {bl.cleanSavingsPct > 5 && (
            <Insight icon={<Leaf size={13} color="#34d399" />} text={<>Cleaner sections cut exposure by <strong style={{color:'#34d399'}}>{bl.cleanSavingsPct.toFixed(0)}%</strong> vs the worst zone.</>} />
          )}
        </div>
      </div>

      {/* Guidance banner */}
      <div className="summary-guidance" style={{ background: `${aColor}12`, borderColor: `${aColor}28` }}>
        <p style={{ color: aColor }}>{aqiGuidance(aqi)}</p>
      </div>

      <p className="screen-footnote">
        Estimates based on public/modelled air-quality data and typical breathing rates. Not a medical diagnosis.
      </p>
    </div>
  );
}

function MiniKpi({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  return (
    <div className="summary-mini-kpi map-panel" style={{ ['--kpi-color' as string]: color }}>
      <div>{icon}<span>{label}</span></div>
      <strong className="mono">{value}</strong>
      <em>{unit}</em>
    </div>
  );
}

function Insight({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="summary-insight">
      <div>{icon}</div>
      <p>{text}</p>
    </div>
  );
}

function AqiRouteChart({ session }: { session: WalkSession }) {
  const pts = session.points;
  if (pts.length < 2) {
    return <div className="summary-chart-empty">Not enough AQI samples for a route graph.</div>;
  }

  const W = 420;
  const H = 130;
  const pad = 12;
  const aqis = pts.map((pt) => pt.aqi);
  const min = Math.min(...aqis);
  const max = Math.max(...aqis);
  const range = max - min || 1;
  const coords = pts.map((pt, i) => {
    const x = pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = H - pad - ((pt.aqi - min) / range) * (H - pad * 2);
    return { x, y, color: pt.color, aqi: pt.aqi };
  });
  const path = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const area = `${path} L ${W - pad} ${H - pad} L ${pad} ${H - pad} Z`;
  const last = coords[coords.length - 1];

  return (
    <div>
      <svg className="summary-line-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="summary-aqi-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={last.color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={last.color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => {
          const y = pad + t * (H - pad * 2);
          return <line key={t} x1={pad} x2={W - pad} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 5" />;
        })}
        <path d={area} fill="url(#summary-aqi-fill)" />
        <path d={path} fill="none" stroke={last.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={i === coords.length - 1 ? 4 : 2.4} fill={pt.color} opacity={i === coords.length - 1 ? 1 : 0.72} />
        ))}
      </svg>
      <div className="summary-chart-meta">
        <span>Low AQI {Math.round(min)}</span>
        <span>High AQI {Math.round(max)}</span>
      </div>
    </div>
  );
}

function ExposureBars({ session }: { session: WalkSession }) {
  const bl = session.breathLoad;
  if (!bl) return null;
  const rows = [
    { label: 'PM2.5 Load', value: bl.pm25InhaledUg, max: Math.max(bl.pm25InhaledUg, 1), color: '#f97316', text: `${bl.pm25InhaledUg.toFixed(2)} ug` },
    { label: 'Avg AQI', value: bl.avgAqi, max: 300, color: aqiColor(bl.avgAqi), text: Math.round(bl.avgAqi).toString() },
    { label: 'Clean Bonus', value: bl.cleanSavingsPct, max: 100, color: '#34d399', text: `${bl.cleanSavingsPct.toFixed(0)}%` },
    { label: 'Air Inhaled', value: bl.airInhaledM3, max: Math.max(bl.airInhaledM3, 0.25), color: '#38bdf8', text: `${bl.airInhaledM3.toFixed(3)} m3` },
  ];

  return (
    <div className="summary-bars">
      {rows.map((row) => (
        <div key={row.label} className="summary-bar-row">
          <div>
            <span>{row.label}</span>
            <strong className="mono" style={{ color: row.color }}>{row.text}</strong>
          </div>
          <div className="summary-bar-track">
            <i style={{ width: `${Math.min(100, (row.value / row.max) * 100)}%`, background: row.color, boxShadow: `0 0 10px ${row.color}88` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryBars({ walks, activeId }: { walks: WalkSession[]; activeId: string }) {
  if (walks.length === 0) return <div className="summary-chart-empty">Finish a walk to build your history.</div>;
  const maxLoad = Math.max(...walks.map((walk) => walk.breathLoad?.pm25InhaledUg ?? 0), 1);

  return (
    <div className="history-list">
      {walks.map((walk) => {
        const bl = walk.breathLoad!;
        const date = new Date(walk.endTime ?? walk.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const width = Math.max(6, (bl.pm25InhaledUg / maxLoad) * 100);
        const color = aqiColor(bl.avgAqi);
        return (
          <div key={walk.id} className={`history-walk ${walk.id === activeId ? 'history-walk--active' : ''}`}>
            <div>
              <strong>{date}</strong>
              <span>{bl.activity.label} · {bl.distanceKm.toFixed(2)} km · AQI {Math.round(bl.avgAqi)}</span>
            </div>
            <div className="history-walk__bar">
              <i style={{ width: `${width}%`, background: color, boxShadow: `0 0 10px ${color}88` }} />
            </div>
            <em className="mono">{bl.pm25InhaledUg.toFixed(2)} ug</em>
          </div>
        );
      })}
    </div>
  );
}
