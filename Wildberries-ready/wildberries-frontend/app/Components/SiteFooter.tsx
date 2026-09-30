import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

export default function SiteFooter() {
    return (
        <footer className="store-footer">
            <div className="store-container store-footer-grid">
                <div className="store-footer-intro">
                    <Link href="/" className="store-footer-brand">
                        <span className="store-brand-icon">
                            <ShoppingBag size={22} aria-hidden="true" />
                        </span>

                        <span>
                            <strong>WildMarket</strong>
                            <small>Find your next favorite.</small>
                        </span>
                    </Link>

                    <p>
                        Explore products from WildMarket and discover more
                        through the AlifShop collection.
                    </p>
                </div>

                <nav
                    className="store-footer-column"
                    aria-label="Discover"
                >
                    <h2>Discover</h2>
                    <Link href="/products">All products</Link>
                    <Link href="/categories">Categories</Link>
                    <Link href="/alif">Explore AlifShop</Link>
                </nav>

                <nav
                    className="store-footer-column"
                    aria-label="Account"
                >
                    <h2>Your account</h2>
                    <Link href="/login">Sign in</Link>
                    <Link href="/register">Create account</Link>
                </nav>

                <div className="store-footer-invitation">
                    <p>Something new awaits.</p>

                    <Link
                        href="/products"
                        className="store-footer-catalog-link"
                    >
                        Browse the catalog
                        <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                </div>
            </div>

            <div className="store-container store-footer-bottom">
                <span>© {new Date().getFullYear()} WildMarket</span>
                <Link href="/alif">Discover AlifShop</Link>
            </div>
        </footer>
    );
}