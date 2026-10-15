import { NextRequest, NextResponse } from "next/server";

import { searchProducts } from "../../_lib/search-products";
import type { Product } from "../../_types/product";

export async function GET(request: NextRequest) {
    const query = (
        request.nextUrl.searchParams.get("q") || ""
    )
        .trim()
        .slice(0, 200);

    const headers = {
        "Cache-Control": "no-store",
    };

    if (query.length < 2) {
        return NextResponse.json(
            { items: [], total: 0 },
            { headers },
        );
    }

    const base = process.env.BACKEND_URL;

    if (!base) {
        return NextResponse.json(
            { message: "Search is temporarily unavailable" },
            { status: 500, headers },
        );
    }

    try {
        const response = await fetch(
            `${base.replace(/\/+$/, "")}/products`,
            {
                cache: "no-store",
                signal: AbortSignal.timeout(8000),
            },
        );

        if (!response.ok) {
            throw new Error("Catalog unavailable");
        }

        const products: Product[] = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Invalid catalog response");
        }

        return NextResponse.json(
            searchProducts(products, query),
            { headers },
        );
    } catch {
        return NextResponse.json(
            { message: "Search is temporarily unavailable" },
            { status: 502, headers },
        );
    }
}