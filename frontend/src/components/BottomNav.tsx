import { Map, PersonStanding, ClipboardList, Settings2 } from 'lucide-react';
import type { AppScreen } from '../types';

interface Props {
  current:   AppScreen;
  onChange:  (s: AppScreen) => void;
  isWalking: boolean;
}

const TABS = [
  { id: 'map'      as AppScreen, label: 'Live Map', Icon: Map            },
  { id: 'walk'     as AppScreen, label: 'Walk',     Icon: PersonStanding },
  { id: 'summary'  as AppScreen, label: 'Summary',  Icon: ClipboardList  },
  { id: 'settings' as AppScreen, label: 'Settings', Icon: Settings2      },
];

export default function BottomNav({ current, onChange, isWalking }: Props) {
  return (
    /* Floating island — centred above bottom edge */
    <div
      className="bottom-nav-shell"
      style={{ zIndex: 1200 }}
    >
      <nav
        className="bottom-nav"
        style={{
          background: 'rgba(4, 15, 30, 0.88)',
          border: '1px solid rgba(20, 184, 166, 0.18)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const walking = id === 'walk' && isWalking;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="bottom-nav__button scale-press"
              style={{
                background:  active ? 'rgba(20,184,166,0.14)' : 'transparent',
                color:       active ? '#2dd4bf' : '#475569',
                boxShadow:   active ? '0 0 16px rgba(20,184,166,0.12), inset 0 1px 0 rgba(20,184,166,0.12)' : 'none',
              }}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              {walking && (
                <span
                  className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full pulse-dot"
                  style={{ background: '#ef4444' }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.75}
                style={{ transition: 'color 0.2s' }}
              />
              <span
                className="text-xs font-medium leading-none"
                style={{ fontSize: 10, letterSpacing: '0.02em' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
