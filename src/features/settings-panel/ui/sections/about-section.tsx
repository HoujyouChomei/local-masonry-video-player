// src/features/settings-panel/ui/sections/about-section.tsx

import { useState, useEffect } from 'react';
import { Info, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LicenseData {
  licenses: string;
  repository?: string;
  publisher?: string;
  email?: string;
  url?: string;
  path?: string;
  licenseFile?: string;
}

type LicensesMap = Record<string, LicenseData>;

export const AboutSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [licenses, setLicenses] = useState<LicensesMap | null>(null);
  const [loading, setLoading] = useState(false);

  // ダイアログが開いたときにJSONをフェッチする
  useEffect(() => {
    if (isOpen && !licenses) {
      const loadLicenses = async () => {
        setLoading(true);
        try {
          // 相対パスで参照
          const res = await fetch('./licenses.json');
          const data = await res.json();
          setLicenses(data);
        } catch (err) {
          console.error('Failed to load licenses:', err);
        } finally {
          setLoading(false);
        }
      };

      loadLicenses();
    }
  }, [isOpen, licenses]);

  const handleOpenLink = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <div className="border-border/40 mt-2 border-t pt-4">
        <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold">
          <Info size={12} /> ABOUT
        </h3>

        <div className="text-muted-foreground mb-3 text-[10px] leading-relaxed">
          {/* ▼▼▼ 修正: バージョンを v0.2.1 に更新 ▼▼▼ */}
          <p>Local Masonry Video Player v0.2.1</p>
          <p>Powered by Electron, Vite & Open Source Software.</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-start text-xs"
          onClick={() => setIsOpen(true)}
        >
          <FileText className="mr-2 h-3 w-3" />
          Third-Party Licenses
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex h-[80vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>Third-Party Licenses</DialogTitle>
            <DialogDescription>
              This application uses the following open source software.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 min-h-0 flex-1 rounded-md border">
            <ScrollArea className="h-full p-4">
              {loading && <div className="text-muted-foreground py-8 text-center">Loading...</div>}

              {!loading && !licenses && (
                <div className="text-destructive py-8 text-center">
                  Failed to load license information.
                </div>
              )}

              {licenses && (
                <div className="space-y-6">
                  {Object.entries(licenses).map(([name, info]) => (
                    <div key={name} className="break-all">
                      <div className="mb-1 flex items-baseline justify-between">
                        <h4 className="text-sm font-semibold">{name}</h4>
                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                          {info.licenses}
                        </span>
                      </div>

                      <div className="text-muted-foreground space-y-0.5 text-xs">
                        {info.publisher && <div>Publisher: {info.publisher}</div>}
                        {info.repository && (
                          <button
                            onClick={() => handleOpenLink(info.repository)}
                            className="hover:text-primary flex items-center gap-1 hover:underline"
                          >
                            {info.repository} <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
