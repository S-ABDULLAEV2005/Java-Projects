"use client";

import MiniCart from "./MiniCart";
import {
    MiniAccount,
    MiniFavorites,
} from "./HeaderPanels";

export default function ShoppingHeaderLinks() {
    return (
        <nav
            className="shopping-header-links"
            aria-label="Your shopping"
        >
            <MiniFavorites />
            <MiniCart />
            <MiniAccount />
        </nav>
    );
}