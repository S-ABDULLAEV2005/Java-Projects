import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export type HeaderProduct = {
    id: number;
    marketplace: "WILDMARKET" | "ALIFSHOP";
    productKey: string;
    name: string;
    href: string;
    imageUrl: string | null;
    price: number | null;
    stock: number | null;
};

function amount(value: unknown): number | null {
    if (
        (typeof value !== "number" && typeof value !== "string") ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= 0
        ? number
        : null;
}

function imageUrl(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const src = value.trim();

    if (
        src.startsWith("/") &&
        !src.startsWith("//") &&
        !src.includes("\\")
    ) {
        return src;
    }

    try {
        const url = new URL(src);

        return (
            ["http:", "https:"].includes(url.protocol) &&
            !url.username &&
            !url.password
        )
            ? src
            : null;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const headers = {
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
    };

    const reply = (body: unknown, status = 200) =>
        NextResponse.json(body, { status, headers });

    const view = request.nextUrl.searchParams.get("view");

    if (view !== "account" && view !== "favorites") {
        return reply({ message: "Route not found" }, 404);
    }

    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        return reply({ message: "Please sign in" }, 401);
    }

    const backend = process.env.BACKEND_URL;

    if (!backend) {
        return reply({ message: "Backend URL is missing" }, 500);
    }

    const base = backend.replace(/\/+$/, "");
    const deadline = AbortSignal.timeout(12000);

    const get = (path: string) =>
        fetch(`${base}${path}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: deadline,
        });

    try {
        const response = await get(
            view === "account"
                ? "/auth/me"
                : "/shopping/favorites",
        );

        if (!response.ok) {
            return reply(
                {
                    message: response.status === 401
                        ? "Please sign in again"
                        : "Could not load this panel",
                },
                response.status,
            );
        }

        const data = await response.json();

        if (view === "account") {
            if (
                typeof data?.username !== "string" ||
                !data.username.trim()
            ) {
                throw new Error("Invalid account response");
            }

            return reply({
                username: data.username,
                isAdmin:
                    Array.isArray(data.authorities) &&
                    data.authorities.some(
                        (role: { authority?: string } | null) =>
                            role?.authority === "ROLE_ADMIN",
                    ),
            });
        }

        if (!Array.isArray(data)) {
            throw new Error("Invalid favorites response");
        }

        const items = data.slice(0, 20);
        const products: HeaderProduct[] = [];

        // Load at most four product details simultaneously.
        for (let offset = 0; offset < items.length; offset += 4) {
            const batch = await Promise.all(
                items.slice(offset, offset + 4).map(async (item) => {
                    const local = item.marketplace === "WILDMARKET";
                    const key = encodeURIComponent(
                        String(item.productKey),
                    );

                    const path = `${
                        local ? "/products/" : "/alif/products/"
                    }${key}`;

                    const fallback: HeaderProduct = {
                        id: item.id,
                        marketplace: item.marketplace,
                        productKey: String(item.productKey),
                        name: "Product currently unavailable",
                        href: path,
                        imageUrl: null,
                        price: null,
                        stock: null,
                    };

                    try {
                        const result = await get(path);

                        if (!result.ok) return fallback;

                        const body = await result.json();
                        const product = local ? body : body.response;

                        const stock = local
                            ? amount(product?.quantity)
                            : null;

                        return {
                            ...fallback,
                            name:
                                typeof product?.name === "string" &&
                                product.name.trim()
                                    ? product.name
                                    : fallback.name,
                            imageUrl: imageUrl(
                                local
                                    ? product?.imageUrl
                                    : product?.images?.[0],
                            ),
                            price: amount(
                                local
                                    ? product?.price
                                    : product?.final_price,
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

            products.push(...batch);
        }

        return reply({ products });
    } catch {
        return reply(
            {
                message:
                    "Could not connect to the backend. Please try again.",
            },
            502,
        );
    }
}