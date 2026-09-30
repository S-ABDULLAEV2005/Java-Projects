import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch } from "lucide-react";

export default function NotFoundPage() {
    return (
        <main className="store-status-page">
            <section className="store-status-panel">
                <span className="store-status-icon">
                    <PackageSearch size={30} aria-hidden="true" />
                </span>

                <p className="store-status-eyebrow">404 · Page not found</p>
                <h1>Let’s find something else.</h1>
                <p className="store-status-description">
                    This page may have moved or is no longer available.
                    Explore the collection to find your next favorite.
                </p>

                <div className="store-status-actions">
                    <Link href="/products" className="store-status-button">
                        Browse products
                        <ArrowRight size={17} aria-hidden="true" />
                    </Link>

                    <Link
                        href="/"
                        className="store-status-button is-secondary"
                    >
                        <ArrowLeft size={17} aria-hidden="true" />
                        Back home
                    </Link>
                </div>
            </section>
        </main>
    );
}