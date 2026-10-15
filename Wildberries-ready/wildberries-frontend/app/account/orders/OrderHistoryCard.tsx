"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDown, Package } from "lucide-react";

import styles from "./order-history.module.css";

export type OrderRecord = {
    id: number;
    orderDate: string | null;
    status: string | null;
    items: {
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }[];
    total: number | null;
    paymentStatus?: string | null;
    testPayment?: boolean;
    paidAt?: string | null;
};

function money(value: number | null | undefined) {
    if (
        value == null ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
    ) {
        return "Not recorded";
    }

    return `${Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} TJS`;
}

function dateTime(value: string | null | undefined) {
    const match = value?.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );

    return match
        ? `${match[3]}.${match[2]}.${match[1]} · ${match[4]}:${match[5]}`
        : "Date unavailable";
}

function label(value: string | null | undefined) {
    return value
        ? value.replaceAll("_", " ").toLowerCase()
        : "Not recorded";
}

export default function OrderHistoryCard({
                                             order,
                                         }: {
    order: OrderRecord;
}) {
    const [open, setOpen] = useState(false);
    const id = useId();

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const quantity = items.reduce(
        (total, item) =>
            total + (
                Number.isSafeInteger(item.quantity) &&
                item.quantity > 0
                    ? item.quantity
                    : 0
            ),
        0,
    );

    return (
        <article
            className={styles.orderCard}
            data-open={open}
            aria-labelledby={`${id}-title`}
        >
            <div className={styles.cardHeading}>
                <span className={styles.orderIcon}>
                    <Package size={22} aria-hidden="true" />
                </span>

                <div className={styles.orderIdentity}>
                    <h3 id={`${id}-title`}>
                        Order #{order.id}
                    </h3>

                    <p>{dateTime(order.orderDate)}</p>
                </div>

                <span
                    className={styles.statusBadge}
                    data-status={order.status || "UNKNOWN"}
                >
                    {label(order.status)}
                </span>
            </div>

            <div className={styles.cardOverview}>
                <span>
                    {items.length
                        ? `${quantity} ${
                            quantity === 1 ? "item" : "items"
                        } · ${items.length} product lines`
                        : "Items not recorded"}
                </span>

                <div>
                    <small>Order total</small>
                    <strong>{money(order.total)}</strong>
                </div>
            </div>

            {order.paymentStatus && (
                <p className={styles.paymentSummary}>
                    Payment: {label(order.paymentStatus)}
                    {order.testPayment ? " · Test payment" : ""}
                </p>
            )}

            <button
                type="button"
                className={styles.expandButton}
                aria-expanded={open}
                aria-controls={`${id}-details`}
                onClick={() => setOpen((current) => !current)}
            >
                {open
                    ? "Hide order details"
                    : "View order details"}

                <ChevronDown size={18} aria-hidden="true" />
            </button>

            <div
                id={`${id}-details`}
                className={styles.detailsGrid}
                aria-hidden={!open}
                inert={!open}
            >
                <div className={styles.detailsClip}>
                    <div className={styles.detailsBody}>
                        {items.length ? (
                            <ul className={styles.itemList}>
                                {items.map((item, index) => (
                                    <li
                                        key={`${item.productId}-${index}`}
                                    >
                                        <div>
                                            <strong>
                                                {item.productName ||
                                                    "Unnamed product"}
                                            </strong>

                                            <span>
                                                {item.quantity} ×{" "}
                                                {money(item.unitPrice)}
                                            </span>
                                        </div>

                                        <strong>
                                            {money(item.lineTotal)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>
                                Product details were not recorded
                                for this older order.
                            </p>
                        )}

                        {order.paidAt && (
                            <p className={styles.paymentSummary}>
                                Paid: {dateTime(order.paidAt)}
                            </p>
                        )}

                        {order.testPayment &&
                            ["PENDING", "DECLINED"].includes(
                                order.paymentStatus || "",
                            ) && (
                                <Link
                                    href={`/payment/${order.id}`}
                                    className="store-text-link"
                                >
                                    Continue test payment →
                                </Link>
                            )}

                        <p className={styles.snapshotNote}>
                            These are the product names and prices
                            recorded when you placed this order.
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}