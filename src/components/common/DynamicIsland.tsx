import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, Smartphone, Wifi, WifiOff } from 'lucide-react';

interface DynamicIslandProps {
  notice?: {
    title: string;
    subtitle?: string;
    icon?: string;
  } | null;
  isOnline: boolean;
  onOpenQuickEntry?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  notice,
  isOnline,
  onOpenQuickEntry,
}) => {
  return (
    <div className="w-full flex justify-center pt-2 pb-1 px-4 select-none pointer-events-none sticky top-0 z-50">
      <AnimatePresence mode="wait">
        {notice ? (
          <motion.div
            key="expanded-island"
            initial={{ scale: 0.85, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="pointer-events-auto bg-black text-white px-4 py-2 rounded-[28px] shadow-2xl flex items-center gap-3 border border-white/15 min-w-[240px] max-w-[340px]"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate tracking-tight">
                {notice.title}
              </p>
              {notice.subtitle && (
                <p className="text-[10px] text-slate-400 truncate tracking-tight">
                  {notice.subtitle}
                </p>
              )}
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full shrink-0">
              Saved
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="idle-island"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto bg-black text-white px-3.5 py-1.5 rounded-[22px] shadow-lg flex items-center gap-2.5 border border-white/10 text-xs hover:border-white/20 transition-all cursor-pointer"
            onClick={onOpenQuickEntry}
            title="Tap for Quick Entry"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/80 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide text-slate-200">
              MY LIFE OS
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              {isOnline ? (
                <span className="text-emerald-400 text-[9px] font-medium">Local-First</span>
              ) : (
                <span className="text-amber-400 text-[9px] font-medium flex items-center gap-0.5">
                  <WifiOff className="w-2.5 h-2.5" /> Offline
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
