// src/features/settings-panel/ui/sections/mobile-connection-section.tsx

import { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/shared/ui/shadcn/button';
import { api } from '@/shared/api';
import { ConnectionInfo } from '@/shared/types/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { SettingsSwitch } from '../components/settings-switch';

export const MobileConnectionSection = () => {
  const { enableMobileConnection, toggleMobileConnection, authAccessToken, resetAuthToken } =
    useSettingsStore();

  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (enableMobileConnection) {
      const fetchInfo = async () => {
        setLoading(true);
        try {
          const info = await api.system.getConnectionInfo();
          if (info) {
            setConnectionInfo(info);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchInfo();
    }
  }, [enableMobileConnection]);

  const handleResetToken = async () => {
    if (
      confirm(
        'Are you sure you want to reset the access token? Existing sessions will be disconnected.'
      )
    ) {
      await resetAuthToken();
    }
  };

  const connectionUrl = connectionInfo
    ? `http://${connectionInfo.ip}:${connectionInfo.port}/?token=${authAccessToken}`
    : '';

  return (
    <div className="border-border/40 space-y-3 border-t pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
          <Smartphone size={12} /> MOBILE CONNECT
        </h3>
        <SettingsSwitch checked={enableMobileConnection} onCheckedChange={toggleMobileConnection} />
      </div>

      {enableMobileConnection ? (
        <div className="animate-in fade-in slide-in-from-top-1 space-y-3 rounded-md bg-gray-50/5 p-3">
          {connectionInfo ? (
            <>
              <div className="flex justify-center rounded-md bg-white p-3">
                <QRCodeSVG value={connectionUrl} size={140} level="M" />
              </div>

              <div className="space-y-1 text-center">
                <div className="text-muted-foreground cursor-text rounded bg-black/20 p-1.5 font-mono text-[10px] leading-tight break-all select-all">
                  http://{connectionInfo.ip}:{connectionInfo.port}/?token=***
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-green-400">
                  <ShieldCheck size={10} />
                  <span>Secured with One-Time Token</span>
                </div>
                <p className="text-muted-foreground/70 text-[10px]">
                  Scan to connect. Token is required for access.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToken}
                disabled={loading}
                className="h-7 w-full gap-1.5 text-[10px]"
              >
                <RefreshCw size={10} />
                Reset Security Token
              </Button>
            </>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-4">
              {loading ? (
                <RefreshCw size={16} className="mb-2 animate-spin" />
              ) : (
                <AlertCircle size={16} className="mb-2 text-yellow-500" />
              )}
              <span className="text-[10px]">
                {loading ? 'Retrieving Network Info...' : 'Network Info Unavailable'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted/20 rounded-md p-3 text-center">
          <div className="text-muted-foreground/60 flex flex-col items-center gap-2">
            <Lock size={24} />
            <p className="text-[10px] leading-relaxed">
              Mobile access is currently disabled.
              <br />
              Enable to generate a secure connection QR code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
