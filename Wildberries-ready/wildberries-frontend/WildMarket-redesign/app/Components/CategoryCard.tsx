import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryDesign } from "../_lib/category-design";

export default function CategoryCard({ name, slug, href }: { name: string; slug?: string; href: string }) {
    const { asset, tone } = categoryDesign(name, slug);
    return (
        <Link href={href} className={`category-tile tone-${tone}`}>
            <div className="category-tile-copy">
                <span>Explore collection</span>
                <h3>{name}</h3>
                <ArrowUpRight size={20} aria-hidden="true" />
            </div>
            <Image src={`/illustrations/${asset}.webp`} alt="" width={240} height={240}
                sizes="(max-width: 600px) 40vw, 180px" className="category-tile-art" />
        </Link>
    );
}
