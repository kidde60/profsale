import React, { useEffect, useState } from 'react';
import { usePendingSync } from '../lib/syncQueue';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const PwaStatus: React.FC = () => {
  const { online, pending } = usePendingSync();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  if (online && pending === 0 && !installEvent) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200 sm:px-6 lg:px-8">
      <span>
        {!online
          ? 'You are offline. Sales and changes are saved on this device and will sync when you reconnect.'
          : `${pending} change(s) waiting to sync.`}
      </span>
      {installEvent && (
        <button
          onClick={install}
          className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          Install app
        </button>
      )}
    </div>
  );
};

export default PwaStatus;
