"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
    ArrowLeft,
    ArrowRight,
    Check,
    SlidersHorizontal,
    Star,
    Wallet,
} from "lucide-react";

import ProductCard from "./ProductCard";
import type { Product } from "../_types/product";

import {
    finderCategories,
    findProducts,
    type FinderPriority,
} from "../_lib/product-finder";

import styles from "./product-finder.module.css";

const steps = ["Category", "Budget", "Priority"];

export default function ProductFinder({
                                          products,
                                      }: {
    products: Product[];
}) {
    const [step, setStep] = useState(0);

    const [categoryId, setCategoryId] = useState<number | null>(
        null,
    );

    const [budgetText, setBudgetText] = useState("");
    const [priority, setPriority] =
        useState<FinderPriority>("price");

    const [visibleCount, setVisibleCount] = useState(6);

    const title = useRef<HTMLHeadingElement>(null);

    const categories = finderCategories(products);

    const budget = budgetText.trim()
        ? Number(budgetText)
        : null;

    const invalidBudget =
        budget !== null &&
        (!Number.isFinite(budget) || budget < 0);

    const matches = findProducts(
        products,
        categoryId,
        budget,
        priority,
    );

    const categoryName =
        categories.find(
            (category) => category.id === categoryId,
        )?.name || "Any category";

    const formattedBudget =
        budget === null
            ? "No price limit"
            : `Up to ${budget.toLocaleString("en-US", {
                maximumFractionDigits: 2,
            })} TJS`;

    useEffect(() => {
        title.current?.focus({ preventScroll: true });
    }, [step]);

    function restart() {
        setStep(0);
        setCategoryId(null);
        setBudgetText("");
        setPriority("price");
        setVisibleCount(6);
    }

    return (
        <main className={styles.page}>
            <Link href="/products" className={styles.back}>
                <ArrowLeft size={17} aria-hidden="true" />
                Back to shop
            </Link>

            <header className={styles.hero}>
                <span className={styles.badge}>
                    <SlidersHorizontal
                        size={17}
                        aria-hidden="true"
                    />
                    Your personal product finder
                </span>

                <h1>
                    A few choices.
                    <br />
                    <span>A better place to start.</span>
                </h1>

                <p>
                    Choose a category, set your budget, and
                    explore matching WildMarket products.
                </p>
            </header>

            <section
                className={styles.panel}
                aria-labelledby="finder-step-title"
            >
                <ol
                    className={styles.progress}
                    aria-label="Finder steps"
                >
                    {steps.map((label, index) => (
                        <li
                            key={label}
                            data-active={index <= step}
                            aria-current={
                                index === step
                                    ? "step"
                                    : undefined
                            }
                        >
                            <span>
                                {index < step ? (
                                    <Check
                                        size={16}
                                        aria-hidden="true"
                                    />
                                ) : (
                                    index + 1
                                )}
                            </span>

                            {label}
                        </li>
                    ))}
                </ol>

                <div className={styles.stage} key={step}>
                    <h2
                        id="finder-step-title"
                        ref={title}
                        tabIndex={-1}
                    >
                        {step === 0
                            ? "What are you looking for?"
                            : step === 1
                                ? "What is your maximum budget?"
                                : step === 2
                                    ? "What matters most?"
                                    : "Your matching products"}
                    </h2>

                    {step < 3 ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();

                                if (invalidBudget) return;

                                setStep(
                                    (current) => current + 1,
                                );

                                setVisibleCount(6);
                            }}
                        >
                            {step === 0 && (
                                <fieldset
                                    className={styles.fieldset}
                                >
                                    <legend>
                                        Choose one category
                                    </legend>

                                    <div
                                        className={styles.choices}
                                    >
                                        <label
                                            className={styles.choice}
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={
                                                    categoryId === null
                                                }
                                                onChange={() =>
                                                    setCategoryId(null)
                                                }
                                            />

                                            <strong>
                                                Surprise me
                                            </strong>

                                            <span>
                                                Explore any category
                                            </span>
                                        </label>

                                        {categories.map(
                                            (category) => (
                                                <label
                                                    key={category.id}
                                                    className={
                                                        styles.choice
                                                    }
                                                >
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        checked={
                                                            categoryId ===
                                                            category.id
                                                        }
                                                        onChange={() =>
                                                            setCategoryId(
                                                                category.id,
                                                            )
                                                        }
                                                    />

                                                    <strong>
                                                        {category.name}
                                                    </strong>

                                                    <span>
                                                        {category.count}{" "}
                                                        catalog{" "}
                                                        {category.count === 1
                                                            ? "product"
                                                            : "products"}
                                                    </span>
                                                </label>
                                            ),
                                        )}
                                    </div>
                                </fieldset>
                            )}

                            {step === 1 && (
                                <div className={styles.budget}>
                                    <Wallet
                                        size={32}
                                        aria-hidden="true"
                                    />

                                    <label htmlFor="finder-budget">
                                        Maximum price in TJS
                                    </label>

                                    <input
                                        id="finder-budget"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        placeholder="Leave blank for no limit"
                                        value={budgetText}
                                        onChange={(event) =>
                                            setBudgetText(
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={invalidBudget}
                                        aria-describedby="finder-budget-help"
                                    />

                                    <p id="finder-budget-help">
                                        Leave the field empty to
                                        include every price. This is
                                        the price per product.
                                    </p>

                                    {invalidBudget && (
                                        <p role="alert">
                                            Enter a valid price of
                                            zero or more.
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        onClick={() =>
                                            setBudgetText("")
                                        }
                                    >
                                        Use no price limit
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <fieldset
                                    className={styles.fieldset}
                                >
                                    <legend>
                                        Choose how to order your matches
                                    </legend>

                                    <div className={styles.choices}>
                                        <label
                                            className={styles.choice}
                                        >
                                            <input
                                                type="radio"
                                                name="priority"
                                                checked={
                                                    priority === "price"
                                                }
                                                onChange={() =>
                                                    setPriority("price")
                                                }
                                            />

                                            <Wallet
                                                size={25}
                                                aria-hidden="true"
                                            />

                                            <strong>
                                                Lowest price
                                            </strong>

                                            <span>
                                                See the most affordable
                                                matches first.
                                            </span>
                                        </label>

                                        <label
                                            className={styles.choice}
                                        >
                                            <input
                                                type="radio"
                                                name="priority"
                                                checked={
                                                    priority === "rating"
                                                }
                                                onChange={() =>
                                                    setPriority("rating")
                                                }
                                            />

                                            <Star
                                                size={25}
                                                aria-hidden="true"
                                            />

                                            <strong>
                                                Highest rated
                                            </strong>

                                            <span>
                                                Based on actual customer
                                                feedback. Unrated products
                                                appear last.
                                            </span>
                                        </label>
                                    </div>
                                </fieldset>
                            )}

                            <div className={styles.actions}>
                                {step > 0 && (
                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        onClick={() =>
                                            setStep(
                                                (current) => current - 1,
                                            )
                                        }
                                    >
                                        <ArrowLeft
                                            size={17}
                                            aria-hidden="true"
                                        />
                                        Back
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className={styles.primary}
                                    disabled={invalidBudget}
                                >
                                    {step === 2
                                        ? "Find my products"
                                        : "Continue"}

                                    <ArrowRight
                                        size={17}
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className={styles.summary}>
                                <span>{categoryName}</span>
                                <span>{formattedBudget}</span>
                                <span>
                                    {priority === "price"
                                        ? "Lowest price first"
                                        : "Highest rated first"}
                                </span>
                            </div>

                            <p role="status">
                                {matches.length} matching{" "}
                                {matches.length === 1
                                    ? "product"
                                    : "products"}
                                . Only in-stock products with a
                                valid price are included.
                            </p>

                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.secondary}
                                    onClick={() => setStep(0)}
                                >
                                    Edit my answers
                                </button>

                                <button
                                    type="button"
                                    className={styles.secondary}
                                    onClick={restart}
                                >
                                    Start again
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {step === 3 && (
                <section
                    className={styles.results}
                    aria-label="Matching products"
                >
                    {matches.length === 0 ? (
                        <div className={styles.empty}>
                            <SlidersHorizontal
                                size={35}
                                aria-hidden="true"
                            />

                            <h2>No matches for these choices</h2>

                            <p>
                                Try a higher budget or choose another
                                category. We keep your filters exactly
                                as selected.
                            </p>

                            <button
                                type="button"
                                className={styles.primary}
                                onClick={() => setStep(0)}
                            >
                                Change my answers
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className={styles.resultCount}>
                                Showing{" "}
                                {Math.min(
                                    visibleCount,
                                    matches.length,
                                )}{" "}
                                of {matches.length} matches. Prices
                                and stock are checked again when
                                ordering.
                            </p>

                            <div className="store-product-grid">
                                {matches
                                    .slice(0, visibleCount)
                                    .map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                        />
                                    ))}
                            </div>

                            {visibleCount < matches.length && (
                                <div className={styles.more}>
                                    <button
                                        type="button"
                                        className={styles.primary}
                                        onClick={() =>
                                            setVisibleCount(
                                                (current) => current + 6,
                                            )
                                        }
                                    >
                                        Show more matches
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </main>
    );
}