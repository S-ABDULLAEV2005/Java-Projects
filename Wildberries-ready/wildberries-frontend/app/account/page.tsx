import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import AccountOverview from "../Components/AccountOverview";
import LogoutButton from "../Components/LogoutButton";

import styles from "../Components/account-overview.module.css";

type CurrentUser = {
    username: string;
    authorities?: {
        authority: string;
    }[];
};

type Props = {
    searchParams: Promise<{
        ordered?: string | string[];
    }>;
};

export default async function AccountPage({
                                              searchParams,
                                          }: Props) {
    const query = await searchParams;

    const ordered = Array.isArray(query.ordered)
        ? query.ordered[0]
        : query.ordered;

    const showConfirmation = ordered === "1";

    const token = (await cookies())
        .get("access_token")?.value;

    if (!token) redirect("/login");

    const backend = process.env.BACKEND_URL;

    if (!backend) {
        throw new Error("BACKEND_URL is missing");
    }

    const base = backend.replace(/\/+$/, "");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${base}/auth/me`, {
        headers,
        cache: "no-store",
    });

    if (response.status === 401) {
        redirect("/login");
    }

    if (!response.ok) {
        throw new Error(
            `Could not load your account (${response.status})`,
        );
    }

    const user: CurrentUser = await response.json();

    if (
        typeof user.username !== "string" ||
        !user.username.trim()
    ) {
        throw new Error(
            "Account response is missing a username",
        );
    }

    const isAdmin =
        Array.isArray(user.authorities) &&
        user.authorities.some(
            (role) => role.authority === "ROLE_ADMIN",
        );

    const initials = Array.from(user.username.trim())
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const results = await Promise.allSettled([
        fetch(
            `${base}/orders/me/history?page=0&size=1`,
            {
                headers,
                cache: "no-store",
                signal: AbortSignal.timeout(8000),
            },
        ),

        fetch(`${base}/shopping/collections`, {
            headers,
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
        }),
    ]);

    // Keep redirects outside catch blocks.
    if (
        results.some(
            (result) =>
                result.status === "fulfilled" &&
                result.value.status === 401,
        )
    ) {
        redirect("/login");
    }

    let ordersCount: number | null = null;
    let collectionsCount: number | null = null;

    const [orderResult, collectionResult] = results;

    if (
        orderResult.status === "fulfilled" &&
        orderResult.value.ok
    ) {
        const data = await orderResult.value
            .json()
            .catch(() => null);

        if (
            Number.isSafeInteger(data?.totalElements) &&
            data.totalElements >= 0
        ) {
            ordersCount = data.totalElements;
        }
    }

    if (
        collectionResult.status === "fulfilled" &&
        collectionResult.value.ok
    ) {
        const data: unknown = await collectionResult.value
            .json()
            .catch(() => null);

        if (Array.isArray(data)) {
            collectionsCount = data.length;
        }
    }

    return (
        <main className={styles.page}>
            <Link href="/" className={styles.back}>
                <ArrowLeft size={17} aria-hidden="true" />
                Back home
            </Link>

            <header className={styles.heading}>
                <p className={styles.eyebrow}>
                    Your personal space
                </p>

                <h1>My account</h1>

                <p>
                    Your saved finds, collections, and order
                    history in one place.
                </p>
            </header>

            <section
                className={styles.profile}
                aria-labelledby="account-profile-title"
            >
                <div
                    className={styles.avatar}
                    aria-hidden="true"
                >
                    {initials}
                </div>

                <div className={styles.profileCopy}>
                    <span>Signed in as</span>

                    <h2 id="account-profile-title">
                        {user.username}
                    </h2>

                    <div className={styles.role}>
                        {isAdmin ? (
                            <ShieldCheck
                                size={14}
                                aria-hidden="true"
                            />
                        ) : (
                            <UserRound
                                size={14}
                                aria-hidden="true"
                            />
                        )}

                        {isAdmin ? "Administrator" : "Member"}
                    </div>
                </div>

                <LogoutButton />
            </section>

            {showConfirmation && (
                <div
                    className={styles.confirmation}
                    role="status"
                >
                    <CheckCircle2
                        size={28}
                        aria-hidden="true"
                    />

                    <div>
                        <h2>Order submitted</h2>

                        <p>
                            Your WildMarket order was submitted
                            successfully. No payment was collected.
                        </p>

                        <p>
                            AlifShop items, if any, remain in your
                            cart. Check the details in{" "}
                            <Link href="/account/orders">
                                Your orders
                            </Link>
                            .
                        </p>
                    </div>

                    <Link
                        href="/account"
                        replace
                        scroll={false}
                        aria-label="Dismiss order confirmation"
                    >
                        Dismiss
                    </Link>
                </div>
            )}

            <AccountOverview
                isAdmin={isAdmin}
                ordersCount={ordersCount}
                collectionsCount={collectionsCount}
            />

            <section
                className={styles.discover}
                aria-labelledby="account-discover-title"
            >
                <div>
                    <h2 id="account-discover-title">
                        Find your next favorite
                    </h2>

                    <p>
                        Use the finder or compare products
                        before choosing.
                    </p>
                </div>

                <div className={styles.discoverLinks}>
                    <Link href="/finder">
                        Product finder
                    </Link>

                    <Link href="/compare">
                        Compare products
                    </Link>
                </div>
            </section>
        </main>
    );
}