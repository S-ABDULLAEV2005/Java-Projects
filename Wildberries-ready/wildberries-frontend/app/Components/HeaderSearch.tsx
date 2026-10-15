"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import {
    ArrowRight,
    ImageOff,
    Search,
} from "lucide-react";

import type {
    SearchResponse,
    SearchSuggestion,
} from "../_lib/search-products";

import styles from "./header-search.module.css";

type Result = SearchResponse & {
    query: string;
    status: "loading" | "ready" | "error";
};

function SearchPhoto({
                         item,
                     }: {
    item: SearchSuggestion;
}) {
    const [failed, setFailed] = useState(false);

    return item.imageUrl && !failed ? (
        <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="52px"
            onError={() => setFailed(true)}
        />
    ) : (
        <ImageOff size={23} aria-hidden="true" />
    );
}

export default function HeaderSearch() {
    const router = useRouter();
    const id = useId();
    const listId = `${id}-results`;

    const inputRef = useRef<HTMLInputElement>(null);

    const [value, setValue] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    const [result, setResult] = useState<Result>({
        query: "",
        status: "ready",
        items: [],
        total: 0,
    });

    const query = value.trim().slice(0, 200);

    const ready =
        result.query === query &&
        result.status === "ready";

    const items = ready ? result.items : [];
    const show = open && query.length > 0;

    const loading =
        query.length >= 2 &&
        (
            result.query !== query ||
            result.status === "loading"
        );

    const failed =
        result.query === query &&
        result.status === "error";

    const allHref =
        `/products?q=${encodeURIComponent(query)}`;

    useEffect(() => {
        if (query.length < 2 || !open) return;

        const controller = new AbortController();

        const timer = setTimeout(() => {
            setResult({
                query,
                status: "loading",
                items: [],
                total: 0,
            });

            void fetch(
                `/api/search?q=${encodeURIComponent(query)}`,
                {
                    cache: "no-store",
                    signal: controller.signal,
                },
            )
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error("Search unavailable");
                    }

                    const data: SearchResponse =
                        await response.json();

                    if (
                        !Array.isArray(data.items) ||
                        !Number.isFinite(data.total)
                    ) {
                        throw new Error(
                            "Invalid search response",
                        );
                    }

                    if (!controller.signal.aborted) {
                        setResult({
                            ...data,
                            query,
                            status: "ready",
                        });
                    }
                })
                .catch(() => {
                    if (!controller.signal.aborted) {
                        setResult({
                            query,
                            status: "error",
                            items: [],
                            total: 0,
                        });
                    }
                });
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, open]);

    function close() {
        setOpen(false);
        setActive(-1);
    }

    return (
        <div
            className={`${styles.wrapper} store-header-search-slot`}
            onBlur={(event) => {
                if (
                    !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                    )
                ) {
                    close();
                }
            }}
        >
            <form
                action="/products"
                method="get"
                role="search"
                aria-label="Search WildMarket products"
                className={`store-header-search ${styles.form}`}
                onSubmit={(event) => {
                    event.preventDefault();

                    close();

                    router.push(
                        query ? allHref : "/products",
                    );

                    inputRef.current?.blur();
                }}
            >
                <input
                    ref={inputRef}
                    type="search"
                    name="q"
                    role="combobox"
                    aria-label="Search products, brands or categories"
                    aria-autocomplete="list"
                    aria-expanded={show}
                    aria-controls={
                        show ? listId : undefined
                    }
                    aria-activedescendant={
                        show &&
                        active >= 0 &&
                        items[active]
                            ? `${id}-option-${items[active].id}`
                            : undefined
                    }
                    placeholder="Search products, brands or categories…"
                    maxLength={200}
                    autoComplete="off"
                    value={value}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setOpen(true);
                        setActive(-1);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            event.preventDefault();
                            close();
                        }

                        if (
                            event.key === "ArrowDown" ||
                            event.key === "ArrowUp"
                        ) {
                            event.preventDefault();
                            setOpen(true);

                            if (items.length) {
                                setActive((current) =>
                                    event.key === "ArrowDown"
                                        ? (current + 1) %
                                        items.length
                                        : current <= 0
                                            ? items.length - 1
                                            : current - 1,
                                );
                            }
                        }

                        if (
                            event.key === "Enter" &&
                            show &&
                            active >= 0 &&
                            items[active]
                        ) {
                            event.preventDefault();

                            router.push(
                                `/products/${items[active].id}`,
                            );

                            close();
                            inputRef.current?.blur();
                        }
                    }}
                />

                <button
                    type="submit"
                    aria-label="Search products"
                >
                    <Search
                        size={19}
                        aria-hidden="true"
                    />
                </button>
            </form>

            {show && (
                <div className={styles.dropdown}>
                    <p
                        className={styles.status}
                        role="status"
                    >
                        {query.length < 2
                            ? "Type at least 2 characters."
                            : loading
                                ? "Searching…"
                                : failed
                                    ? "Suggestions unavailable. Press Enter to search."
                                    : `${result.total} matching ${
                                        result.total === 1
                                            ? "product"
                                            : "products"
                                    }`}
                    </p>

                    <ul
                        id={listId}
                        role="listbox"
                        aria-label="Product suggestions"
                        className={styles.list}
                    >
                        {items.map((item, index) => (
                            <li
                                key={item.id}
                                role="presentation"
                            >
                                <Link
                                    id={`${id}-option-${item.id}`}
                                    href={`/products/${item.id}`}
                                    role="option"
                                    aria-selected={
                                        active === index
                                    }
                                    tabIndex={-1}
                                    className={styles.option}
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onMouseEnter={() =>
                                        setActive(index)
                                    }
                                    onClick={close}
                                >
                                    <span
                                        className={styles.photo}
                                    >
                                        <SearchPhoto
                                            key={`${item.id}-${item.imageUrl}`}
                                            item={item}
                                        />
                                    </span>

                                    <span
                                        className={styles.copy}
                                    >
                                        <strong>
                                            {item.name}
                                        </strong>

                                        <small>
                                            {[
                                                    item.brand,
                                                    item.category,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ") ||
                                                "WildMarket"}
                                        </small>

                                        {item.stock !== null && (
                                            <small>
                                                {item.stock > 0
                                                    ? "In stock"
                                                    : "Out of stock"}
                                            </small>
                                        )}
                                    </span>

                                    <span
                                        className={styles.price}
                                    >
                                        {item.price === null
                                            ? "Price unavailable"
                                            : `${item.price.toLocaleString(
                                                "en-US",
                                                {
                                                    maximumFractionDigits: 2,
                                                },
                                            )} TJS`}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {ready &&
                        query.length >= 2 &&
                        items.length === 0 && (
                            <p className={styles.empty}>
                                Try another product name,
                                brand, or category.
                            </p>
                        )}

                    <Link
                        href={allHref}
                        className={styles.all}
                        onClick={close}
                    >
                        View full search results
                        <ArrowRight
                            size={16}
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            )}
        </div>
    );
}