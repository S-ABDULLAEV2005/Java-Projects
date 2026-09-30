"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, Package, Sparkles } from "lucide-react";

const navigation = [
    { name: "Shop", href: "/products", icon: Package },
    { name: "Categories", href: "/categories", icon: Grid2X2 },
    { name: "AlifShop", href: "/alif", icon: Sparkles },
];

export default function StoreNavigation({
                                            mobile = false,
                                        }: {
    mobile?: boolean;
}) {
    const pathname = usePathname();

    return (
        <nav
            className={
                mobile
                    ? "store-mobile-navigation"
                    : "store-desktop-navigation"
            }
            aria-label={mobile ? "Mobile navigation" : "Main navigation"}
        >
            {navigation.map(({ name, href, icon: Icon }) => {
                const active =
                    pathname === href || pathname.startsWith(`${href}/`);

                return (
                    <Link
                        key={href}
                        href={href}
                        className={`store-navigation-link ${
                            active ? "is-active" : ""
                        }`}
                        aria-current={active ? "page" : undefined}
                    >
                        <Icon size={mobile ? 19 : 17} aria-hidden="true" />
                        <span>{name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}