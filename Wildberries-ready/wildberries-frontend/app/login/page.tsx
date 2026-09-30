import DecorativeArt from "../Components/DecorativeArt";
import Link from "next/link";
import {
    ArrowLeft,
    KeyRound,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Store,
} from "lucide-react";

import LoginForm from "../Components/LoginForm";

export default function LoginPage() {
    return (
        <main className="store-auth-page">
            <section className="store-auth-visual store-login-visual">
                <div className="store-auth-visual-overlay" />

                <Link
                    href="/"
                    className="store-auth-back-link"
                >
                    <ArrowLeft size={17} />
                    Return home
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
                        Your shopping experience
                    </p>

                    <h1>
                        Welcome back to
                        <span> better shopping.</span>
                    </h1>

                    <DecorativeArt priority />
                    <div className="store-auth-features">
                        <article>
                            <span>
                                <ShieldCheck size={21} />
                            </span>

                            <div>
                                <strong>Secure access</strong>
                                <small>
                                    Sign in to share your feedback
                                </small>
                            </div>
                        </article>

                        <article>
                            <span>
                                <Store size={21} />
                            </span>

                            <div>
                                <strong>Two marketplaces</strong>
                                <small>
                                    Explore WildMarket and AlifShop
                                </small>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section className="store-auth-form-side">
                <div className="store-auth-form-container">
                    <div className="store-auth-form-icon">
                        <KeyRound size={23} />
                    </div>

                    <p className="store-auth-form-eyebrow">
                        Account access
                    </p>

                    <h2>Sign in</h2>

                    <p className="store-auth-form-description">
                        Enter your account information to continue
                        shopping.
                    </p>

                    <LoginForm />
                </div>
            </section>
        </main>
    );
}