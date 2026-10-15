"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    CheckCircle2,
    CreditCard,
    LoaderCircle,
    RefreshCw,
} from "lucide-react";

import styles from "./payment.module.css";

type Outcome = "SUCCESS" | "DECLINE" | "CANCEL";

type PaymentStatus =
    | "PENDING"
    | "PAID"
    | "DECLINED"
    | "CANCELLED";

type Order = {
    id: number;
    paymentStatus: PaymentStatus;
    testPayment: boolean;
    total: number;
    items: {
        productId: number;
        productName: string;
        quantity: number;
        lineTotal: number;
    }[];
};

function money(amount: number) {
    return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} TJS`;
}

async function requestOrder(
    orderId: string,
    outcome?: Outcome,
    signal?: AbortSignal,
): Promise<Order> {
    const response = await fetch(
        `/api/test-payments/${orderId}`,
        {
            method: outcome ? "POST" : "GET",
            headers: outcome
                ? { "Content-Type": "application/json" }
                : undefined,
            body: outcome
                ? JSON.stringify({ outcome })
                : undefined,
            cache: "no-store",
            signal,
        },
    );

    const data =
        await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `Request failed (${response.status})`,
        );
    }

    if (
        !data ||
        String(data.id) !== orderId ||
        data.testPayment !== true ||
        !Array.isArray(data.items) ||
        !["PENDING", "PAID", "DECLINED", "CANCELLED"].includes(
            data.paymentStatus,
        ) ||
        typeof data.total !== "number" ||
        !Number.isFinite(data.total) ||
        data.total < 0
    ) {
        throw new Error(
            "This is not a valid test-payment order. Check that backend test mode is enabled.",
        );
    }

    return data;
}

export default function PaymentPanel({
                                         orderId,
                                     }: {
    orderId: string;
}) {
    const [order, setOrder] = useState<Order | null>(null);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState("");
    const [needsRefresh, setNeedsRefresh] = useState(false);

    const inFlight = useRef(false);

    useEffect(() => {
        const controller = new AbortController();

        requestOrder(
            orderId,
            undefined,
            controller.signal,
        )
            .then(setOrder)
            .catch((failure) => {
                if (!controller.signal.aborted) {
                    setError(
                        failure instanceof Error
                            ? failure.message
                            : "Could not load payment",
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setBusy(false);
                }
            });

        return () => controller.abort();
    }, [orderId]);

    async function run(outcome?: Outcome) {
        if (inFlight.current || busy) return;

        inFlight.current = true;
        setBusy(true);
        setError("");

        try {
            const next = await requestOrder(
                orderId,
                outcome,
            );

            setOrder(next);
            setNeedsRefresh(false);
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Could not confirm payment status",
            );

            if (outcome) {
                setNeedsRefresh(true);
            }
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    const canPay =
        order &&
        ["PENDING", "DECLINED"].includes(
            order.paymentStatus,
        );

    const locked = busy || needsRefresh;

    return (
        <main className={`${styles.page} wm-studio-payment`}>
            <Link href="/account" className={styles.back}>
                ← My account
            </Link>

            <header className={styles.heading}>
                <span className={styles.badge}>
                    Test checkout · No real money
                </span>

                <h1>Complete your test payment</h1>

                <p>
                    Choose a simulated result.
                    Do not enter real card details.
                </p>
            </header>

            {error && (
                <div className={styles.error} role="alert">
                    <p>{error}</p>
                    <p>
                        After an uncertain result, refresh
                        the status before submitting again.
                    </p>
                </div>
            )}

            {!order && busy && (
                <p role="status">Loading your order…</p>
            )}

            {order && (
                <div className={styles.layout}>
                    <section
                        className={styles.panel}
                        aria-labelledby="payment-order-title"
                    >
                        <h2 id="payment-order-title">
                            Order #{order.id}
                        </h2>

                        <ul className={styles.items}>
                            {order.items.map((item, index) => (
                                <li
                                    key={`${item.productId}-${index}`}
                                >
                                    <div>
                                        <strong>
                                            {item.productName}
                                        </strong>

                                        <small>
                                            Quantity: {item.quantity}
                                        </small>
                                    </div>

                                    <strong>
                                        {money(item.lineTotal)}
                                    </strong>
                                </li>
                            ))}
                        </ul>

                        <div className={styles.total}>
                            <span>Order total</span>
                            <strong>{money(order.total)}</strong>
                        </div>
                    </section>

                    <section
                        className={styles.panel}
                        aria-labelledby="payment-result-title"
                    >
                        <CreditCard
                            size={28}
                            aria-hidden="true"
                        />

                        <h2 id="payment-result-title">
                            Payment simulator
                        </h2>

                        <p
                            className={styles.status}
                            role="status"
                        >
                            Payment status:{" "}
                            {order.paymentStatus.toLowerCase()}
                        </p>

                        {order.paymentStatus === "PENDING" && (
                            <p>
                                Stock is reserved for this order.
                                Choose a test outcome below.
                            </p>
                        )}

                        {order.paymentStatus === "DECLINED" && (
                            <p>
                                The simulated payment was declined.
                                Retry this order or cancel it to
                                release stock.
                            </p>
                        )}

                        {order.paymentStatus === "PAID" && (
                            <div className={styles.success}>
                                <CheckCircle2
                                    size={24}
                                    aria-hidden="true"
                                />

                                <p>
                                    Test payment succeeded.
                                    Your order is marked paid.
                                    No money was charged.
                                </p>
                            </div>
                        )}

                        {order.paymentStatus === "CANCELLED" && (
                            <p>
                                This order is cancelled.
                                Reserved stock for existing products
                                has been restored. Add products to
                                the cart to start again.
                            </p>
                        )}

                        {canPay && (
                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.primary}
                                    disabled={locked}
                                    onClick={() =>
                                        void run("SUCCESS")
                                    }
                                >
                                    Simulate successful payment
                                </button>

                                <button
                                    type="button"
                                    className={styles.secondary}
                                    disabled={locked}
                                    onClick={() =>
                                        void run("DECLINE")
                                    }
                                >
                                    Simulate declined payment
                                </button>

                                <button
                                    type="button"
                                    className={styles.cancel}
                                    disabled={locked}
                                    onClick={() =>
                                        void run("CANCEL")
                                    }
                                >
                                    Cancel order and release stock
                                </button>
                            </div>
                        )}

                        {busy && (
                            <p
                                className={styles.processing}
                                role="status"
                            >
                                <LoaderCircle
                                    size={17}
                                    className="loading-spinner"
                                    aria-hidden="true"
                                />

                                Checking saved payment status…
                            </p>
                        )}

                        {needsRefresh && (
                            <p>
                                Payment controls are paused until
                                you refresh the saved status.
                            </p>
                        )}

                        <div className={styles.links}>
                            <Link href="/account">
                                My account
                            </Link>

                            <Link href="/products">
                                Continue shopping
                            </Link>
                        </div>
                    </section>
                </div>
            )}

            <button
                type="button"
                className={styles.refresh}
                disabled={busy}
                onClick={() => void run()}
            >
                <RefreshCw
                    size={16}
                    aria-hidden="true"
                />

                Refresh payment status
            </button>
        </main>
    );
}