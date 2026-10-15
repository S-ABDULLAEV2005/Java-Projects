"use client";

import Image from "next/image";
import Link from "next/link";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import {
    ImageOff,
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
    Undo2,
    X,
} from "lucide-react";

import {
    useShopping,
    type SavedItem,
} from "./ShoppingProvider";

import type { CartPreviewProduct } from "../api/cart-preview/route";

import styles from "./mini-cart.module.css";

type Removed = {
    item: SavedItem;
    name: string;
    attempted: boolean;
};

const keyOf = (item: {
    marketplace: string;
    productKey: string;
}) => `${item.marketplace}:${item.productKey}`;

const money = (value: number) =>
    `${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} TJS`;

function Photo({
                   src,
                   name,
               }: {
    src: string | null;
    name: string;
}) {
    const [failed, setFailed] = useState<string | null>(null);

    return src && failed !== src ? (
        <Image
            src={src}
            alt={name}
            fill
            unoptimized
            sizes="72px"
            onError={() => setFailed(src)}
        />
    ) : (
        <ImageOff size={25} aria-hidden="true" />
    );
}

function CartDrawer({
                        onClose,
                    }: {
    onClose: (changed: boolean) => void;
}) {
    const shopping = useShopping();
    const router = useRouter();

    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const changed = useRef(false);
    const inFlight = useRef(false);
    const titleId = useId();

    const [details, setDetails] = useState<
        Record<string, CartPreviewProduct>
    >({});

    const [detailsReady, setDetailsReady] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [retry, setRetry] = useState(0);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [removed, setRemoved] = useState<Removed | null>(
        null,
    );

    const signature = shopping.cart
        .map((item) => `${item.id}:${keyOf(item)}`)
        .sort()
        .join("|");

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const body = document.body;
        const oldOverflow = body.style.overflow;
        const oldPadding = body.style.paddingRight;

        const gap =
            window.innerWidth -
            document.documentElement.clientWidth;

        const padding =
            parseFloat(getComputedStyle(body).paddingRight) || 0;

        if (!dialog.open) dialog.showModal();

        closeRef.current?.focus({ preventScroll: true });

        body.style.overflow = "hidden";

        if (gap > 0) {
            body.style.paddingRight = `${padding + gap}px`;
        }

        return () => {
            body.style.overflow = oldOverflow;
            body.style.paddingRight = oldPadding;
        };
    }, []);

    useEffect(() => {
        if (!shopping.ready || shopping.loadError) return;

        const controller = new AbortController();

        void fetch("/api/cart-preview", {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async (response) => {
                if (response.status === 401) {
                    router.push("/login");
                    throw new Error("Please sign in again.");
                }

                const data = await response.json();

                if (
                    !response.ok ||
                    !Array.isArray(data.products)
                ) {
                    throw new Error(
                        data.message ||
                        "Could not load product details.",
                    );
                }

                if (controller.signal.aborted) return;

                const products: CartPreviewProduct[] =
                    data.products;

                setDetails((current) => ({
                    ...current,
                    ...Object.fromEntries(
                        products.map((product) => [
                            keyOf(product),
                            product,
                        ]),
                    ),
                }));

                setDetailsError("");
                setDetailsReady(true);
            })
            .catch((failure: unknown) => {
                if (!controller.signal.aborted) {
                    setDetailsError(
                        failure instanceof Error
                            ? failure.message
                            : "Could not load product details.",
                    );

                    setDetailsReady(true);
                }
            });

        return () => controller.abort();
    }, [
        shopping.ready,
        shopping.loadError,
        signature,
        retry,
        router,
    ]);

    async function run(
        action: () => Promise<void>,
        success: string,
    ) {
        if (inFlight.current) return;

        inFlight.current = true;
        setBusy(true);
        setError("");
        setMessage("");

        try {
            await action();

            changed.current = true;
            setMessage(success);
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Please try again.",
            );

            await shopping.reload();
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    const complete = shopping.cart.every(
        (item) => details[keyOf(item)]?.price != null,
    );

    const total = shopping.cart.reduce((sum, item) => {
        const price = details[keyOf(item)]?.price;

        return (
            sum +
            (
                price == null
                    ? 0
                    : Math.round(price * 100) * item.quantity
            )
        );
    }, 0);

    return (
        <dialog
            ref={dialogRef}
            className={styles.shell}
            aria-labelledby={titleId}
            onClose={() => onClose(changed.current)}
            onCancel={(event) => {
                if (inFlight.current) {
                    event.preventDefault();
                }
            }}
            onPointerDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !inFlight.current
                ) {
                    dialogRef.current?.close();
                }
            }}
        >
            <section className={styles.panel}>
                <header className={styles.heading}>
                    <div>
                        <span>Your saved shopping</span>
                        <h2 id={titleId}>Your cart</h2>

                        <p>
                            {shopping.cart.length}{" "}
                            {shopping.cart.length === 1
                                ? "product"
                                : "products"}
                        </p>
                    </div>

                    <button
                        ref={closeRef}
                        type="button"
                        className={styles.icon}
                        disabled={busy}
                        aria-label="Close cart"
                        onClick={() =>
                            dialogRef.current?.close()
                        }
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </header>

                <div className={styles.content}>
                    <div className={styles.feedback}>
                        {error && (
                            <p role="alert">{error}</p>
                        )}

                        <p role="status">
                            {busy
                                ? "Updating cart…"
                                : message}
                        </p>
                    </div>

                    {removed && (
                        <div className={styles.undo}>
                            <p>
                                Removed {removed.name} · quantity{" "}
                                {removed.item.quantity}
                            </p>

                            <button
                                type="button"
                                disabled={
                                    busy || removed.attempted
                                }
                                onClick={() =>
                                    void run(async () => {
                                        setRemoved((current) =>
                                            current
                                                ? {
                                                    ...current,
                                                    attempted: true,
                                                }
                                                : null,
                                        );

                                        await shopping.restoreCart(
                                            removed.item,
                                        );

                                        setRemoved(null);
                                    }, "Product restored.")
                                }
                            >
                                <Undo2
                                    size={16}
                                    aria-hidden="true"
                                />
                                Undo
                            </button>

                            {removed.attempted && (
                                <small>
                                    If restoration failed or could
                                    not be confirmed, check the full
                                    cart before adding it again.
                                </small>
                            )}
                        </div>
                    )}

                    {!shopping.ready ? (
                        <p role="status">
                            Loading your cart…
                        </p>
                    ) : shopping.loadError ? (
                        <div role="alert">
                            <p>{shopping.loadError}</p>

                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={() =>
                                    void shopping.reload()
                                }
                            >
                                Try again
                            </button>
                        </div>
                    ) : shopping.cart.length === 0 ? (
                        <div className={styles.empty}>
                            <ShoppingCart
                                size={38}
                                aria-hidden="true"
                            />

                            <h3>Your cart is empty</h3>

                            <p>
                                Browse the catalog to find
                                something you love.
                            </p>
                        </div>
                    ) : (
                        <>
                            {!detailsReady && (
                                <p role="status">
                                    Loading product details…
                                </p>
                            )}

                            {detailsError && (
                                <div role="alert">
                                    <p>{detailsError}</p>

                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        onClick={() =>
                                            setRetry(
                                                (current) =>
                                                    current + 1,
                                            )
                                        }
                                    >
                                        Reload product details
                                    </button>
                                </div>
                            )}

                            {shopping.cart.map((item) => {
                                const product =
                                    details[keyOf(item)];

                                const local =
                                    item.marketplace ===
                                    "WILDMARKET";

                                const stock =
                                    product?.stock ?? null;

                                const name =
                                    product?.name ||
                                    "Loading product…";

                                const href =
                                    product?.href ||
                                    `${
                                        local
                                            ? "/products/"
                                            : "/alif/products/"
                                    }${encodeURIComponent(
                                        item.productKey,
                                    )}`;

                                const maximum = local
                                    ? Math.min(stock ?? 0, 99)
                                    : 99;

                                const decrease =
                                    local &&
                                    stock !== null &&
                                    stock > 0
                                        ? Math.min(
                                            item.quantity - 1,
                                            stock,
                                            99,
                                        )
                                        : item.quantity - 1;

                                return (
                                    <article
                                        key={item.id}
                                        className={styles.row}
                                    >
                                        <Link
                                            href={href}
                                            className={styles.photo}
                                            aria-label={`View ${name}`}
                                            onClick={() =>
                                                dialogRef.current
                                                    ?.close()
                                            }
                                        >
                                            <Photo
                                                src={
                                                    product
                                                        ?.imageUrl ??
                                                    null
                                                }
                                                name={name}
                                            />
                                        </Link>

                                        <div
                                            className={styles.copy}
                                        >
                                            <small>
                                                {local
                                                    ? "WildMarket"
                                                    : "AlifShop"}
                                            </small>

                                            <Link
                                                href={href}
                                                onClick={() =>
                                                    dialogRef.current
                                                        ?.close()
                                                }
                                            >
                                                <h3>{name}</h3>
                                            </Link>

                                            <strong>
                                                {product?.price !=
                                                null
                                                    ? money(
                                                        product.price,
                                                    )
                                                    : "Price unavailable"}
                                            </strong>

                                            <small>
                                                {local
                                                    ? stock === null
                                                        ? "Stock unavailable"
                                                        : stock === 0
                                                            ? "Out of stock"
                                                            : `${stock} in stock`
                                                    : "Availability not provided"}
                                            </small>

                                            <div
                                                className={
                                                    styles.quantity
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    aria-label={`Decrease quantity of ${name}`}
                                                    disabled={
                                                        busy ||
                                                        item.quantity <=
                                                        1 ||
                                                        (
                                                            local &&
                                                            (
                                                                stock ===
                                                                null ||
                                                                stock ===
                                                                0
                                                            )
                                                        )
                                                    }
                                                    onClick={() =>
                                                        void run(
                                                            () =>
                                                                shopping.setQuantity(
                                                                    item.id,
                                                                    decrease,
                                                                ),
                                                            "",
                                                        )
                                                    }
                                                >
                                                    <Minus
                                                        size={15}
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
                                                        product?.price ==
                                                        null ||
                                                        item.quantity >=
                                                        maximum
                                                    }
                                                    onClick={() =>
                                                        void run(
                                                            () =>
                                                                shopping.setQuantity(
                                                                    item.id,
                                                                    item.quantity +
                                                                    1,
                                                                ),
                                                            "",
                                                        )
                                                    }
                                                >
                                                    <Plus
                                                        size={15}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={styles.icon}
                                            disabled={busy}
                                            aria-label={`Remove ${name} from cart`}
                                            onClick={() =>
                                                void run(
                                                    async () => {
                                                        await shopping.removeItem(
                                                            item.id,
                                                        );

                                                        setRemoved({
                                                            item: {
                                                                ...item,
                                                            },
                                                            name,
                                                            attempted: false,
                                                        });
                                                    },
                                                    "Product removed. Undo is available below the heading.",
                                                )
                                            }
                                        >
                                            <Trash2
                                                size={18}
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </article>
                                );
                            })}
                        </>
                    )}
                </div>

                <footer className={styles.footer}>
                    {shopping.cart.length > 0 && (
                        <>
                            <div className={styles.total}>
                                <span>
                                    {complete
                                        ? "Product subtotal"
                                        : "Known-price subtotal"}
                                </span>

                                <strong>
                                    {money(total / 100)}
                                </strong>
                            </div>

                            <p>
                                {complete
                                    ? "Current catalog prices. Final stock and prices are checked when ordering."
                                    : "Products with unavailable prices are excluded."}
                            </p>
                        </>
                    )}

                    <Link
                        href="/cart"
                        className={styles.primary}
                        onClick={(event) => {
                            if (inFlight.current) {
                                event.preventDefault();
                            } else {
                                dialogRef.current?.close();
                            }
                        }}
                    >
                        View full cart
                    </Link>

                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() =>
                            dialogRef.current?.close()
                        }
                    >
                        Continue browsing
                    </button>
                </footer>
            </section>
        </dialog>
    );
}

export default function MiniCart() {
    const shopping = useShopping();
    const router = useRouter();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className={styles.trigger}
                aria-label="Open cart"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                    if (!shopping.isLoggedIn) {
                        router.push("/login");
                    } else {
                        setOpen(true);
                    }
                }}
            >
                <ShoppingCart
                    size={18}
                    aria-hidden="true"
                />
                <span>Cart</span>
            </button>

            {open && shopping.isLoggedIn && (
                <CartDrawer
                    onClose={(wasChanged) => {
                        setOpen(false);

                        if (
                            wasChanged &&
                            pathname === "/cart"
                        ) {
                            router.refresh();
                        }
                    }}
                />
            )}
        </>
    );
}