"use client";

import { useEffect, useState } from "react";
import { getMobileInfo, debugMobileAuth } from "@/lib/mobileDebug";

interface MobileDebugProps {
  enabled?: boolean;
}

export const MobileDebugInfo: React.FC<MobileDebugProps> = ({ enabled = false }) => {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      const info = getMobileInfo();
      setDebugInfo(info);
      
      // Auto-show debug if there are authentication issues
      if (info.isMobile && !info.cookieEnabled) {
        setShowDebug(true);
      }
    }
  }, [enabled]);

  if (!enabled || !debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
      >
        Debug {debugInfo.isMobile ? "📱" : "💻"}
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-black text-white p-4 rounded max-w-sm max-h-96 overflow-auto text-xs">
          <div className="mb-2">
            <strong>Mobile Debug Info:</strong>
          </div>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          <button
            onClick={() => debugMobileAuth()}
            className="bg-green-500 text-white px-2 py-1 rounded mt-2 block"
          >
            Log Auth Debug
          </button>
          <button
            onClick={() => setShowDebug(false)}
            className="bg-red-500 text-white px-2 py-1 rounded mt-1 block"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};