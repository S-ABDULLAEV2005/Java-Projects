import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import OrderHistoryCard, {
    type OrderRecord,
} from "./OrderHistoryCard";

import styles from "./order-history.module.css";

type History = {
    items: OrderRecord[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    today: string;
};

const statuses = [
    "NEW",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
];

function dateLabel(value: string) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    return match
        ? `${match[3]}.${match[2]}.${match[1]}`
        : "Date unavailable";
}

function label(value: string) {
    return value.replaceAll("_", " ").toLowerCase();
}

function daysBefore(day: string, count: number) {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - count);
    return date.toISOString().slice(0, 10);
}

export default async function AccountOrdersPage({
                                                    searchParams,
                                                }: {
    searchParams: Promise<
        Record<string, string | string[] | undefined>
    >;
}) {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) redirect("/login");

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing");
    }

    const params = await searchParams;

    const read = (key: string) => {
        const value = params[key];
        return typeof value === "string" ? value.trim() : "";
    };

    const from = read("from");
    const to = read("to");
    const q = read("q").slice(0, 200);
    const status = read("status");

    const rawPage = Number(read("page") || "1");

    const requestedPage =
        Number.isSafeInteger(rawPage) &&
        rawPage >= 1 &&
        rawPage <= 1_000_000
            ? rawPage
            : 1;

    const filters = new URLSearchParams();

    if (from) filters.set("from", from);
    if (to) filters.set("to", to);
    if (q) filters.set("q", q);
    if (status) filters.set("status", status);

    function href(changes: Record<string, string>) {
        const next = new URLSearchParams(filters);

        for (const [key, value] of Object.entries(changes)) {
            if (value) {
                next.set(key, value);
            } else {
                next.delete(key);
            }
        }

        const query = next.toString();

        return `/account/orders${query ? `?${query}` : ""}`;
    }

    const query = new URLSearchParams(filters);

    query.set("page", String(requestedPage - 1));
    query.set("size", "5");

    const response = await fetch(
        `${backendUrl.replace(/\/$/, "")}/orders/me/history?${query}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
        },
    ).catch(() => null);

    if (response?.status === 401) {
        redirect("/login");
    }

    let history: History | null = null;
    let error = "";

    if (response?.ok) {
        try {
            const data: History = await response.json();

            if (
                !Array.isArray(data.items) ||
                !Number.isInteger(data.page) ||
                data.page < 0 ||
                !Number.isSafeInteger(data.totalElements) ||
                data.totalElements < 0 ||
                !Number.isInteger(data.totalPages) ||
                data.totalPages < 0 ||
                typeof data.today !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(data.today)
            ) {
                throw new Error("Invalid history response");
            }

            history = data;
        } catch {
            error =
                "Could not read your order history. Please try again.";
        }
    } else if (response?.status === 400) {
        const body = await response.json().catch(() => null);

        error = typeof body?.message === "string"
            ? body.message
            : "Please check your filters.";
    } else {
        error =
            "Could not load your order history. Please try again.";
    }

    if (
        history &&
        requestedPage > Math.max(1, history.totalPages)
    ) {
        redirect(href({
            page: String(Math.max(1, history.totalPages)),
        }));
    }

    const groups = new Map<string, OrderRecord[]>();

    for (const order of history?.items ?? []) {
        const day = order.orderDate?.slice(0, 10) || "unknown";
        const group = groups.get(day) ?? [];

        group.push(order);
        groups.set(day, group);
    }

    const filtered = Boolean(from || to || q || status);

    const dateShortcuts = history ? [
        {
            title: "All dates",
            from: "",
            to: "",
        },
        {
            title: "Today",
            from: history.today,
            to: history.today,
        },
        {
            title: "Yesterday",
            from: daysBefore(history.today, 1),
            to: daysBefore(history.today, 1),
        },
        {
            title: "Last 7 days",
            from: daysBefore(history.today, 6),
            to: history.today,
        },
    ] : [];

    return (
        <main
            className={`shopping-page account-page ${styles.history}`}
        >
            <Link href="/account" className="shopping-back-link">
                ← My account
            </Link>

            <div className="account-heading">
                <p>Your purchases, organized by day</p>
                <h1>Order history</h1>
            </div>

            <section
                className={styles.filters}
                aria-labelledby="history-filter-title"
            >
                <h2 id="history-filter-title">
                    Find an order
                </h2>

                <form
                    key={`${q}-${from}-${to}-${status}`}
                    action="/account/orders"
                    method="get"
                    className={styles.form}
                >
                    <label>
                        Order number or product
                        <input
                            type="search"
                            name="q"
                            defaultValue={q}
                            placeholder="iPhone, headphones or #10"
                            maxLength={200}
                        />
                    </label>

                    <label>
                        From date
                        <input
                            type="date"
                            name="from"
                            defaultValue={from}
                        />
                    </label>

                    <label>
                        To date
                        <input
                            type="date"
                            name="to"
                            defaultValue={to}
                        />
                    </label>

                    <label>
                        Order status
                        <select
                            name="status"
                            defaultValue={status}
                        >
                            <option value="">
                                All statuses
                            </option>

                            {statuses.map((value) => (
                                <option key={value} value={value}>
                                    {label(value)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className={styles.actions}>
                        <button
                            type="submit"
                            className="shopping-page-link"
                        >
                            Search
                        </button>

                        <Link
                            href="/account/orders"
                            className="store-outline-button"
                        >
                            Reset
                        </Link>
                    </div>
                </form>

                {history && (
                    <nav
                        className={styles.quick}
                        aria-label="Filter orders by date"
                    >
                        {dateShortcuts.map((shortcut) => (
                            <Link
                                key={shortcut.title}
                                href={href({
                                    from: shortcut.from,
                                    to: shortcut.to,
                                })}
                                aria-current={
                                    from === shortcut.from &&
                                    to === shortcut.to
                                        ? "true"
                                        : undefined
                                }
                            >
                                {shortcut.title}
                            </Link>
                        ))}
                    </nav>
                )}
            </section>

            <section
                className="account-orders"
                aria-labelledby="account-orders-title"
            >
                <div className="account-orders-heading">
                    <h2 id="account-orders-title">
                        {filtered
                            ? "Search results"
                            : "All your orders"}
                    </h2>

                    {history && (
                        <span>
                            {history.totalElements}{" "}
                            {history.totalElements === 1
                                ? "order"
                                : "orders"}
                        </span>
                    )}
                </div>

                {error ? (
                    <div
                        className="account-orders-empty"
                        role="alert"
                    >
                        <h3>History unavailable</h3>
                        <p>{error}</p>

                        <Link
                            href={href({
                                page: String(requestedPage),
                            })}
                            className="shopping-page-link"
                        >
                            Try again
                        </Link>
                    </div>
                ) : history?.items.length === 0 ? (
                    <div className="account-orders-empty">
                        <h3>
                            {filtered
                                ? "No matching orders"
                                : "No orders yet"}
                        </h3>

                        <p>
                            {filtered
                                ? "Try another product name, order number, date, or status."
                                : "Your saved orders will appear here after checkout."}
                        </p>

                        <Link
                            href={filtered
                                ? "/account/orders"
                                : "/products"}
                            className="shopping-page-link"
                        >
                            {filtered
                                ? "Clear filters"
                                : "Browse products"}
                        </Link>
                    </div>
                ) : (
                    <div className={styles.groups}>
                        {Array.from(groups, ([day, orders]) => (
                            <section
                                key={day}
                                aria-label={`Orders for ${dateLabel(day)}`}
                            >
                                <h3 className={styles.day}>
                                    {dateLabel(day)}
                                </h3>

                                <div className="account-orders-list">
                                    {orders.map((order) => (
                                        <OrderHistoryCard
                                            key={order.id}
                                            order={order}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {history && history.totalPages > 1 && (
                    <nav
                        className={styles.pagination}
                        aria-label="Order history pages"
                    >
                        {history.page > 0 ? (
                            <Link
                                href={href({
                                    page: String(history.page),
                                })}
                                className="store-outline-button"
                            >
                                ← Previous
                            </Link>
                        ) : (
                            <span />
                        )}

                        <span>
                            Page {history.page + 1} of{" "}
                            {history.totalPages}
                        </span>

                        {history.page + 1 < history.totalPages ? (
                            <Link
                                href={href({
                                    page: String(history.page + 2),
                                })}
                                className="store-outline-button"
                            >
                                Next →
                            </Link>
                        ) : (
                            <span />
                        )}
                    </nav>
                )}
            </section>
        </main>
    );
}