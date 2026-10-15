import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageOff, Star } from "lucide-react";

import ProductActions from "./ProductActions";
import ProductQuickView from "./ProductQuickView";
import type { Product } from "../_types/product";
import CompareButton from "./CompareButton";
import compareStyles from "./product-compare.module.css";
function calculateRating(product: Product) {
    const ratings = (product.feedbacks ?? [])
        .map((feedback) => Number(feedback.rating))
        .filter(
            (rating) =>
                Number.isFinite(rating) && rating > 0,
        );

    if (!ratings.length) return null;

    return (
        ratings.reduce((total, rating) => total + rating, 0) /
        ratings.length
    ).toFixed(1);
}

export default function ProductCard({
                                        product,
                                    }: {
    product: Product;
}) {
    const rating = calculateRating(product);
    const feedbackCount = product.feedbacks?.length ?? 0;
    const available = product.quantity > 0;
    const href = `/products/${product.id}`;
    const price = Number(product.price);

    return (
        <article className="store-product-card">
            <Link
                href={href}
                className="store-product-image"
                aria-label={`View ${product.name}`}
            >
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
                        className="store-product-photo"
                    />
                ) : (
                    <div className="store-product-image-empty">
                        <ImageOff
                            size={32}
                            aria-hidden="true"
                        />
                        <span>No image available</span>
                    </div>
                )}

                <span
                    className={`store-stock-badge ${
                        available ? "" : "is-unavailable"
                    }`}
                >
                    {available ? "In stock" : "Out of stock"}
                </span>

                <span
                    className="store-product-open-icon"
                    aria-hidden="true"
                >
                    <ArrowUpRight size={18} />
                </span>
            </Link>

            <div className="store-product-content">
                <p className="store-product-meta">
                    {[product.category?.name, product.brand]
                        .filter(Boolean)
                        .join(" · ") || "WildMarket"}
                </p>

                <Link
                    href={href}
                    className="store-product-title-link"
                >
                    <h2>{product.name}</h2>
                </Link>

                <div className="store-product-rating-row">
                    <Star
                        size={14}
                        fill={rating ? "currentColor" : "none"}
                        aria-hidden="true"
                    />

                    <span>{rating ?? "Not rated"}</span>
                    <small>({feedbackCount})</small>
                </div>

                <p className="store-card-price">
                    {Number.isFinite(price) && price >= 0
                        ? `${price.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                        })} TJS`
                        : "Price unavailable"}
                </p>

                <div className={`${compareStyles.discovery} store-card-discovery`}>
                    <ProductQuickView
                        product={{
                            marketplace: "WILDMARKET",
                            productKey: String(product.id),
                            name: product.name,
                            href,
                            imageUrl: product.imageUrl,
                            price:
                                Number.isFinite(price) && price >= 0
                                    ? price
                                    : null,
                            rating,
                            reviewCount: feedbackCount,
                            category: product.category?.name,
                            brand: product.brand,
                            description: product.description,
                            available,
                            stock: product.quantity,
                        }}
                    />

                    <CompareButton
                        product={{
                            marketplace: "WILDMARKET",
                            productKey: String(product.id),
                            name: product.name,
                            imageUrl: product.imageUrl,
                            price:
                                Number.isFinite(price) && price >= 0
                                    ? price
                                    : null,
                            rating,
                            reviewCount: feedbackCount,
                            brand: product.brand,
                            category: product.category?.name,
                            availability: available
                                ? "IN_STOCK"
                                : "OUT_OF_STOCK",
                        }}
                    />
                </div>

                <ProductActions
                    marketplace="WILDMARKET"
                    productKey={String(product.id)}
                    name={product.name}
                    available={product.quantity > 0}
                />
            </div>
        </article>
    );
}