import ProductActions from "../../Components/ProductActions";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    Boxes,
    Check,
    ImageOff,
    MessageSquare,
    Package,
    ShieldCheck,
    Star,
    Tag,
    Truck,
} from "lucide-react";

import ProductFeedback from "../../Components/ProductFeedback";
import type {
    Feedback,
    Product,
} from "../../_types/product";

type ProductDetailsPageProps = {
    params: Promise<{
        id: string;
    }>;
};

async function getProduct(
    id: number,
): Promise<Product | null> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error(
            "BACKEND_URL is missing in .env.local",
        );
    }

    const response = await fetch(
        `${backendUrl}/products/${id}`,
        {
            cache: "no-store",
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Could not load product: ${response.status}`,
        );
    }

    return response.json();
}

function calculateRating(
    feedbacks: Feedback[],
): string | null {
    if (feedbacks.length === 0) {
        return null;
    }

    const totalRating = feedbacks.reduce(
        (total, feedback) =>
            total + Number(feedback.rating),
        0,
    );

    return (totalRating / feedbacks.length).toFixed(1);
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(Number(price));
}

export default async function ProductDetailsPage({
                                                     params,
                                                 }: ProductDetailsPageProps) {
    const { id } = await params;
    const productId = Number(id);

    if (Number.isNaN(productId)) {
        notFound();
    }

    const product = await getProduct(productId);

    if (!product) {
        notFound();
    }

    const feedbacks = product.feedbacks ?? [];
    const rating = calculateRating(feedbacks);
    const isAvailable = product.quantity > 0;

    return (
        <main className="store-product-detail-page">
            <section className="store-product-detail-container">
                <nav
                    className="store-product-breadcrumbs"
                    aria-label="Breadcrumb"
                >
                    <Link href="/products">
                        <ArrowLeft size={17} />
                        Products
                    </Link>

                    {product.category && (
                        <>
                            <span>/</span>

                            <Link
                                href={`/categories/${product.category.id}`}
                            >
                                {product.category.name}
                            </Link>
                        </>
                    )}

                    <span>/</span>
                    <span>{product.name}</span>
                </nav>

                <article className="store-product-detail">
                    <div className="store-product-gallery">
                        <div className="store-product-gallery-label">
                            <span>WildMarket collection</span>

                            <span>
                                Product #{product.id}
                            </span>
                        </div>

                        <div className="store-product-main-image">
                            {product.imageUrl ? (
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    priority
                                    unoptimized
                                    sizes="
                                        (max-width: 900px) 100vw,
                                        50vw
                                    "
                                />
                            ) : (
                                <div className="store-detail-image-empty">
                                    <ImageOff size={58} />
                                    <strong>
                                        No image available
                                    </strong>
                                </div>
                            )}
                        </div>

                        <div className="store-gallery-caption">
                            <ShieldCheck size={17} />

                            <span>
                                WildMarket product information
                            </span>
                        </div>
                    </div>

                    <div className="store-product-information">
                        <p className="store-catalog-eyebrow">
                            <Package size={15} />
                            Local WildMarket product
                        </p>

                        <h1>{product.name}</h1>

                        <div className="store-detail-rating-row">
                            <span className="store-detail-rating">
                                <Star
                                    size={16}
                                    fill={
                                        rating
                                            ? "currentColor"
                                            : "none"
                                    }
                                />

                                <strong>
                                    {rating ?? "New"}
                                </strong>
                            </span>

                            <span>
                                <MessageSquare size={16} />

                                {feedbacks.length}{" "}
                                {feedbacks.length === 1
                                    ? "review"
                                    : "reviews"}
                            </span>

                            <span
                                className={
                                    isAvailable
                                        ? "store-detail-stock available"
                                        : "store-detail-stock unavailable"
                                }
                            >
                                {isAvailable ? (
                                    <Check size={16} />
                                ) : (
                                    <Package size={16} />
                                )}

                                {isAvailable
                                    ? `${product.quantity} in stock`
                                    : "Out of stock"}
                            </span>
                        </div>

                        <div className="store-detail-meta">
                            {product.category && (
                                <Link
                                    href={`/categories/${product.category.id}`}
                                >
                                    <Boxes size={17} />
                                    {product.category.name}
                                </Link>
                            )}

                            {product.brand && (
                                <span>
                                    <Tag size={17} />
                                    {product.brand}
                                </span>
                            )}
                        </div>

                        <p className="store-detail-description">
                            {product.description ||
                                "No description is available for this product."}
                        </p>

                        <div className="store-detail-price-panel">
                            <div>
                                <span>Current price</span>

                                <strong>
                                    {formatPrice(product.price)} TJS
                                </strong>
                            </div>

                            <div
                                className={
                                    isAvailable
                                        ? "store-price-availability available"
                                        : "store-price-availability unavailable"
                                }
                            >
                                {isAvailable ? (
                                    <Check size={18} />
                                ) : (
                                    <Package size={18} />
                                )}

                                <span>
                                    {isAvailable
                                        ? "Available now"
                                        : "Currently unavailable"}
                                </span>
                            </div>
                        </div>
                        <div className="shopping-detail-actions">
                            <ProductActions
                                marketplace="WILDMARKET"
                                productKey={String(product.id)}
                                name={product.name}
                                available={product.quantity > 0}
                            />
                        </div>

                        <div className="store-detail-benefits">
                            <article>
                                <div>
                                    <ShieldCheck size={21} />
                                </div>

                                <span>
                                    <strong>
                                        Product information
                                    </strong>

                                    <small>
                                        WildMarket collection
                                    </small>
                                </span>
                            </article>

                            <article>
                                <div>
                                    <Truck size={21} />
                                </div>

                                <span>
                                    <strong>
                                        Local marketplace
                                    </strong>

                                    <small>
                                        WildMarket collection
                                    </small>
                                </span>
                            </article>
                        </div>

                        <Link
                            href={
                                product.category
                                    ? `/categories/${product.category.id}`
                                    : "/categories"
                            }
                            className="store-detail-category-button"
                        >
                            <Boxes size={18} />

                            {product.category
                                ? `More from ${product.category.name}`
                                : "Browse categories"}
                        </Link>
                    </div>
                </article>
            </section>

            <ProductFeedback key={product.id} productId={product.id} />
        </main>
    );
}