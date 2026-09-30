export type Category = {
    id: number;
    name: string;
};

export type Feedback = {
    id: number;
    rating: number;
    comment?: string | null;
};

export type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    brand: string | null;
    imageUrl: string | null;
    category: Category | null;
    feedbacks?: Feedback[];
};