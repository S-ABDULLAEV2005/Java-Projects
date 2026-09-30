import DecorativeArt from "../Components/DecorativeArt";
import Link from "next/link";
import {
    ArrowLeft,
    LockKeyhole,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    UserPlus,
} from "lucide-react";

import RegisterForm from "../Components/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="store-auth-page">
            <section className="store-auth-visual store-register-visual">
                <div className="store-auth-visual-overlay" />

                <Link
                    href="/login"
                    className="store-auth-back-link"
                >
                    <ArrowLeft size={17} />
                    Back to login
                </Link>

                <div className="store-auth-brand">
                    <span>
                        <ShoppingBag size={27} />
                    </span>

                    <div>
                        <strong>WildMarket</strong>
                        <small>Local marketplace</small>
                    </div>
                </div>

                <div className="store-auth-message">
                    <p>
                        <Sparkles size={15} />
                        Become a customer
                    </p>

                    <h1>
                        Create an account.
                        <span> Find your favorites.</span>
                    </h1>

                    <DecorativeArt priority />
                    <div className="store-auth-features">
                        <article>
                            <span>
                                <UserPlus size={21} />
                            </span>

                            <div>
                                <strong>Simple registration</strong>
                                <small>
                                    Choose a username and password
                                </small>
                            </div>
                        </article>

                        <article>
                            <span>
                                <LockKeyhole size={21} />
                            </span>

                            <div>
                                <strong>Protected password</strong>
                                <small>
                                    Encoded securely by the backend
                                </small>
                            </div>
                        </article>

                        <article>
                            <span>
                                <ShieldCheck size={21} />
                            </span>

                            <div>
                                <strong>Secure customer account</strong>
                                <small>
                                    Sign in to manage your feedback
                                </small>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section className="store-auth-form-side">
                <div className="store-auth-form-container">
                    <div className="store-auth-form-icon store-register-icon">
                        <UserPlus size={23} />
                    </div>

                    <p className="store-auth-form-eyebrow">
                        New customer
                    </p>

                    <h2>Create account</h2>

                    <p className="store-auth-form-description">
                        Choose a username and create a secure
                        password.
                    </p>

                    <RegisterForm />
                </div>
            </section>
        </main>
    );
}