import React, { useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Copy, Check, QrCode } from "lucide-react";

interface QRCodeCardProps {
  batchId: string;
  productName: string;
  organizationName?: string;
  originLocation?: string;
  harvestDate?: number;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  batchId,
  productName,
  organizationName,
  originLocation,
  harvestDate,
}) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Construct absolute URL to public verification page
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#/verify/${batchId}`
    : `/verify/${batchId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (!canvas) return;

    // Create high-res download
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `FarmTrace-${batchId}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = harvestDate
    ? new Date(harvestDate * 1000).toLocaleDateString()
    : "Registered";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-farm-600" />
          <h3 className="font-bold text-stone-900 text-base">Consumer Traceability QR</h3>
        </div>
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-farm-50 text-farm-700 border border-farm-200">
          {batchId}
        </span>
      </div>

      {/* QR Code Presentation */}
      <div className="my-6 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-stone-200 shadow-xs hover:border-farm-400 transition">
          <QRCodeSVG
            value={verificationUrl}
            size={180}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2316a34a'><path d='M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'/></svg>",
              x: undefined,
              y: undefined,
              height: 28,
              width: 28,
              excavate: true,
            }}
          />
        </div>

        {/* Hidden Canvas for PNG Export */}
        <div ref={canvasRef} className="hidden">
          <QRCodeCanvas value={verificationUrl} size={512} level="H" includeMargin={true} />
        </div>

        <p className="mt-3 text-xs text-stone-500 max-w-xs">
          Scan with any mobile camera. Direct public read without requiring MetaMask.
        </p>

        {/* Verification Link Preview */}
        <div className="mt-2 flex items-center space-x-1.5 text-xs text-farm-700 font-mono bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 max-w-xs truncate">
          <span className="truncate">{verificationUrl}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-xs">
        <button
          onClick={downloadPNG}
          className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 font-medium text-stone-700 transition"
          title="Download PNG QR code image"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          <span>PNG</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 font-medium text-stone-700 transition"
          title="Print official product label with QR"
        >
          <Printer className="w-3.5 h-3.5 text-stone-500" />
          <span>Print</span>
        </button>

        <button
          onClick={copyLink}
          className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-farm-50 hover:bg-farm-100 border border-farm-200 font-medium text-farm-700 transition"
          title="Copy direct verification link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-farm-600" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Printable Certificate Template (Only shown when printing) */}
      <div id="printable-certificate" className="hidden">
        <div style={{ padding: "30px", border: "3px solid #16a34a", borderRadius: "12px", maxWidth: "600px", margin: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e5e7eb", paddingBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#166534", margin: "0" }}>FarmTrace Verified Batch Label</h1>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0" }}>Blockchain-Tracked Agricultural Provenance</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "monospace", color: "#111827" }}>{batchId}</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Chain: Sepolia (11155111)</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "24px" }}>
            <div>
              <QRCodeSVG value={verificationUrl} size={150} level="H" includeMargin={true} />
            </div>
            <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#374151" }}>
              <p><strong>Product:</strong> {productName}</p>
              {organizationName && <p><strong>Producer Org:</strong> {organizationName}</p>}
              {originLocation && <p><strong>Origin:</strong> {originLocation}</p>}
              <p><strong>Harvest Date:</strong> {formattedDate}</p>
              <p style={{ fontSize: "11px", color: "#059669", marginTop: "8px" }}>Scan to inspect full chronological timeline on Ethereum Sepolia.</p>
            </div>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px dashed #d1d5db", fontSize: "10px", color: "#9ca3af" }}>
            * This label certifies immutable on-chain record existence. Consumers are encouraged to verify real-time checkpoints via the QR code.
          </div>
        </div>
      </div>
    </div>
  );
};
