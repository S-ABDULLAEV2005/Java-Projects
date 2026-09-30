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
    Check,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    User,
    UserPlus,
} from "lucide-react";

export default function RegisterForm() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] =
        useState(false);

    const passwordIsLongEnough =
        password.length >= 6;

    const passwordsMatch =
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword;

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError("");

        if (
            !username.trim() ||
            !password ||
            !confirmPassword
        ) {
            setError("Complete all fields.");
            return;
        }

        if (username.trim().length < 3) {
            setError(
                "Username must contain at least 3 characters.",
            );
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must contain at least 6 characters.",
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
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
                    "Registration failed.",
                );
                return;
            }

            /*
             * Registration creates the user.
             * Login will create the access_token cookie.
             */
            router.replace(
                "/login?registered=true",
            );
        } catch {
            setError(
                "Could not connect to the registration server.",
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
                <label htmlFor="register-username">
                    Username
                </label>

                <div className="store-auth-input">
                    <User
                        size={19}
                        aria-hidden="true"
                    />

                    <input
                        id="register-username"
                        type="text"
                        value={username}
                        onChange={(event) =>
                            setUsername(
                                event.target.value,
                            )
                        }
                        placeholder="Choose a username"
                        autoComplete="username"
                        disabled={isLoading}
                        minLength={3}
                        required
                    />
                </div>

                <small className="store-field-hint">
                    Use at least 3 characters.
                </small>
            </div>

            <div className="store-auth-field">
                <label htmlFor="register-password">
                    Password
                </label>

                <div className="store-auth-input">
                    <LockKeyhole
                        size={19}
                        aria-hidden="true"
                    />

                    <input
                        id="register-password"
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
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        disabled={isLoading}
                        minLength={6}
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
                                ? "Hide passwords"
                                : "Show passwords"
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

                <small
                    className={
                        passwordIsLongEnough
                            ? "store-password-rule valid"
                            : "store-password-rule"
                    }
                >
                    <Check size={14} />
                    At least 6 characters
                </small>
            </div>

            <div className="store-auth-field">
                <label htmlFor="confirm-password">
                    Confirm password
                </label>

                <div className="store-auth-input">
                    <LockKeyhole
                        size={19}
                        aria-hidden="true"
                    />

                    <input
                        id="confirm-password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(
                                event.target.value,
                            )
                        }
                        placeholder="Enter password again"
                        autoComplete="new-password"
                        disabled={isLoading}
                        minLength={6}
                        required
                    />
                </div>

                {confirmPassword && (
                    <small
                        className={
                            passwordsMatch
                                ? "store-password-rule valid"
                                : "store-password-rule invalid"
                        }
                    >
                        <Check size={14} />

                        {passwordsMatch
                            ? "Passwords match"
                            : "Passwords do not match"}
                    </small>
                )}
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
                        Creating account...
                    </>
                ) : (
                    <>
                        <UserPlus size={19} />
                        Create account
                        <ArrowRight
                            className="store-submit-arrow"
                            size={19}
                        />
                    </>
                )}
            </button>

            <div className="store-auth-divider">
                <span>Already registered?</span>
            </div>

            <p className="store-auth-switch">
                Already have an account?
                <Link href="/login">
                    Sign in
                    <ArrowRight size={15} />
                </Link>
            </p>
        </form>
    );
}