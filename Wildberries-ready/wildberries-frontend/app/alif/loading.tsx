export default function AlifLoading() {
    return (
        <main
            className="alif-store-page"
            aria-busy="true"
            aria-label="Loading AlifShop"
        >
            <div className="store-container alif-store-content">
                <p className="alif-store-eyebrow">
                    <span className="alif-store-mark" aria-hidden="true">
                        A
                    </span>
                    Loading AlifShop
                </p>

                <p className="alif-loading-message">
                    Getting your collection ready…
                </p>

                <div className="alif-loading-heading" aria-hidden="true">
                    <div className="alif-skeleton alif-skeleton-title" />
                    <div className="alif-skeleton alif-skeleton-subtitle" />
                </div>

                <div className="alif-store-product-grid" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, index) => (
                        <div key={index} className="alif-loading-card">
                            <div className="alif-skeleton alif-skeleton-image" />
                            <div className="alif-skeleton alif-skeleton-name" />
                            <div className="alif-skeleton alif-skeleton-price" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}