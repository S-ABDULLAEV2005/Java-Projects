"use client";

import Image from "next/image";
import Link from "next/link";
import {
    useEffect,
    useId,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    ArrowUpRight,
    Eye,
    ImageOff,
    Star,
    X,
} from "lucide-react";

import ProductActions from "./ProductActions";
import type { Marketplace } from "./ShoppingProvider";
import styles from "./product-quick-view.module.css";

export type QuickViewProduct = {
    marketplace: Marketplace;
    productKey: string;
    name: string;
    href: string;
    imageUrl: string | null;
    price: number | null;
    rating: string | null;
    reviewCount: number;
    category?: string | null;
    brand?: string | null;
    description?: string | null;
    available?: boolean;
    stock?: number;
};

function QuickViewDialog({
                             product,
                             onClose,
                         }: {
    product: QuickViewProduct;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const closing = useRef(false);
    const exitAnimation = useRef<Animation | null>(null);

    const titleId = useId();
    const [brokenImage, setBrokenImage] = useState(false);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) return;

        const body = document.body;
        const previousOverflow = body.style.overflow;
        const previousPadding = body.style.paddingRight;

        const gap =
            window.innerWidth -
            document.documentElement.clientWidth;

        const padding =
            parseFloat(
                window.getComputedStyle(body).paddingRight,
            ) || 0;

        if (!dialog.open) {
            dialog.showModal();
        }

        closeRef.current?.focus({
            preventScroll: true,
        });

        // Prevent the page behind the preview from scrolling.
        body.style.overflow = "hidden";

        // Compensate for the scrollbar to reduce horizontal shifting.
        if (gap > 0) {
            body.style.paddingRight = `${padding + gap}px`;
        }

        return () => {
            exitAnimation.current?.cancel();

            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPadding;
        };
    }, []);

    function dismiss() {
        const dialog = dialogRef.current;
        const panel = panelRef.current;

        if (!dialog?.open || closing.current) return;

        closing.current = true;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (!panel?.animate || reducedMotion) {
            dialog.close();
            return;
        }

        const animation = panel.animate(
            [
                { opacity: 1 },
                { opacity: 0 },
            ],
            {
                duration: 160,
                easing: "ease-out",
                fill: "forwards",
            },
        );

        exitAnimation.current = animation;

        void animation.finished
            .then(() => {
                if (dialog.isConnected && dialog.open) {
                    dialog.close();
                }
            })
            .catch(() => {});
    }

    const money =
        product.price == null
            ? "Price unavailable"
            : `${product.price.toLocaleString("en-US", {
                maximumFractionDigits: 2,
            })} TJS`;

    const reviews = Number.isFinite(product.reviewCount)
        ? Math.max(0, Math.floor(product.reviewCount))
        : 0;

    return (
        <dialog
            ref={dialogRef}
            className={styles.shell}
            aria-labelledby={titleId}
            onClose={onClose}
            onCancel={(event) => {
                event.preventDefault();
                dismiss();
            }}
            onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                    dismiss();
                }
            }}
        >
            <section ref={panelRef} className={styles.panel}>
                <header className={styles.heading}>
                    <span>
                        <Eye size={17} aria-hidden="true" />
                        Quick view
                    </span>

                    <button
                        ref={closeRef}
                        type="button"
                        className={styles.close}
                        onClick={dismiss}
                        aria-label="Close product preview"
                    >
                        <X size={21} aria-hidden="true" />
                    </button>
                </header>

                <div className={styles.image}>
                    {product.imageUrl && !brokenImage ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(max-width: 600px) 90vw, 480px"
                            onError={() => setBrokenImage(true)}
                        />
                    ) : (
                        <div className={styles.fallback}>
                            <ImageOff
                                size={42}
                                aria-hidden="true"
                            />
                            <span>No image available</span>
                        </div>
                    )}
                </div>

                <div className={styles.copy}>
                    <p className={styles.source}>
                        {product.marketplace === "WILDMARKET"
                            ? "WildMarket"
                            : "AlifShop"}

                        {product.category
                            ? ` · ${product.category}`
                            : ""}
                    </p>

                    <h2 id={titleId}>{product.name}</h2>

                    {product.brand && (
                        <p className={styles.brand}>
                            {product.brand}
                        </p>
                    )}

                    <div className={styles.rating}>
                        <Star
                            size={16}
                            fill={
                                product.rating
                                    ? "currentColor"
                                    : "none"
                            }
                            aria-hidden="true"
                        />

                        <strong>
                            {product.rating ?? "Not rated"}
                        </strong>

                        <span>
                            {reviews}{" "}
                            {reviews === 1 ? "review" : "reviews"}
                        </span>
                    </div>

                    <p className={styles.price}>{money}</p>

                    <p className={styles.stock}>
                        {product.marketplace === "WILDMARKET"
                            ? product.available
                                ? typeof product.stock === "number"
                                    ? `${product.stock} in stock`
                                    : "In stock"
                                : "Out of stock"
                            : "Availability is not confirmed in this preview."}
                    </p>

                    {product.description && (
                        <p className={styles.description}>
                            {product.description}
                        </p>
                    )}

                    <div className={styles.actions}>
                        <ProductActions
                            marketplace={product.marketplace}
                            productKey={product.productKey}
                            name={product.name}
                            available={product.available ?? true}
                        />
                    </div>

                    <Link
                        href={product.href}
                        onClick={dismiss}
                        className={styles.details}
                    >
                        View full product details

                        <ArrowUpRight
                            size={18}
                            aria-hidden="true"
                        />
                    </Link>

                    <p className={styles.note}>
                        Preview uses the catalog data loaded on
                        this page. Stock and pricing are checked
                        again by your existing backend where
                        applicable.
                    </p>
                </div>
            </section>
        </dialog>
    );
}

export default function ProductQuickView({
                                             product,
                                             triggerLabel = "Quick view",
                                             triggerClassName,
                                             showTriggerIcon = true,
                                         }: {
    product: QuickViewProduct;
    triggerLabel?: ReactNode;
    triggerClassName?: string;
    showTriggerIcon?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className={triggerClassName ?? styles.trigger}
                aria-haspopup="dialog"
                aria-label={`Quick view: ${product.name}`}
                onClick={() => setOpen(true)}
            >
                {showTriggerIcon && (
                    <Eye size={17} aria-hidden="true" />
                )}

                {triggerLabel}
            </button>

            {open && (
                <QuickViewDialog
                    product={product}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}