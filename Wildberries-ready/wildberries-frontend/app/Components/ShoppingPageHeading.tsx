"use client";

import { useShopping } from "./ShoppingProvider";

export default function ShoppingPageHeading({
                                                type,
                                            }: {
    type: "cart" | "favorites";
}) {
    const { cart, favorites, ready, loadError } = useShopping();

    const count = type === "cart" ? cart.length : favorites.length;

    return (
        <div className="shopping-page-heading">
            <h1>{type === "cart" ? "Cart" : "Favorites"}</h1>

            {ready && !loadError && (
                <span className="shopping-page-count" role="status">
                    {count} {count === 1 ? "product" : "products"}
                </span>
            )}
        </div>
    );
}