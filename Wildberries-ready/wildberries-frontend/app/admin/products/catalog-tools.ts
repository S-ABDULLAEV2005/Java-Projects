import type { ManagedProduct } from "./ProductManager";

export type StockFilter = "all" | "in" | "out" | "low";

export type SortOrder =
    | "newest"
    | "name"
    | "price-asc"
    | "price-desc"
    | "stock";

export function safeImage(value: unknown): string {
    if (typeof value !== "string") return "";

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
            : "";
    } catch {
        return "";
    }
}

export function money(value: unknown): string {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return "Price unavailable";
    }

    if (typeof value === "string" && !value.trim()) {
        return "Price unavailable";
    }

    const price = Number(value);

    return Number.isFinite(price) && price >= 0
        ? `${price.toLocaleString("en-US", {
            maximumFractionDigits: 2,
        })} TJS`
        : "Price unavailable";
}

function normalize(value: string) {
    return value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

export function filterCatalog(
    products: ManagedProduct[],
    query: string,
    categoryId: string,
    stock: StockFilter,
    sort: SortOrder,
) {
    const terms = normalize(query).split(" ").filter(Boolean);

    const matches = products.filter((product) => {
        const text = normalize([
            `#${product.id}`,
            product.name,
            product.brand || "",
            product.category?.name || "",
        ].join(" "));

        const quantity = Number(product.quantity);

        return (
            terms.every((term) => text.includes(term)) &&
            (!categoryId ||
                String(product.category?.id) === categoryId) &&
            (
                stock === "all" ||
                (stock === "in" && quantity > 0) ||
                (stock === "out" && quantity === 0) ||
                (stock === "low" && quantity > 0 && quantity <= 5)
            )
        );
    });

    return matches.sort((a, b) => {
        if (sort === "name") {
            return a.name.localeCompare(b.name, "en") || a.id - b.id;
        }

        if (sort === "stock") {
            return Number(a.quantity) - Number(b.quantity) ||
                b.id - a.id;
        }

        if (sort === "price-asc" || sort === "price-desc") {
            const price = (product: ManagedProduct) => {
                const value = Number(product.price);

                return (
                    product.price != null &&
                    Number.isFinite(value) &&
                    value >= 0
                )
                    ? value
                    : sort === "price-asc"
                        ? Infinity
                        : -Infinity;
            };

            const difference = sort === "price-asc"
                ? price(a) - price(b)
                : price(b) - price(a);

            return difference || b.id - a.id;
        }

        return b.id - a.id;
    });
}