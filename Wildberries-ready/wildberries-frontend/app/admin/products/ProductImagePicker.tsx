"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import styles from "./admin-products.module.css";

export type SelectedImage = {
    file: File;
    previewUrl: string;
};

type Props = {
    selected: SelectedImage | null;
    imageUrl: string;
    disabled: boolean;
    onSelect: (image: SelectedImage) => void;
    onRemove: () => void;
};

export default function ProductImagePicker({
                                               selected,
                                               imageUrl,
                                               disabled,
                                               onSelect,
                                               onRemove,
                                           }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState("");

    const safeUrl =
        /^(https?:\/\/|\/(?!\/))/.test(imageUrl)
            ? imageUrl
            : "";

    const preview = selected?.previewUrl || safeUrl;

    function choose(file: File) {
        if (disabled) return;

        setError("");

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setError("Choose a JPEG or PNG image.");
            return;
        }

        if (!file.size || file.size > 3 * 1024 * 1024) {
            setError(
                "Choose a non-empty image no larger than 3 MB.",
            );
            return;
        }

        onSelect({
            file,
            previewUrl: URL.createObjectURL(file),
        });
    }

    return (
        <div className={styles.wide}>
            <p className={styles.imageLabel}>
                Product photo
            </p>

            <div
                className={`${styles.imageDrop} ${
                    dragging ? styles.imageDragging : ""
                }`}
                role="group"
                aria-label="Product photo upload"
                aria-describedby="product-photo-help"
                tabIndex={disabled ? -1 : 0}
                onDragOver={(event) => {
                    event.preventDefault();

                    if (!disabled) {
                        setDragging(true);
                    }
                }}
                onDragLeave={(event) => {
                    if (
                        !event.currentTarget.contains(
                            event.relatedTarget as Node | null,
                        )
                    ) {
                        setDragging(false);
                    }
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);

                    const file = event.dataTransfer.files[0];

                    if (file) choose(file);
                }}
                onPaste={(event) => {
                    const file = Array.from(
                        event.clipboardData.items,
                    )
                        .find(
                            (item) =>
                                item.kind === "file" &&
                                item.type.startsWith("image/"),
                        )
                        ?.getAsFile();

                    if (file) {
                        event.preventDefault();
                        choose(file);
                    }
                }}
            >
                {preview ? (
                    <div className={styles.imagePreview}>
                        <Image
                            src={preview}
                            alt="Product photo preview"
                            fill
                            unoptimized
                            sizes="(max-width: 700px) 100vw, 500px"
                        />
                    </div>
                ) : (
                    <ImagePlus
                        size={40}
                        aria-hidden="true"
                    />
                )}

                <p>
                    {selected
                        ? selected.file.name
                        : preview
                            ? "Current product photo"
                            : "Drop a product photo here"}
                </p>

                <p id="product-photo-help">
                    JPEG or PNG, up to 3 MB. Focus this area
                    and press Ctrl + V to paste a copied image.
                </p>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    disabled={disabled}
                    aria-label="Choose product photo"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) choose(file);

                        event.target.value = "";
                    }}
                />

                <div className={styles.actions}>
                    <button
                        type="button"
                        disabled={disabled}
                        className={styles.secondary}
                        onClick={() =>
                            inputRef.current?.click()
                        }
                    >
                        <Upload
                            size={17}
                            aria-hidden="true"
                        />

                        {preview
                            ? "Replace photo"
                            : "Choose photo"}
                    </button>

                    {preview && (
                        <button
                            type="button"
                            disabled={disabled}
                            className={styles.secondary}
                            onClick={() => {
                                setError("");
                                onRemove();
                            }}
                        >
                            <X
                                size={17}
                                aria-hidden="true"
                            />
                            Remove photo
                        </button>
                    )}
                </div>

                {selected && (
                    <small>
                        Selected locally. Uploaded when you save.
                    </small>
                )}
            </div>

            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}
        </div>
    );
}