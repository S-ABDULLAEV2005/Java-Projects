"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FormEvent,
    useState,
} from "react";
import {
    AlertCircle,
    ArrowRight,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    LogIn,
    User,
} from "lucide-react";

export default function LoginForm() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError("");

        if (!username.trim() || !password) {
            setError(
                "Enter your username and password.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        password,
                    }),
                },
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                setError(
                    data?.message ||
                    "Invalid username or password.",
                );
                return;
            }

            /*
             * Login route creates the secure access_token cookie.
             * The homepage lets the customer choose a marketplace.
             */
            router.replace("/");
            router.refresh();
        } catch {
            setError(
                "Could not connect to the authentication server.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form
            className="store-auth-form"
            onSubmit={handleSubmit}
        >
            {error && (
                <div
                    className="store-auth-error"
                    role="alert"
                >
                    <AlertCircle size={18} />

                    <span>{error}</span>
                </div>
            )}

            <div className="store-auth-field">
                <label htmlFor="login-username">
                    Username
                </label>

                <div className="store-auth-input">
                    <User
                        size={19}
                        aria-hidden="true"
                    />

                    <input
                        id="login-username"
                        type="text"
                        value={username}
                        onChange={(event) =>
                            setUsername(
                                event.target.value,
                            )
                        }
                        placeholder="Enter your username"
                        autoComplete="username"
                        disabled={isLoading}
                        required
                    />
                </div>
            </div>

            <div className="store-auth-field">
                <div className="store-auth-label-row">
                    <label htmlFor="login-password">
                        Password
                    </label>

                    <span>Keep it private</span>
                </div>

                <div className="store-auth-input">
                    <LockKeyhole
                        size={19}
                        aria-hidden="true"
                    />

                    <input
                        id="login-password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value,
                            )
                        }
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                    />

                    <button
                        type="button"
                        className="store-password-button"
                        onClick={() =>
                            setShowPassword(
                                (current) => !current,
                            )
                        }
                        aria-label={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                        disabled={isLoading}
                    >
                        {showPassword ? (
                            <EyeOff size={18} />
                        ) : (
                            <Eye size={18} />
                        )}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                className="store-auth-submit"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <LoaderCircle
                            className="store-auth-spinner"
                            size={19}
                        />
                        Signing in...
                    </>
                ) : (
                    <>
                        <LogIn size={19} />
                        Sign in
                        <ArrowRight
                            className="store-submit-arrow"
                            size={19}
                        />
                    </>
                )}
            </button>

            <div className="store-auth-divider">
                <span>New to WildMarket?</span>
            </div>

            <p className="store-auth-switch">
                Don&apos;t have an account?
                <Link href="/register">
                    Create an account
                    <ArrowRight size={15} />
                </Link>
            </p>
        </form>
    );
}