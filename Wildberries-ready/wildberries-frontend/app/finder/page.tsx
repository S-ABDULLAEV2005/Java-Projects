import type { Metadata } from "next";

import ProductFinder from "../Components/ProductFinder";
import type { Product } from "../_types/product";

export const metadata: Metadata = {
    title: "Product Finder",
    description:
        "Find WildMarket products by category, budget, and priority.",
};

export default async function FinderPage() {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing in .env.local");
    }

    const response = await fetch(
        `${backendUrl.replace(/\/+$/, "")}/products`,
        { cache: "no-store" },
    );

    if (!response.ok) {
        throw new Error(
            `Could not load products: ${response.status}`,
        );
    }

    const products: Product[] = await response.json();

    if (!Array.isArray(products)) {
        throw new Error(
            "The catalog returned an invalid response",
        );
    }

    return <ProductFinder products={products} />;
}