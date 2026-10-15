"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ImageOff, Plus } from "lucide-react";

import ProductQuickView, {
    type QuickViewProduct,
} from "./ProductQuickView";

import DeskSceneArt, {
    type DeskKind,
} from "./DeskSceneArt";

import type { Product } from "../_types/product";
import styles from "./shop-the-scene.module.css";

// IDs from your actual catalog.
// Change these when curating a different desk setup.
const selection: {
    id: number;
    kind: DeskKind;
    x: number;
    y: number;
}[] = [
    { id: 5, kind: "laptop", x: 44, y: 40 },
    { id: 7, kind: "keyboard", x: 40, y: 74 },
    { id: 6, kind: "mouse", x: 67, y: 71 },
    { id: 3, kind: "headphones", x: 82, y: 43 },
];

function preview(product: Product): QuickViewProduct {
    const raw = product.price as unknown;

    const price =
        typeof raw === "number" ||
        (typeof raw === "string" && raw.trim())
            ? Number(raw)
            : NaN;

    const ratings = (product.feedbacks ?? [])
        .map((feedback) => Number(feedback.rating))
        .filter(
            (value) => Number.isFinite(value) && value > 0,
        );

    return {
        marketplace: "WILDMARKET",
        productKey: String(product.id),
        name: product.name,
        href: `/products/${product.id}`,
        imageUrl: product.imageUrl,

        price:
            Number.isFinite(price) && price >= 0
                ? price
                : null,

        rating: ratings.length
            ? (
                ratings.reduce(
                    (sum, value) => sum + value,
                    0,
                ) / ratings.length
            ).toFixed(1)
            : null,

        reviewCount: product.feedbacks?.length ?? 0,
        category: product.category?.name,
        brand: product.brand,
        description: product.description,
        available: product.quantity > 0,
        stock: product.quantity,
    };
}

function ScenePhoto({
                        product,
                    }: {
    product: Product;
}) {
    const [failedSource, setFailedSource] = useState<
        string | null
    >(null);

    return product.imageUrl &&
    failedSource !== product.imageUrl ? (
        <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="80px"
            onError={() =>
                setFailedSource(product.imageUrl)
            }
        />
    ) : (
        <ImageOff size={25} aria-hidden="true" />
    );
}

export default function ShopTheScene({
                                         products,
                                     }: {
    products: Product[];
}) {
    const entries = selection.flatMap((slot) => {
        const product = products.find(
            (item) => item.id === slot.id,
        );

        return product
            ? [
                {
                    ...slot,
                    product,
                    quickView: preview(product),
                },
            ]
            : [];
    });

    if (!entries.length) return null;

    return (
        <section
            className={styles.section}
            aria-labelledby="shop-scene-title"
        >
            <header className={styles.heading}>
                <div>
                    <p className={styles.eyebrow}>
                        Ideas you can explore
                    </p>

                    <h2 id="shop-scene-title">
                        Shop the scene
                    </h2>

                    <p>
                        A little inspiration for your desk.
                        Tap a numbered marker to explore its
                        product.
                    </p>
                </div>

                <Link
                    href="/products"
                    className={styles.browse}
                >
                    Browse the catalog
                    <ArrowRight
                        size={17}
                        aria-hidden="true"
                    />
                </Link>
            </header>

            <div className={styles.layout}>
                <div>
                    <div className={styles.scene}>
                        <DeskSceneArt
                            kinds={entries.map(
                                (entry) => entry.kind,
                            )}
                        />

                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={styles.marker}
                                style={{
                                    left: `${entry.x}%`,
                                    top: `${entry.y}%`,
                                }}
                            >
                                <ProductQuickView
                                    product={entry.quickView}
                                    triggerClassName={
                                        styles.hotspot
                                    }
                                    showTriggerIcon={false}
                                    triggerLabel={
                                        <>
                                            <span>
                                                {index + 1}
                                            </span>

                                            <Plus
                                                size={14}
                                                aria-hidden="true"
                                            />
                                        </>
                                    }
                                />
                            </div>
                        ))}

                        <span className={styles.sceneLabel}>
                            Desk essentials
                        </span>
                    </div>

                    <p className={styles.note}>
                        Stylized illustrations, not exact
                        model photos. Plant, frame, desk,
                        and cup are decorative.
                    </p>
                </div>

                <div
                    className={styles.products}
                    aria-label="Products in this scene"
                >
                    {entries.map((entry, index) => (
                        <article
                            key={entry.id}
                            className={styles.product}
                        >
                            <div className={styles.productTop}>
                                <span className={styles.number}>
                                    {index + 1}
                                </span>

                                <Link
                                    href={entry.quickView.href}
                                    className={styles.photo}
                                    aria-label={`View ${entry.product.name}`}
                                >
                                    <ScenePhoto
                                        product={entry.product}
                                    />
                                </Link>

                                <div className={styles.copy}>
                                    <small>
                                        {entry.product.brand ||
                                            entry.product.category
                                                ?.name ||
                                            "WildMarket"}
                                    </small>

                                    <Link
                                        href={entry.quickView.href}
                                    >
                                        <h3>
                                            {entry.product.name}
                                        </h3>
                                    </Link>

                                    <strong>
                                        {entry.quickView.price ===
                                        null
                                            ? "Price unavailable"
                                            : `${entry.quickView.price.toLocaleString(
                                                "en-US",
                                                {
                                                    maximumFractionDigits: 2,
                                                },
                                            )} TJS`}
                                    </strong>

                                    <span>
                                        {entry.product.quantity > 0
                                            ? `${entry.product.quantity} in stock`
                                            : "Out of stock"}
                                    </span>
                                </div>
                            </div>

                            <ProductQuickView
                                product={entry.quickView}
                                triggerLabel="Explore product"
                                triggerClassName={styles.explore}
                            />
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}