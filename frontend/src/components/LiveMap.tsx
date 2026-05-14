import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { AirQualityData, WalkPoint, AqiGridPoint } from '../types';
import { fetchAirQuality } from '../lib/api';
import { aqiColor } from '../lib/aqi';

const aqiCache = new Map<string, AqiGridPoint>();

function cacheKey(lat: number, lon: number, zoom: number) {
  const precision = zoom < 4 ? 0 : zoom < 8 ? 1 : 2;
  return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
}

function buildViewportSamples(map: ReturnType<typeof useMap>): { lat: number; lon: number }[] {
  const bounds = map.getBounds().pad(0.12);
  const zoom = map.getZoom();
  const size = map.getSize();
  const cols = zoom < 4 ? 9 : zoom < 8 ? 8 : Math.min(8, Math.max(5, Math.round(size.x / 170)));
  const rows = zoom < 4 ? 5 : zoom < 8 ? 5 : Math.min(6, Math.max(4, Math.round(size.y / 170)));
  const west = Math.max(-180, bounds.getWest());
  const east = Math.min(180, bounds.getEast());
  const south = Math.max(-84, bounds.getSouth());
  const north = Math.min(84, bounds.getNorth());
  const pts: { lat: number; lon: number }[] = [];

  for (let r = 0; r < rows; r++) {
    const lat = rows === 1 ? (north + south) / 2 : north - (r / (rows - 1)) * (north - south);
    for (let c = 0; c < cols; c++) {
      const lon = cols === 1 ? (east + west) / 2 : west + (c / (cols - 1)) * (east - west);
      pts.push({ lat, lon });
    }
  }
  return pts;
}

function ViewportAqiSampler({ onGrid }: { onGrid: (grid: AqiGridPoint[]) => void }) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function refresh() {
      const zoom = map.getZoom();
      const samples = buildViewportSamples(map);
      const cached: AqiGridPoint[] = [];
      const missing: { lat: number; lon: number; key: string }[] = [];

      samples.forEach((p) => {
        const key = cacheKey(p.lat, p.lon, zoom);
        const hit = aqiCache.get(key);
        if (hit) cached.push(hit);
        else missing.push({ ...p, key });
      });

      if (cached.length && !cancelled) onGrid(cached);

      const fetched = await Promise.allSettled(
        missing.map(async (p) => {
          const aq = await fetchAirQuality(p.lat, p.lon);
          const point = { lat: p.lat, lon: p.lon, aqi: aq.aqi, color: aq.color || aqiColor(aq.aqi) };
          aqiCache.set(p.key, point);
          return point;
        })
      );

      if (cancelled) return;
      const fresh = fetched
        .filter((r): r is PromiseFulfilledResult<AqiGridPoint> => r.status === 'fulfilled')
        .map((r) => r.value);
      onGrid([...cached, ...fresh]);
    }

    function scheduleRefresh() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 260);
    }

    refresh();
    map.on('moveend zoomend resize', scheduleRefresh);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      map.off('moveend zoomend resize', scheduleRefresh);
    };
  }, [map, onGrid]);

  return null;
}

