"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const TARGETS = [
    "main h1",
    ".category-tile",
    ".store-product-card",
    ".alif-store-product",
    ".marketplace-card",
    ".account-profile",
    ".account-shortcut",
    ".store-footer-intro",
    ".store-footer-column",
    ".store-footer-invitation",
    "[data-wm-reveal]",
].join(",");

export default function StudioMotion() {
    const pathname = usePathname();
    const seen = useRef(new WeakSet<Element>());

    useEffect(() => {
        const root = document.querySelector(".store-app");

        if (
            !root ||
            typeof IntersectionObserver === "undefined"
        ) {
            return;
        }

        const preference = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );

        const animations = new Map<HTMLElement, Animation>();
        let frame = 0;

        const viewport = new IntersectionObserver(
            (entries) => {
                let order = 0;

                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;

                    viewport.unobserve(entry.target);
                    seen.current.add(entry.target);

                    const element = entry.target;

                    if (
                        !(element instanceof HTMLElement) ||
                        preference.matches ||
                        !element.animate ||
                        element.contains(document.activeElement) ||
                        !element.getClientRects().length
                    ) {
                        continue;
                    }

                    const animation = element.animate(
                        [
                            {
                                opacity: 0.65,
                                translate: "0 6px",
                            },
                            {
                                opacity: 1,
                                translate: "0 0",
                            },
                        ],
                        {
                            duration: 360,
                            delay: Math.min(order++ * 35, 105),
                            easing: "cubic-bezier(.22,1,.36,1)",
                        },
                    );

                    animations.set(element, animation);

                    animation.onfinish = animation.oncancel = () => {
                        animations.delete(element);
                    };
                }
            },
            {
                threshold: 0,
                rootMargin: "0px 0px -24px 0px",
            },
        );

        function scan() {
            root!.querySelectorAll<HTMLElement>(TARGETS)
                .forEach((element) => {
                    if (
                        seen.current.has(element) ||
                        element.closest(
                            "dialog, .shopping-saved-row, " +
                            ".shopping-rich-row, .shopping-quantity",
                        )
                    ) {
                        return;
                    }

                    viewport.observe(element);
                });
        }

        function queueScan() {
            if (frame) return;

            frame = requestAnimationFrame(() => {
                frame = 0;
                scan();
            });
        }

        function settle() {
            if (preference.matches) {
                for (const animation of animations.values()) {
                    animation.cancel();
                }
            }
        }

        function stopInteractedAnimation(event: Event) {
            if (!(event.target instanceof Node)) return;

            for (const [element, animation] of animations) {
                if (element.contains(event.target)) {
                    animation.cancel();
                }
            }
        }

        scan();

        // Also detects content arriving after navigation or streaming.
        const observer = new MutationObserver(queueScan);

        observer.observe(root, {
            childList: true,
            subtree: true,
        });

        preference.addEventListener("change", settle);

        root.addEventListener(
            "pointerdown",
            stopInteractedAnimation,
            true,
        );

        root.addEventListener(
            "focusin",
            stopInteractedAnimation,
            true,
        );

        return () => {
            observer.disconnect();
            viewport.disconnect();
            cancelAnimationFrame(frame);

            preference.removeEventListener("change", settle);

            root.removeEventListener(
                "pointerdown",
                stopInteractedAnimation,
                true,
            );

            root.removeEventListener(
                "focusin",
                stopInteractedAnimation,
                true,
            );

            for (const animation of animations.values()) {
                animation.cancel();
            }
        };
    }, [pathname]);

    return null;
}