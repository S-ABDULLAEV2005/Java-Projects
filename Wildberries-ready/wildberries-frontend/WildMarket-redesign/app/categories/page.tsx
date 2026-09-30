import CategoryCard from "../Components/CategoryCard";
import DecorativeArt from "../Components/DecorativeArt";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    Grid2X2,
    PackageSearch,
} from "lucide-react";

import type { Category } from "../_types/product";

async function getCategories(): Promise<Category[]> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing in .env.local");
    }

    const response = await fetch(`${backendUrl}/categories`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `Could not load categories: ${response.status}`,
        );
    }

    return response.json();
}

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <main className="store-catalog-page">
            <section className="store-categories-hero">
                <div>
                    <Link
                        href="/"
                        className="store-back-link"
                    >
                        <ArrowLeft size={17} />
                        Back home
                    </Link>

                    <p className="store-catalog-eyebrow">
                        <Grid2X2 size={15} />
                        Shop by collection
                    </p>

                    <h1>
                        Find something
                        <span> made for you.</span>
                    </h1>

                    <p>
                        Select a category and explore products from
                        the WildMarket collection.
                    </p>
                </div>

                <DecorativeArt priority />
                <div className="store-categories-count">
                    <Boxes size={27} />
                    <strong>{categories.length}</strong>
                    <span>
                        {categories.length === 1
                            ? "Category"
                            : "Categories"}
                    </span>
                </div>
            </section>

            <section className="store-catalog-content">
                <div className="store-section-heading">
                    <div>
                        <p className="store-section-label">
                            Your collections
                        </p>

                        <h2>Browse categories</h2>

                        <p>
                            Every category opens its own collection
                            of products.
                        </p>
                    </div>

                    <Link
                        href="/products"
                        className="store-text-link"
                    >
                        View all products
                        <ArrowRight size={17} />
                    </Link>
                </div>

                {categories.length === 0 ? (
                    <div className="store-catalog-empty">
                        <div>
                            <PackageSearch size={36} />
                        </div>

                        <h2>No categories found</h2>

                        <p>
                            New collections will appear here when available.
                        </p>
                    </div>
                ) : (
                    <div className="store-categories-grid">
                        {categories.map(category => <CategoryCard key={category.id} name={category.name} href={`/categories/${category.id}`} />)}
                    </div>
                )}
            </section>
        </main>
    );
}