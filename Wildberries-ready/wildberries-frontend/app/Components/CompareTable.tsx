"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageOff, X } from "lucide-react";

import {
    clearCompare,
    compareHref,
    compareKey,
    removeCompare,
    useComparison,
    type CompareProduct,
} from "../_lib/compare-store";

import styles from "./product-compare.module.css";

function ProductImage({
                          product,
                      }: {
    product: CompareProduct;
}) {
    const [broken, setBroken] = useState(false);

    return (
        <div className={styles.image}>
            {product.imageUrl && !broken ? (
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="200px"
                    onError={() => setBroken(true)}
                />
            ) : (
                <ImageOff size={32} aria-hidden="true" />
            )}
        </div>
    );
}

const rows: {
    label: string;
    value: (product: CompareProduct) => string;
}[] = [
    {
        label: "Marketplace",
        value: (product) =>
            product.marketplace === "WILDMARKET"
                ? "WildMarket"
                : "AlifShop",
    },
    {
        label: "Price",
        value: (product) =>
            product.price == null
                ? "Not provided"
                : `${product.price.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                })} TJS`,
    },
    {
        label: "Brand",
        value: (product) => product.brand || "Not provided",
    },
    {
        label: "Category",
        value: (product) => product.category || "Not provided",
    },
    {
        label: "Rating",
        value: (product) =>
            product.rating
                ? `${product.rating} / 5`
                : "Not rated",
    },
    {
        label: "Reviews",
        value: (product) => String(product.reviewCount),
    },
    {
        label: "Availability",
        value: (product) =>
            product.availability === "IN_STOCK"
                ? "In stock"
                : product.availability === "OUT_OF_STOCK"
                    ? "Out of stock"
                    : "Not confirmed",
    },
];

export default function CompareTable() {
    const { items, ready, message } = useComparison();

    const [differencesOnly, setDifferencesOnly] =
        useState(false);

    if (!ready) {
        return <p role="status">Loading your comparison…</p>;
    }

    if (items.length === 0) {
        return (
            <div className={styles.empty}>
                <span className={styles.srOnly} role="status">
                    {message}
                </span>

                <h2>No products selected</h2>

                <p>
                    Choose up to three products using the
                    Compare buttons in either catalog.
                </p>

                <Link
                    href="/products"
                    className={styles.primary}
                >
                    Browse WildMarket
                </Link>

                <Link
                    href="/alif"
                    className={styles.secondary}
                >
                    Browse AlifShop
                </Link>
            </div>
        );
    }

    const visibleRows = rows.filter(
        (row) =>
            !differencesOnly ||
            items.length < 2 ||
            new Set(items.map(row.value)).size > 1,
    );

    return (
        <>
            <div className={styles.toolbar}>
                <label>
                    <input
                        type="checkbox"
                        checked={differencesOnly}
                        disabled={items.length < 2}
                        onChange={(event) =>
                            setDifferencesOnly(
                                event.target.checked,
                            )
                        }
                    />

                    Show differences only
                </label>

                <button
                    type="button"
                    className={styles.clear}
                    onClick={clearCompare}
                >
                    Clear comparison
                </button>
            </div>

            {items.length === 1 && (
                <p>
                    Select another product from either
                    catalog to compare.
                </p>
            )}

            <p className={styles.message} role="status">
                {message}
            </p>

            <div
                className={styles.scroll}
                role="region"
                aria-label={
                    "Product comparison table, scroll horizontally on smaller screens"
                }
                tabIndex={0}
            >
                <table className={styles.table}>
                    <caption className={styles.srOnly}>
                        Compare selected products using
                        available catalog information
                    </caption>

                    <thead>
                    <tr>
                        <th scope="col">
                            Product details
                        </th>

                        {items.map((product) => (
                            <th
                                key={compareKey(product)}
                                scope="col"
                            >
                                <button
                                    type="button"
                                    className={styles.remove}
                                    onClick={() =>
                                        removeCompare(product)
                                    }
                                    aria-label={
                                        `Remove ${product.name}`
                                    }
                                >
                                    <X
                                        size={18}
                                        aria-hidden="true"
                                    />
                                </button>

                                <ProductImage
                                    key={
                                        product.imageUrl ??
                                        compareKey(product)
                                    }
                                    product={product}
                                />

                                <Link
                                    href={compareHref(product)}
                                    className={
                                        styles.productName
                                    }
                                >
                                    {product.name}
                                </Link>

                                <Link
                                    href={compareHref(product)}
                                    className={styles.details}
                                >
                                    View details →
                                </Link>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {visibleRows.map((row) => {
                        const different =
                            new Set(
                                items.map(row.value),
                            ).size > 1;

                        return (
                            <tr
                                key={row.label}
                                className={
                                    different
                                        ? styles.different
                                        : ""
                                }
                            >
                                <th scope="row">
                                    {row.label}
                                </th>

                                {items.map((product) => (
                                    <td
                                        key={compareKey(product)}
                                    >
                                        {row.value(product)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {visibleRows.length === 0 && (
                <p>
                    The selected products match across the
                    available comparison fields.
                </p>
            )}

            <p className={styles.note}>
                Prices, ratings, and availability reflect
                the catalog data when you selected each
                product. Open its details for current
                information. Selections are saved in this
                browser, independently of your account.
            </p>
        </>
    );
}