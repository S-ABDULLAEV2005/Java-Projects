import { cookies } from "next/headers";
import Link from "next/link";
import { LogIn, Search, ShoppingBag, UserPlus } from "lucide-react";

import LogoutButton from "./LogoutButton";
import StoreNavigation from "./StoreNavigation";

export default async function SiteHeader() {
    const cookieStore = await cookies();
    const isLoggedIn = Boolean(cookieStore.get("access_token")?.value);

    return (
        <header className="store-header">
            <div className="store-container store-header-main">
                <Link
                    href="/"
                    className="store-brand"
                    aria-label="WildMarket homepage"
                >
                    <span className="store-brand-icon">
                        <ShoppingBag
                            size={23}
                            strokeWidth={2.1}
                            aria-hidden="true"
                        />
                    </span>

                    <span className="store-brand-text">
                        <strong>WildMarket</strong>
                        <small>Local marketplace</small>
                    </span>
                </Link>

                <form
                    action="/products"
                    method="get"
                    role="search"
                    aria-label="Search WildMarket products"
                    className="store-header-search"
                >
                    <input
                        type="search"
                        name="q"
                        aria-label="Search products, brands or categories"
                        placeholder="Search products, brands or categories…"
                        maxLength={200}
                    />

                    <button type="submit" aria-label="Search products">
                        <Search size={19} aria-hidden="true" />
                    </button>
                </form>

                <StoreNavigation />

                <div className="store-account-area">
                    {isLoggedIn ? (
                        <LogoutButton />
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="store-signin-link"
                                aria-label="Sign in"
                            >
                                <LogIn size={18} aria-hidden="true" />

                                <span>
                                    <strong>Sign in</strong>
                                    <small>Your account</small>
                                </span>
                            </Link>

                            <Link
                                href="/register"
                                className="store-register-link"
                            >
                                <UserPlus size={17} aria-hidden="true" />
                                Create account
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <StoreNavigation mobile />
        </header>
    );
}