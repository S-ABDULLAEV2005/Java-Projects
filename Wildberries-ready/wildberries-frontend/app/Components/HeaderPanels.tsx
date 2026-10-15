"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import {
    Heart,
    ImageOff,
    LogOut,
    Package,
    Settings2,
    ShoppingCart,
    UserRound,
    X,
} from "lucide-react";

import { useShopping } from "./ShoppingProvider";
import type { HeaderProduct } from "../api/header-preview/route";

import styles from "./header-panels.module.css";

type Kind = "favorites" | "account";

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
                   product,
               }: {
    product?: HeaderProduct;
}) {
    const [failed, setFailed] = useState<string | null>(null);
    const src = product?.imageUrl;

    return src && failed !== src ? (
        <Image
            src={src}
            alt={product.name}
            fill
            unoptimized
            sizes="72px"
            onError={() => setFailed(src)}
        />
    ) : (
        <ImageOff size={24} aria-hidden="true" />
    );
}

function HeaderPanel({
                         kind,
                         onClose,
                     }: {
    kind: Kind;
    onClose: (changed: boolean) => void;
}) {
    const shopping = useShopping();
    const router = useRouter();

    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const inFlight = useRef(false);
    const changed = useRef(false);
    const titleId = useId();

    const [products, setProducts] = useState<
        Record<string, HeaderProduct>
    >({});

    const [account, setAccount] = useState<{
        username: string;
        isAdmin: boolean;
    } | null>(null);

    const [loaded, setLoaded] = useState(false);
    const [signedOut, setSignedOut] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [retry, setRetry] = useState(0);

    const signature = kind === "favorites"
        ? shopping.favorites
            .slice(0, 20)
            .map((item) => `${item.id}:${keyOf(item)}`)
            .join("|")
        : "account";

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const body = document.body;
        const overflow = body.style.overflow;
        const padding = body.style.paddingRight;

        const gap =
            window.innerWidth -
            document.documentElement.clientWidth;

        if (!dialog.open) {
            dialog.showModal();
        }

        body.style.overflow = "hidden";

        if (gap > 0) {
            const currentPadding =
                parseFloat(getComputedStyle(body).paddingRight) || 0;

            body.style.paddingRight =
                `${currentPadding + gap}px`;
        }

        closeRef.current?.focus({ preventScroll: true });

        return () => {
            body.style.overflow = overflow;
            body.style.paddingRight = padding;
        };
    }, []);

    useEffect(() => {
        if (
            !shopping.isLoggedIn ||
            (
                kind === "favorites" &&
                (!shopping.ready || shopping.loadError)
            )
        ) {
            return;
        }

        const controller = new AbortController();

        void fetch(`/api/header-preview?view=${kind}`, {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async (response) => {
                if (response.status === 401) {
                    if (!controller.signal.aborted) {
                        setSignedOut(true);
                    }
                    return;
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load this panel.",
                    );
                }

                if (controller.signal.aborted) return;

                if (kind === "account") {
                    if (typeof data.username !== "string") {
                        throw new Error("Invalid account response");
                    }

                    setAccount({
                        username: data.username,
                        isAdmin: data.isAdmin === true,
                    });
                } else {
                    if (!Array.isArray(data.products)) {
                        throw new Error("Invalid favorites response");
                    }

                    setProducts(
                        Object.fromEntries(
                            (data.products as HeaderProduct[]).map(
                                (product) => [
                                    keyOf(product),
                                    product,
                                ],
                            ),
                        ),
                    );
                }

                setLoadError("");
                setLoaded(true);
            })
            .catch((failure: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(
                        failure instanceof Error
                            ? failure.message
                            : "Please try again.",
                    );

                    setLoaded(true);
                }
            });

        return () => controller.abort();
    }, [
        kind,
        shopping.isLoggedIn,
        shopping.ready,
        shopping.loadError,
        signature,
        retry,
    ]);

    function close() {
        if (!inFlight.current) {
            dialogRef.current?.close();
        }
    }

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
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    const guest = !shopping.isLoggedIn || signedOut;

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
                if (event.target === event.currentTarget) {
                    close();
                }
            }}
        >
            <section
                className={styles.panel}
                onClickCapture={(event) => {
                    if (
                        inFlight.current &&
                        event.target instanceof Element &&
                        event.target.closest("a")
                    ) {
                        event.preventDefault();
                    }
                }}
            >
                <header className={styles.heading}>
                    <div>
                        <span>Your personal space</span>

                        <h2 id={titleId}>
                            {kind === "favorites"
                                ? "Your favorites"
                                : "Your account"}
                        </h2>
                    </div>

                    <button
                        ref={closeRef}
                        type="button"
                        className={styles.icon}
                        disabled={busy}
                        aria-label="Close panel"
                        onClick={close}
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </header>

                <div className={styles.content}>
                    <div className={styles.feedback}>
                        {error && <p role="alert">{error}</p>}

                        <p role="status">
                            {busy ? "Updating…" : message}
                        </p>
                    </div>

                    {guest ? (
                        <div className={styles.empty}>
                            <UserRound
                                size={36}
                                aria-hidden="true"
                            />

                            <h3>Welcome to WildMarket</h3>

                            <p>
                                Sign in to view your account
                                and saved products.
                            </p>

                            <Link
                                href="/login"
                                className={styles.primary}
                                onClick={close}
                            >
                                Sign in
                            </Link>

                            <Link
                                href="/register"
                                className={styles.secondary}
                                onClick={close}
                            >
                                Create account
                            </Link>
                        </div>
                    ) : kind === "favorites" &&
                    shopping.loadError ? (
                        <div role="alert">
                            <p>{shopping.loadError}</p>

                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={() => void shopping.reload()}
                            >
                                Try again
                            </button>
                        </div>
                    ) : loadError ? (
                        <div role="alert">
                            <p>{loadError}</p>

                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={() =>
                                    setRetry((current) => current + 1)
                                }
                            >
                                Reload panel
                            </button>
                        </div>
                    ) : kind === "account" ? (
                        <>
                            {!loaded ? (
                                <p role="status">
                                    Loading your account…
                                </p>
                            ) : account && (
                                <>
                                    <div className={styles.profile}>
                                        <span className={styles.avatar}>
                                            {Array.from(account.username)
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase()}
                                        </span>

                                        <div>
                                            <small>Signed in as</small>
                                            <h3>{account.username}</h3>
                                            <p>
                                                {account.isAdmin
                                                    ? "Administrator"
                                                    : "Member"}
                                            </p>
                                        </div>
                                    </div>

                                    <nav
                                        className={styles.links}
                                        aria-label="Account shortcuts"
                                    >
                                        <Link
                                            href="/account"
                                            onClick={close}
                                        >
                                            <UserRound
                                                size={20}
                                                aria-hidden="true"
                                            />
                                            My account
                                            <span>→</span>
                                        </Link>

                                        <Link
                                            href="/account/orders"
                                            onClick={close}
                                        >
                                            <Package
                                                size={20}
                                                aria-hidden="true"
                                            />
                                            Your orders
                                            <span>→</span>
                                        </Link>

                                        <Link
                                            href="/favorites"
                                            onClick={close}
                                        >
                                            <Heart
                                                size={20}
                                                aria-hidden="true"
                                            />
                                            Favorites and collections
                                            <span>→</span>
                                        </Link>

                                        <Link
                                            href="/cart"
                                            onClick={close}
                                        >
                                            <ShoppingCart
                                                size={20}
                                                aria-hidden="true"
                                            />
                                            Your cart
                                            <span>→</span>
                                        </Link>

                                        {account.isAdmin && (
                                            <Link
                                                href="/admin/products"
                                                onClick={close}
                                            >
                                                <Settings2
                                                    size={20}
                                                    aria-hidden="true"
                                                />
                                                Manage products
                                                <span>→</span>
                                            </Link>
                                        )}
                                    </nav>

                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        disabled={busy}
                                        onClick={() => void run(
                                            async () => {
                                                const response = await fetch(
                                                    "/api/auth/logout",
                                                    {
                                                        method: "POST",
                                                        credentials: "include",
                                                    },
                                                );

                                                if (!response.ok) {
                                                    throw new Error(
                                                        "Could not sign out. Please try again.",
                                                    );
                                                }

                                                router.replace("/login");
                                                router.refresh();
                                                dialogRef.current?.close();
                                            },
                                            "Signing out…",
                                        )}
                                    >
                                        <LogOut
                                            size={18}
                                            aria-hidden="true"
                                        />
                                        Sign out
                                    </button>
                                </>
                            )}
                        </>
                    ) : !shopping.ready ? (
                        <p role="status">Loading favorites…</p>
                    ) : shopping.favorites.length === 0 ? (
                        <div className={styles.empty}>
                            <Heart size={36} aria-hidden="true" />
                            <h3>No favorites yet</h3>
                            <p>
                                Save a product with the heart
                                button to see it here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className={styles.note}>
                                {shopping.favorites.length} saved products
                                {shopping.favorites.length > 20
                                    ? " · Showing the first 20. Open the full page for all products."
                                    : ""}
                            </p>

                            {!loaded && (
                                <p role="status">
                                    Loading product details…
                                </p>
                            )}

                            {shopping.favorites
                                .slice(0, 20)
                                .map((item) => {
                                    const product = products[keyOf(item)];

                                    const name = product?.name ||
                                        "Loading product details…";

                                    const href = product?.href ||
                                        `${
                                            item.marketplace === "WILDMARKET"
                                                ? "/products/"
                                                : "/alif/products/"
                                        }${encodeURIComponent(item.productKey)}`;

                                    const unavailable =
                                        !product ||
                                        product.price === null ||
                                        (
                                            item.marketplace === "WILDMARKET" &&
                                            (
                                                product.stock === null ||
                                                product.stock <= 0
                                            )
                                        );

                                    return (
                                        <article
                                            key={item.id}
                                            className={styles.row}
                                        >
                                            <Link
                                                href={href}
                                                className={styles.photo}
                                                onClick={close}
                                                aria-label={`View ${name}`}
                                            >
                                                <Photo product={product} />
                                            </Link>

                                            <div className={styles.copy}>
                                                <small>
                                                    {item.marketplace ===
                                                    "WILDMARKET"
                                                        ? "WildMarket"
                                                        : "AlifShop"}
                                                </small>

                                                <Link
                                                    href={href}
                                                    onClick={close}
                                                >
                                                    <h3>{name}</h3>
                                                </Link>

                                                <strong>
                                                    {product?.price != null
                                                        ? money(product.price)
                                                        : "Price unavailable"}
                                                </strong>

                                                <button
                                                    type="button"
                                                    className={styles.add}
                                                    disabled={
                                                        busy || unavailable
                                                    }
                                                    onClick={() => void run(
                                                        () => shopping.addToCart(
                                                            item.marketplace,
                                                            item.productKey,
                                                        ),
                                                        "Added to cart. Your favorite is still saved.",
                                                    )}
                                                >
                                                    <ShoppingCart
                                                        size={15}
                                                        aria-hidden="true"
                                                    />

                                                    {product?.stock === 0
                                                        ? "Out of stock"
                                                        : "Add to cart"}
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.icon}
                                                disabled={busy}
                                                aria-label={`Remove ${name} from favorites`}
                                                onClick={() => void run(
                                                    () =>
                                                        shopping.removeItem(
                                                            item.id,
                                                        ),
                                                    "Removed from favorites.",
                                                )}
                                            >
                                                <X
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
                    {!guest && (
                        <Link
                            href={
                                kind === "favorites"
                                    ? "/favorites"
                                    : "/account"
                            }
                            className={styles.primary}
                            onClick={close}
                        >
                            Open full{" "}
                            {kind === "favorites"
                                ? "favorites"
                                : "account"}{" "}
                            page
                        </Link>
                    )}

                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={close}
                    >
                        Continue browsing
                    </button>
                </footer>
            </section>
        </dialog>
    );
}

function PanelTrigger({ kind }: { kind: Kind }) {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);

    const router = useRouter();
    const pathname = usePathname();

    const title = kind === "favorites"
        ? "Favorites"
        : "Account";

    return (
        <>
            <button
                ref={trigger}
                type="button"
                className={styles.trigger}
                aria-label={`Open ${title.toLowerCase()}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                title={title}
                onClick={() => setOpen(true)}
            >
                {kind === "favorites" ? (
                    <Heart size={20} aria-hidden="true" />
                ) : (
                    <UserRound size={20} aria-hidden="true" />
                )}

                <span>{title}</span>
            </button>

            {open && createPortal(
                <HeaderPanel
                    kind={kind}
                    onClose={(wasChanged) => {
                        setOpen(false);

                        trigger.current?.focus({
                            preventScroll: true,
                        });

                        if (
                            wasChanged &&
                            ["/cart", "/favorites", "/account"]
                                .includes(pathname)
                        ) {
                            router.refresh();
                        }
                    }}
                />,
                document.body,
            )}
        </>
    );
}

export function MiniFavorites() {
    return <PanelTrigger kind="favorites" />;
}

export function MiniAccount() {
    return <PanelTrigger kind="account" />;
}