"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from "react";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Eye,
    ImageIcon,
    Package,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";

import ProductImagePicker, {
    type SelectedImage,
} from "./ProductImagePicker";

import {
    filterCatalog,
    money,
    safeImage,
    type SortOrder,
    type StockFilter,
} from "./catalog-tools";

import styles from "./admin-products.module.css";

export type ManagedCategory = {
    id: number;
    name: string;
};

export type ManagedProduct = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    brand: string | null;
    imageUrl: string | null;
    category: ManagedCategory | null;
};

type Draft = {
    name: string;
    description: string;
    price: string;
    quantity: string;
    brand: string;
    imageUrl: string;
    categoryId: string;
};

type Editor =
    | { kind: "create" | "edit"; id?: number }
    | { kind: "image"; id: number; name: string };

const PAGE_SIZE = 5;

async function api<T>(
    path: string,
    method = "GET",
    body?: unknown,
): Promise<T> {
    const response = await fetch(`/api/admin/${path}`, {
        method,
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: body === undefined
            ? undefined
            : JSON.stringify(body),
    });

    const data = response.status === 204
        ? null
        : await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.detail ||
            (
                response.status === 401
                    ? "Your session expired. Sign in again."
                    : response.status === 403
                        ? "Admin access is required."
                        : `Request failed (${response.status})`
            ),
        );
    }

    return data as T;
}

function Photo({
                   src,
                   name,
                   temporary = false,
               }: {
    src: string | null;
    name: string;
    temporary?: boolean;
}) {
    const [failed, setFailed] = useState<string | null>(null);

    const photo = temporary && src?.startsWith("blob:")
        ? src
        : safeImage(src);

    return photo && failed !== photo ? (
        <Image
            src={photo}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 700px) 90vw, 300px"
            onError={() => setFailed(photo)}
        />
    ) : (
        <ImageIcon size={30} aria-hidden="true" />
    );
}

