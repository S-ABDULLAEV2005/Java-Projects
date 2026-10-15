import type { Product } from "../_types/product";

export type FinderPriority = "price" | "rating";

export function catalogPrice(value: unknown): number | null {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return null;
    }

    if (typeof value === "string" && !value.trim()) {
        return null;
    }

    const price = Number(value);

    return Number.isFinite(price) && price >= 0
        ? price
        : null;
}

function rating(product: Product) {
    const values = (product.feedbacks ?? [])
        .map((feedback) => Number(feedback.rating))
        .filter(
            (value) =>
                Number.isFinite(value) &&
                value > 0 &&
                value <= 5,
        );

    return {
        average: values.length
            ? values.reduce((sum, value) => sum + value, 0) /
            values.length
            : -1,
        count: values.length,
    };
}

export function finderCategories(products: Product[]) {
    const categories = new Map<
        number,
        { id: number; name: string; count: number }
    >();

    for (const product of products) {
        if (!product.category) continue;

        const existing = categories.get(product.category.id);

        if (existing) {
            existing.count += 1;
        } else {
            categories.set(product.category.id, {
                ...product.category,
                count: 1,
            });
        }
    }

    return [...categories.values()].sort((a, b) =>
        a.name.localeCompare(b.name, "en"),
    );
}

export function findProducts(
    products: Product[],
    categoryId: number | null,
    budget: number | null,
    priority: FinderPriority,
): Product[] {
    if (
        budget !== null &&
        (!Number.isFinite(budget) || budget < 0)
    ) {
        return [];
    }

    const matches = products.filter((product) => {
        const price = catalogPrice(product.price);

        return (
            price !== null &&
            Number(product.quantity) > 0 &&
            (
                categoryId === null ||
                product.category?.id === categoryId
            ) &&
            (budget === null || price <= budget)
        );
    });

    return matches.sort((a, b) => {
        if (priority === "rating") {
            const first = rating(a);
            const second = rating(b);

            const difference =
                second.average - first.average ||
                second.count - first.count;

            if (difference) return difference;
        }

        return (
            catalogPrice(a.price)! - catalogPrice(b.price)! ||
            a.id - b.id
        );
    });
}