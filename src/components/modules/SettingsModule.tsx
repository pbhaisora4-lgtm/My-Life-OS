import React, { useState, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { dbService } from '../../services/db';
import {
  Settings,
  Download,
  Upload,
  Moon,
  Sun,
  Smartphone,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';

export const SettingsModule: React.FC<{
  currentTheme: 'dark' | 'light' | 'system';
  onSetTheme: (theme: 'dark' | 'light' | 'system') => void;
}> = ({ currentTheme, onSetTheme }) => {
  const {
    settings,
    updateSettings,
    showIslandNotice,
    loadSampleData,
    clearData,
    currentUser,
    isSyncingCloud,
    lastCloudSyncAt,
    loginWithGoogle,
    logoutUser,
    syncToCloudNow,
    pullFromCloudNow,
  } = useLifeOS();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState(settings.userName || 'Alex');
  const [stepTarget, setStepTarget] = useState(settings.stepTarget || 10000);
  const [waterTarget, setWaterTarget] = useState(settings.waterTargetMl || 3000);
  const [proteinTarget, setProteinTarget] = useState(settings.proteinTargetG || 140);
  const [calorieTarget, setCalorieTarget] = useState(settings.calorieTarget || 2200);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      userName,
      stepTarget,
      waterTargetMl: waterTarget,
      proteinTargetG: proteinTarget,
      calorieTarget,
    });
  };

  const handleExportJSON = async () => {
    const jsonStr = await dbService.exportFullDatabaseJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MyLifeOS_Backup_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showIslandNotice('Complete Backup Exported', 'Full JSON database downloaded');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await dbService.importFullDatabaseJSON(content);
        if (success) {
          showIslandNotice('Backup Restored', 'All records recovered successfully');
          window.location.reload();
        } else {
          showIslandNotice('Import Error', 'Invalid backup JSON file');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportFitnessCSV = async () => {
    const csv = await dbService.exportFitnessCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Fitness_Records_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showIslandNotice('Fitness CSV Exported');
  };

  const handleExportFinanceCSV = async () => {
    const csv = await dbService.exportFinanceCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Finance_Records_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showIslandNotice('Finance CSV Exported');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Preferences & Data
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Backups
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Local-first storage controls, JSON backups, CSV export and appearance.
        </p>
      </div>

      {/* Appearance & Frame Mode */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Appearance & Display
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSetTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
              currentTheme === 'dark'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-xs font-semibold">Dark Mode</span>
          </button>
          <button
            onClick={() => onSetTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
              currentTheme === 'light'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-xs font-semibold">Light Mode</span>
          </button>
          <button
            onClick={() => onSetTheme('system')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
              currentTheme === 'system'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-semibold">System</span>
          </button>
        </div>

        {/* Desktop iPhone Frame Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              iPhone 17 Frame Preview (Desktop)
            </p>
            <p className="text-[10px] text-slate-400">
              Renders inside an authentic iPhone chassis on larger screens.
            </p>
          </div>
          <button
            onClick={() =>
              updateSettings({
                useDeviceFrameOnDesktop: !settings.useDeviceFrameOnDesktop,
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.useDeviceFrameOnDesktop ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.useDeviceFrameOnDesktop ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Personal Targets */}
      <form
        onSubmit={handleSavePreferences}
        className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
      >
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Daily Targets & Profile
        </h3>

        <div>
          <label className="text-[10px] text-slate-500 dark:text-slate-400">Your Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Daily Steps Target</label>
            <input
              type="number"
              value={stepTarget}
              onChange={(e) => setStepTarget(parseInt(e.target.value, 10) || 10000)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Water Target (ml)</label>
            <input
              type="number"
              value={waterTarget}
              onChange={(e) => setWaterTarget(parseInt(e.target.value, 10) || 3000)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Protein Target (g)</label>
            <input
              type="number"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(parseInt(e.target.value, 10) || 140)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Calories Burn Target</label>
            <input
              type="number"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(parseInt(e.target.value, 10) || 2200)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
        >
          Save Profile Preferences
        </button>
      </form>

      {/* Firebase Auth & Firestore Cloud Vault Sync */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-indigo-500/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Firebase Auth & Cloud Vault
            </h3>
          </div>
          {currentUser && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold">
              Connected
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser.displayName || 'Life OS User'}
                </p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                {lastCloudSyncAt && (
                  <p className="text-[10px] text-cyan-500 font-mono mt-0.5">
                    Last Synced: {new Date(lastCloudSyncAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={logoutUser}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={syncToCloudNow}
                disabled={isSyncingCloud}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>Push to Firestore</span>
              </button>
              <button
                onClick={pullFromCloudNow}
                disabled={isSyncingCloud}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pull from Cloud</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Sign in with Google to automatically sync your local IndexedDB database with your private Firestore Cloud Vault.
            </p>
            <button
              onClick={loginWithGoogle}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Complete Data Backup & Restore */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Local Storage & Backups
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          MY LIFE OS operates locally using IndexedDB in your Safari / browser storage with optional Firebase Cloud Sync. Export your full JSON backup regularly to keep an offline copy.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportJSON}
            className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-semibold hover:bg-slate-100 transition text-slate-900 dark:text-white"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Export JSON Backup</span>
          </button>

          <label className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer text-slate-900 dark:text-white">
            <Upload className="w-4 h-4 text-cyan-500" />
            <span>Restore JSON Backup</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {/* CSV Exports */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex gap-2">
          <button
            onClick={handleExportFitnessCSV}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-200 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-500" />
            <span>Fitness CSV</span>
          </button>
          <button
            onClick={handleExportFinanceCSV}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-200 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Finance CSV</span>
          </button>
        </div>
      </div>

      {/* Sample Data & Reset */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Demo Testing & Reset
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Want to test the app with realistic entries across all 10 modules? Tap below. You can clear them at any time.
        </p>

        <div className="flex gap-2">
          <button
            onClick={loadSampleData}
            className="flex-1 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-cyan-400 text-xs font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Data</span>
          </button>
          {confirmClear ? (
            <button
              onClick={() => {
                clearData();
                setConfirmClear(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>Confirm Reset</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