/* ─── Canvas heatmap overlay ────────────────────────────────── */
function AqiCanvasLayer({ grid }: { grid: AqiGridPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (grid.length === 0) return;

    // Mount canvas directly on map container so it's outside Leaflet pane transforms
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'absolute', top: '0', left: '0',
      pointerEvents: 'none', zIndex: '300',
      opacity: '0.72',
      mixBlendMode: 'multiply',
    });
    container.appendChild(canvas);

    function hexToRgb(hex: string): [number, number, number] {
      const h = hex.replace('#', '');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }

    function render() {
      const size = map.getSize();
      canvas.width  = size.x;
      canvas.height = size.y;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, size.x, size.y);

      const projected = grid.map((pt) => ({ ...pt, p: map.latLngToContainerPoint([pt.lat, pt.lon]) }));
      const xs = [...new Set(projected.map((pt) => Math.round(pt.p.x)))].sort((a, b) => a - b);
      const ys = [...new Set(projected.map((pt) => Math.round(pt.p.y)))].sort((a, b) => a - b);
      const gapX = xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => Math.abs(x - xs[i]))) : 180;
      const gapY = ys.length > 1 ? Math.min(...ys.slice(1).map((y, i) => Math.abs(y - ys[i]))) : 180;
      const radius = Math.max(130, Math.min(520, Math.max(gapX, gapY) * 1.08));

      ctx.filter = 'blur(22px)';
      for (const pt of projected) {
        const p = pt.p;
        const [rv, gv, bv] = hexToRgb(pt.color);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0.00, `rgba(${rv},${gv},${bv},0.50)`);
        grad.addColorStop(0.46, `rgba(${rv},${gv},${bv},0.36)`);
        grad.addColorStop(0.78, `rgba(${rv},${gv},${bv},0.18)`);
        grad.addColorStop(1.00, `rgba(${rv},${gv},${bv},0.00)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = 'none';
    }

    // Smooth redraws during pan and zoom
    map.on('move zoom viewreset', render);
    render();

    return () => {
      map.off('move zoom viewreset', render);
      canvas.remove();
    };
  }, [map, grid]);

  return null;
}

/* ─── Re-center once when GPS arrives ──────────────────────── */
function RecenterOnUser({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current && lat && lon) {
      map.setView([lat, lon], 15);
      done.current = true;
    }
  }, [lat, lon, map]);
  return null;
}

/* ─── Props ─────────────────────────────────────────────────── */
interface Props {
  userLat:    number;
  userLon:    number;
  airQuality: AirQualityData | null;
  walkPoints: WalkPoint[];
  aqiGrid:    AqiGridPoint[];
  onAqiGridChange: (grid: AqiGridPoint[]) => void;
}

export default function LiveMap({ userLat, userLon, airQuality, walkPoints, aqiGrid, onAqiGridChange }: Props) {
  if (!userLat && !userLon) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500" style={{ background: 'var(--bg-void)' }}>
        <div className="text-center">
          <div className="text-5xl mb-3">📍</div>
          <p className="text-sm">Waiting for location…</p>
        </div>
      </div>
    );
  }

  const color = airQuality?.color ?? '#14b8a6';
  const aqi   = airQuality?.aqi   ?? 0;

  // Walk trail segments
  const trail: { pos: [[number, number], [number, number]]; color: string }[] = [];
  for (let i = 1; i < walkPoints.length; i++) {
    trail.push({
      pos:   [[walkPoints[i - 1].lat, walkPoints[i - 1].lon], [walkPoints[i].lat, walkPoints[i].lon]],
      color: walkPoints[i].color,
    });
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer center={[userLat, userLon]} zoom={15} className="w-full h-full" zoomControl>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <RecenterOnUser lat={userLat} lon={userLon} />
        <ViewportAqiSampler onGrid={onAqiGridChange} />

        {/* Smooth AQI heatmap canvas */}
        <AqiCanvasLayer grid={aqiGrid} />

        {/* Pulsing glow rings around user position */}
        <CircleMarker
          center={[userLat, userLon]} radius={40}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.06, weight: 0 }}
        />
        <CircleMarker
          center={[userLat, userLon]} radius={22}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 0 }}
        />
        <CircleMarker
          center={[userLat, userLon]} radius={10}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.22, weight: 1.5 }}
        />

        {/* User dot */}
        <CircleMarker
          center={[userLat, userLon]} radius={7}
          pathOptions={{ color: '#fff', fillColor: '#0d9488', fillOpacity: 1, weight: 2.5 }}
        >
          <Popup>
            <div style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#0f172a', background: '#ffffff', padding: '6px 10px', borderRadius: 8 }}>
              <strong>You</strong><br />
              AQI {Math.round(aqi)} · {airQuality?.qualityLabel ?? '—'}
            </div>
          </Popup>
        </CircleMarker>

        {/* Walk trail */}
        {trail.map((seg, i) => (
          <Polyline key={i} positions={seg.pos}
            pathOptions={{ color: seg.color, weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
          />
        ))}
      </MapContainer>
      <AqiLegend sampleCount={aqiGrid.length} />
    </div>
  );
}

function AqiLegend({ sampleCount }: { sampleCount: number }) {
  const zones = [
    { label: 'Good', color: '#22c55e' },
    { label: 'Moderate', color: '#eab308' },
    { label: 'Unhealthy', color: '#f97316' },
    { label: 'High', color: '#ef4444' },
    { label: 'Severe', color: '#7f1d1d' },
  ];
  return (
    <div className="aqi-legend" aria-label="AQI map legend">
      <div className="aqi-legend__bar">
        {zones.map((z) => <span key={z.label} style={{ background: z.color }} />)}
      </div>
      <div className="aqi-legend__labels">
        <span>Global AQI zones</span>
        <span>{sampleCount || '...'} samples</span>
      </div>
    </div>
  );
}
