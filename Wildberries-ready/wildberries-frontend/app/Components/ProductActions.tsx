"use client";

import { useState } from "react";
import { Heart, LoaderCircle, ShoppingCart } from "lucide-react";
import { useShopping, type Marketplace } from "./ShoppingProvider";

export default function ProductActions({
                                           marketplace,
                                           productKey,
                                           name,
                                           available = true,
                                       }: {
    marketplace: Marketplace;
    productKey: string;
    name: string;
    available?: boolean;
}) {
    const shopping = useShopping();
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");

    const favorite = shopping.favorites.some(
        (item) =>
            item.marketplace === marketplace &&
            item.productKey === productKey,
    );

    async function act(action: "cart" | "favorite") {
        setPending(true);
        setMessage("");

        try {
            if (action === "cart") {
                await shopping.addToCart(marketplace, productKey);
                setMessage("Added to cart");
            } else {
                await shopping.toggleFavorite(marketplace, productKey);
                setMessage(
                    favorite ? "Favorite removed" : "Saved to favorites",
                );
            }
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Please try again.",
            );
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="shopping-product-actions">
            <div className="shopping-action-row">
                <button
                    type="button"
                    className="shopping-cart-button"
                    disabled={pending || !shopping.ready || !available}
                    onClick={() => void act("cart")}
                    aria-label={`Add ${name} to cart`}
                >
                    {pending ? (
                        <LoaderCircle size={17} className="loading-spinner" />
                    ) : (
                        <ShoppingCart size={17} />
                    )}
                    <span>{available ? "Add to cart" : "Out of stock"}</span>
                </button>

                <button
                    type="button"
                    className="shopping-heart-button"
                    disabled={pending || !shopping.ready || Boolean(shopping.loadError)}
                    onClick={() => void act("favorite")}
                    aria-pressed={favorite}
                    aria-label={
                        favorite
                            ? `Remove ${name} from favorites`
                            : `Save ${name} to favorites`
                    }
                >
                    <Heart
                        size={19}
                        fill={favorite ? "currentColor" : "none"}
                    />
                </button>
            </div>

            <p className="shopping-action-message" role="status">
                {message || shopping.loadError}
            </p>
        </div>
    );
}