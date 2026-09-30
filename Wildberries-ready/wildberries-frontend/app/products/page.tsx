import DecorativeArt from "../Components/DecorativeArt";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    CheckCircle2,
    PackageSearch,
    Search,
    ShoppingBag,
} from "lucide-react";

import ProductCard from "../Components/ProductCard";
import type { Product } from "../_types/product";

type Props = {
    searchParams: Promise<{ q?: string | string[] }>;
};

async function getProducts(): Promise<Product[]> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing in .env.local");
    }

    const response = await fetch(
        `${backendUrl.replace(/\/+$/, "")}/products`,
        { cache: "no-store" },
    );

    if (!response.ok) {
        throw new Error(`Could not load products: ${response.status}`);
    }

    return response.json();
}

function normalizeSearch(value: string) {
    return value
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

export default async function ProductsPage({ searchParams }: Props) {
    const params = await searchParams;
    const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
    const query = (rawQuery ?? "").trim().slice(0, 200);
    const searchTerms = normalizeSearch(query).split(" ").filter(Boolean);

    const products = await getProducts();

    const results = searchTerms.length
        ? products.filter((product) => {
            const searchableText = normalizeSearch(
                [
                    product.name,
                    product.brand ?? "",
                    product.category?.name ?? "",
                ].join(" "),
            );

            return searchTerms.every((term) =>
                searchableText.includes(term),
            );
        })
        : products;

    const availableProducts = products.filter(
        (product) => product.quantity > 0,
    ).length;

    const availableResults = results.filter(
        (product) => product.quantity > 0,
    ).length;

    const unavailableProducts = products.length - availableProducts;

    return (
        <main className="store-catalog-page">
            <section className="store-catalog-hero">
                <div className="store-catalog-hero-content">
                    <Link href="/" className="store-back-link">
                        <ArrowLeft size={17} aria-hidden="true" />
                        Back home
                    </Link>

                    <p className="store-catalog-eyebrow">
                        <ShoppingBag size={15} aria-hidden="true" />
                        Local WildMarket collection
                    </p>

                    <h1>
                        Products worth
                        <span> discovering.</span>
                    </h1>

                    <p className="store-catalog-description">
                        Find your next favorite. Explore products, compare
                        prices, and discover what other customers think.
                    </p>

                    <Link
                        href="/categories"
                        className="store-catalog-hero-button"
                    >
                        Browse categories
                        <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                </div>

                <DecorativeArt priority />
                <div className="store-catalog-stats">
                    <article>
                        <span>Total collection</span>
                        <strong>{products.length}</strong>
                        <small>Products</small>
                    </article>

                    <article>
                        <span>Ready to explore</span>
                        <strong>{availableProducts}</strong>
                        <small>In stock</small>
                    </article>

                    <article>
                        <span>Currently unavailable</span>
                        <strong>{unavailableProducts}</strong>
                        <small>Out of stock</small>
                    </article>
                </div>
            </section>

            <section className="store-catalog-content">
                <form
                    action="/products"
                    method="get"
                    role="search"
                    aria-label="Search the local catalog"
                    className="store-catalog-search-form"
                >
                    <label
                        htmlFor="catalog-search"
                        className="store-catalog-search-label"
                    >
                        Find something you love
                    </label>

                    <div className="store-catalog-search-controls">
                        <div className="store-catalog-search-input">
                            <Search size={19} aria-hidden="true" />

                            <input
                                key={query}
                                id="catalog-search"
                                type="search"
                                name="q"
                                defaultValue={query}
                                placeholder="Search by product, brand or category"
                                maxLength={200}
                            />
                        </div>

                        <button
                            type="submit"
                            className="store-catalog-search-submit"
                        >
                            Search
                            <ArrowRight size={17} aria-hidden="true" />
                        </button>
                    </div>
                </form>

                <div className="store-catalog-toolbar">
                    <div className="store-catalog-result">
                        <PackageSearch size={20} aria-hidden="true" />

                        <span>
                            Showing <strong>{results.length}</strong>{" "}
                            {results.length === 1 ? "product" : "products"}
                        </span>
                    </div>

                    <div className="store-catalog-toolbar-actions">
                        <span className="store-availability-label">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            {availableResults} available
                        </span>

                        <Link
                            href="/categories"
                            className="store-outline-button"
                        >
                            <Boxes size={17} aria-hidden="true" />
                            Categories
                        </Link>
                    </div>
                </div>

                {query && (
                    <div className="store-search-summary">
                        <p>
                            Results for <strong>“{query}”</strong>
                        </p>

                        <Link href="/products">Clear search</Link>
                    </div>
                )}

                {results.length === 0 ? (
                    <div className="store-catalog-empty">
                        <div>
                            <PackageSearch size={36} aria-hidden="true" />
                        </div>

                        <h2>
                            {query
                                ? "No matching products"
                                : "No products available yet"}
                        </h2>

                        <p>
                            {query
                                ? "Try another product name, brand or category."
                                : "Check back soon to explore new products."}
                        </p>

                        <Link href={query ? "/products" : "/categories"}>
                            {query ? "View all products" : "View categories"}
                            <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                    </div>
                ) : (
                    <div className="store-product-grid">
                        {results.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}