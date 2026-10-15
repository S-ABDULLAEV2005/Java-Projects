import type { Metadata } from "next";
import Link from "next/link";

import CompareTable from "../Components/CompareTable";

export const metadata: Metadata = {
    title: "Compare products",
};

export default function ComparePage() {
    return (
        <main className="shopping-page account-page">
            <Link
                href="/products"
                className="shopping-back-link"
            >
                ← Continue browsing
            </Link>

            <div className="account-heading">
                <p>Find the right fit</p>
                <h1>Compare products</h1>
            </div>

            <CompareTable />
        </main>
    );
}