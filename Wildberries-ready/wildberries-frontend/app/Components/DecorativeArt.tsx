import Image from "next/image";
export default function DecorativeArt({ priority = false }: { priority?: boolean }) {
    return <div className="decorative-art" aria-hidden="true"><Image src="/illustrations/hero.webp" alt="" width={768} height={768} priority={priority} sizes="(max-width: 760px) 90vw, 520px" /></div>;
}
