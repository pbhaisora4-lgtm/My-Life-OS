import React from 'react';
import { Maximize2, Minimize2, Smartphone } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const { settings, updateSettings } = useLifeOS();
  const useFrame = settings.useDeviceFrameOnDesktop;

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-[#04060a] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Desktop Helper Ribbon */}
      <div className="hidden md:flex w-full max-w-4xl items-center justify-between py-2 px-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            iPhone 17 Pro Experience
          </span>
          <span className="text-[10px] bg-slate-300/60 dark:bg-white/10 px-2 py-0.5 rounded-full">
            PWA Standalone
          </span>
        </div>

        <button
          onClick={() =>
            updateSettings({ useDeviceFrameOnDesktop: !useFrame })
          }
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 transition"
        >
          {useFrame ? (
            <>
              <Maximize2 className="w-3 h-3" />
              <span>Full Screen Width</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3 h-3" />
              <span>iPhone 17 Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Frame Container */}
      {useFrame ? (
        <div className="w-full flex justify-center py-0 md:py-6 px-0 md:px-4">
          <div className="w-full max-w-md md:h-[890px] bg-white dark:bg-[#090c14] md:rounded-[52px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_12px_#1e2330,0_0_0_14px_#333a4d] flex flex-col overflow-hidden relative border-0 md:border md:border-white/10">
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto flex flex-col relative w-full scroll-smooth">
              {children}
            </div>

            {/* iOS Home Indicator Bar (Simulated on frame) */}
            <div className="hidden md:flex w-full justify-center pb-2 pt-1 pointer-events-none absolute bottom-0 left-0 right-0 z-50">
              <div className="w-32 h-1 rounded-full bg-slate-400/50 dark:bg-white/30" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl min-h-screen flex flex-col bg-white dark:bg-[#090c14] shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
};
