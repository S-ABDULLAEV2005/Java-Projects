"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, CreditCard } from "lucide-react";

import { useShopping } from "./ShoppingProvider";

export default function CheckoutButton({
                                           disabled = false,
                                       }: {
    disabled?: boolean;
}) {
    const router = useRouter();
    const shopping = useShopping();

    const [pending, setPending] = useState(false);
    const [created, setCreated] = useState(false);
    const [error, setError] = useState("");

    const inFlight = useRef(false);

    const hasLocalProducts = shopping.cart.some(
        (item) => item.marketplace === "WILDMARKET",
    );

    async function placeOrder() {
        if (inFlight.current || created) return;

        inFlight.current = true;
        setPending(true);
        setError("");

        try {
            const response = await fetch(
                "/api/shopping/checkout",
                {
                    method: "POST",
                    credentials: "include",
                    cache: "no-store",
                },
            );

            if (response.status === 401) {
                router.push("/login");
                return;
            }

            const data =
                await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.detail ||
                    `Could not create order (${response.status}).`,
                );
            }

            setCreated(true);

            // A cart refresh failure must not repeat checkout.
            await shopping.reload().catch(() => undefined);

            if (
                !Number.isSafeInteger(data?.id) ||
                data.id <= 0
            ) {
                throw new Error(
                    "The order was created, but its response could not be read. Check your order history before creating another order.",
                );
            }

            if (data.testPayment !== true) {
                throw new Error(
                    `Order #${data.id} was created without test-payment mode. Enable test mode in Spring Boot and restart it. This existing order cannot use the simulator.`,
                );
            }

            router.push(`/payment/${data.id}`);
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : "Could not confirm checkout. Check order history before trying again.",
            );
        } finally {
            inFlight.current = false;
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
                    created ||
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
                    <CreditCard
                        size={18}
                        aria-hidden="true"
                    />
                )}

                {pending
                    ? "Preparing checkout…"
                    : created
                        ? "Order created"
                        : "Continue to test payment"}
            </button>

            <p>
                WildMarket items only. AlifShop items stay in
                your cart. This is a simulation; no real money
                is charged.
            </p>

            {error && (
                <div role="alert">
                    <p>{error}</p>

                    <Link href="/account">
                        Check your account and orders
                    </Link>
                </div>
            )}
        </div>
    );
}