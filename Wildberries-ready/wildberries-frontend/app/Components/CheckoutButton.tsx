"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useShopping } from "./ShoppingProvider";

export default function CheckoutButton({
                                           disabled = false,
                                       }: {
    disabled?: boolean;
}) {
    const router = useRouter();
    const shopping = useShopping();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    const hasLocalProducts = shopping.cart.some(
        (item) => item.marketplace === "WILDMARKET",
    );

    async function placeOrder() {
        if (pending) return;

        setPending(true);
        setError("");

        try {
            const response = await fetch("/api/shopping/checkout", {
                method: "POST",
                credentials: "include",
                cache: "no-store",
            });

            if (response.status === 401) {
                window.location.assign("/login");
                return;
            }

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    data?.message ||
                    data?.detail ||
                    `Could not place order (${response.status}).`,
                );
            }

            // Checkout succeeded. Reload the cart without retrying checkout.
            await shopping.reload();

            router.push("/account?ordered=1");
            router.refresh();
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Could not confirm the order. Check order history before trying again.",
            );
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="shopping-checkout">
            <button
                type="button"
                className="shopping-page-link"
                disabled={
                    disabled ||
                    pending ||
                    !shopping.ready ||
                    Boolean(shopping.loadError) ||
                    !hasLocalProducts
                }
                onClick={() => void placeOrder()}
            >
                {pending ? (
                    <LoaderCircle
                        size={18}
                        className="loading-spinner"
                        aria-hidden="true"
                    />
                ) : (
                    <ShoppingBag size={18} aria-hidden="true" />
                )}

                {pending ? "Placing order…" : "Place WildMarket order"}
            </button>

            <p>
                Orders WildMarket items only. AlifShop items stay in
                your cart. No payment is collected.
            </p>

            {error && <p role="alert">{error}</p>}
        </div>
    );
}