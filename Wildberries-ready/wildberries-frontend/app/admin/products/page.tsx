import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccess } from "../../_lib/admin-auth";

import ProductManager, {
    type ManagedCategory,
    type ManagedProduct,
} from "./ProductManager";

import styles from "./admin-products.module.css";

export default async function AdminProductsPage() {
    const access = await getAdminAccess();

    if (!access.session) {
        if (access.status === 401) {
            redirect("/login");
        }

        if (access.status === 403) {
            return (
                <main className={`${styles.page} wm-studio-admin`}>
                    <h1>Admin access required</h1>

                    <p>
                        This account cannot manage the catalog.
                    </p>

                    <Link href="/account">
                        Back to my account
                    </Link>
                </main>
            );
        }

        throw new Error(
            `Could not check admin access (${access.status})`,
        );
    }

    const { base, token } = access.session;

    const options = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store" as const,
    };

    const [productsResponse, categoriesResponse] =
        await Promise.all([
            fetch(`${base}/products`, options),
            fetch(`${base}/categories`, options),
        ]);

    if (!productsResponse.ok || !categoriesResponse.ok) {
        throw new Error("Could not load the admin catalog");
    }

    const products: ManagedProduct[] =
        await productsResponse.json();

    const categories: ManagedCategory[] =
        await categoriesResponse.json();

    if (
        !Array.isArray(products) ||
        !Array.isArray(categories)
    ) {
        throw new Error("Unexpected catalog response");
    }

    return (
        <ProductManager
            initialProducts={products}
            categories={categories}
        />
    );
}