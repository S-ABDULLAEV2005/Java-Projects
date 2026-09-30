import CategoryCard from "../Components/CategoryCard";
import DecorativeArt from "../Components/DecorativeArt";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    PackageSearch,
    Store,
} from "lucide-react";
import { fetchAlif } from "../_lib/alif-api";
import type { AlifCategory } from "../_types/alif";

export default async function AlifCategoriesPage() {
    let categories: AlifCategory[] = [];
    let failed = false;

    try {
        categories = await fetchAlif<AlifCategory[]>("/alif/categories");
    } catch {
        failed = true;
    }

    return (
        <main className="alif-store-page">
            <section className="alif-store-hero">
                <div className="store-container">
                    <Link href="/" className="alif-store-back">
                        <ArrowLeft size={16} />
                        Choose marketplace
                    </Link>

                    <div className="alif-store-heading">
                        <div>
                            <p className="alif-store-eyebrow">
                                <span className="alif-store-mark" aria-hidden="true">
                                    A
                                </span>
                                Explore AlifShop
                            </p>

                            <h1>
                                Your next find.
                                <br />
                                <span>All in one place.</span>
                            </h1>

                            <p className="alif-store-intro">
                                Discover everyday essentials and something special.
                                Browse AlifShop by category to find your next favorite.
                            </p>
                        </div>

                        <DecorativeArt priority />
                        <aside
                            className="alif-store-summary"
                            aria-label="Catalog summary"
                        >
                            <Store size={25} aria-hidden="true" />
                            <strong>
                                {failed ? "—" : categories.length}
                            </strong>
                            <span>Categories to explore</span>
                        </aside>
                    </div>
                </div>
            </section>

            <section className="store-container alif-store-content">
                <div className="alif-store-section-heading">
                    <div>
                        <p className="alif-store-eyebrow">Shop your interests</p>
                        <h2>Browse categories</h2>
                    </div>

                    <span className="alif-store-caption">
                        Technology, beauty & everyday living
                    </span>
                </div>

                {failed ? (
                    <div className="alif-store-empty" role="alert">
                        <Store size={34} aria-hidden="true" />
                        <h2>We couldn’t load the categories</h2>
                        <p>Please try again in a moment.</p>
                        <Link href="/alif" className="alif-store-button">
                            Try again <ArrowRight size={17} />
                        </Link>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="alif-store-empty">
                        <PackageSearch size={34} aria-hidden="true" />
                        <h2>No categories available yet</h2>
                        <p>Check back soon for more collections.</p>
                    </div>
                ) : (
                    <div className="alif-store-category-grid">
                        {categories.map(category => <CategoryCard key={category.slug} name={category.name} slug={category.slug} href={`/alif/categories/${encodeURIComponent(category.slug)}`} />)}
                    </div>
                )}
            </section>
        </main>
    );
}