"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function QrButton({ title }: { title: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" title="Show QR Code">
          <QrCode className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6">
        <DialogHeader>
          <DialogTitle className="text-center mb-4 text-xl">
            Scan to view this listing
          </DialogTitle>
        </DialogHeader>
        <div className="bg-white p-4 rounded-xl border-2 border-zinc-100 shadow-sm">
          {url ? (
            <QRCodeSVG
              value={url}
              size={220}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="w-[220px] h-[220px] flex items-center justify-center bg-zinc-100 rounded-lg">
              <span className="text-sm text-zinc-500">Loading...</span>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground font-medium">
          {title}
        </p>
      </DialogContent>
    </Dialog>
  );
}
