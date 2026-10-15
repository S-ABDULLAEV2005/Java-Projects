import type { Product } from "../_types/product";

export type SearchSuggestion = {
    id: number;
    name: string;
    brand: string | null;
    category: string | null;
    imageUrl: string | null;
    price: number | null;
    stock: number | null;
};

export type SearchResponse = {
    items: SearchSuggestion[];
    total: number;
};

function normalize(value: unknown) {
    return typeof value === "string"
        ? value
            .normalize("NFKC")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim()
        : "";
}

export function searchProducts(
    products: Product[],
    query: string,
): SearchResponse {
    const normalized = normalize(query);
    const terms = normalized.split(" ").filter(Boolean);

    if (normalized.length < 2) {
        return { items: [], total: 0 };
    }

    const matches = products.filter((product) => {
        if (
            !product ||
            !Number.isSafeInteger(product.id) ||
            product.id <= 0 ||
            typeof product.name !== "string"
        ) {
            return false;
        }

        const text = normalize(
            [
                product.name,
                product.brand || "",
                product.category?.name || "",
            ].join(" "),
        );

        return terms.every((term) => text.includes(term));
    });

    const score = (product: Product) =>
        normalize(product.name).startsWith(normalized)
            ? 0
            : normalize(product.name).includes(normalized)
                ? 1
                : 2;

    matches.sort(
        (a, b) => score(a) - score(b) || a.id - b.id,
    );

    return {
        total: matches.length,

        items: matches.slice(0, 6).map((product) => {
            const raw = product.price as unknown;

            const price =
                typeof raw === "number" ||
                (typeof raw === "string" && raw.trim())
                    ? Number(raw)
                    : NaN;

            const stock = product.quantity as unknown;

            return {
                id: product.id,
                name: product.name,
                brand: product.brand || null,
                category: product.category?.name || null,

                imageUrl:
                    typeof product.imageUrl === "string" &&
                    product.imageUrl.trim()
                        ? product.imageUrl.trim()
                        : null,

                price:
                    Number.isFinite(price) && price >= 0
                        ? price
                        : null,

                stock:
                    typeof stock === "number" &&
                    Number.isInteger(stock) &&
                    stock >= 0
                        ? stock
                        : null,
            };
        }),
    };
}