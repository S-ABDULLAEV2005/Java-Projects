import type { ReactNode } from "react";

import styles from "./product-details-upgrade.module.css";

export default function ProductDetailsSections({
                                                   description,
                                                   information,
                                                   children,
                                               }: {
    description?: string | null;
    information: {
        label: string;
        value: string;
    }[];
    children: ReactNode;
}) {
    return (
        <>
            <nav
                className={styles.sectionNav}
                aria-label="Product sections"
            >
                <a href="#product-about">About</a>

                <a href="#product-information">
                    Product information
                </a>

                <a href="#product-reviews">Reviews</a>
            </nav>

            <div className={styles.storyGrid}>
                <section
                    id="product-about"
                    className={styles.story}
                    aria-labelledby="product-about-title"
                >
                    <span className={styles.number}>
                        01 · Discover
                    </span>

                    <h2 id="product-about-title">
                        About this product
                    </h2>

                    <p>
                        {description?.trim() ||
                            "A description has not been provided for this product."}
                    </p>
                </section>

                <section
                    id="product-information"
                    className={styles.story}
                    aria-labelledby="product-information-title"
                >
                    <span className={styles.number}>
                        02 · The details
                    </span>

                    <h2 id="product-information-title">
                        Product information
                    </h2>

                    <dl className={styles.facts}>
                        {information.map((item) => (
                            <div key={item.label}>
                                <dt>{item.label}</dt>
                                <dd>{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>

            <div
                id="product-reviews"
                className={styles.reviews}
            >
                {children}
            </div>
        </>
    );
}