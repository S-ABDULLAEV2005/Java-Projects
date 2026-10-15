"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
    ArrowRight,
    ImageOff,
    Pause,
    Play,
    ShoppingBag,
    Sparkles,
} from "lucide-react";

type HeroProduct = {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
};

const COUNT = 37;
const RADIUS = 891;

function position(index: number, phase: number) {
    const angle =
        ((index * 360 / COUNT + phase) % 360 + 540) % 360 - 180;

    const radians = angle * Math.PI / 180;

    return {
        transform:
            `translate3d(${RADIUS * Math.sin(radians)}px,` +
            `0,${RADIUS * (1 - Math.cos(radians))}px) ` +
            `rotateY(${-angle}deg)`,

        visibility:
            Math.abs(angle) > 42
                ? "hidden" as const
                : "visible" as const,
    };
}

function ProductArt({ product }: { product: HeroProduct }) {
    const [broken, setBroken] = useState(false);

    return (
        <>
            {product.imageUrl && !broken ? (
                <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="130px"
                    onError={() => setBroken(true)}
                />
            ) : (
                <ImageOff size={32} aria-hidden="true" />
            )}
        </>
    );
}

export default function StudioHero({
                                       products,
                                   }: {
    products: HeroProduct[];
}) {
    const viewport = useRef<HTMLDivElement>(null);
    const scene = useRef<HTMLDivElement>(null);
    const cards = useRef<(HTMLDivElement | null)[]>([]);
    const phase = useRef(-2);

    const [paused, setPaused] = useState(false);

    const selection = products.slice(0, 10);
    const featured = selection[0];

    useEffect(() => {
        const windowElement = viewport.current;
        const sceneElement = scene.current;

        if (!windowElement || !sceneElement || !featured) return;

        let frame = 0;
        let last = 0;
        let visible = false;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );

        function place() {
            cards.current.forEach((card, index) => {
                if (!card) return;

                const style = position(index, phase.current);

                card.style.transform = style.transform;
                card.style.visibility = style.visibility;
            });
        }

        function tick(time: number) {
            if (last) {
                phase.current -=
                    1.9 * Math.min((time - last) / 1000, 0.1);
            }

            last = time;
            place();

            frame = requestAnimationFrame(tick);
        }

        function sync() {
            cancelAnimationFrame(frame);
            last = 0;

            const enabled = Boolean(
                windowElement!.closest('[data-design="studio"]'),
            );

            if (
                enabled &&
                visible &&
                !document.hidden &&
                !reduced.matches &&
                !paused
            ) {
                frame = requestAnimationFrame(tick);
            }
        }

        // Scale the decorative scene only.
        // Real text and controls keep their normal size.
        const resize = new ResizeObserver(entries => {
            const width = entries[0].contentRect.width;

            sceneElement!.style.setProperty(
                "--orbit-scale",
                String(Math.min(width / 1172, 1)),
            );
        });

        resize.observe(windowElement);

        const visibility = new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            sync();
        });

        visibility.observe(windowElement);

        document.addEventListener("visibilitychange", sync);
        reduced.addEventListener("change", sync);

        place();

        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            visibility.disconnect();

            document.removeEventListener("visibilitychange", sync);
            reduced.removeEventListener("change", sync);
        };
    }, [paused, featured]);

    return (
        <section
            className="wm-studio-hero"
            aria-labelledby="studio-title"
        >
            <div className="wm-studio-copy">
                <p className="store-eyebrow">
                    <Sparkles size={15} aria-hidden="true" />
                    Your everyday discoveries
                </p>

                <h1 id="studio-title">
                    Good finds.
                    <br />
                    <span>Great possibilities.</span>
                </h1>

                <p className="wm-studio-description">
                    Explore WildMarket and AlifShop. Save your
                    favorites and build a collection of your own.
                </p>

                <div className="wm-studio-actions">
                    <Link
                        href="/products"
                        className="store-primary-button"
                    >
                        Explore the collection
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>

                    <Link
                        href="/alif"
                        className="store-outline-button"
                    >
                        Discover AlifShop
                    </Link>
                </div>
            </div>

            {featured ? (
                <div className="wm-orbit-window" ref={viewport}>
                    <div
                        className="wm-orbit-scene"
                        ref={scene}
                        aria-hidden="true"
                    >
                        <div className="wm-orbit-ring">
                            {Array.from(
                                { length: COUNT },
                                (_, index) => (
                                    <div
                                        key={index}
                                        className={
                                            `wm-orbit-card ` +
                                            `wm-orbit-tone-${index % 4}`
                                        }
                                        style={{ visibility: "hidden" }}
                                        ref={element => {
                                            cards.current[index] = element;
                                        }}
                                    >
                                        <div className="wm-orbit-art">
                                            <ProductArt
                                                product={
                                                    selection[
                                                    index % selection.length
                                                        ]
                                                }
                                            />
                                        </div>

                                        <span>
                                            {
                                                selection[
                                                index % selection.length
                                                    ].name
                                            }
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="wm-studio-preview">
                        <div className="wm-preview-top">
                            <ShoppingBag
                                size={17}
                                aria-hidden="true"
                            />
                            <span>
                                From the WildMarket collection
                            </span>
                        </div>

                        <div className="wm-preview-body">
                            <div className="wm-preview-image">
                                <ProductArt product={featured} />
                            </div>

                            <div>
                                <small>Discover this product</small>

                                <h2>{featured.name}</h2>

                                <p>
                                    {Number.isFinite(
                                        Number(featured.price),
                                    ) && Number(featured.price) >= 0
                                        ? `${Number(
                                            featured.price,
                                        ).toLocaleString("en-US", {
                                            maximumFractionDigits: 2,
                                        })} TJS`
                                        : "Price unavailable"}
                                </p>

                                <Link
                                    href={`/products/${featured.id}`}
                                    className="store-text-link"
                                >
                                    View details
                                    <ArrowRight
                                        size={16}
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="wm-orbit-control"
                        aria-pressed={paused}
                        onClick={() => setPaused(value => !value)}
                    >
                        {paused ? (
                            <Play size={14} aria-hidden="true" />
                        ) : (
                            <Pause size={14} aria-hidden="true" />
                        )}

                        {paused
                            ? "Resume showcase"
                            : "Pause showcase"}
                    </button>
                </div>
            ) : (
                <div
                    className="wm-studio-fallback"
                    aria-hidden="true"
                >
                    <Image
                        src="/illustrations/hero.webp"
                        alt=""
                        width={768}
                        height={768}
                        sizes="(max-width: 700px) 90vw, 540px"
                    />
                </div>
            )}
        </section>
    );
}