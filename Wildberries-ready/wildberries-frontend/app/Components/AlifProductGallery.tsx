import ProductGallery from "./ProductGallery";

export default function AlifProductGallery({
                                               images,
                                               name,
                                           }: {
    images: string[];
    name: string;
}) {
    return <ProductGallery images={images} name={name} />;
}