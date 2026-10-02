import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    MessageSquare,
    PackageSearch,
    Star,
} from "lucide-react";
import ProductActions from "../../../Components/ProductActions";
import AlifProductGallery from "../../../Components/AlifProductGallery";
import { fetchAlif } from "../../../_lib/alif-api";
import type {
    AlifProductDetailsResponse,
    AlifReviewsResponse,
} from "../../../_types/alif";

type Props = {
    params: Promise<{ slug: string }>;
};

function formatMoney(value: unknown) {
    const amount = Number(value);

    return Number.isFinite(amount) && amount >= 0
        ? `${amount.toLocaleString("en-US", {
            maximumFractionDigits: 2,
        })} TJS`
        : "Price unavailable";
}

export default async function AlifProductDetailsPage({ params }: Props) {
    const { slug } = await params;
    const encodedSlug = encodeURIComponent(slug);

    const [productResult, reviewsResult] = await Promise.allSettled([
        fetchAlif<AlifProductDetailsResponse>(
            `/alif/products/${encodedSlug}`,
        ),
        fetchAlif<AlifReviewsResponse>(
            `/alif/products/${encodedSlug}/reviews?page=1&limit=10`,
        ),
    ]);

    const product =
        productResult.status === "fulfilled"
            ? productResult.value?.response
            : null;

    if (!product) {
        return (
            <main className="alif-store-page">
                <section className="store-container alif-store-content">
                    <Link href="/alif" className="alif-store-back">
                        <ArrowLeft size={16} />
                        AlifShop categories
                    </Link>

                    <div className="alif-store-empty" role="alert">
                        <PackageSearch size={34} aria-hidden="true" />
                        <h2>We couldn’t load this product</h2>
                        <p>Please try again in a moment.</p>

                        <Link
                            href={`/alif/products/${encodedSlug}`}
                            className="alif-store-button"
                        >
                            Try again <ArrowRight size={17} />
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    const reviewsResponse =
        reviewsResult.status === "fulfilled"
            ? reviewsResult.value?.response
            : null;

    const reviewsFailed = !reviewsResponse;
    const reviews = reviewsResponse?.items ?? [];

    const rawRating = Number(product.rating);
    const rating =
        Number.isFinite(rawRating) && rawRating > 0 ? rawRating : 0;

    const discount = Number(product.discount_percent);
    const monthlyPayment = Number(product.monthly_payment);

    const categoryHref = product.default_category?.slug
        ? `/alif/categories/${encodeURIComponent(product.default_category.slug)}`
        : "/alif";

    return (
        <main className="alif-store-page alif-detail-page">
            <div className="store-container alif-detail-container">
                <nav
                    className="alif-detail-breadcrumbs"
                    aria-label="Breadcrumb"
                >
                    <Link href="/alif">AlifShop</Link>
                    <ChevronRight size={13} aria-hidden="true" />

                    <Link href={categoryHref}>Collection</Link>
                    <ChevronRight size={13} aria-hidden="true" />

                    <span aria-current="page">{product.name}</span>
                </nav>

                <Link href={categoryHref} className="alif-store-back">
                    <ArrowLeft size={16} />
                    Back to products
                </Link>

                <article className="alif-detail-layout">
                    <AlifProductGallery
                        key={slug}
                        images={product.images ?? []}
                        name={product.name}
                    />

                    <div className="alif-detail-information">
                        <p className="alif-store-eyebrow">
                            <span
                                className="alif-store-mark"
                                aria-hidden="true"
                            >
                                A
                            </span>
                            AlifShop collection
                        </p>

                        <h1>{product.name}</h1>

                        <div className="alif-detail-rating">
                            <span>
                                <Star
                                    size={17}
                                    fill={rating > 0 ? "currentColor" : "none"}
                                    aria-hidden="true"
                                />
                                <strong>
                                    {rating > 0 ? rating.toFixed(1) : "Not rated"}
                                </strong>
                            </span>

                            <span>
                                {Number(product.rating_count ?? 0).toLocaleString(
                                    "en-US",
                                )}{" "}
                                ratings
                            </span>

                            <a href="#alif-reviews">Read feedback</a>
                        </div>

                        <div className="alif-detail-price-panel">
                            <div className="alif-detail-price-label">
                                <span>Current price</span>

                                {Number.isFinite(discount) && discount > 0 && (
                                    <span className="alif-detail-discount">
                                        Save {discount}%
                                    </span>
                                )}
                            </div>

                            <strong className="alif-detail-price">
                                {formatMoney(product.final_price)}
                            </strong>

                            {Number.isFinite(monthlyPayment) &&
                                monthlyPayment > 0 && (
                                    <p className="alif-detail-payment">
                                        From{" "}
                                        <strong>
                                            {formatMoney(monthlyPayment)}
                                        </strong>{" "}
                                        per month
                                    </p>
                                )}

                            <div className="alif-detail-price-note">
                                <span
                                    className="alif-store-mark"
                                    aria-hidden="true"
                                >
                                    A
                                </span>
                                <p>
                                    AlifShop pricing
                                    <small>
                                        Payment options and availability may vary.
                                    </small>
                                </p>
                            </div>
                        </div>

                        <div className="shopping-detail-actions">
                            <ProductActions
                                marketplace="ALIFSHOP"
                                productKey={product.slug}
                                name={product.name}
                            />
                        </div>

                        {product.description && (
                            <section className="alif-detail-description">
                                <h2>About this product</h2>
                                <p>{product.description}</p>
                            </section>
                        )}

                        <Link
                            href={categoryHref}
                            className="alif-detail-collection-link"
                        >
                            Explore more from this collection
                            <ArrowRight size={17} />
                        </Link>
                    </div>
                </article>

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
                            <h2 id="alif-reviews-title">Customer feedback</h2>
                        </div>

                        {!reviewsFailed && (
                            <span className="alif-store-caption">
                                {reviews.length} written reviews shown
                            </span>
                        )}
                    </div>

                    <div className="alif-detail-review-layout">
                        <aside
                            className="alif-detail-review-summary"
                            aria-label="Product rating summary"
                        >
                            <Star size={24} aria-hidden="true" />
                            <strong>
                                {rating > 0 ? rating.toFixed(1) : "—"}
                            </strong>
                            <span>
                                {rating > 0 ? "Overall rating" : "Not yet rated"}
                            </span>
                            <small>
                                {Number(product.rating_count ?? 0).toLocaleString(
                                    "en-US",
                                )}{" "}
                                ratings on AlifShop
                            </small>
                        </aside>

                        {reviewsFailed ? (
                            <div
                                className="alif-store-empty alif-detail-review-empty"
                                role="alert"
                            >
                                <MessageSquare
                                    size={30}
                                    aria-hidden="true"
                                />
                                <h2>Feedback is temporarily unavailable</h2>
                                <p>Please try again in a moment.</p>

                                <Link
                                    href={`/alif/products/${encodedSlug}`}
                                    className="alif-store-button alif-store-button-secondary"
                                >
                                    Try again <ArrowRight size={17} />
                                </Link>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="alif-store-empty alif-detail-review-empty">
                                <MessageSquare
                                    size={30}
                                    aria-hidden="true"
                                />
                                <h2>No written feedback yet</h2>
                                <p>
                                    This product may have ratings without written
                                    comments.
                                </p>
                            </div>
                        ) : (
                            <div className="alif-detail-review-list">
                                {reviews.map((review) => {
                                    const reviewRating = Number(review.rating);
                                    const hasRating =
                                        Number.isFinite(reviewRating) &&
                                        reviewRating > 0;

                                    return (
                                        <article
                                            key={review.id}
                                            className="alif-detail-review-card"
                                        >
                                            <div className="alif-detail-review-top">
                                                <h3>
                                                    {review.user?.name ||
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
                                                        ? reviewRating.toFixed(1)
                                                        : "Not rated"}
                                                </span>
                                            </div>

                                            <p>
                                                {review.comment ||
                                                    review.text ||
                                                    "No written comment"}
                                            </p>

                                            <small>AlifShop review</small>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}