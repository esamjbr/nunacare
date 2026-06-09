import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useT } from './ui';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  headerRight?: React.ReactNode;
  noPadding?: boolean;
  noScroll?: boolean;
}

export function AppShell({
  children,
  title,
  showBack = false,
  showNav = true,
  headerRight,
  noPadding = false,
  noScroll = false,
}: AppShellProps) {
  const navigate = useNavigate();
  const { isRtl } = useT();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    /*
     * Fixed inset-0 + max-w-mobile mx-auto = centered 430px mobile frame on desktop.
     * flex-col lets us push BottomNav to the bottom as a real shrink-0 sibling,
     * so the nav NEVER overlaps content and ALWAYS stays at the bottom.
     * overflow-hidden clips any content that momentarily escapes during animations.
     */
    <div className="fixed inset-0 w-full max-w-mobile mx-auto bg-background flex flex-col overflow-hidden">

      {/* ── Header ── */}
      {(title || showBack || headerRight) && (
        <header className="shrink-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border-hairline/[.15] px-5 py-4 flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 bg-soft-surface rounded-full flex items-center justify-center shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={isRtl ? 'رجوع' : 'Go back'}
            >
              <BackIcon size={18} className="text-text-secondary" aria-hidden="true" />
            </button>
          )}
          {title && (
            <h1 className="flex-1 font-display text-[20px] font-[500] text-text-primary truncate">{title}</h1>
          )}
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </header>
      )}

      {/* ── Scrollable Content ── */}
      <main
        className={[
          'flex-1 min-h-0',
          !noPadding ? 'px-5 py-4' : '',
          noScroll ? 'overflow-hidden' : 'overflow-y-auto',
        ].join(' ')}
      >
        {children}
      </main>

      {/* ── Bottom Navigation (flex child — never overlaps content) ── */}
      {showNav && <BottomNav />}
    </div>
  );
}
