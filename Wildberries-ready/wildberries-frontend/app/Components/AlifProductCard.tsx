import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageOff, Star } from "lucide-react";
import type { AlifProduct } from "../_types/alif";

function formatMoney(value: unknown) {
    const amount = Number(value);

    return Number.isFinite(amount) && amount >= 0
        ? `${amount.toLocaleString("en-US", {
            maximumFractionDigits: 2,
        })} TJS`
        : "Price unavailable";
}

export default function AlifProductCard({
                                            product,
                                        }: {
    product: AlifProduct;
}) {
    const rawRating = Number(product.rating);
    const rating =
        Number.isFinite(rawRating) && rawRating > 0 ? rawRating : 0;

    const discount = Number(product.discount_percent);
    const monthlyPayment = Number(product.monthly_payment);
    const image = product.images?.[0];
    const href = `/alif/products/${encodeURIComponent(product.slug)}`;

    return (
        <article className="alif-store-product">
            <Link
                href={href}
                className="alif-store-product-image"
                aria-label={`View ${product.name}`}
            >
                {image ? (
                    <Image
                        src={image}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
                        className="alif-store-product-photo"
                    />
                ) : (
                    <div className="alif-store-image-empty">
                        <ImageOff size={34} aria-hidden="true" />
                        <span>No image available</span>
                    </div>
                )}

                {Number.isFinite(discount) && discount > 0 && (
                    <span className="alif-store-discount">−{discount}%</span>
                )}

                <span className="alif-store-open" aria-hidden="true">
                    <ArrowUpRight size={19} />
                </span>
            </Link>

            <div className="alif-store-product-copy">
                <p className="alif-store-product-source">AlifShop</p>

                <Link href={href} className="alif-store-product-name">
                    <h2>{product.name}</h2>
                </Link>

                <div className="alif-store-product-rating">
                    <Star
                        size={14}
                        fill={rating > 0 ? "currentColor" : "none"}
                        aria-hidden="true"
                    />
                    <strong>{rating > 0 ? rating.toFixed(1) : "Not rated"}</strong>
                    <span>
                        ({Number(product.rating_count ?? 0).toLocaleString("en-US")})
                    </span>
                </div>

                <p className="alif-store-product-price">
                    {formatMoney(product.final_price)}
                </p>

                <p className="alif-store-product-payment">
                    {Number.isFinite(monthlyPayment) && monthlyPayment > 0
                        ? `From ${formatMoney(monthlyPayment)} / month`
                        : "Explore product details"}
                </p>
            </div>
        </article>
    );
}