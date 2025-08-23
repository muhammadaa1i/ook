"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = "" }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      // Show status briefly when it changes
      if (!online) {
        setShowStatus(true);
      } else {
        // Show "back online" briefly
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform
        ${isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"}
        ${className}
      `}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Соединение восстановлено
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <span className="text-sm font-medium">
              Нет соединения с интернетом
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
