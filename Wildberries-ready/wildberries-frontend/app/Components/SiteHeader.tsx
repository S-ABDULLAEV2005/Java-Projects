import Link from "next/link";

import ShoppingHeaderLinks from "./ShoppingHeaderLinks";
import WildMarketLogo from "./WildMarketLogo";
import StoreNavigation from "./StoreNavigation";
import HeaderSearch from "./HeaderSearch";

export default function SiteHeader() {
    return (
        <header className="store-header wm-clean-header">
            <div className="store-container store-header-main">
                <Link
                    href="/"
                    className="store-brand"
                    aria-label="WildMarket homepage"
                >
                    <WildMarketLogo />
                </Link>

                <HeaderSearch />

                <StoreNavigation />

                <div className="store-account-area">
                    <ShoppingHeaderLinks />
                </div>
            </div>

            <StoreNavigation mobile />
        </header>
    );
}