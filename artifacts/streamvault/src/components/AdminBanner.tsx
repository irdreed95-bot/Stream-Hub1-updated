import React, { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { publicSettingsApi } from '@/services/adminApi';

export function AdminBanner() {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    publicSettingsApi.get().then((settings) => {
      setEnabled(settings.banner_enabled);
      setText(settings.banner_text || "");
      if (settings.banner_enabled && settings.banner_text) setVisible(true);
    }).catch(() => {});
  }, []);

  if (!enabled || !visible || !text) return null;

  return (
    <div className="w-full bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground px-4 py-2.5 flex items-center justify-between text-sm font-medium z-50 shadow-[0_2px_20px_rgba(201,162,39,0.3)]">
      <div className="flex items-center gap-2 flex-1 justify-center">
        <Bell className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
        <span className="text-center leading-snug">{text}</span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="w-6 h-6 rounded-full flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-black/15 transition-colors flex-shrink-0 ms-2"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
