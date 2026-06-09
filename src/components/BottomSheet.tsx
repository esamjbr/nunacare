import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'max-h-[92dvh]',
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — covers full viewport */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/*
           * Sheet — fixed to bottom of the viewport, centered, max-w-mobile.
           * z-50 ensures it renders above the BottomNav (which has no z-index).
           * max-h uses dvh (dynamic viewport height) so mobile browser chrome
           * (address bar) is accounted for.
           */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed bottom-0 start-0 end-0 mx-auto z-50 w-full max-w-mobile bg-surface rounded-t-[24px] shadow-elevated ${height} flex flex-col`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border-hairline/[.4] rounded-full" />
            </div>

            {/* Header: X / serif title */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border-hairline/[.15] shrink-0">
              <button
                onClick={onClose}
                className="w-9 h-9 bg-soft-surface rounded-full flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Close"
              >
                <X size={16} className="text-text-secondary" aria-hidden="true" />
              </button>
              <h2 className="font-display text-[18px] font-[500] text-text-primary flex-1 text-center">{title}</h2>
              {/* Spacer to keep title centred */}
              <div className="w-9" />
            </div>

            {/*
             * Scrollable content — flex-1 min-h-0 lets it shrink correctly.
             * pb-safe guards the iOS home indicator on real devices.
             */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
