"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DownloadAppPage() {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [apkUrl, setApkUrl] = useState<string>("");

  useEffect(() => {
    // We get the origin on the client side to avoid hydration mismatch
    const origin = window.location.origin;
    const fullUrl = `${origin}/bhoomitayi-app.apk`;
    setApkUrl(fullUrl);

    QRCode.toDataURL(fullUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then(setQrUrl)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-4 relative overflow-hidden bg-transparent">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      <Card className="relative z-10 w-full max-w-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-3xl shadow-2xl border-0 rounded-[3rem] overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
        <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center space-y-8">
          <div className="flex items-center justify-center size-24 rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 text-white mb-2">
            <Smartphone className="size-12 drop-shadow-md" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Get the Mobile App
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto font-medium">
              Scan the QR code below or click the download button to install the Android application on your device.
            </p>
          </div>

          <div className="bg-white p-4 rounded-[2rem] shadow-xl ring-1 ring-black/5 hover:scale-105 transition-transform duration-500">
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt="QR Code for APK"
                width={240}
                height={240}
                className="rounded-2xl"
                unoptimized
              />
            ) : (
              <div className="w-[240px] h-[240px] flex flex-col items-center justify-center bg-zinc-50 rounded-2xl animate-pulse">
                <div className="size-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-sm font-semibold text-muted-foreground">Generating QR...</span>
              </div>
            )}
          </div>

          <Button 
            asChild 
            size="lg" 
            className="h-16 px-10 rounded-full text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/25 hover:shadow-2xl transition-all hover:scale-[1.02] group"
          >
            <a href="/bhoomitayi-app.apk" download>
              <Download className="mr-3 size-6 group-hover:-translate-y-1 transition-transform" />
              Download APK Now
            </a>
          </Button>
          
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full mt-4">
            <p className="text-sm font-medium text-muted-foreground bg-blue-50 dark:bg-blue-950/50 p-4 rounded-2xl">
              <strong>Note:</strong> You may need to enable "Install from Unknown Sources" in your Android settings to install this direct APK.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
