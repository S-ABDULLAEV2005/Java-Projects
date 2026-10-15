"use client";

import Image from "next/image";
import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import {
    ChevronLeft,
    ChevronRight,
    ImageOff,
    Maximize2,
    X,
} from "lucide-react";

import styles from "./product-gallery.module.css";

type Props = {
    images: string[];
    name: string;
};

function ImagePreview({
                          src,
                          name,
                          unavailable,
                          onError,
                          expanded = false,
                      }: {
    src: string | undefined;
    name: string;
    unavailable: boolean;
    onError: () => void;
    expanded?: boolean;
}) {
    if (!src || unavailable) {
        return (
            <span className={styles.fallback}>
                <ImageOff size={42} aria-hidden="true" />
                <span>Image unavailable</span>
            </span>
        );
    }

    return (
        <Image
            key={src}
            src={src}
            alt={name}
            fill
            unoptimized
            priority={!expanded}
            sizes={
                expanded
                    ? "90vw"
                    : "(max-width: 850px) 90vw, 50vw"
            }
            className={styles.photo}
            onError={onError}
        />
    );
}

function EnlargedGallery({
                             src,
                             name,
                             index,
                             total,
                             unavailable,
                             onError,
                             move,
                             onClose,
                         }: {
    src: string | undefined;
    name: string;
    index: number;
    total: number;
    unavailable: boolean;
    onError: () => void;
    move: (direction: number) => void;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const body = document.body;
        const oldOverflow = body.style.overflow;
        const oldPadding = body.style.paddingRight;

        const gap =
            window.innerWidth -
            document.documentElement.clientWidth;

        const padding =
            parseFloat(getComputedStyle(body).paddingRight) || 0;

        if (!dialog.open) dialog.showModal();

        closeRef.current?.focus({ preventScroll: true });

        body.style.overflow = "hidden";

        if (gap > 0) {
            body.style.paddingRight = `${padding + gap}px`;
        }

        return () => {
            body.style.overflow = oldOverflow;
            body.style.paddingRight = oldPadding;
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby={titleId}
            onClose={onClose}
            onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                    dialogRef.current?.close();
                }
            }}
            onKeyDown={(event) => {
                if (total < 2) return;

                if (
                    event.key === "ArrowLeft" ||
                    event.key === "ArrowRight"
                ) {
                    event.preventDefault();

                    move(
                        event.key === "ArrowLeft" ? -1 : 1,
                    );
                }
            }}
        >
            <div className={styles.lightbox}>
                <header className={styles.lightboxHeading}>
                    <h2 id={titleId}>{name}</h2>

                    <button
                        ref={closeRef}
                        type="button"
                        className={styles.iconButton}
                        aria-label="Close image preview"
                        onClick={() => dialogRef.current?.close()}
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </header>

                <div className={styles.enlarged}>
                    <ImagePreview
                        src={src}
                        name={`${name} — photo ${index + 1}`}
                        unavailable={unavailable}
                        onError={onError}
                        expanded
                    />
                </div>

                <div className={styles.controls}>
                    {total > 1 && (
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Previous photo"
                            onClick={() => move(-1)}
                        >
                            <ChevronLeft
                                size={20}
                                aria-hidden="true"
                            />
                        </button>
                    )}

                    <span role="status">
                        {index + 1} / {total}
                    </span>

                    {total > 1 && (
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Next photo"
                            onClick={() => move(1)}
                        >
                            <ChevronRight
                                size={20}
                                aria-hidden="true"
                            />
                        </button>
                    )}
                </div>
            </div>
        </dialog>
    );
}

export default function ProductGallery({
                                           images,
                                           name,
                                       }: Props) {
    const photos = [
        ...new Set(
            images
                .filter(
                    (src) =>
                        typeof src === "string" && src.trim(),
                )
                .map((src) => src.trim()),
        ),
    ];

    const [selected, setSelected] = useState<string | null>(
        null,
    );

    const [failed, setFailed] = useState<
        Record<string, boolean>
    >({});

    const [open, setOpen] = useState(false);

    const src =
        selected && photos.includes(selected)
            ? selected
            : photos[0];

    const index = src ? photos.indexOf(src) : 0;
    const unavailable = !src || Boolean(failed[src]);

    function markFailed(source: string | undefined) {
        if (source) {
            setFailed((current) => ({
                ...current,
                [source]: true,
            }));
        }
    }

    function move(direction: number) {
        if (photos.length > 1) {
            setSelected(
                photos[
                (index + direction + photos.length) %
                photos.length
                    ],
            );
        }
    }

    return (
        <div className={styles.gallery}>
            <button
                type="button"
                className={styles.stage}
                disabled={unavailable}
                aria-haspopup="dialog"
                aria-label={`Enlarge photo ${index + 1} of ${name}`}
                onClick={() => setOpen(true)}
            >
                <ImagePreview
                    src={src}
                    name={`${name} — photo ${index + 1}`}
                    unavailable={unavailable}
                    onError={() => markFailed(src)}
                />

                {!unavailable && (
                    <span className={styles.zoom}>
                        <Maximize2
                            size={16}
                            aria-hidden="true"
                        />
                        Enlarge
                    </span>
                )}
            </button>

            {photos.length > 1 && (
                <>
                    <div className={styles.controls}>
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Previous photo"
                            onClick={() => move(-1)}
                        >
                            <ChevronLeft
                                size={20}
                                aria-hidden="true"
                            />
                        </button>

                        <span role="status">
                            {index + 1} / {photos.length}
                        </span>

                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Next photo"
                            onClick={() => move(1)}
                        >
                            <ChevronRight
                                size={20}
                                aria-hidden="true"
                            />
                        </button>
                    </div>

                    <div
                        className={styles.thumbnails}
                        role="group"
                        aria-label="Choose a product photo"
                    >
                        {photos.map((photo, photoIndex) => (
                            <button
                                key={photo}
                                type="button"
                                className={styles.thumbnail}
                                aria-pressed={src === photo}
                                aria-label={`Show photo ${photoIndex + 1} of ${name}`}
                                onClick={() => setSelected(photo)}
                            >
                                {failed[photo] ? (
                                    <ImageOff
                                        size={22}
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Image
                                        src={photo}
                                        alt=""
                                        fill
                                        unoptimized
                                        sizes="76px"
                                        onError={() =>
                                            markFailed(photo)
                                        }
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {open && photos.length > 0 && (
                <EnlargedGallery
                    src={src}
                    name={name}
                    index={index}
                    total={photos.length}
                    unavailable={unavailable}
                    onError={() => markFailed(src)}
                    move={move}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}