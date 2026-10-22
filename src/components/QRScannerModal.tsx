import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle, Upload } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (batchId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const elementId = "farmtrace-qr-reader";

  // Extract batchId from scanned string (can be full URL or direct Batch ID)
  const extractBatchId = (decodedText: string): string => {
    let clean = decodedText.trim();
    if (clean.includes("/verify/")) {
      const parts = clean.split("/verify/");
      clean = parts[parts.length - 1];
    } else if (clean.includes("id=")) {
      const match = clean.match(/id=([A-Za-z0-9-_]+)/);
      if (match) clean = match[1];
    }
    // Remove query params or hashes
    clean = clean.split("?")[0].split("#")[0];
    return clean.toUpperCase();
  };

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.warn);
      }
      return;
    }

    setCameraError(null);
    let html5QrCode: Html5Qrcode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            const batchId = extractBatchId(decodedText);
            html5QrCode.stop().then(() => {
              onScanSuccess(batchId);
            });
          },
          () => {
            // Frame scan failure (ignore)
          }
        );
        setScanning(true);
      } catch (err: any) {
        console.warn("Camera start failed:", err);
        setCameraError(
          "Camera access could not be initialized. You may need to grant camera permission in your browser or upload a QR image below."
        );
        setScanning(false);
      }
    };

    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.warn);
          }
        } catch (e) {
          console.warn("Cleanup scanner error:", e);
        }
      }
    };
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = scannerRef.current || new Html5Qrcode(elementId);
      const decodedText = await html5QrCode.scanFile(file, true);
      const batchId = extractBatchId(decodedText);
      onScanSuccess(batchId);
    } catch (err: any) {
      setCameraError("Could not detect a valid QR code in the uploaded image. Please try another image or enter the Batch ID manually.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d1410] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#18251e]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#18251e]">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-farm-400" />
            <h3 className="font-bold text-white">Scan Product QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-[#14201a] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div className="p-6">
          <div
            id={elementId}
            className="w-full h-64 bg-[#070b09] border border-[#18251e] rounded-xl overflow-hidden flex items-center justify-center text-stone-400 text-xs text-center"
          >
            {!scanning && !cameraError && (
              <div className="p-4">
                <Camera className="w-8 h-8 mx-auto mb-2 text-stone-500 animate-pulse" />
                <p>Requesting camera permissions...</p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Fallback Image Upload */}
          <div className="mt-4 pt-4 border-t border-[#18251e] flex items-center justify-between">
            <span className="text-xs text-stone-400">Have a saved QR image?</span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#18251e] bg-[#121c17] hover:bg-[#1a2820] text-stone-200 transition"
            >
              <Upload className="w-3.5 h-3.5 text-stone-400" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
