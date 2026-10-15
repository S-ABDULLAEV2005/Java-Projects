"use client";

import { useSyncExternalStore } from "react";

export type CompareProduct = {
    marketplace: "WILDMARKET" | "ALIFSHOP";
    productKey: string;
    name: string;
    imageUrl: string | null;
    price: number | null;
    rating: string | null;
    reviewCount: number;
    brand?: string | null;
    category?: string | null;
    availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
};

type State = {
    items: CompareProduct[];
    message: string;
    ready: boolean;
};

const STORAGE_KEY = "wildmarket.compare.v1";

const SERVER: State = {
    items: [],
    message: "",
    ready: false,
};

let snapshot: State | null = null;

const listeners = new Set<() => void>();

export function compareKey(
    product: Pick<CompareProduct, "marketplace" | "productKey">,
) {
    return `${product.marketplace}:${product.productKey}`;
}

export function compareHref(product: CompareProduct) {
    const key = encodeURIComponent(product.productKey);

    return product.marketplace === "WILDMARKET"
        ? `/products/${key}`
        : `/alif/products/${key}`;
}

function text(value: unknown) {
    return typeof value === "string"
        ? value.trim().slice(0, 250)
        : "";
}

function validProduct(value: unknown): CompareProduct | null {
    if (!value || typeof value !== "object") return null;

    const data = value as Record<string, unknown>;
    const marketplace = data.marketplace;
    const productKey = text(data.productKey);
    const name = text(data.name);

    if (
        (marketplace !== "WILDMARKET" &&
            marketplace !== "ALIFSHOP") ||
        !name ||
        !productKey
    ) {
        return null;
    }

    if (
        marketplace === "WILDMARKET" &&
        !/^[1-9]\d*$/.test(productKey)
    ) {
        return null;
    }

    let imageUrl: string | null = null;

    if (typeof data.imageUrl === "string") {
        const candidate = data.imageUrl.trim().slice(0, 2048);

        if (/^\/(?!\/)/.test(candidate)) {
            imageUrl = candidate;
        } else {
            try {
                const url = new URL(candidate);

                if (
                    url.protocol === "https:" ||
                    url.protocol === "http:"
                ) {
                    imageUrl = url.href;
                }
            } catch {
                // Invalid stored image: use the fallback.
            }
        }
    }

    const rating = Number(data.rating);

    return {
        marketplace,
        productKey,
        name,
        imageUrl,

        price:
            typeof data.price === "number" &&
            Number.isFinite(data.price) &&
            data.price >= 0
                ? data.price
                : null,

        rating:
            Number.isFinite(rating) &&
            rating > 0 &&
            rating <= 5
                ? rating.toFixed(1)
                : null,

        reviewCount:
            typeof data.reviewCount === "number" &&
            Number.isFinite(data.reviewCount)
                ? Math.max(0, Math.floor(data.reviewCount))
                : 0,

        brand: text(data.brand) || null,
        category: text(data.category) || null,

        availability:
            marketplace === "WILDMARKET" &&
            data.availability === "IN_STOCK"
                ? "IN_STOCK"
                : marketplace === "WILDMARKET" &&
                data.availability === "OUT_OF_STOCK"
                    ? "OUT_OF_STOCK"
                    : "UNKNOWN",
    };
}

function restore(raw: string | null) {
    try {
        const values: unknown = JSON.parse(raw ?? "[]");

        if (!Array.isArray(values)) return [];

        const items = new Map<string, CompareProduct>();

        for (const value of values.slice(0, 30)) {
            const product = validProduct(value);

            if (product) {
                items.set(compareKey(product), product);
            }

            if (items.size === 3) break;
        }

        return Array.from(items.values());
    } catch {
        return [];
    }
}

function getSnapshot(): State {
    if (typeof window === "undefined") return SERVER;

    if (!snapshot) {
        let items: CompareProduct[] = [];

        try {
            items = restore(
                window.localStorage.getItem(STORAGE_KEY),
            );
        } catch {
            // Continue with tab-only storage.
        }

        snapshot = {
            items,
            message: "",
            ready: true,
        };
    }

    return snapshot;
}

function emit() {
    listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
    if (
        event.key !== STORAGE_KEY &&
        event.key !== null
    ) {
        return;
    }

    snapshot = {
        items: restore(event.newValue),
        message: "Comparison updated in another tab.",
        ready: true,
    };

    emit();
}

function subscribe(listener: () => void) {
    listeners.add(listener);

    if (listeners.size === 1) {
        window.addEventListener("storage", onStorage);
    }

    return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
            window.removeEventListener("storage", onStorage);
        }
    };
}

function commit(items: CompareProduct[], message: string) {
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(items),
        );
    } catch {
        message += " Selections are saved for this tab only.";
    }

    snapshot = {
        items,
        message,
        ready: true,
    };

    emit();
}

export function toggleCompare(product: CompareProduct) {
    const current = getSnapshot();
    const item = validProduct(product);

    if (!item) return;

    const existing = current.items.some(
        (entry) => compareKey(entry) === compareKey(item),
    );

    if (existing) {
        removeCompare(item);
        return;
    }

    if (current.items.length >= 3) {
        snapshot = {
            ...current,
            message:
                "You can compare up to 3 products. Remove one to add another.",
        };

        emit();
        return;
    }

    commit(
        [...current.items, item],
        `${item.name} added to comparison.`,
    );
}

export function removeCompare(product: CompareProduct) {
    commit(
        getSnapshot().items.filter(
            (item) =>
                compareKey(item) !== compareKey(product),
        ),
        `${product.name} removed.`,
    );
}

export function clearCompare() {
    commit([], "Comparison cleared.");
}

export function useComparison() {
    return useSyncExternalStore(
        subscribe,
        getSnapshot,
        () => SERVER,
    );
}