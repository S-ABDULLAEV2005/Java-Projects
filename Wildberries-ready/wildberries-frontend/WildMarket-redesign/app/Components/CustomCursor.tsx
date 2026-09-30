"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const finePointer = window.matchMedia(
            "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        );

        if (!finePointer.matches) {
            return;
        }

        const cursor = cursorRef.current;

        if (!cursor) {
            return;
        }

        document.documentElement.classList.add("custom-cursor-enabled");

        let animationFrame = 0;
        let mouseX = -100;
        let mouseY = -100;

        const updateCursor = () => {
            cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
            animationFrame = 0;
        };

        const handlePointerMove = (event: PointerEvent) => {
            mouseX = event.clientX;
            mouseY = event.clientY;

            if (!animationFrame) {
                animationFrame = requestAnimationFrame(updateCursor);
            }

            cursor.classList.add("custom-cursor-visible");
        };

        const handlePointerOver = (event: PointerEvent) => {
            const target = event.target as HTMLElement;

            const interactive = target.closest(
                'a, button, [role="button"], [data-cursor="interactive"]',
            );

            const textInput = target.closest(
                'input, textarea, select, [contenteditable="true"]',
            );

            cursor.classList.toggle(
                "custom-cursor-hovering",
                Boolean(interactive),
            );

            cursor.classList.toggle(
                "custom-cursor-hidden",
                Boolean(textInput),
            );
        };

        const handlePointerDown = () => {
            cursor.classList.add("custom-cursor-pressed");
        };

        const handlePointerUp = () => {
            cursor.classList.remove("custom-cursor-pressed");
        };

        const handlePointerLeave = () => {
            cursor.classList.remove("custom-cursor-visible");
        };

        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerover", handlePointerOver);
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("pointerleave", handlePointerLeave);

        return () => {
            document.documentElement.classList.remove(
                "custom-cursor-enabled",
            );

            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerover", handlePointerOver);
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("pointerup", handlePointerUp);
            document.removeEventListener("pointerleave", handlePointerLeave);

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="custom-cursor"
            aria-hidden="true"
        >
            <span />
        </div>
    );
}