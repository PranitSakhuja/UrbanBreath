import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { C, F, glass } from '../theme';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import worldAtlas from 'world-atlas/countries-110m.json';

const W = 1920;
const H = 1080;

const projection = geoNaturalEarth1()
  .scale(280)
  .translate([W / 2, H / 2]);

const pathGenerator = geoPath(projection);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topology = worldAtlas as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countries = feature(topology, topology.objects.countries) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countryPaths: string[] = countries.features.map((f: any) => pathGenerator(f) ?? '');

// AQI hotspots — [lon, lat] → projected pixel coords
const CITY_ZONES = [
  { lon: -74,   lat: 40.7,  r: 72,  color: C.aqiGood },   // New York
  { lon: -118,  lat: 34,    r: 60,  color: C.aqiMod  },   // Los Angeles
  { lon: -99,   lat: 19.4,  r: 58,  color: C.aqiSens },   // Mexico City
  { lon: -46.6, lat: -23.5, r: 68,  color: C.aqiGood },   // São Paulo
  { lon: -0.1,  lat: 51.5,  r: 52,  color: C.aqiMod  },   // London
  { lon: 13.4,  lat: 52.5,  r: 46,  color: C.aqiGood },   // Berlin
  { lon: 31.2,  lat: 30.1,  r: 78,  color: C.aqiBad  },   // Cairo
  { lon: 3.4,   lat: 6.5,   r: 82,  color: C.aqiBad  },   // Lagos
  { lon: 37.6,  lat: 55.8,  r: 62,  color: C.aqiMod  },   // Moscow
  { lon: 77.2,  lat: 28.6,  r: 90,  color: C.aqiSens },   // Delhi
  { lon: 72.8,  lat: 19.1,  r: 68,  color: C.aqiMod  },   // Mumbai
  { lon: 116.4, lat: 39.9,  r: 96,  color: C.aqiBad  },   // Beijing
  { lon: 121.5, lat: 31.2,  r: 64,  color: C.aqiSens },   // Shanghai
  { lon: 100.5, lat: 13.8,  r: 58,  color: C.aqiMod  },   // Bangkok
  { lon: 139.7, lat: 35.7,  r: 50,  color: C.aqiGood },   // Tokyo
  { lon: 151.2, lat: -33.9, r: 72,  color: C.aqiGood },   // Sydney
  { lon: 106.8, lat: -6.2,  r: 44,  color: C.aqiVBad },   // Jakarta
  { lon: -43.2, lat: -22.9, r: 55,  color: C.aqiSens },   // Rio
  { lon: 55.3,  lat: 25.2,  r: 46,  color: C.aqiMod  },   // Dubai
];

// Pre-project city positions
const ZONES = CITY_ZONES.map((c) => {
  const pt = projection([c.lon, c.lat]);
  return { x: pt ? pt[0] : 0, y: pt ? pt[1] : 0, r: c.r, color: c.color };
}).filter((z) => z.x > 0 && z.x < W && z.y > 0 && z.y < H);

export const AQIMapScene: React.FC = () => {
  const frame = useCurrentFrame();

  const zoomIn = interpolate(frame, [0, 35], [0.12, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const mapOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });

  const smashZoom = interpolate(frame, [58, 65, 75, 88], [1, 1.14, 1.14, 1.0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const mapDrift = interpolate(frame, [130, 165], [0, 1], { extrapolateRight: 'clamp' });

  const cardP = interpolate(frame, [20, 40], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: '#030c18', fontFamily: F.sans, overflow: 'hidden' }}>
      <div style={{
        transform: `scale(${zoomIn * smashZoom}) translate(${-mapDrift * 30}px, ${-mapDrift * 15}px)`,
        transformOrigin: 'center center',
        width: '110%', height: '110%',
        position: 'absolute', top: 0, left: 0,
        opacity: mapOpacity,
      }}>
        {/* World map SVG */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Subtle lat/lon grid */}
          {[180, 360, 540, 720, 900].map((y, i) => (
            <line key={`lat${i}`} x1={0} y1={y} x2={W} y2={y}
              stroke="rgba(56,189,248,0.06)" strokeWidth={0.8} />
          ))}
          {[320, 640, 960, 1280, 1600].map((x, i) => (
            <line key={`lon${i}`} x1={x} y1={0} x2={x} y2={H}
              stroke="rgba(56,189,248,0.06)" strokeWidth={0.8} />
          ))}

          {/* Country fills */}
          {countryPaths.map((d, i) => (
            <path
              key={i} d={d}
              fill="#0d2340"
              stroke="#1a4a7a"
              strokeWidth={0.6}
            />
          ))}

          {/* AQI glow circles — rendered in SVG so they sit above the map */}
          {ZONES.map((z, i) => {
            const t = Math.max(0, frame - i * 4);
            const explode = interpolate(t, [0, 22], [0, 1], {
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const pulse = 1 + Math.sin(frame * 0.08 + i * 0.7) * 0.04;
            const cx = W / 2, cy = H / 2;
            const dx = z.x - cx, dy = z.y - cy;
            const px = cx + dx * explode;
            const py = cy + dy * explode;
            const currentR = z.r * explode * pulse;

            return (
              <g key={i} opacity={explode}>
                <radialGradient id={`rg${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={z.color} stopOpacity="0.55" />
                  <stop offset="50%"  stopColor={z.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={z.color} stopOpacity="0"    />
                </radialGradient>
                <circle cx={px} cy={py} r={currentR} fill={`url(#rg${i})`} />
                {/* Bright core dot */}
                <circle cx={px} cy={py} r={Math.max(3, currentR * 0.12)}
                  fill={z.color} opacity={0.85} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Feature card */}
      <div style={{
        position: 'absolute', bottom: 60, left: 60,
        ...glass, padding: '20px 28px',
        display: 'flex', alignItems: 'center', gap: 16,
        transform: `translateY(${(1 - cardP) * 60}px)`, opacity: cardP,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: C.tealDim, border: `1px solid ${C.borderTeal}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2a8 8 0 0 1 8 8c0 5-8 14-8 14S4 15 4 10a8 8 0 0 1 8-8z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text1 }}>Global AQI Map</div>
          <div style={{ fontSize: 15, color: C.text2, marginTop: 3 }}>Explore air quality anywhere in the world</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
