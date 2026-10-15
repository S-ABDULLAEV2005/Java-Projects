import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { SavedItem } from "../../Components/ShoppingProvider";

export type CartPreviewProduct = {
    marketplace: SavedItem["marketplace"];
    productKey: string;
    name: string;
    href: string;
    imageUrl: string | null;
    price: number | null;
    stock: number | null;
};

function amount(value: unknown): number | null {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return null;
    }

    if (typeof value === "string" && !value.trim()) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= 0
        ? number
        : null;
}

export async function GET() {
    const headers = { "Cache-Control": "no-store" };

    const token = (await cookies())
        .get("access_token")?.value;

    if (!token) {
        return NextResponse.json(
            { message: "Please sign in" },
            { status: 401, headers },
        );
    }

    const backend = process.env.BACKEND_URL;

    if (!backend) {
        return NextResponse.json(
            { message: "Backend URL is missing" },
            { status: 500, headers },
        );
    }

    const base = backend.replace(/\/+$/, "");

    try {
        const response = await fetch(
            `${base}/shopping/cart`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
                signal: AbortSignal.timeout(8000),
            },
        );

        if (!response.ok) {
            return NextResponse.json(
                { message: "Could not load your cart" },
                { status: response.status, headers },
            );
        }

        const cart: SavedItem[] = await response.json();

        if (!Array.isArray(cart)) {
            throw new Error("Invalid cart response");
        }

        const products: CartPreviewProduct[] =
            await Promise.all(
                cart.map(async (item) => {
                    const key = encodeURIComponent(
                        item.productKey,
                    );

                    const local =
                        item.marketplace === "WILDMARKET";

                    const fallback: CartPreviewProduct = {
                        marketplace: item.marketplace,
                        productKey: item.productKey,
                        name: "Product currently unavailable",
                        href: local
                            ? `/products/${key}`
                            : `/alif/products/${key}`,
                        imageUrl: null,
                        price: null,
                        stock: null,
                    };

                    try {
                        const path = local
                            ? `/products/${key}`
                            : `/alif/products/${key}`;

                        const result = await fetch(
                            `${base}${path}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                                cache: "no-store",
                                signal: AbortSignal.timeout(8000),
                            },
                        );

                        if (!result.ok) return fallback;

                        const data = await result.json();
                        const product = local
                            ? data
                            : data.response;

                        if (!product) return fallback;

                        const image = local
                            ? product.imageUrl
                            : product.images?.[0];

                        const stock = local
                            ? amount(product.quantity)
                            : null;

                        return {
                            ...fallback,

                            name:
                                typeof product.name === "string" &&
                                product.name.trim()
                                    ? product.name
                                    : fallback.name,

                            imageUrl:
                                typeof image === "string" &&
                                image.trim()
                                    ? image.trim()
                                    : null,

                            price: amount(
                                local
                                    ? product.price
                                    : product.final_price,
                            ),

                            stock:
                                stock !== null &&
                                Number.isInteger(stock)
                                    ? stock
                                    : null,
                        };
                    } catch {
                        return fallback;
                    }
                }),
            );

        return NextResponse.json(
            { products },
            { headers },
        );
    } catch {
        return NextResponse.json(
            { message: "Could not connect to the backend" },
            { status: 502, headers },
        );
    }
}