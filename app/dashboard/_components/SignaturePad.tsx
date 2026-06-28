"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  leadName: string;
}

export function SignaturePadComponent({ onSave, onCancel, leadName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 2,
        maxWidth: 4,
      });
      setSignaturePad(pad);

      // Resize canvas
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      return () => {
        pad.off();
      };
    }
  }, []);

  const handleClear = () => {
    if (signaturePad) {
      signaturePad.clear();
      setIsSigned(false);
    }
  };

  const handleSave = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const dataUrl = signaturePad.toDataURL('image/png');
      setIsSigned(true);
      onSave(dataUrl);
    } else {
      alert('Please sign before saving.');
    }
  };

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      background: "rgba(0,0,0,0.7)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: 200 
    }}>
      <div style={{
        background: "var(--bg-panel)",
        borderRadius: "var(--radius-lg)",
        width: 560,
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        border: "0.5px solid var(--border)",
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Digital Signature</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              Please sign for: <strong>{leadName}</strong>
            </p>
          </div>
          <button 
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              fontSize: 24,
            }}
          >
            ×
          </button>
        </div>

        {/* Signature Pad */}
        <div style={{
          border: "2px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          background: "white",
          marginBottom: 16,
          height: 200,
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              cursor: "crosshair",
            }}
          />
        </div>

        {/* Instructions */}
        <div style={{
          fontSize: 11,
          color: "var(--text-3)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <i className="ti ti-info-circle"></i>
          {isSigned 
            ? "✓ Signature captured" 
            : "Sign above using your mouse or touch screen"}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            className="btn"
            onClick={handleClear}
            style={{
              padding: "8px 16px",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <button
            className="btn"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{
              padding: "8px 24px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--purple-deep)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <i className="ti ti-check"></i> Sign
          </button>
        </div>
      </div>
    </div>
  );
}