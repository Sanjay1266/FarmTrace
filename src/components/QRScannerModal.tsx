import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle, Upload, Loader2, Sparkles } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (batchId: string) => void;
}

export const QRScannerModalInner: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const elementId = "farmtrace-camera-reader";
  const fileElementId = "farmtrace-qr-file-helper";

  // Extract batchId from scanned string (URL or direct Batch ID)
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
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {
          console.warn("Cleanup scanner error:", e);
        }
      }
      return;
    }

    setCameraError(null);
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const domTarget = document.getElementById(elementId);
        if (!domTarget || !isMounted) return;

        html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!isMounted) return;
            const batchId = extractBatchId(decodedText);
            try {
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  onScanSuccess(batchId);
                }).catch(() => {
                  onScanSuccess(batchId);
                });
              } else {
                onScanSuccess(batchId);
              }
            } catch {
              onScanSuccess(batchId);
            }
          },
          () => {
            // Frame scan failure ignored
          }
        );

        if (isMounted) {
          setScanning(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Camera start notice:", err);
        setCameraError(
          "Camera access is unavailable or denied. You can upload a photo of the QR code using the button below or enter the Batch ID manually."
        );
        setScanning(false);
      }
    };

    // Small delay to ensure the DOM element is mounted cleanly
    const timer = setTimeout(startScanner, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              try {
                scannerRef.current?.clear();
              } catch {}
            }).catch(() => {});
          } else {
            try {
              scannerRef.current.clear();
            } catch {}
          }
        } catch (e) {
          console.warn("Cleanup scanner on unmount error:", e);
        }
      }
    };
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset file input value so selecting the same file again triggers onChange
    event.target.value = "";
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    // If camera is currently actively running, stop it gracefully before analyzing image
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          setScanning(false);
        }
      } catch (stopErr) {
        console.warn("Notice: could not stop camera before file scan:", stopErr);
      }
    }

    try {
      // Use dedicated hidden element for file scanning to completely prevent any DOM reconciliation conflicts with React
      const fileScanner = new Html5Qrcode(fileElementId);
      // IMPORTANT: showImage MUST be false to prevent html5-qrcode from injecting DOM elements into React's tree
      const decodedText = await fileScanner.scanFile(file, false);
      const batchId = extractBatchId(decodedText);

      try {
        await fileScanner.clear();
      } catch {}

      onScanSuccess(batchId);
    } catch (err: any) {
      console.warn("File QR scan detection warning:", err);
      setCameraError(
        "Could not detect a valid QR code in this photo. Please make sure the QR code is clearly visible, well-lit, and in focus, or enter the Batch ID manually."
      );
    } finally {
      setIsProcessingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Hidden off-screen container dedicated solely to file QR scanning without DOM interference */}
      <div id={fileElementId} className="hidden" aria-hidden="true" />

      <div className="bg-[#0d1410] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#18251e] space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#18251e]">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-farm-400" />
            <h3 className="font-bold text-white text-base">Scan or Upload Product QR</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#14201a] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div className="p-6 space-y-4">
          <div className="relative w-full h-64 bg-[#070b09] border border-[#18251e] rounded-xl overflow-hidden flex items-center justify-center">
            {/* Dedicated leaf DOM container for Html5Qrcode camera: LEAVE EMPTY WITH NO REACT CHILDREN INSIDE */}
            <div id={elementId} className="w-full h-full" />

            {/* Sibling Overlay for Camera Status - React manages this cleanly outside elementId */}
            {!scanning && !cameraError && !isProcessingFile && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-stone-400 text-xs text-center bg-[#070b09] pointer-events-none">
                <Camera className="w-8 h-8 mb-2 text-stone-500 animate-pulse" />
                <p className="font-medium">Initializing camera scanner...</p>
                <p className="text-[11px] text-stone-500 mt-1">Please allow camera permission when prompted.</p>
              </div>
            )}

            {/* Loading Indicator during photo file scan */}
            {isProcessingFile && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white text-xs text-center bg-black/85 backdrop-blur-xs z-10 space-y-2">
                <Loader2 className="w-8 h-8 text-farm-400 animate-spin" />
                <p className="font-bold text-sm text-farm-300">Scanning uploaded photo...</p>
                <p className="text-[11px] text-stone-400 max-w-xs">
                  Extracting cryptographic Batch ID from QR code image.
                </p>
              </div>
            )}
          </div>

          {/* Camera or File Error Alert */}
          {cameraError && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Notice:</p>
                <p className="leading-relaxed">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Photo File Upload Section */}
          <div className="pt-3 border-t border-[#18251e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-stone-200">Have a photo or screenshot?</p>
              <p className="text-[11px] text-stone-400">Upload any image containing the FarmTrace QR.</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              disabled={isProcessingFile}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-farm-800/80 bg-farm-950/70 hover:bg-farm-900/60 text-farm-300 transition shadow-sm shrink-0 disabled:opacity-50"
            >
              {isProcessingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-farm-400" />
                  <span>Upload Photo</span>
                </>
              )}
            </button>
          </div>

          {/* Help Tip */}
          <div className="text-[11px] text-stone-500 text-center flex items-center justify-center space-x-1">
            <Sparkles className="w-3 h-3 text-farm-500" />
            <span>Works with JPG, PNG, WEBP, and camera photos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QRScannerModal: React.FC<QRScannerModalProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle="QR Scanner Notice">
      <QRScannerModalInner {...props} />
    </ErrorBoundary>
  );
};
