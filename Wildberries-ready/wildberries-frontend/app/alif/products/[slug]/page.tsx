import Link from "next/link";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

import ProductActions from "../../../Components/ProductActions";
import AlifProductGallery from "../../../Components/AlifProductGallery";
import AlifProductCard from "../../../Components/AlifProductCard";
import ProductDetailsSections from "../../../Components/ProductDetailsSections";

import { fetchAlif } from "../../../_lib/alif-api";

import type {
    AlifProduct,
    AlifProductDetailsResponse,
    AlifProductsResponse,
    AlifReviewsResponse,
} from "../../../_types/alif";

import styles from "../../../Components/product-details-upgrade.module.css";

type Props = {
    params: Promise<{ slug: string }>;
};

function formatMoney(value: unknown) {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return "Price unavailable";
    }

    if (typeof value === "string" && !value.trim()) {
        return "Price unavailable";
    }

    const amount = Number(value);

    return Number.isFinite(amount) && amount >= 0
        ? `${amount.toLocaleString("en-US", {
            maximumFractionDigits: 2,
        })} TJS`
        : "Price unavailable";
}

export default async function AlifProductDetailsPage({
                                                         params,
                                                     }: Props) {
    const { slug } = await params;
    const key = encodeURIComponent(slug);

    const [productResult, reviewsResult] =
        await Promise.allSettled([
            fetchAlif<AlifProductDetailsResponse>(
                `/alif/products/${key}`,
            ),
            fetchAlif<AlifReviewsResponse>(
                `/alif/products/${key}/reviews?page=1&limit=10`,
            ),
        ]);

    const product =
        productResult.status === "fulfilled"
            ? productResult.value?.response
            : null;

    if (!product) {
        return (
            <main className={styles.page}>
                <Link
                    href="/alif"
                    className={styles.categoryLink}
                >
                    <ArrowLeft
                        size={17}
                        aria-hidden="true"
                    />
                    Back to AlifShop
                </Link>

                <div
                    className={styles.empty}
                    role="alert"
                >
                    <h1>We couldn’t load this product</h1>
                    <p>Please try again in a moment.</p>

                    <Link href={`/alif/products/${key}`}>
                        Try again
                    </Link>
                </div>
            </main>
        );
    }

    const reviewsResponse =
        reviewsResult.status === "fulfilled"
            ? reviewsResult.value?.response
            : null;

    const reviewsFailed =
        !reviewsResponse ||
        !Array.isArray(reviewsResponse.items);

    const reviews = reviewsFailed
        ? []
        : reviewsResponse.items;

    const rawRating = Number(product.rating);

    const rating =
        Number.isFinite(rawRating) && rawRating > 0
            ? rawRating.toFixed(1)
            : null;

    const rawCount = Number(product.rating_count);

    const ratingCount =
        Number.isFinite(rawCount) && rawCount >= 0
            ? Math.floor(rawCount)
            : 0;

    const discount = Number(product.discount_percent);
    const monthly = Number(product.monthly_payment);

    const categorySlug = product.default_category?.slug;

    const categoryHref = categorySlug
        ? `/alif/categories/${encodeURIComponent(categorySlug)}`
        : "/alif";

    let related: AlifProduct[] | null = [];

    if (categorySlug) {
        try {
            const data = await fetchAlif<AlifProductsResponse>(
                `/alif/products?category=${encodeURIComponent(categorySlug)}&page=1&limit=8&sortType=popular`,
            );

            const items = data?.response?.products?.items;

            related = Array.isArray(items)
                ? items
                    .filter(
                        (item) =>
                            item.slug !== product.slug &&
                            item.id !== product.id &&
                            item.default_category?.slug ===
                            categorySlug,
                    )
                    .slice(0, 4)
                : null;
        } catch {
            related = null;
        }
    }

    return (
        <main className={styles.page}>
            <nav
                className={styles.breadcrumbs}
                aria-label="Breadcrumb"
            >
                <Link href="/alif">
                    <ArrowLeft
                        size={16}
                        aria-hidden="true"
                    />
                    AlifShop
                </Link>

                <span aria-hidden="true">/</span>

                <Link href={categoryHref}>
                    {product.default_category?.name ||
                        "Collection"}
                </Link>

                <span aria-hidden="true">/</span>
                <span aria-current="page">{product.name}</span>
            </nav>

            <article className={styles.hero}>
                <AlifProductGallery
                    key={slug}
                    images={product.images ?? []}
                    name={product.name}
                />

                <div className={styles.copy}>
                    <p className={styles.eyebrow}>
                        AlifShop collection
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

                        <span>
                            {ratingCount.toLocaleString("en-US")}{" "}
                            ratings
                        </span>

                        <a href="#product-reviews">
                            Read feedback
                        </a>
                    </div>

                    <div className={styles.pricePanel}>
                        <span>Current catalog price</span>

                        <strong className={styles.price}>
                            {formatMoney(product.final_price)}
                        </strong>

                        {Number.isFinite(discount) &&
                            discount > 0 &&
                            discount <= 100 && (
                                <p>
                                    Catalog discount: {discount}%
                                </p>
                            )}

                        {Number.isFinite(monthly) &&
                            monthly > 0 && (
                                <p>
                                    From {formatMoney(monthly)} per
                                    month on AlifShop.
                                </p>
                            )}
                    </div>

                    <ProductActions
                        marketplace="ALIFSHOP"
                        productKey={product.slug}
                        name={product.name}
                    />

                    <p className={styles.note}>
                        Availability is not provided by this
                        integration. AlifShop pricing and
                        installment conditions may vary.
                    </p>

                    <Link
                        href={categoryHref}
                        className={styles.categoryLink}
                    >
                        Explore this collection
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
                        value: "AlifShop",
                    },
                    {
                        label: "Product ID",
                        value: String(product.id),
                    },
                    {
                        label: "Category",
                        value:
                            product.default_category?.name ||
                            "Not provided",
                    },
                    {
                        label: "Availability",
                        value: "Not provided by this integration",
                    },
                ]}
            >
                <section
                    id="alif-reviews"
                    className="alif-detail-reviews"
                    aria-labelledby="alif-reviews-title"
                >
                    <div className="alif-store-section-heading">
                        <div>
                            <p className="alif-store-eyebrow">
                                Community voices
                            </p>

                            <h2 id="alif-reviews-title">
                                Customer feedback
                            </h2>
                        </div>

                        {!reviewsFailed && (
                            <span className="alif-store-caption">
                                {reviews.length} reviews loaded
                            </span>
                        )}
                    </div>

                    <div className="alif-detail-review-layout">
                        <aside
                            className="alif-detail-review-summary"
                            aria-label="Product rating summary"
                        >
                            <Star
                                size={24}
                                aria-hidden="true"
                            />

                            <strong>{rating ?? "—"}</strong>

                            <span>
                                {rating
                                    ? "Overall rating"
                                    : "Not yet rated"}
                            </span>

                            <small>
                                {ratingCount.toLocaleString(
                                    "en-US",
                                )}{" "}
                                ratings on AlifShop
                            </small>
                        </aside>

                        {reviewsFailed ? (
                            <div
                                className={styles.empty}
                                role="alert"
                            >
                                <h3>
                                    Feedback is temporarily
                                    unavailable
                                </h3>

                                <p>
                                    Please try loading this page
                                    again.
                                </p>

                                <Link
                                    href={`/alif/products/${key}`}
                                >
                                    Try again
                                </Link>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className={styles.empty}>
                                <h3>No written feedback yet</h3>

                                <p>
                                    This product may have ratings
                                    without written comments.
                                </p>
                            </div>
                        ) : (
                            <div className="alif-detail-review-list">
                                {reviews.map((review) => {
                                    const value = Number(
                                        review.rating,
                                    );

                                    const hasRating =
                                        Number.isFinite(value) &&
                                        value > 0;

                                    return (
                                        <article
                                            key={review.id}
                                            className="alif-detail-review-card"
                                        >
                                            <div className="alif-detail-review-top">
                                                <h3>
                                                    {review.user
                                                            ?.name ||
                                                        "AlifShop customer"}
                                                </h3>

                                                <span>
                                                    <Star
                                                        size={14}
                                                        fill={
                                                            hasRating
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                        aria-hidden="true"
                                                    />

                                                    {hasRating
                                                        ? value.toFixed(
                                                            1,
                                                        )
                                                        : "Not rated"}
                                                </span>
                                            </div>

                                            <p>
                                                {review.comment ||
                                                    review.text ||
                                                    "No written comment"}
                                            </p>

                                            <small>
                                                AlifShop review
                                            </small>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </ProductDetailsSections>

            {categorySlug && (
                <section
                    className={styles.related}
                    aria-labelledby="alif-related-title"
                >
                    <div className={styles.relatedHeading}>
                        <h2 id="alif-related-title">
                            More from this collection
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
                        <div className="alif-store-product-grid">
                            {related.map((item) => (
                                <AlifProductCard
                                    key={item.id}
                                    product={item}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.note}>
                            No other matching products were returned.
                            Explore the category for more.
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}