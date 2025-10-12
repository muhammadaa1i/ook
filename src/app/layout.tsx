import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import "react-toastify/dist/ReactToastify.css";
import DynamicToastContainer from "@/components/common/DynamicToastContainer";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { I18nProvider } from "@/i18n";
import GlobalSWRConfig from "@/lib/swrConfig";
import { MobileDebugInfo } from "@/components/dev/MobileDebugInfo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velora shoes - Качественные тапочки",
  description:
    "Velora shoes: качественные тапочки для дома и отдыха. Комфорт и стиль в каждом шаге.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white text-gray-900`}
      >
        <I18nProvider>
          <GlobalSWRConfig>
            <AuthProvider>
              <ConfirmDialogProvider>
                <CartProvider>
                  <PaymentProvider>
                    <Navbar />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                    <MobileDebugInfo enabled={process.env.NODE_ENV === "production"} />
                  </PaymentProvider>
                </CartProvider>
                <DynamicToastContainer />
              </ConfirmDialogProvider>
            </AuthProvider>
          </GlobalSWRConfig>
        </I18nProvider>
      </body>
    </html>
  );
}