export default function ProductManager({
                                           initialProducts,
                                           categories,
                                       }: {
    initialProducts: ManagedProduct[];
    categories: ManagedCategory[];
}) {
    const router = useRouter();

    const blank = (): Draft => ({
        name: "",
        description: "",
        price: "",
        quantity: "0",
        brand: "",
        imageUrl: "",
        categoryId: String(categories[0]?.id ?? ""),
    });

    const [products, setProducts] = useState(initialProducts);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [stock, setStock] = useState<StockFilter>("all");
    const [sort, setSort] = useState<SortOrder>("newest");
    const [page, setPage] = useState(1);

    const [editor, setEditor] = useState<Editor | null>(null);
    const [draft, setDraft] = useState<Draft>(blank());

    const [deleteTarget, setDeleteTarget] =
        useState<ManagedProduct | null>(null);

    const [selectedImage, setSelectedImage] =
        useState<SelectedImage | null>(null);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const inFlight = useRef(false);
    const editorRef = useRef<HTMLElement>(null);
    const editorTitleRef = useRef<HTMLHeadingElement>(null);
    const addRef = useRef<HTMLButtonElement>(null);
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    const cancelDeleteRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        return () => {
            if (selectedImage) {
                URL.revokeObjectURL(selectedImage.previewUrl);
            }
        };
    }, [selectedImage]);

    useEffect(() => {
        if (!editor) return;

        editorTitleRef.current?.focus({ preventScroll: true });

        editorRef.current?.scrollIntoView({
            block: "start",
            behavior: "instant",
        });
    }, [editor]);

    useEffect(() => {
        if (!deleteTarget) return;

        const dialog = deleteDialogRef.current;
        if (!dialog) return;

        const previousFocus =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const fallbackFocus = addRef.current;
        const body = document.body;

        const oldOverflow = body.style.overflow;
        const oldPadding = body.style.paddingRight;

        const gap =
            window.innerWidth -
            document.documentElement.clientWidth;

        const padding =
            parseFloat(getComputedStyle(body).paddingRight) || 0;

        if (!dialog.open) dialog.showModal();

        body.style.overflow = "hidden";

        if (gap > 0) {
            body.style.paddingRight = `${padding + gap}px`;
        }

        cancelDeleteRef.current?.focus({ preventScroll: true });

        return () => {
            dialog.close();

            body.style.overflow = oldOverflow;
            body.style.paddingRight = oldPadding;

            if (previousFocus?.isConnected) {
                previousFocus.focus({ preventScroll: true });
            } else {
                fallbackFocus?.focus({ preventScroll: true });
            }
        };
    }, [deleteTarget]);

    const matches = filterCatalog(
        products,
        query,
        category,
        stock,
        sort,
    );

    const pages = Math.max(
        1,
        Math.ceil(matches.length / PAGE_SIZE),
    );

    const currentPage = Math.min(page, pages);

    const visible = matches.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const inStock = products.filter(
        (product) => product.quantity > 0,
    ).length;

    const outOfStock = products.filter(
        (product) => product.quantity === 0,
    ).length;

    const missingImages = products.filter(
        (product) => !product.imageUrl?.trim(),
    ).length;

    const draftCategory = categories.find(
        (item) => String(item.id) === draft.categoryId,
    )?.name;

    const editorTitle = editor?.kind === "create"
        ? "Add product"
        : editor?.kind === "image"
            ? `Update image: ${editor.name}`
            : `Edit product #${editor?.id}`;

    function clearFilters() {
        setQuery("");
        setCategory("");
        setStock("all");
        setSort("newest");
        setPage(1);
    }

    function field(key: keyof Draft, value: string) {
        setDraft((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function begin(
        product?: ManagedProduct,
        imageOnly = false,
    ) {
        if (inFlight.current) return;

        setError("");
        setMessage("");
        setDeleteTarget(null);
        setSelectedImage(null);

        setDraft(product ? {
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            quantity: String(product.quantity),
            brand: product.brand ?? "",
            imageUrl: product.imageUrl ?? "",
            categoryId: String(product.category?.id ?? ""),
        } : blank());

        setEditor(
            !product
                ? { kind: "create" }
                : imageOnly
                    ? {
                        kind: "image",
                        id: product.id,
                        name: product.name,
                    }
                    : { kind: "edit", id: product.id },
        );
    }

    async function reloadProducts() {
        const next = await api<ManagedProduct[]>("products");

        if (!Array.isArray(next)) {
            throw new Error("Unexpected catalog response");
        }

        setProducts(next);
    }

    async function refresh() {
        if (inFlight.current) return;

        inFlight.current = true;
        setBusy(true);
        setError("");
        setMessage("");

        try {
            await reloadProducts();
            router.refresh();
            setMessage("Catalog refreshed.");
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Could not refresh products.",
            );
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    async function mutate(
        action: () => Promise<unknown>,
        success: string,
    ) {
        if (inFlight.current) return;

        inFlight.current = true;
        setBusy(true);
        setError("");
        setMessage("");

        try {
            await action();

            if (editor?.kind === "create") {
                clearFilters();
            }

            setEditor(null);
            setSelectedImage(null);
            setDeleteTarget(null);
            setMessage(success);

            router.refresh();

            try {
                await reloadProducts();
            } catch {
                setError(
                    "The change succeeded, but the list could not refresh. " +
                    "Use Refresh catalog before making another change.",
                );
            }
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "The change failed. Please try again.",
            );
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    async function resolveImageUrl(): Promise<string | null> {
        if (!selectedImage) {
            return draft.imageUrl.trim() || null;
        }

        const body = new FormData();
        body.append("file", selectedImage.file);

        const response = await fetch("/api/admin/images", {
            method: "POST",
            body,
        });

        const data = await response.json().catch(() => null);

        if (
            !response.ok ||
            typeof data?.imageUrl !== "string"
        ) {
            throw new Error(
                data?.message || "Could not upload the photo",
            );
        }

        field("imageUrl", data.imageUrl);
        setSelectedImage(null);

        return data.imageUrl;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editor || inFlight.current) return;

        if (
            !selectedImage &&
            draft.imageUrl.trim() &&
            !safeImage(draft.imageUrl)
        ) {
            setError(
                "Use a valid HTTP/HTTPS image URL or a local path beginning with /.",
            );
            return;
        }

        if (editor.kind === "image") {
            if (!selectedImage && !draft.imageUrl.trim()) {
                setError(
                    "Choose a photo or enter an image URL. " +
                    "To clear an image, use Edit product.",
                );
                return;
            }

            await mutate(
                async () => api(
                    `products/${editor.id}/image`,
                    "PATCH",
                    { imageUrl: await resolveImageUrl() },
                ),
                "Product image updated.",
            );

            return;
        }

        const price = Number(draft.price);
        const quantity = Number(draft.quantity);

        if (
            !draft.name.trim() ||
            !categories.some(
                (item) => String(item.id) === draft.categoryId,
            ) ||
            !draft.price.trim() ||
            !Number.isFinite(price) ||
            price < 0 ||
            !draft.quantity.trim() ||
            !Number.isInteger(quantity) ||
            quantity < 0 ||
            quantity > 2147483647
        ) {
            setError(
                "Enter a name, category, non-negative price and whole-number quantity.",
            );
            return;
        }

        const path = editor.kind === "create"
            ? `products/category/${draft.categoryId}`
            : `products/${editor.id}/category/${draft.categoryId}`;

        await mutate(
            async () => api(
                path,
                editor.kind === "create" ? "POST" : "PUT",
                {
                    name: draft.name.trim(),
                    description: draft.description.trim() || null,
                    price,
                    quantity,
                    brand: draft.brand.trim() || null,
                    imageUrl: await resolveImageUrl(),
                },
            ),
            editor.kind === "create"
                ? "Product created."
                : "Product updated.",
        );
    }

    return (
        <main className={styles.page}>
            <Link href="/account" className={styles.back}>
                <ArrowLeft size={17} aria-hidden="true" />
                My account
            </Link>

            <header className={styles.heading}>
                <div>
                    <p className={styles.eyebrow}>
                        WildMarket administration
                    </p>
                    <h1>Manage products</h1>
                    <p>
                        A clear view of your catalog, stock,
                        and product information.
                    </p>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() => void refresh()}
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                        Refresh catalog
                    </button>

                    <button
                        ref={addRef}
                        type="button"
                        className={styles.primary}
                        disabled={busy || !categories.length}
                        onClick={() => begin()}
                    >
                        <Plus size={17} aria-hidden="true" />
                        Add product
                    </button>
                </div>
            </header>

            <section
                className={styles.stats}
                aria-label="Overview of the whole catalog"
            >
                {[
                    {
                        label: "Catalog products",
                        value: products.length,
                        tone: "mint",
                    },
                    {
                        label: "In stock",
                        value: inStock,
                        tone: "lavender",
                    },
                    {
                        label: "Out of stock",
                        value: outOfStock,
                        tone: "peach",
                    },
                    {
                        label: "Missing image URL",
                        value: missingImages,
                        tone: "yellow",
                    },
                ].map((stat) => (
                    <article key={stat.label} data-tone={stat.tone}>
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                    </article>
                ))}
            </section>

            <div className={styles.toolbar}>
                <label className={styles.search}>
                    Search catalog
                    <input
                        type="search"
                        maxLength={200}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Name, brand, category or #ID"
                    />
                </label>

                <label>
                    Category
                    <select
                        value={category}
                        onChange={(event) => {
                            setCategory(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All categories</option>
                        {categories.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Stock
                    <select
                        value={stock}
                        onChange={(event) => {
                            setStock(event.target.value as StockFilter);
                            setPage(1);
                        }}
                    >
                        <option value="all">Any stock</option>
                        <option value="in">In stock</option>
                        <option value="out">Out of stock</option>
                        <option value="low">Low stock: 1–5</option>
                    </select>
                </label>

                <label>
                    Sort
                    <select
                        value={sort}
                        onChange={(event) => {
                            setSort(event.target.value as SortOrder);
                            setPage(1);
                        }}
                    >
                        <option value="newest">Newest first</option>
                        <option value="name">Name A–Z</option>
                        <option value="price-asc">
                            Price: low to high
                        </option>
                        <option value="price-desc">
                            Price: high to low
                        </option>
                        <option value="stock">
                            Stock: low to high
                        </option>
                    </select>
                </label>
            </div>

            {!categories.length && (
                <p className={styles.notice}>
                    Create a category in your existing backend first.
                    A product needs a category.
                </p>
            )}

            <div className={styles.statusArea}>
                {error && !deleteTarget && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <p
                    className={message ? styles.success : styles.result}
                    role="status"
                >
                    {busy ? "Processing…" : message}
                </p>
            </div>

            {editor && (
                <section
                    ref={editorRef}
                    className={`${styles.panel} ${styles.editor}`}
                    aria-labelledby="product-editor-title"
                >
                    <h2
                        ref={editorTitleRef}
                        tabIndex={-1}
                        id="product-editor-title"
                    >
                        {editorTitle}
                    </h2>

                    <div className={styles.editorLayout}>
                        <form onSubmit={(event) => void submit(event)}>
                            <fieldset
                                className={styles.fields}
                                disabled={busy}
                            >
                                {editor.kind !== "image" && (
                                    <>
                                        <label>
                                            Name
                                            <input
                                                required
                                                maxLength={255}
                                                value={draft.name}
                                                onChange={(event) =>
                                                    field("name", event.target.value)
                                                }
                                            />
                                        </label>

                                        <label>
                                            Category
                                            <select
                                                required
                                                value={draft.categoryId}
                                                onChange={(event) =>
                                                    field("categoryId", event.target.value)
                                                }
                                            >
                                                <option value="">
                                                    Select category
                                                </option>
                                                {categories.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Price (TJS)
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={draft.price}
                                                onChange={(event) =>
                                                    field("price", event.target.value)
                                                }
                                            />
                                        </label>

                                        <label>
                                            Quantity
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                max="2147483647"
                                                step="1"
                                                value={draft.quantity}
                                                onChange={(event) =>
                                                    field("quantity", event.target.value)
                                                }
                                            />
                                        </label>

                                        <label>
                                            Brand
                                            <input
                                                maxLength={255}
                                                value={draft.brand}
                                                onChange={(event) =>
                                                    field("brand", event.target.value)
                                                }
                                            />
                                        </label>

                                        <label className={styles.wide}>
                                            Description
                                            <textarea
                                                maxLength={255}
                                                rows={3}
                                                value={draft.description}
                                                onChange={(event) =>
                                                    field("description", event.target.value)
                                                }
                                            />
                                        </label>
                                    </>
                                )}

                                <ProductImagePicker
                                    key={`${editor.kind}-${editor.id ?? "new"}`}
                                    selected={selectedImage}
                                    imageUrl={draft.imageUrl}
                                    disabled={busy}
                                    onSelect={setSelectedImage}
                                    onRemove={() => {
                                        setSelectedImage(null);
                                        field("imageUrl", "");
                                    }}
                                />

                                <details className={styles.wide}>
                                    <summary>
                                        Use an image URL instead
                                    </summary>

                                    <label>
                                        Image URL (optional)
                                        <input
                                            maxLength={255}
                                            value={draft.imageUrl}
                                            onChange={(event) => {
                                                setSelectedImage(null);
                                                field("imageUrl", event.target.value);
                                            }}
                                            placeholder="https://… or /images/product.webp"
                                        />
                                    </label>
                                </details>
                            </fieldset>

                            <div className={styles.actions}>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className={styles.primary}
                                >
                                    {editor.kind === "create"
                                        ? "Create product"
                                        : "Save changes"}
                                </button>

                                <button
                                    type="button"
                                    disabled={busy}
                                    className={styles.secondary}
                                    onClick={() => {
                                        setEditor(null);
                                        setSelectedImage(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>

                        <aside
                            className={styles.livePreview}
                            aria-label="Unsaved product preview"
                        >
                            <span className={styles.previewLabel}>
                                <Eye size={16} aria-hidden="true" />
                                Live preview
                            </span>

                            <div className={styles.previewPhoto}>
                                <Photo
                                    src={selectedImage?.previewUrl || draft.imageUrl}
                                    name={draft.name || "Product preview"}
                                    temporary={Boolean(selectedImage)}
                                />
                            </div>

                            <small>
                                {[draftCategory, draft.brand.trim()]
                                    .filter(Boolean)
                                    .join(" · ") || "Choose a category"}
                            </small>

                            <h3>
                                {draft.name.trim() || "Your product name"}
                            </h3>

                            <strong>{money(draft.price)}</strong>

                            <p>
                                {draft.quantity.trim() &&
                                Number.isInteger(Number(draft.quantity)) &&
                                Number(draft.quantity) >= 0
                                    ? `${draft.quantity} in stock`
                                    : "Enter a valid quantity"}
                            </p>

                            <p className={styles.previewNote}>
                                Preview only. Your changes become public
                                after saving.
                            </p>
                        </aside>
                    </div>
                </section>
            )}

            {deleteTarget && (
                <dialog
                    ref={deleteDialogRef}
                    className={styles.deleteModal}
                    aria-labelledby="delete-product-title"
                    aria-describedby="delete-product-description"
                    aria-busy={busy}
                    onCancel={(event) => {
                        event.preventDefault();

                        if (!inFlight.current) {
                            setDeleteTarget(null);
                        }
                    }}
                >
                    <span className={styles.deleteModalIcon}>
                        <Trash2 size={26} aria-hidden="true" />
                    </span>

                    <h2 id="delete-product-title">
                        Delete this product?
                    </h2>

                    <p className={styles.deleteModalName}>
                        {deleteTarget.name}
                    </p>

                    <p id="delete-product-description">
                        Are you sure you want to delete this product?
                    </p>

                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}

                    {busy && (
                        <p role="status">Deleting product…</p>
                    )}

                    <div className={styles.deleteModalActions}>
                        <button
                            ref={cancelDeleteRef}
                            type="button"
                            className={styles.secondary}
                            disabled={busy}
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className={styles.danger}
                            disabled={busy}
                            onClick={() => void mutate(
                                () => api(
                                    `products/${deleteTarget.id}`,
                                    "DELETE",
                                ),
                                "Product deleted.",
                            )}
                        >
                            <Trash2 size={16} aria-hidden="true" />
                            {busy ? "Deleting…" : "Delete product"}
                        </button>
                    </div>
                </dialog>
            )}

            <div className={styles.listHeading}>
                <p className={styles.result}>
                    {matches.length
                        ? `${(currentPage - 1) * PAGE_SIZE + 1}–${
                            Math.min(currentPage * PAGE_SIZE, matches.length)
                        }`
                        : "0"}
                    {" "}of {matches.length} matching products
                    {" "}· {products.length} in catalog
                </p>

                <button
                    type="button"
                    className={styles.secondary}
                    onClick={clearFilters}
                >
                    Reset filters
                </button>
            </div>

            <div className={styles.list}>
                {visible.map((product) => (
                    <article key={product.id} className={styles.row}>
                        <Link
                            href={`/products/${product.id}`}
                            className={styles.rowPhoto}
                            aria-label={`View ${product.name}`}
                        >
                            <Photo
                                src={product.imageUrl}
                                name={product.name}
                            />
                        </Link>

                        <div className={styles.copy}>
                            <span className={styles.eyebrow}>
                                #{product.id}
                                {" "}· {product.category?.name || "No category"}
                            </span>

                            <Link href={`/products/${product.id}`}>
                                <h2>{product.name}</h2>
                            </Link>

                            <p>
                                {money(product.price)}
                                {product.brand ? ` · ${product.brand}` : ""}
                            </p>

                            <span
                                className={styles.stockBadge}
                                data-state={
                                    product.quantity === 0
                                        ? "out"
                                        : product.quantity <= 5
                                            ? "low"
                                            : "in"
                                }
                            >
                                {product.quantity === 0
                                    ? "Out of stock"
                                    : `${product.quantity} in stock`}
                            </span>
                        </div>

                        <div className={styles.actions}>
                            <button
                                className={styles.secondary}
                                type="button"
                                disabled={busy}
                                onClick={() => begin(product)}
                                aria-label={`Edit ${product.name}`}
                            >
                                <Pencil size={16} aria-hidden="true" />
                                Edit
                            </button>

                            <button
                                className={styles.secondary}
                                type="button"
                                disabled={busy}
                                onClick={() => begin(product, true)}
                                aria-label={`Update image for ${product.name}`}
                            >
                                <ImageIcon size={16} aria-hidden="true" />
                                Image
                            </button>

                            <button
                                className={styles.danger}
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    if (inFlight.current) return;

                                    setEditor(null);
                                    setSelectedImage(null);
                                    setError("");
                                    setMessage("");
                                    setDeleteTarget(product);
                                }}
                                aria-label={`Delete ${product.name}`}
                            >
                                <Trash2 size={16} aria-hidden="true" />
                                Delete
                            </button>
                        </div>
                    </article>
                ))}

                {!matches.length && (
                    <div className={styles.panel}>
                        <Package size={30} aria-hidden="true" />
                        <h2>No matching products</h2>

                        <p>
                            {products.length
                                ? "Change your search or reset the filters."
                                : "Add a product to start your catalog."}
                        </p>

                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={clearFilters}
                        >
                            Reset filters
                        </button>
                    </div>
                )}
            </div>

            {matches.length > PAGE_SIZE && (
                <nav
                    className={styles.pagination}
                    aria-label="Product list pages"
                >
                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        <ChevronLeft size={17} aria-hidden="true" />
                        Previous
                    </button>

                    <span>
                        Page {currentPage} of {pages}
                    </span>

                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={currentPage === pages}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        Next
                        <ChevronRight size={17} aria-hidden="true" />
                    </button>
                </nav>
            )}
        </main>
    );
}