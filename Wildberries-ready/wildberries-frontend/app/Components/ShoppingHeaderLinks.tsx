"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

export default function ShoppingHeaderLinks() {
    return (
        <nav
            className="shopping-header-links"
            aria-label="Your shopping"
        >
            <Link href="/favorites">
                <Heart size={18} aria-hidden="true" />
                <span>Favorites</span>
            </Link>

            <Link href="/cart">
                <ShoppingCart size={18} aria-hidden="true" />
                <span>Cart</span>
            </Link>
        </nav>
    );
}