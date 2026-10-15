"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    useRef,
    useState,
    useTransition,
} from "react";

import {
    ArrowUpRight,
    FolderHeart,
    Heart,
    Package,
    RefreshCw,
    Settings2,
    ShoppingCart,
} from "lucide-react";

import { useShopping } from "./ShoppingProvider";
import styles from "./account-overview.module.css";

type Props = {
    isAdmin: boolean;
    ordersCount: number | null;
    collectionsCount: number | null;
};

export default function AccountOverview({
                                            isAdmin,
                                            ordersCount,
                                            collectionsCount,
                                        }: Props) {
    const shopping = useShopping();
    const router = useRouter();

    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState("");

    const [pending, startTransition] = useTransition();
    const inFlight = useRef(false);

    const ready =
        shopping.ready && !shopping.loadError;

    const busy = refreshing || pending;

    const quantity = shopping.cart.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );

    const savedCount = (count: number) =>
        !shopping.ready
            ? "…"
            : shopping.loadError
                ? "Unavailable"
                : String(count);

    async function refresh() {
        if (inFlight.current || pending) return;

        inFlight.current = true;

        setRefreshing(true);
        setRefreshError("");

        try {
            await shopping.reload();

            startTransition(() => {
                router.refresh();
            });
        } catch {
            setRefreshError(
                "Could not refresh your account. Please try again.",
            );
        } finally {
            inFlight.current = false;
            setRefreshing(false);
        }
    }

    const cards = [
        {
            title: "Your cart",
            href: "/cart",
            icon: ShoppingCart,
            tone: "mint",
            count: savedCount(shopping.cart.length),
            unit: "products",

            text: ready
                ? `${quantity} ${
                    quantity === 1 ? "item" : "items"
                } in total. Review quantities and prices.`
                : "Review your products, quantities, and prices.",

            action: "Open cart",
        },
        {
            title: "Your favorites",
            href: "/favorites",
            icon: Heart,
            tone: "peach",
            count: savedCount(shopping.favorites.length),
            unit: "products",
            text: "Return to the products you saved for later.",
            action: "Open favorites",
        },
        {
            title: "Your collections",
            href: "/favorites#favorite-collections-title",
            icon: FolderHeart,
            tone: "yellow",

            count:
                collectionsCount === null
                    ? "Unavailable"
                    : String(collectionsCount),

            unit: "collections",
            text: "Organize favorites into gift ideas, projects, and personal lists.",
            action: "Open collections",
        },
        {
            title: "Your orders",
            href: "/account/orders",
            icon: Package,
            tone: "lavender",

            count:
                ordersCount === null
                    ? "Unavailable"
                    : String(ordersCount),

            unit: "orders",
            text: "Search previous orders and check their products and status.",
            action: "View order history",
        },
    ];

    return (
        <section
            className={styles.dashboard}
            aria-labelledby="account-overview-title"
        >
            <header className={styles.dashboardHeading}>
                <div>
                    <p className={styles.eyebrow}>
                        Everything in its place
                    </p>

                    <h2 id="account-overview-title">
                        Your shopping space
                    </h2>
                </div>

                <button
                    type="button"
                    className={styles.refresh}
                    disabled={busy}
                    onClick={() => void refresh()}
                >
                    <RefreshCw
                        size={16}
                        className={
                            busy ? styles.spinning : undefined
                        }
                        aria-hidden="true"
                    />

                    {busy ? "Refreshing…" : "Refresh"}
                </button>
            </header>

            {(refreshError || shopping.loadError) && (
                <p className={styles.error} role="alert">
                    {refreshError || shopping.loadError}
                </p>
            )}

            {(ordersCount === null ||
                collectionsCount === null) && (
                <p className={styles.note}>
                    Some activity counts could not be loaded.
                    You can still open each section or try
                    Refresh.
                </p>
            )}

            <nav
                className={styles.grid}
                aria-label="Account shortcuts"
            >
                {cards.map(
                    ({
                         title,
                         href,
                         icon: Icon,
                         tone,
                         count,
                         unit,
                         text,
                         action,
                     }) => (
                        <Link
                            key={title}
                            href={href}
                            className={styles.card}
                        >
                            <div className={styles.cardTop}>
                                <span
                                    className={styles.icon}
                                    data-tone={tone}
                                >
                                    <Icon
                                        size={26}
                                        aria-hidden="true"
                                    />
                                </span>

                                <span className={styles.count}>
                                    <strong>{count}</strong>
                                    <small>{unit}</small>
                                </span>
                            </div>

                            <h3>{title}</h3>
                            <p>{text}</p>

                            <span className={styles.action}>
                                {action}
                                <ArrowUpRight
                                    size={18}
                                    aria-hidden="true"
                                />
                            </span>
                        </Link>
                    ),
                )}

                {isAdmin && (
                    <Link
                        href="/admin/products"
                        className={`${styles.card} ${styles.admin}`}
                    >
                        <span
                            className={styles.icon}
                            data-tone="yellow"
                        >
                            <Settings2
                                size={26}
                                aria-hidden="true"
                            />
                        </span>

                        <div>
                            <span className={styles.adminLabel}>
                                Administration
                            </span>

                            <h3>Manage products</h3>

                            <p>
                                Create, update, and maintain
                                your WildMarket catalog.
                            </p>
                        </div>

                        <ArrowUpRight
                            size={23}
                            aria-hidden="true"
                        />
                    </Link>
                )}
            </nav>
        </section>
    );
}