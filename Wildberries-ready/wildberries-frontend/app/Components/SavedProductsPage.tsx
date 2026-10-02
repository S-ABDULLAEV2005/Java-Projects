import { cookies } from "next/headers";
import Link from "next/link";

import ShoppingPageHeading from "./ShoppingPageHeading";
import SavedProductsList from "./SavedProductsList";

type SavedItem = {
    id: number;
    marketplace: "WILDMARKET" | "ALIFSHOP";
    productKey: string;
    itemType: "CART" | "FAVORITE";
    quantity: number;
};

export type SavedProductDetails = {
    id: number;
    name: string;
    href: string;
    price: number | null;
    imageUrl: string | null;
    stock: number | null;
};

export default async function SavedProductsPage({
                                                    type,
                                                }: {
    type: "cart" | "favorites";
}) {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        return (
            <main className="shopping-page">
                <ShoppingPageHeading type={type} />
                <p>Sign in to view your saved products.</p>

                <Link href="/login" className="shopping-page-link">
                    Sign in
                </Link>
            </main>
        );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing");
    }

    const base = backendUrl.replace(/\/$/, "");

    async function get(path: string) {
        const response = await fetch(`${base}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Could not load data (${response.status})`);
        }

        return response.json();
    }

    const items: SavedItem[] = await get(`/shopping/${type}`);

    const details: SavedProductDetails[] = await Promise.all(
        items.map(async (item) => {
            const key = encodeURIComponent(item.productKey);
            const local = item.marketplace === "WILDMARKET";
            const href = local
                ? `/products/${key}`
                : `/alif/products/${key}`;

            try {
                const data = await get(
                    local ? `/products/${key}` : `/alif/products/${key}`,
                );

                const product = local ? data : data.response;
                const rawPrice = local
                    ? product?.price
                    : product?.final_price;

                const price = Number(rawPrice);
                const rawStock = local ? product?.quantity : null;
                const stock = Number(rawStock);

                const validStock =
                    rawStock !== null &&
                    rawStock !== undefined &&
                    rawStock !== "" &&
                    Number.isInteger(stock) &&
                    stock >= 0
                        ? stock
                        : null;
                const rawImage = local
                    ? product?.imageUrl
                    : product?.images?.[0];

                return {
                    id: item.id,
                    name: product?.name || "Unnamed product",
                    href,
                    price:
                        rawPrice !== null &&
                        rawPrice !== undefined &&
                        rawPrice !== "" &&
                        Number.isFinite(price) &&
                        price >= 0
                            ? price
                            : null,
                    imageUrl:
                        typeof rawImage === "string" && rawImage.trim()
                            ? rawImage.trim()
                            : null,
                    stock: validStock,
                };
            } catch {
                return {
                    id: item.id,
                    name: "Product currently unavailable",
                    href,
                    price: null,
                    imageUrl: null,
                    stock: null,
                };
            }
        }),
    );

    return (
        <main className="shopping-page">
            <Link href="/products" className="shopping-back-link">
                ← Continue browsing
            </Link>

            <ShoppingPageHeading type={type} />

            <SavedProductsList type={type} details={details} />
        </main>
    );
}