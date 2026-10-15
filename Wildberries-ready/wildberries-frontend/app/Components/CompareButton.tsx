"use client";

import { Check, Scale } from "lucide-react";

import {
    compareKey,
    toggleCompare,
    useComparison,
    type CompareProduct,
} from "../_lib/compare-store";

import styles from "./product-compare.module.css";

export default function CompareButton({
                                          product,
                                      }: {
    product: CompareProduct;
}) {
    const { items, ready } = useComparison();

    const selected = items.some(
        (item) =>
            compareKey(item) === compareKey(product),
    );

    return (
        <button
            type="button"
            className={`${styles.trigger} ${
                selected ? styles.selected : ""
            }`}
            disabled={!ready}
            aria-pressed={selected}
            aria-label={
                `${selected ? "Remove" : "Add"} ` +
                `${product.name} ` +
                `${selected ? "from" : "to"} comparison`
            }
            onClick={() => toggleCompare(product)}
        >
            {selected ? (
                <Check size={17} aria-hidden="true" />
            ) : (
                <Scale size={17} aria-hidden="true" />
            )}

            {selected ? "Selected" : "Compare"}
        </button>
    );
}