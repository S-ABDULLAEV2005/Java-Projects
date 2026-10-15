"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
    AlertCircle,
    ArrowLeft,
    RotateCcw,
} from "lucide-react";

import styles from "./route-state.module.css";

export type PageErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
    retry?: () => void;
};

export default function PageErrorState({
                                           reset,
                                           retry,
                                           alif = false,
                                       }: PageErrorProps & {
    alif?: boolean;
}) {
    const [pending, startTransition] = useTransition();

    return (
        <main className={styles.errorPage}>
            <section
                className={styles.errorPanel}
                aria-labelledby="page-error-title"
            >
                <span className={styles.errorIcon}>
                    <AlertCircle size={30} aria-hidden="true" />
                </span>

                <p className={styles.eyebrow}>
                    {alif ? "AlifShop" : "WildMarket"}
                </p>

                <h1 id="page-error-title">
                    A little interruption.
                </h1>

                <p
                    className={styles.description}
                    role="alert"
                >
                    {alif
                        ? "We couldn’t load this AlifShop page."
                        : "We couldn’t load this page."}
                    {" "}Please try again in a moment.
                </p>

                <div className={styles.errorActions}>
                    <button
                        type="button"
                        className={styles.retryButton}
                        disabled={pending}
                        onClick={() => {
                            startTransition(() => {
                                (retry ?? reset)();
                            });
                        }}
                    >
                        <RotateCcw
                            size={17}
                            aria-hidden="true"
                            className={
                                pending ? styles.spin : undefined
                            }
                        />

                        <span>
                            {pending ? "Retrying…" : "Try again"}
                        </span>
                    </button>

                    <Link
                        href={alif ? "/alif" : "/"}
                        className={styles.backButton}
                    >
                        <ArrowLeft
                            size={17}
                            aria-hidden="true"
                        />

                        {alif
                            ? "AlifShop categories"
                            : "Back home"}
                    </Link>
                </div>

                <p
                    className={styles.hint}
                    role="status"
                >
                    {pending
                        ? "Requesting this page again…"
                        : "If the problem continues, try again later."}
                </p>
            </section>
        </main>
    );
}