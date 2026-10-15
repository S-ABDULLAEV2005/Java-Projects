"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, X } from "lucide-react";

import {
    clearCompare,
    compareKey,
    removeCompare,
    useComparison,
} from "../_lib/compare-store";

import styles from "./product-compare.module.css";

export default function CompareBar() {
    const { items, ready, message } = useComparison();
    const pathname = usePathname();

    if (!ready || pathname === "/compare") return null;

    return (
        <>
            {items.length === 0 && (
                <span className={styles.srOnly} role="status">
                    {message}
                </span>
            )}

            {items.length > 0 && (
                <>
                    <div
                        className={styles.spacer}
                        aria-hidden="true"
                    />

                    <aside
                        className={styles.bar}
                        aria-label="Selected products for comparison"
                    >
                        <div className={styles.barTitle}>
                            <Scale
                                size={20}
                                aria-hidden="true"
                            />
                            <strong>
                                {items.length}/3 selected
                            </strong>
                        </div>

                        <div className={styles.chips}>
                            {items.map((item) => (
                                <div
                                    key={compareKey(item)}
                                    className={styles.chip}
                                >
                                    <span title={item.name}>
                                        {item.name}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeCompare(item)
                                        }
                                        aria-label={
                                            `Remove ${item.name} from comparison`
                                        }
                                    >
                                        <X
                                            size={15}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.barActions}>
                            <button
                                type="button"
                                className={styles.clear}
                                onClick={clearCompare}
                            >
                                Clear
                            </button>

                            {items.length >= 2 ? (
                                <Link
                                    href="/compare"
                                    className={styles.primary}
                                >
                                    Compare →
                                </Link>
                            ) : (
                                <span className={styles.waiting}>
                                    Choose one more
                                </span>
                            )}
                        </div>

                        <p
                            className={styles.message}
                            role="status"
                        >
                            {message}
                        </p>
                    </aside>
                </>
            )}
        </>
    );
}