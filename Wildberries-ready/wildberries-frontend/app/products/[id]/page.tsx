import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

import ProductActions from "../../Components/ProductActions";
import ProductFeedback from "../../Components/ProductFeedback";
import ProductCard from "../../Components/ProductCard";
import ProductGallery from "../../Components/ProductGallery";
import ProductDetailsSections from "../../Components/ProductDetailsSections";

import type { Product } from "../../_types/product";

import styles from "../../Components/product-details-upgrade.module.css";

type Props = {
    params: Promise<{ id: string }>;
};

async function getProduct(id: number): Promise<Product | null> {
    const base = process.env.BACKEND_URL;

    if (!base) {
        throw new Error("BACKEND_URL is missing in .env.local");
    }

    const response = await fetch(
        `${base.replace(/\/+$/, "")}/products/${id}`,
        { cache: "no-store" },
    );

    if (response.status === 404) return null;

    if (!response.ok) {
        throw new Error(
            `Could not load product: ${response.status}`,
        );
    }

    return response.json();
}

async function getRelated(
    product: Product,
): Promise<Product[] | null> {
    if (!product.category) return [];

    try {
        const base = process.env.BACKEND_URL!.replace(
            /\/+$/,
            "",
        );

        const response = await fetch(
            `${base}/products/category/${product.category.id}`,
            {
                cache: "no-store",
                signal: AbortSignal.timeout(8000),
            },
        );

        if (!response.ok) return null;

        const data: Product[] = await response.json();
        if (!Array.isArray(data)) return null;

        return data
            .filter(
                (item) =>
                    item.id !== product.id &&
                    item.category?.id === product.category?.id,
            )
            .slice(0, 4);
    } catch {
        return null;
    }
}

export default async function ProductDetailsPage({
                                                     params,
                                                 }: Props) {
    const { id } = await params;
    const productId = Number(id);

    if (
        !/^[1-9]\d*$/.test(id) ||
        !Number.isSafeInteger(productId)
    ) {
        notFound();
    }

    const product = await getProduct(productId);

    if (!product) notFound();

    const related = await getRelated(product);
    const feedbacks = product.feedbacks ?? [];

    const ratings = feedbacks
        .map((feedback) => Number(feedback.rating))
        .filter(
            (value) => Number.isFinite(value) && value > 0,
        );

    const rating = ratings.length
        ? (
            ratings.reduce((sum, value) => sum + value, 0) /
            ratings.length
        ).toFixed(1)
        : null;

    const rawPrice = product.price as unknown;

    const amount =
        typeof rawPrice === "number" ||
        (typeof rawPrice === "string" && rawPrice.trim())
            ? Number(rawPrice)
            : NaN;

    const price =
        Number.isFinite(amount) && amount >= 0
            ? `${amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
            })} TJS`
            : "Price unavailable";

    const available = product.quantity > 0;

    const categoryHref = product.category
        ? `/categories/${product.category.id}`
        : "/categories";

    return (
        <main className={styles.page}>
            <nav
                className={styles.breadcrumbs}
                aria-label="Breadcrumb"
            >
                <Link href="/products">
                    <ArrowLeft size={16} aria-hidden="true" />
                    Products
                </Link>

                {product.category && (
                    <>
                        <span aria-hidden="true">/</span>

                        <Link href={categoryHref}>
                            {product.category.name}
                        </Link>
                    </>
                )}

                <span aria-hidden="true">/</span>
                <span aria-current="page">{product.name}</span>
            </nav>

            <article className={styles.hero}>
                <ProductGallery
                    key={product.id}
                    images={
                        product.imageUrl
                            ? [product.imageUrl]
                            : []
                    }
                    name={product.name}
                />

                <div className={styles.copy}>
                    <p className={styles.eyebrow}>
                        WildMarket collection · Product #{product.id}
                    </p>

                    <h1>{product.name}</h1>

                    <div className={styles.meta}>
                        <span className={styles.rating}>
                            <Star
                                size={17}
                                fill={
                                    rating ? "currentColor" : "none"
                                }
                                aria-hidden="true"
                            />

                            <strong>
                                {rating ?? "Not rated"}
                            </strong>
                        </span>

                        <a href="#product-reviews">
                            {feedbacks.length}{" "}
                            {feedbacks.length === 1
                                ? "review"
                                : "reviews"}
                        </a>

                        {product.brand && (
                            <span>{product.brand}</span>
                        )}
                    </div>

                    <span className={styles.stock}>
                        {available
                            ? `${product.quantity} in stock`
                            : "Out of stock"}
                    </span>

                    <div className={styles.pricePanel}>
                        <span>Current catalog price</span>
                        <strong className={styles.price}>
                            {price}
                        </strong>

                        <p>
                            Prices and stock are checked again
                            when placing an order.
                        </p>
                    </div>

                    <ProductActions
                        marketplace="WILDMARKET"
                        productKey={String(product.id)}
                        name={product.name}
                        available={available}
                    />

                    <Link
                        href={categoryHref}
                        className={styles.categoryLink}
                    >
                        Explore{" "}
                        {product.category?.name || "categories"}

                        <ArrowRight
                            size={17}
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            </article>

            <ProductDetailsSections
                description={product.description}
                information={[
                    {
                        label: "Marketplace",
                        value: "WildMarket",
                    },
                    {
                        label: "Product ID",
                        value: String(product.id),
                    },
                    {
                        label: "Brand",
                        value: product.brand || "Not provided",
                    },
                    {
                        label: "Category",
                        value:
                            product.category?.name ||
                            "Not provided",
                    },
                    {
                        label: "Stock",
                        value: available
                            ? `${product.quantity} available`
                            : "Out of stock",
                    },
                ]}
            >
                <ProductFeedback
                    key={product.id}
                    productId={product.id}
                />
            </ProductDetailsSections>

            {product.category && (
                <section
                    className={styles.related}
                    aria-labelledby="related-products-title"
                >
                    <div className={styles.relatedHeading}>
                        <h2 id="related-products-title">
                            More from {product.category.name}
                        </h2>

                        <Link href={categoryHref}>
                            View category →
                        </Link>
                    </div>

                    {related === null ? (
                        <p className={styles.note}>
                            Related products are temporarily
                            unavailable.
                        </p>
                    ) : related.length ? (
                        <div className="store-product-grid">
                            {related.map((item) => (
                                <ProductCard
                                    key={item.id}
                                    product={item}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.note}>
                            No other products in this category yet.
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}