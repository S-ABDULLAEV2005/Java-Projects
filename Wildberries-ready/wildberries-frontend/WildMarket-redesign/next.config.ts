import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.simsim.tj",
                pathname: "/storage/products/**",
            },
            {
                protocol: "https",
                hostname: "storage.alifshop.tj",
                pathname: "/media/images/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
