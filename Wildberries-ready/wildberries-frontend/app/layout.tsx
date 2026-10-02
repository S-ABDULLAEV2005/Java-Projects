import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import SiteFooter from "./Components/SiteFooter";
import SiteHeader from "./Components/SiteHeader";
import ShoppingProvider from "./Components/ShoppingProvider";

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
    description: "Discover products from WildMarket and AlifShop.",
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: ReactNode;
}>) {
    const cookieStore = await cookies();

    const isLoggedIn = Boolean(
        cookieStore.get("access_token")?.value,
    );

    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
        <ShoppingProvider isLoggedIn={isLoggedIn}>
            <div className="store-app">
                <SiteHeader />

                <div className="store-page-content">
                    {children}
                </div>

                <SiteFooter />
            </div>
        </ShoppingProvider>
        </body>
        </html>
    );
}