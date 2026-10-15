import styles from "./route-state.module.css";

export default function LoadingSkeleton({
                                            alif = false,
                                        }: {
    alif?: boolean;
}) {
    return (
        <main className={styles.loading}>
            <div className={styles.container}>
                <header className={styles.loadingHeader}>
                    <p className={styles.eyebrow}>
                        {alif ? "AlifShop collection" : "WildMarket"}
                    </p>

                    <h1>
                        {alif
                            ? "Preparing your collection…"
                            : "Getting your next find ready…"}
                    </h1>

                    <p
                        role="status"
                        className={styles.description}
                    >
                        Loading products and page details.
                        You can keep using the navigation above.
                    </p>
                </header>

                <div
                    aria-busy="true"
                    aria-label="Loading page content"
                >
                    <div
                        className={styles.toolbar}
                        aria-hidden="true"
                    >
                        <span
                            className={`${styles.skeleton} ${styles.search}`}
                        />
                        <span
                            className={`${styles.skeleton} ${styles.filter}`}
                        />
                    </div>

                    <div
                        className={styles.grid}
                        aria-hidden="true"
                    >
                        {Array.from(
                            { length: alif ? 8 : 4 },
                            (_, index) => (
                                <div
                                    key={index}
                                    className={styles.card}
                                >
                                    <div
                                        className={`${styles.skeleton} ${styles.image}`}
                                    />

                                    <div className={styles.copy}>
                                        <div
                                            className={`${styles.skeleton} ${styles.meta}`}
                                        />
                                        <div
                                            className={`${styles.skeleton} ${styles.title}`}
                                        />
                                        <div
                                            className={`${styles.skeleton} ${styles.price}`}
                                        />
                                        <div
                                            className={`${styles.skeleton} ${styles.action}`}
                                        />
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}