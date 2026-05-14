import { Info, BookOpen, Globe, LogOut } from 'lucide-react';
import type { Settings } from '../types';
import { supabase } from '../lib/supabase';

interface Props { settings: Settings; onChange: (s: Settings) => void; }

const AQI_BANDS = [
  { range: '0 – 50',    label: 'Good',                    sub: 'Air quality is satisfactory.', color: '#22c55e' },
  { range: '51 – 100',  label: 'Moderate',                sub: 'Sensitive groups may be affected.', color: '#eab308' },
  { range: '101 – 150', label: 'Unhealthy (Sensitive)',    sub: 'Asthma / heart patients reduce outdoor time.', color: '#f97316' },
  { range: '151 – 200', label: 'Unhealthy',               sub: 'Everyone may experience effects.', color: '#ef4444' },
  { range: '201 – 300', label: 'Very Unhealthy',          sub: 'Avoid prolonged outdoor activity.', color: '#a855f7' },
  { range: '300+',      label: 'Hazardous',               sub: 'Health emergency. Stay indoors.', color: '#7f1d1d' },
];

export default function SettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="screen-shell">
      <div className="screen-titlebar">
        <div>
          <h2>Settings</h2>
          <p>Display preferences and air-quality reference.</p>
        </div>
      </div>

      {/* AQI unit */}
      <div className="map-panel settings-card">
        <div className="panel-title">
          <Globe size={14} color="var(--teal)" />
          AQI Scale
        </div>
        <div className="settings-segment">
          {(['us', 'eu'] as const).map(unit => {
            const sel = settings.aqiUnit === unit;
            return (
              <button key={unit} onClick={() => onChange({ ...settings, aqiUnit: unit })}
                className={`scale-press ${sel ? 'settings-segment__button settings-segment__button--active' : 'settings-segment__button'}`}>
                {unit === 'us' ? '🇺🇸 US EPA' : '🇪🇺 EU AQI'}
              </button>
            );
          })}
        </div>
        <p className="settings-card__copy">
          Both calculated from PM2.5 via Open-Meteo model data.
        </p>
      </div>

      {/* AQI legend */}
      <div className="map-panel settings-card">
        <div className="panel-title">
          <BookOpen size={14} color="var(--teal)" />
          AQI Reference Guide
        </div>
        <div className="aqi-reference">
          {AQI_BANDS.map(({ range, label, sub, color }) => (
            <div key={range} className="aqi-reference__row">
              <div className="aqi-reference__dot" style={{ background: color, boxShadow: `0 0 7px ${color}66` }} />
              <div>
                <div className="aqi-reference__topline">
                  <span>{label}</span>
                  <span className="mono">{range}</span>
                </div>
                <p>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="map-panel settings-card">
        <div className="panel-title">
          <Info size={14} color="var(--teal)" />
          About UrbanBreath
        </div>
        <p className="settings-card__copy settings-card__copy--body">
          Real-time air quality from <strong style={{ color: 'var(--teal)' }}>Open-Meteo</strong>. Breath Load uses
          your activity's breathing rate × average PM2.5 along your walk. Activity is selected in the Walk screen.
        </p>
        <div className="settings-note">
          Not a medical device. For informational use only.
        </div>
      </div>

      {/* Sign out */}
      <div className="map-panel settings-card">
        <button
          onClick={() => supabase.auth.signOut()}
          className="settings-signout scale-press"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}
