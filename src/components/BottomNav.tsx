import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, CalendarDays, Heart, MoreHorizontal } from 'lucide-react';
import { useT } from './ui';

export function BottomNav() {
  const { t } = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const tabs = [
    { icon: Home, label: t.home, route: '/home' },
    { icon: Clock, label: t.timeline, route: '/timeline' },
    { icon: CalendarDays, label: t.calendar, route: '/calendar' },
    { icon: Heart, label: t.momRecovery, route: '/mom-recovery' },
    { icon: MoreHorizontal, label: t.more, route: '/more' },
  ];

  return (
    /*
     * shrink-0 ensures the nav never collapses or gets squeezed by content.
     * Hairline top border per spec §3. No box-shadow — border is the separator.
     */
    <nav className="shrink-0 w-full bg-surface border-t border-border-hairline/[.2]">
      <div className="flex items-center px-2 pt-1 pb-safe">
        {tabs.map(({ icon: Icon, label, route }) => {
          const isActive = path === route || (route === '/home' && path === '/');
          return (
            <button
              key={route}
              onClick={() => navigate(route)}
              aria-label={label}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-150 min-h-[44px] ${
                isActive ? 'text-primary' : 'text-text-hint'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                  isActive ? 'bg-feeding-tint' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.6} aria-hidden="true" />
              </div>
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
