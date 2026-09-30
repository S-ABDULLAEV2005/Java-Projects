export default function LoadingPage() {
    return (
        <main
            className="store-status-loading"
            aria-busy="true"
            aria-label="Loading page"
        >
            <div className="store-container">
                <p className="store-status-eyebrow">WildMarket</p>
                <h1>Getting your next find ready…</h1>

                <div className="store-status-placeholder-grid" aria-hidden="true">
                    {Array.from({ length: 4 }, (_, index) => (
                        <div key={index} className="store-status-placeholder">
                            <div className="store-status-skeleton is-image" />
                            <div className="store-status-skeleton is-name" />
                            <div className="store-status-skeleton is-price" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}