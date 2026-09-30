"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function AlifErrorPage({
                                          reset,
                                      }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main className="store-status-page">
            <section className="store-status-panel" role="alert">
                <span className="store-status-icon">
                    <AlertCircle size={30} aria-hidden="true" />
                </span>

                <p className="store-status-eyebrow">AlifShop</p>

                <h1>A little interruption.</h1>

                <p className="store-status-description">
                    We couldn’t load this AlifShop page.
                    Please try again in a moment.
                </p>

                <div className="store-status-actions">
                    <button
                        type="button"
                        onClick={reset}
                        className="store-status-button"
                    >
                        <RotateCcw size={17} aria-hidden="true" />
                        Try again
                    </button>

                    <Link
                        href="/alif"
                        className="store-status-button is-secondary"
                    >
                        <ArrowLeft size={17} aria-hidden="true" />
                        Browse categories
                    </Link>
                </div>
            </section>
        </main>
    );
}