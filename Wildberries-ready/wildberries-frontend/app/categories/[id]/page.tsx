import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    Layers3,
    PackageSearch,
} from "lucide-react";

import ProductCard from "../../Components/ProductCard";
import type {
    Category,
    Product,
} from "../../_types/product";

type CategoryPageProps = {
    params: Promise<{
        id: string;
    }>;
};

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

async function getProducts(): Promise<Product[]> {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing in .env.local");
    }

    const response = await fetch(`${backendUrl}/products`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `Could not load products: ${response.status}`,
        );
    }

    return response.json();
}

export default async function CategoryProductsPage({
                                                       params,
                                                   }: CategoryPageProps) {
    const { id } = await params;
    const categoryId = Number(id);

    if (Number.isNaN(categoryId)) {
        notFound();
    }

    const [categories, products] = await Promise.all([
        getCategories(),
        getProducts(),
    ]);

    const selectedCategory = categories.find(
        (category) => category.id === categoryId,
    );

    if (!selectedCategory) {
        notFound();
    }

    const categoryProducts = products.filter(
        (product) => product.category?.id === categoryId,
    );

    const availableProducts = categoryProducts.filter(
        (product) => product.quantity > 0,
    ).length;

    return (
        <main className="store-catalog-page">
            <section className="store-category-detail-hero">
                <div>
                    <Link
                        href="/categories"
                        className="store-back-link"
                    >
                        <ArrowLeft size={17} />
                        All categories
                    </Link>

                    <p className="store-catalog-eyebrow">
                        <Layers3 size={15} />
                        Selected collection
                    </p>

                    <h1>{selectedCategory.name}</h1>

                    <p>
                        Explore all products currently assigned to
                        the {selectedCategory.name} collection.
                    </p>
                </div>

                <div className="store-category-detail-stat">
                    <span>Collection size</span>

                    <strong>{categoryProducts.length}</strong>

                    <small>
                        {categoryProducts.length === 1
                            ? "Product"
                            : "Products"}
                    </small>
                </div>
            </section>

            <section className="store-catalog-content">
                <div className="store-catalog-toolbar">
                    <div className="store-catalog-result">
                        <PackageSearch size={20} />

                        <span>
                            Showing{" "}
                            <strong>
                                {categoryProducts.length}
                            </strong>{" "}
                            {categoryProducts.length === 1
                                ? "product"
                                : "products"}
                        </span>
                    </div>

                    <div className="store-catalog-toolbar-actions">
                        <span className="store-availability-label">
                            {availableProducts} available
                        </span>

                        <Link
                            href="/products"
                            className="store-outline-button"
                        >
                            <Boxes size={17} />
                            All products
                        </Link>
                    </div>
                </div>

                {categoryProducts.length === 0 ? (
                    <div className="store-catalog-empty">
                        <div>
                            <PackageSearch size={36} />
                        </div>

                        <h2>No products in this category</h2>

                        <p>
                            Assign products to this category in your
                            database and reload the page.
                        </p>

                        <Link href="/products">
                            Browse all products
                            <ArrowRight size={17} />
                        </Link>
                    </div>
                ) : (
                    <div className="store-product-grid">
                        {categoryProducts.map((product) => (
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