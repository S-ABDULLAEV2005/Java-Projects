import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Heart,
    ShoppingCart,
    UserRound,
} from "lucide-react";

import LogoutButton from "../Components/LogoutButton";

type CurrentUser = {
    username: string;
};

type MyOrder = {
    id: number;
    orderDate: string | null;
    status: string | null;
    items: {
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }[];
    total: number | null;
};

type AccountPageProps = {
    searchParams: Promise<{
        ordered?: string | string[];
    }>;
};

function orderMoney(amount: number) {
    return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} TJS`;
}

function formatOrderDate(value: string | null) {
    if (!value) return "Date unavailable";

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );

    return match
        ? `${match[3]}.${match[2]}.${match[1]} · ${match[4]}:${match[5]}`
        : "Date unavailable";
}

function formatOrderStatus(value: string | null) {
    return value
        ? value.replaceAll("_", " ").toLowerCase()
        : "Status unavailable";
}

export default async function AccountPage({
                                              searchParams,
                                          }: AccountPageProps) {
    const query = await searchParams;
    const showConfirmation = query.ordered === "1";

    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        redirect("/login");
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing");
    }

    const base = backendUrl.replace(/\/$/, "");

    const response = await fetch(`${base}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    if (response.status === 401) {
        redirect("/login");
    }

    if (!response.ok) {
        throw new Error(
            `Could not load your account (${response.status})`,
        );
    }

    const user: CurrentUser = await response.json();

    let orders: MyOrder[] = [];
    let ordersFailed = false;

    // Keep redirects outside the fetch error handler.
    const ordersResponse = await fetch(`${base}/orders/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    }).catch(() => null);

    if (ordersResponse?.status === 401) {
        redirect("/login");
    }

    if (!ordersResponse?.ok) {
        ordersFailed = true;
    } else {
        try {
            const data: MyOrder[] = await ordersResponse.json();

            if (Array.isArray(data)) {
                orders = data;
            } else {
                ordersFailed = true;
            }
        } catch {
            ordersFailed = true;
        }
    }

    return (
        <main className="shopping-page account-page">
            <Link href="/" className="shopping-back-link">
                <ArrowLeft size={17} aria-hidden="true" />
                Back home
            </Link>

            <div className="account-heading">
                <p>Your personal space</p>
                <h1>My account</h1>
            </div>

            <section
                className="account-profile"
                aria-labelledby="account-profile-title"
            >
                <div className="account-avatar" aria-hidden="true">
                    <UserRound size={32} />
                </div>

                <div className="account-profile-copy">
                    <span>Signed in as</span>
                    <h2 id="account-profile-title">{user.username}</h2>
                </div>

                <div className="account-signout">
                    <LogoutButton />
                </div>
            </section>

            <nav
                className="account-shortcuts"
                aria-label="Your saved shopping"
            >
                <Link href="/cart" className="account-shortcut">
                    <span className="account-shortcut-icon">
                        <ShoppingCart size={25} aria-hidden="true" />
                    </span>

                    <h2>Your cart</h2>
                    <p>Review products, quantities, and current prices.</p>
                    <span className="account-shortcut-action">
                        Open cart →
                    </span>
                </Link>

                <Link href="/favorites" className="account-shortcut">
                    <span className="account-shortcut-icon is-peach">
                        <Heart size={25} aria-hidden="true" />
                    </span>

                    <h2>Your favorites</h2>
                    <p>Find the products you saved for later.</p>
                    <span className="account-shortcut-action">
                        Open favorites →
                    </span>
                </Link>
            </nav>

            {showConfirmation && (
                <div className="account-order-confirmation" role="status">
                    <CheckCircle2 size={28} aria-hidden="true" />

                    <div>
                        <h2>Order submitted</h2>
                        <p>
                            Your WildMarket order was submitted successfully.
                            No payment was collected.
                        </p>
                        <p>
                            AlifShop items, if any, remain in your cart.
                        </p>
                    </div>

                    <Link
                        href="/account"
                        replace
                        scroll={false}
                        className="account-confirmation-dismiss"
                        aria-label="Dismiss order confirmation"
                    >
                        Dismiss
                    </Link>
                </div>
            )}

            <section
                className="account-orders"
                aria-labelledby="account-orders-title"
            >
                <div className="account-orders-heading">
                    <div>
                        <p>Your activity</p>
                        <h2 id="account-orders-title">Order history</h2>
                    </div>

                    {!ordersFailed && (
                        <span>
                            {orders.length}{" "}
                            {orders.length === 1 ? "order" : "orders"}
                        </span>
                    )}
                </div>

                {ordersFailed ? (
                    <div className="account-orders-empty" role="alert">
                        <h3>Could not load your orders</h3>
                        <p>Please try loading this page again.</p>
                        <Link
                            href={showConfirmation
                                ? "/account?ordered=1"
                                : "/account"}
                            className="shopping-page-link"
                        >
                            Try again
                        </Link>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="account-orders-empty">
                        <h3>No orders to show</h3>
                        <p>
                            Orders associated with your linked customer
                            profile will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="account-orders-list">
                        {orders.map((order) => (
                            <article
                                key={order.id}
                                className="account-order-card"
                            >
                                <div className="account-order-row">
                                    <div>
                                        <h3>Order #{order.id}</h3>
                                        <p>
                                            {formatOrderDate(order.orderDate)}
                                        </p>
                                    </div>

                                    <span className="account-order-status">
                                        {formatOrderStatus(order.status)}
                                    </span>
                                </div>

                                {order.items?.length > 0 ? (
                                    <ul className="account-order-items">
                                        {order.items.map((item, index) => (
                                            <li
                                                key={`${item.productId}-${index}`}
                                            >
                                                <div>
                                                    <strong>
                                                        {item.productName}
                                                    </strong>

                                                    <span>
                                                        {item.quantity} ×{" "}
                                                        {orderMoney(item.unitPrice)}
                                                    </span>
                                                </div>

                                                <strong>
                                                    {orderMoney(item.lineTotal)}
                                                </strong>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="account-order-legacy">
                                        Product details were not recorded
                                        for this older order.
                                    </p>
                                )}

                                <div className="account-order-total">
                                    <span>Order total</span>
                                    <strong>
                                        {order.total != null
                                            ? orderMoney(order.total)
                                            : "Not recorded"}
                                    </strong>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}