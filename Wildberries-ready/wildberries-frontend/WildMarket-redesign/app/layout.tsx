import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import SiteFooter from "./Components/SiteFooter";
import SiteHeader from "./Components/SiteHeader";

import "./globals.css";
import "./storefront.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "WildMarket",
        template: "%s | WildMarket",
    },
    description:
        "Discover products from WildMarket and AlifShop.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
        <div className="store-app">
            <SiteHeader />

            <div className="store-page-content">
                {children}
            </div>

            <SiteFooter />
        </div>
        </body>
        </html>
    );
}


