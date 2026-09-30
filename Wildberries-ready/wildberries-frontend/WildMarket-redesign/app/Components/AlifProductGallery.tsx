"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

type Props = {
    images: string[];
    name: string;
};

export default function AlifProductGallery({ images, name }: Props) {
    const photos = images.filter(Boolean);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    const selectedImage = photos[selectedIndex] ?? photos[0];
    const unavailable = !selectedImage || failedImages[selectedImage];

    function markFailed(src: string) {
        setFailedImages((previous) => ({ ...previous, [src]: true }));
    }

    return (
        <div className="alif-detail-gallery">
            <div className="alif-detail-main-image">
                {unavailable ? (
                    <div className="alif-detail-image-fallback">
                        <ImageOff size={48} aria-hidden="true" />
                        <span>Image unavailable</span>
                    </div>
                ) : (
                    <Image
                        key={selectedImage}
                        src={selectedImage}
                        alt={`${name} — image ${selectedIndex + 1}`}
                        fill
                        unoptimized
                        priority
                        sizes="(max-width: 850px) 100vw, 55vw"
                        onError={() => markFailed(selectedImage)}
                    />
                )}

                {photos.length > 1 && (
                    <span className="alif-detail-image-count">
                        {selectedIndex + 1} / {photos.length}
                    </span>
                )}
            </div>

            {photos.length > 1 && (
                <div
                    className="alif-detail-thumbnails"
                    role="group"
                    aria-label="Product images"
                >
                    {photos.map((src, index) => (
                        <button
                            key={`${src}-${index}`}
                            type="button"
                            className={`alif-detail-thumbnail ${
                                selectedIndex === index ? "is-selected" : ""
                            }`}
                            aria-label={`Show image ${index + 1} of ${name}`}
                            aria-pressed={selectedIndex === index}
                            onClick={() => setSelectedIndex(index)}
                        >
                            {failedImages[src] ? (
                                <ImageOff size={22} aria-hidden="true" />
                            ) : (
                                <Image
                                    src={src}
                                    alt=""
                                    fill
                                    unoptimized
                                    sizes="76px"
                                    onError={() => markFailed(src)}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}