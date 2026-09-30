import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    PackageSearch,
} from "lucide-react";
import AlifProductCard from "../../../Components/AlifProductCard";
import { fetchAlif } from "../../../_lib/alif-api";
import type { AlifCategory, AlifProductsResponse } from "../../../_types/alif";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string | string[] }>;
};


export default async function AlifCategoryProductsPage({
                                                           params,
                                                           searchParams,
                                                       }: Props) {
    const { slug } = await params;
    const query = await searchParams;
    const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
    const requestedPage = Number(rawPage ?? "1");
    const page =
        Number.isSafeInteger(requestedPage) && requestedPage > 0
            ? requestedPage
            : 1;

    const [productsResult, categoriesResult] = await Promise.allSettled([
        fetchAlif<AlifProductsResponse>(
            `/alif/products?category=${encodeURIComponent(slug)}&page=${page}&limit=24&sortType=popular`,
        ),
        fetchAlif<AlifCategory[]>("/alif/categories"),
    ]);

    const data =
        productsResult.status === "fulfilled"
            ? productsResult.value
            : null;

    const categories =
        categoriesResult.status === "fulfilled"
            ? categoriesResult.value
            : [];

    const collection = data?.response?.products;
    const failed = !collection;
    const products = collection?.items ?? [];
    const pagination = collection?.pagination;

    const total = pagination?.total ?? products.length;
    const currentPage = pagination?.current_page ?? page;
    const lastPage = Math.max(1, pagination?.last_page ?? 1);
    const title =
        categories.find((category) => category.slug === slug)?.name ??
        products.find(
            (product) => product.default_category?.slug === slug,
        )?.default_category?.name ??
        slug.replace(/[-_]+/g, " ");
    const categoryPath = `/alif/categories/${encodeURIComponent(slug)}`;

    return (
        <main className="alif-store-page">
            <section className="alif-store-hero alif-store-hero-compact">
                <div className="store-container">
                    <Link href="/alif" className="alif-store-back">
                        <ArrowLeft size={16} />
                        AlifShop categories
                    </Link>

                    <div className="alif-store-heading">
                        <div>
                            <p className="alif-store-eyebrow">
                                <span className="alif-store-mark" aria-hidden="true">
                                    A
                                </span>
                                AlifShop collection
                            </p>

                            <h1 className="alif-store-category-title">{title}</h1>

                            <p className="alif-store-intro">
                                Explore the collection and find something you’ll love.
                            </p>
                        </div>

                        <aside
                            className="alif-store-summary"
                            aria-label="Product count"
                        >
                            <PackageSearch size={25} aria-hidden="true" />
                            <strong>
                                {failed ? "—" : Number(total).toLocaleString("en-US")}
                            </strong>
                            <span>Products in this collection</span>
                        </aside>
                    </div>
                </div>
            </section>

            <section
                className="store-container alif-store-content"
                aria-label={`${title} products`}
            >
                {!failed && (
                    <div className="alif-store-toolbar">
                        <p>
                            <strong>{products.length}</strong> products on this page
                            <span className="alif-store-toolbar-dot" aria-hidden="true">
                                ·
                            </span>
                            Popular first
                        </p>

                        <span>
                            Page {currentPage} of {lastPage}
                        </span>
                    </div>
                )}

                {failed ? (
                    <div className="alif-store-empty" role="alert">
                        <PackageSearch size={34} aria-hidden="true" />
                        <h2>We couldn’t load this collection</h2>
                        <p>Please try again in a moment.</p>
                        <Link
                            href={`${categoryPath}?page=${page}`}
                            className="alif-store-button"
                        >
                            Try again <ArrowRight size={17} />
                        </Link>
                    </div>
                ) : products.length === 0 ? (
                    <div className="alif-store-empty">
                        <PackageSearch size={34} aria-hidden="true" />
                        <h2>No products on this page</h2>
                        <p>Explore another category or return to the first page.</p>

                        <Link
                            href={page > 1 ? categoryPath : "/alif"}
                            className="alif-store-button"
                        >
                            {page > 1 ? "Back to first page" : "Browse categories"}
                            <ArrowRight size={17} />
                        </Link>
                    </div>
                ) : (
                    <div className="alif-store-product-grid">
                        {products.map((product) => (
                            <AlifProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {!failed && pagination && lastPage > 1 && (
                    <nav
                        className="alif-store-pagination"
                        aria-label="Product pages"
                    >
                        {page > 1 ? (
                            <Link
                                href={`${categoryPath}?page=${page - 1}`}
                                className="alif-store-button alif-store-button-secondary"
                                rel="prev"
                            >
                                <ChevronLeft size={17} />
                                Previous
                            </Link>
                        ) : (
                            <span />
                        )}

                        <span className="alif-store-page-number">
                            {currentPage} / {lastPage}
                        </span>

                        {page < lastPage ? (
                            <Link
                                href={`${categoryPath}?page=${page + 1}`}
                                className="alif-store-button"
                                rel="next"
                            >
                                Next
                                <ChevronRight size={17} />
                            </Link>
                        ) : (
                            <span />
                        )}
                    </nav>
                )}
            </section>
        </main>
    );
}