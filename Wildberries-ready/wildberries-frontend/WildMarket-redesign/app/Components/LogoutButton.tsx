"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleLogout() {
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            router.replace("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoading(false);
        }
    }

    return (
        <button
            type="button"
            className="header-logout-button"
            onClick={handleLogout}
            disabled={isLoading}
            data-cursor="interactive"
        >
            {isLoading ? (
                <LoaderCircle
                    className="loading-spinner"
                    size={18}
                />
            ) : (
                <LogOut size={18} />
            )}

            <span>
                {isLoading ? "Signing out..." : "Logout"}
            </span>
        </button>
    );
}