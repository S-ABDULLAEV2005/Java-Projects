import CategoryCard from "./Components/CategoryCard";
import DecorativeArt from "./Components/DecorativeArt";
import Link from "next/link";
import {
    ArrowRight,
    Grid2X2,
    PackageSearch,
    ShoppingBag,
    Sparkles,
    Store,
} from "lucide-react";

import ProductCard from "./Components/ProductCard";
import type { Category, Product } from "./_types/product";

async function loadCollection<T>(path: string): Promise<T[] | null> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) return null;

    try {
        const response = await fetch(
            `${backendUrl.replace(/\/+$/, "")}${path}`,
            { cache: "no-store" },
        );

        if (!response.ok) return null;

        const data: unknown = await response.json();
        return Array.isArray(data) ? (data as T[]) : null;
    } catch {
        return null;
    }
}

export default async function HomePage() {
    const [productData, categoryData] = await Promise.all([
        loadCollection<Product>("/products"),
        loadCollection<Category>("/categories"),
    ]);

    const products = productData ?? [];
    const categories = categoryData ?? [];
    const featuredProducts = products.slice(0, 4);

    return (
        <main className="store-home store-home-refined">
            <section className="store-hero">
                <div className="store-hero-overlay" aria-hidden="true" />

                <div className="store-hero-content">
                    <p className="store-eyebrow">
                        <Sparkles size={14} aria-hidden="true" />
                        Discover your everyday favorites
                    </p>

                    <h1>
                        Find your next
                        <span> favorite.</span>
                    </h1>

                    <p className="store-hero-description">
                        Explore the WildMarket collection and discover more
                        through AlifShop.
                    </p>

                    <div className="store-hero-actions">
                        <Link
                            href="/products"
                            className="store-primary-button"
                        >
                            Shop the collection
                            <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                <DecorativeArt priority />
            </section>

            <section
                className="store-category-section"
                aria-label="Browse product categories"
            >
                <div className="store-category-rail">
                    {categories.slice(0, 4).map(category => <CategoryCard key={category.id} name={category.name} href={`/categories/${category.id}`} />)}

                    <Link
                        href="/categories"
                        className="store-category-card home-category-more"
                    >
                        <span className="home-category-thumbnail">
                            <Grid2X2 size={23} aria-hidden="true" />
                        </span>

                        <span className="store-category-copy">
                            <strong>
                                {categories.length ? "More" : "Categories"}
                            </strong>
                            <small>All collections</small>
                        </span>

                        <ArrowRight
                            className="store-category-arrow"
                            size={16}
                            aria-hidden="true"
                        />
                    </Link>
                </div>

                {categoryData === null && (
                    <p className="home-collection-message">
                        Category previews are temporarily unavailable.
                    </p>
                )}
            </section>

            <section
                className="store-products-section"
                aria-labelledby="home-products-title"
            >
                <div className="store-section-heading">
                    <div className="home-products-heading">
                        <h2 id="home-products-title">Discover now</h2>
                        <p>A few finds from the WildMarket collection</p>
                    </div>

                    <Link href="/products" className="store-text-link">
                        View all products
                        <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                </div>

                {featuredProducts.length ? (
                    <div className="store-product-grid">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="store-empty-state">
                        <div>
                            <PackageSearch size={32} aria-hidden="true" />
                        </div>

                        <h3>
                            {productData === null
                                ? "The collection is temporarily unavailable"
                                : "New finds are on their way"}
                        </h3>

                        <p>
                            {productData === null
                                ? "Please try again in a moment."
                                : "Check back soon or explore AlifShop."}
                        </p>

                        <Link href="/alif" className="store-text-link">
                            Explore AlifShop
                            <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                    </div>
                )}
            </section>

            <section
                className="store-marketplaces"
                aria-label="Explore marketplaces"
            >
                <article className="marketplace-card marketplace-local">
                    <div className="marketplace-card-icon">
                        <ShoppingBag size={24} aria-hidden="true" />
                    </div>

                    <div>
                        <span>Local collection</span>
                        <h2>Explore WildMarket</h2>
                        <p>
                            Find technology, accessories, and everyday
                            favorites in one place.
                        </p>

                        <Link href="/categories">
                            Browse WildMarket
                            <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                    </div>
                </article>

                <article className="marketplace-card marketplace-alif">
                    <div className="marketplace-card-icon">
                        <Store size={24} aria-hidden="true" />
                    </div>

                    <div>
                        <span>More to discover</span>
                        <h2>Explore AlifShop</h2>
                        <p>
                            Discover more collections, compare prices,
                            and explore customer feedback.
                        </p>

                        <Link href="/alif">
                            Browse AlifShop
                            <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                    </div>
                </article>
            </section>
        </main>
    );
}