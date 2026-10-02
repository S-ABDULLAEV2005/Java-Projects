"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export type Marketplace = "WILDMARKET" | "ALIFSHOP";

export type SavedItem = {
    id: number;
    marketplace: Marketplace;
    productKey: string;
    itemType: "CART" | "FAVORITE";
    quantity: number;
};

type ShoppingContextValue = {
    cart: SavedItem[];
    favorites: SavedItem[];
    ready: boolean;
    loadError: string;
    reload: () => Promise<void>;
    addToCart: (
        marketplace: Marketplace,
        productKey: string,
    ) => Promise<void>;
    toggleFavorite: (
        marketplace: Marketplace,
        productKey: string,
    ) => Promise<void>;
    removeItem: (id: number) => Promise<void>;
    setQuantity: (id: number, quantity: number) => Promise<void>;
};

const ShoppingContext = createContext<ShoppingContextValue | null>(null);

async function api<T>(
    path: string,
    method = "GET",
    body?: unknown,
): Promise<T> {
    const response = await fetch(`/api/shopping/${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
    });

    if (!response.ok) {
        if (response.status === 401) {
            window.location.assign("/login");
            throw new Error("Your session is no longer valid. Please sign in again.");
        }

        const data = await response.json().catch(() => null);

        throw new Error(
            data?.message ||
            data?.detail ||
            `Request failed (${response.status})`,
        );
    }

    if (response.status === 204) return undefined as T;
    return response.json();
}

export default function ShoppingProvider({
                                             children,
                                             isLoggedIn,
                                         }: {
    children: ReactNode;
    isLoggedIn: boolean;
}) {
    const [cart, setCart] = useState<SavedItem[]>([]);
    const [favorites, setFavorites] = useState<SavedItem[]>([]);
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState("");

    const reload = useCallback(async () => {
        if (!isLoggedIn) {
            setCart([]);
            setFavorites([]);
            setLoadError("");
            setReady(true);
            return;
        }

        try {
            const [nextCart, nextFavorites] = await Promise.all([
                api<SavedItem[]>("cart"),
                api<SavedItem[]>("favorites"),
            ]);

            setCart(nextCart);
            setFavorites(nextFavorites);
            setLoadError("");
        } catch (error) {
            setLoadError(
                error instanceof Error
                    ? error.message
                    : "Could not load saved products.",
            );
        } finally {
            setReady(true);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        void reload();
    }, [reload]);

    async function addToCart(
        marketplace: Marketplace,
        productKey: string,
    ) {
        const item = await api<SavedItem>("cart", "POST", {
            marketplace,
            productKey,
        });

        setCart((current) => [
            ...current.filter((entry) => entry.id !== item.id),
            item,
        ]);
    }

    async function removeItem(id: number) {
        await api<void>(`items/${id}`, "DELETE");
        setCart((current) => current.filter((item) => item.id !== id));
        setFavorites((current) =>
            current.filter((item) => item.id !== id),
        );
    }

    async function toggleFavorite(
        marketplace: Marketplace,
        productKey: string,
    ) {
        const existing = favorites.find(
            (item) =>
                item.marketplace === marketplace &&
                item.productKey === productKey,
        );

        if (existing) {
            await removeItem(existing.id);
            return;
        }

        const item = await api<SavedItem>("favorites", "POST", {
            marketplace,
            productKey,
        });

        setFavorites((current) => [
            ...current.filter((entry) => entry.id !== item.id),
            item,
        ]);
    }

    async function setQuantity(id: number, quantity: number) {
        const updated = await api<SavedItem>(
            `cart/${id}`,
            "PATCH",
            { quantity },
        );

        setCart((current) =>
            current.map((item) => (item.id === id ? updated : item)),
        );
    }

    return (
        <ShoppingContext.Provider
            value={{
                cart,
                favorites,
                ready,
                loadError,
                reload,
                addToCart,
                toggleFavorite,
                removeItem,
                setQuantity,
            }}
        >
            {children}
        </ShoppingContext.Provider>
    );
}

export function useShopping() {
    const context = useContext(ShoppingContext);

    if (!context) {
        throw new Error("ShoppingProvider is missing from layout.");
    }

    return context;
}