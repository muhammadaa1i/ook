"use client";
import React from "react";
import { ToastContainer } from "react-toastify";
import { usePathname } from "next/navigation";

/**
 * Dynamic toast container duration:
 * - User pages (non /admin): 2000ms
 * - Admin pages: 5000ms (retain longer visibility for management actions)
 */
export const DynamicToastContainer: React.FC = () => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const autoClose = isAdmin ? 5000 : 2000;
  return (
    <ToastContainer
      position="top-left"
      autoClose={autoClose}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
};

export default DynamicToastContainer;