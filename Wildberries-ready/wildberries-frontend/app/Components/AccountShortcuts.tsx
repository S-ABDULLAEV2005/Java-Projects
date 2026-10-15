"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    ArrowUpRight,
    Heart,
    Package,
    RefreshCw,
    Settings2,
    ShoppingCart,
} from "lucide-react";

import { useShopping } from "./ShoppingProvider";

type Props = {
    isAdmin: boolean;
    ordersCount: number | null;
};

export default function AccountShortcuts({
                                             isAdmin,
                                             ordersCount,
                                         }: Props) {
    const shopping = useShopping();
    const router = useRouter();

    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState("");

    const countsReady =
        shopping.ready && !shopping.loadError;

    async function refreshAccount() {
        if (refreshing) return;

        setRefreshing(true);
        setRefreshError("");

        try {
            await shopping.reload();
            router.refresh();
        } catch {
            setRefreshError("Could not refresh your account.");
        } finally {
            setRefreshing(false);
        }
    }

    function savedCount(value: number) {
        if (!shopping.ready) return "…";
        if (shopping.loadError) return "Unavailable";
        return String(value);
    }

    return (
        <section
            className="account-dashboard"
            aria-labelledby="account-dashboard-title"
        >
            <div className="account-dashboard-heading">
                <div>
                    <p>Your shopping space</p>
                    <h2 id="account-dashboard-title">
                        Quick access
                    </h2>
                </div>

                <button
                    type="button"
                    className="account-refresh-button"
                    disabled={refreshing}
                    onClick={() => void refreshAccount()}
                >
                    <RefreshCw
                        size={16}
                        className={
                            refreshing
                                ? "account-refresh-spinning"
                                : undefined
                        }
                        aria-hidden="true"
                    />

                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {(refreshError || shopping.loadError) && (
                <p className="account-dashboard-error" role="alert">
                    {refreshError || shopping.loadError}
                </p>
            )}

            <nav
                className="account-shortcuts"
                aria-label="Account shortcuts"
            >
                <Link href="/cart" className="account-shortcut">
                    <div className="account-shortcut-top">
                        <span className="account-shortcut-icon">
                            <ShoppingCart
                                size={23}
                                aria-hidden="true"
                            />
                        </span>

                        <span
                            className="account-shortcut-count"
                            aria-label={
                                countsReady
                                    ? `${shopping.cart.length} products in your cart`
                                    : "Cart count loading or unavailable"
                            }
                        >
                            {savedCount(shopping.cart.length)}
                        </span>
                    </div>

                    <h2>Your cart</h2>

                    <p>
                        Review your products, quantities and prices.
                    </p>

                    <span className="account-shortcut-action">
                        Open cart
                        <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                </Link>

                <Link
                    href="/favorites"
                    className="account-shortcut"
                >
                    <div className="account-shortcut-top">
                        <span className="account-shortcut-icon is-peach">
                            <Heart size={23} aria-hidden="true" />
                        </span>

                        <span
                            className="account-shortcut-count"
                            aria-label={
                                countsReady
                                    ? `${shopping.favorites.length} favorite products`
                                    : "Favorites count loading or unavailable"
                            }
                        >
                            {savedCount(shopping.favorites.length)}
                        </span>
                    </div>

                    <h2>Your favorites</h2>

                    <p>
                        Return to the products you saved for later.
                    </p>

                    <span className="account-shortcut-action">
                        Open favorites
                        <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                </Link>

                <Link
                    href="/account/orders"
                    className="account-shortcut"
                >
                    <div className="account-shortcut-top">
                        <span className="account-shortcut-icon is-lavender">
                            <Package size={23} aria-hidden="true" />
                        </span>

                        <span className="account-shortcut-count">
                            {ordersCount ?? "Unavailable"}
                        </span>
                    </div>

                    <h2>Your orders</h2>

                    <p>
                        View purchased products and order status.
                    </p>

                    <span className="account-shortcut-action">
                        View order history
                        <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                </Link>

                {isAdmin && (
                    <Link
                        href="/admin/products"
                        className="account-shortcut"
                    >
                        <div className="account-shortcut-top">
                            <span className="account-shortcut-icon is-yellow">
                                <Settings2
                                    size={23}
                                    aria-hidden="true"
                                />
                            </span>

                            <span className="account-admin-label">
                                Admin
                            </span>
                        </div>

                        <h2>Manage products</h2>

                        <p>
                            Create products and maintain your catalog.
                        </p>

                        <span className="account-shortcut-action">
                            Open administration
                            <ArrowUpRight
                                size={17}
                                aria-hidden="true"
                            />
                        </span>
                    </Link>
                )}
            </nav>
        </section>
    );
}