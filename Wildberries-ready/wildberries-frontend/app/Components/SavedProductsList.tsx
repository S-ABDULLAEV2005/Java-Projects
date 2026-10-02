"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Heart,
    ImageOff,
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
} from "lucide-react";

import CheckoutButton from "./CheckoutButton";
import { useShopping } from "./ShoppingProvider";
import type { SavedProductDetails } from "./SavedProductsPage";

function money(amount: number) {
    return `${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} TJS`;
}

function ProductThumbnail({
                              src,
                              name,
                          }: {
    src: string | null;
    name: string;
}) {
    const [failedSource, setFailedSource] = useState<string | null>(null);

    if (!src || failedSource === src) {
        return (
            <span className="shopping-thumbnail-fallback">
                <ImageOff size={26} aria-hidden="true" />
                <span>No image</span>
            </span>
        );
    }

    return (
        <Image
            src={src}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 600px) 80px, 112px"
            className="shopping-thumbnail-photo"
            onError={() => setFailedSource(src)}
        />
    );
}

export default function SavedProductsList({
                                              type,
                                              details,
                                          }: {
    type: "cart" | "favorites";
    details: SavedProductDetails[];
}) {
    const shopping = useShopping();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const items = type === "cart" ? shopping.cart : shopping.favorites;
    const detailMap = new Map(details.map((item) => [item.id, item]));

    async function run(
        action: () => Promise<void>,
        successMessage: string,
    ) {
        if (busy) return;

        setBusy(true);
        setError("");
        setMessage("");

        try {
            await action();
            setMessage(successMessage);
            router.refresh();
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Please try again.",
            );
        } finally {
            setBusy(false);
        }
    }

    if (!shopping.ready) {
        return <p role="status">Loading saved products…</p>;
    }

    if (shopping.loadError) {
        return (
            <div>
                <p role="alert">{shopping.loadError}</p>
                <button
                    type="button"
                    className="shopping-page-link"
                    onClick={() => void shopping.reload()}
                >
                    Try again
                </button>
            </div>
        );
    }

    const completePrices = items.every(
        (item) => detailMap.get(item.id)?.price != null,
    );

    const totalQuantity = items.reduce(
        (total, item) => total + item.quantity,
        0,
    );

    const totalCents = items.reduce((total, item) => {
        const price = detailMap.get(item.id)?.price;

        return total + (
            price == null
                ? 0
                : Math.round(price * 100) * item.quantity
        );
    }, 0);

    const localItems = items.filter(
        (item) => item.marketplace === "WILDMARKET",
    );

    const localPricesComplete = localItems.every(
        (item) => detailMap.get(item.id)?.price != null,
    );

    const localTotalCents = localItems.reduce((total, item) => {
        const price = detailMap.get(item.id)?.price;

        return total + (
            price == null
                ? 0
                : Math.round(price * 100) * item.quantity
        );
    }, 0);

    return (
        <>
            <div className="shopping-feedback">
                {error && <p role="alert">{error}</p>}
                {message && <p role="status">{message}</p>}
            </div>

            {items.length === 0 ? (
                <div className="shopping-empty">
                    {type === "cart" ? (
                        <ShoppingCart size={36} aria-hidden="true" />
                    ) : (
                        <Heart size={36} aria-hidden="true" />
                    )}

                    <h2>
                        {type === "cart"
                            ? "Your cart is empty"
                            : "No favorites yet"}
                    </h2>

                    <p>Browse products to start your collection.</p>

                    <Link href="/products" className="shopping-page-link">
                        Browse products
                    </Link>
                </div>
            ) : (
                <div
                    className={`shopping-detail-layout ${
                        type === "cart" ? "has-summary" : ""
                    }`}
                >
                    <div className="shopping-saved-list">
                        {items.map((item) => {
                            const product = detailMap.get(item.id);
                            const local = item.marketplace === "WILDMARKET";
                            const stock = product?.stock ?? null;

                            const maximumQuantity = local
                                ? Math.min(stock ?? 0, 99)
                                : 99;

                            const cartQuantity = shopping.cart.find(
                                (cartItem) =>
                                    cartItem.marketplace === item.marketplace &&
                                    cartItem.productKey === item.productKey,
                            )?.quantity ?? 0;

                            const exceedsStock =
                                local &&
                                stock !== null &&
                                item.quantity > stock;

                            const decreasedQuantity =
                                local && stock !== null && stock > 0
                                    ? Math.min(item.quantity - 1, stock, 99)
                                    : item.quantity - 1;

                            const isFavorite = shopping.favorites.some(
                                (favorite) =>
                                    favorite.marketplace === item.marketplace &&
                                    favorite.productKey === item.productKey,
                            );

                            const name =
                                product?.name || "Refreshing product details…";

                            const href = product?.href || (
                                local
                                    ? `/products/${encodeURIComponent(item.productKey)}`
                                    : `/alif/products/${encodeURIComponent(item.productKey)}`
                            );

                            const lineTotal = product?.price != null
                                ? (
                                Math.round(product.price * 100) *
                                item.quantity
                            ) / 100
                                : null;

                            return (
                                <article
                                    key={item.id}
                                    className="shopping-saved-row shopping-rich-row"
                                >
                                    <Link
                                        href={href}
                                        className="shopping-thumbnail"
                                        aria-label={`View ${name}`}
                                    >
                                        <ProductThumbnail
                                            src={product?.imageUrl ?? null}
                                            name={name}
                                        />
                                    </Link>

                                    <div className="shopping-saved-copy">
                                        <small>
                                            {local ? "WildMarket" : "AlifShop"}
                                        </small>

                                        <Link href={href}>
                                            <h2>{name}</h2>
                                        </Link>

                                        <p>
                                            {product?.price != null
                                                ? money(product.price)
                                                : "Price unavailable"}

                                            {type === "cart" &&
                                                product?.price != null && (
                                                    <span className="shopping-unit-label">
                                                        {" "}each
                                                    </span>
                                                )}
                                        </p>

                                        {local ? (
                                            <p
                                                className={`shopping-stock-message ${
                                                    stock === 0 ||
                                                    (type === "cart" && exceedsStock)
                                                        ? "is-warning"
                                                        : ""
                                                }`}
                                            >
                                                {stock === null
                                                    ? "Stock information unavailable"
                                                    : stock === 0
                                                        ? "Out of stock"
                                                        : type === "cart" && exceedsStock
                                                            ? `Only ${stock} available. Reduce your quantity.`
                                                            : `${stock} in stock`}
                                            </p>
                                        ) : (
                                            <p className="shopping-stock-message">
                                                Availability is not provided by
                                                this integration.
                                            </p>
                                        )}
                                    </div>

                                    <div className="shopping-row-controls">
                                        {type === "cart" ? (
                                            <>
                                                <div className="shopping-quantity">
                                                    <button
                                                        type="button"
                                                        aria-label={`Decrease quantity of ${name}`}
                                                        disabled={
                                                            busy ||
                                                            item.quantity <= 1 ||
                                                            (local &&
                                                                (stock === null || stock === 0))
                                                        }
                                                        onClick={() => void run(
                                                            () => shopping.setQuantity(
                                                                item.id,
                                                                decreasedQuantity,
                                                            ),
                                                            "Quantity updated.",
                                                        )}
                                                    >
                                                        <Minus
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                    </button>

                                                    <span aria-label="Quantity">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        aria-label={`Increase quantity of ${name}`}
                                                        disabled={
                                                            busy ||
                                                            item.quantity >= maximumQuantity ||
                                                            product?.price == null
                                                        }
                                                        onClick={() => void run(
                                                            () => shopping.setQuantity(
                                                                item.id,
                                                                item.quantity + 1,
                                                            ),
                                                            "Quantity updated.",
                                                        )}
                                                    >
                                                        <Plus
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </div>

                                                <div className="shopping-line-total">
                                                    <small>Row total</small>
                                                    <strong>
                                                        {lineTotal != null
                                                            ? money(lineTotal)
                                                            : "Unavailable"}
                                                    </strong>
                                                </div>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className="shopping-page-link"
                                                disabled={
                                                    busy ||
                                                    product?.price == null ||
                                                    cartQuantity >= maximumQuantity
                                                }
                                                onClick={() => void run(
                                                    () => shopping.addToCart(
                                                        item.marketplace,
                                                        item.productKey,
                                                    ),
                                                    "Added to cart.",
                                                )}
                                            >
                                                <ShoppingCart
                                                    size={17}
                                                    aria-hidden="true"
                                                />
                                                Add to cart
                                            </button>
                                        )}

                                        {type === "cart" && (
                                            <button
                                                type="button"
                                                className={`shopping-save-favorite ${
                                                    isFavorite ? "is-saved" : ""
                                                }`}
                                                disabled={busy || isFavorite}
                                                aria-label={
                                                    isFavorite
                                                        ? `${name} is saved in favorites`
                                                        : `Save ${name} to favorites`
                                                }
                                                onClick={() => void run(
                                                    () => shopping.toggleFavorite(
                                                        item.marketplace,
                                                        item.productKey,
                                                    ),
                                                    "Saved to favorites.",
                                                )}
                                            >
                                                <Heart
                                                    size={17}
                                                    fill={
                                                        isFavorite
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    {isFavorite
                                                        ? "Saved"
                                                        : "Save to favorites"}
                                                </span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="shopping-remove"
                                            aria-label={`Remove ${name}`}
                                            disabled={busy}
                                            onClick={() => void run(
                                                () => shopping.removeItem(item.id),
                                                "Product removed.",
                                            )}
                                        >
                                            <Trash2 size={19} aria-hidden="true" />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {type === "cart" && (
                        <aside
                            className="shopping-summary shopping-cart-summary"
                            aria-labelledby="cart-summary-title"
                        >
                            <h2 id="cart-summary-title">Cart summary</h2>

                            <dl className="shopping-summary-details">
                                <div>
                                    <dt>Different products</dt>
                                    <dd>{items.length}</dd>
                                </div>

                                <div>
                                    <dt>Total quantity</dt>
                                    <dd>{totalQuantity}</dd>
                                </div>

                                <div className="shopping-summary-total">
                                    <dt>
                                        {completePrices
                                            ? "Product total"
                                            : "Known-price subtotal"}
                                    </dt>
                                    <dd>{money(totalCents / 100)}</dd>
                                </div>
                            </dl>

                            <p>
                                {completePrices
                                    ? "Based on current catalog prices."
                                    : "Products with unavailable prices are excluded from this subtotal."}
                            </p>

                            {localItems.length > 0 && (
                                <div className="shopping-checkout-total">
                                    <span>WildMarket order estimate</span>

                                    <strong>
                                        {localPricesComplete
                                            ? money(localTotalCents / 100)
                                            : "Some prices are unavailable"}
                                    </strong>

                                    <p>
                                        Final prices and stock are checked
                                        when you place the order.
                                    </p>
                                </div>
                            )}

                            <CheckoutButton disabled={busy} />

                            <Link
                                href="/products"
                                className="shopping-page-link"
                            >
                                Continue shopping
                            </Link>
                        </aside>
                    )}
                </div>
            )}
        </>
    );
}