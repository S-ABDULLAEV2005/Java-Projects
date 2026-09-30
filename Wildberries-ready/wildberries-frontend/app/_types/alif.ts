export type AlifCategory = { name: string; slug: string };

export type AlifPagination = {
    total: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
};

export type AlifProduct = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    rating: string | number;
    rating_count: number;
    min_price: string | number;
    final_price: string | number;
    discount?: string | number;
    discount_percent?: number;
    monthly_payment?: string | number;
    images: string[];
    default_category?: { id: number; name: string; slug: string };
};

export type AlifProductsResponse = {
    response: {
        products: {
            pagination: AlifPagination;
            items: AlifProduct[];
        };
    };
};

export type AlifProductDetailsResponse = { response: AlifProduct };

export type AlifReview = {
    id: number;
    rating?: number;
    comment?: string | null;
    text?: string | null;
    user?: { name?: string };
};

export type AlifReviewsResponse = {
    response: { pagination: AlifPagination; items: AlifReview[] };
};
