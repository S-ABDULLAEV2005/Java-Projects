import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        productId: string;
    }>;
};

async function getAuthentication() {
    const cookieStore = await cookies();
    return cookieStore.get("access_token")?.value;
}

function getBackendUrl(): string | null {
    return process.env.BACKEND_URL ?? null;
}

async function createProxyResponse(
    backendResponse: Response,
) {
    const responseText = await backendResponse.text();

    return new NextResponse(responseText || null, {
        status: backendResponse.status,
        headers: {
            "Content-Type":
                backendResponse.headers.get("Content-Type") ??
                "application/json",
        },
    });
}

export async function GET(
    request: Request,
    context: RouteContext,
) {
    try {
        const backendUrl = getBackendUrl();
        const token = await getAuthentication();
        const { productId } = await context.params;

        if (!backendUrl) {
            return NextResponse.json(
                {
                    message: "BACKEND_URL is missing",
                },
                {
                    status: 500,
                },
            );
        }

        if (!token) {
            return NextResponse.json(
                {
                    message: "You must log in first",
                },
                {
                    status: 401,
                },
            );
        }

        const backendResponse = await fetch(
            `${backendUrl}/feedbacks/product/${productId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            },
        );

        return createProxyResponse(backendResponse);
    } catch (error) {
        console.error(
            "[api/feedbacks/product] GET failed:",
            error,
        );

        return NextResponse.json(
            {
                message: "Could not load product feedback",
            },
            {
                status: 500,
            },
        );
    }
}

export async function POST(
    request: Request,
    context: RouteContext,
) {
    try {
        const backendUrl = getBackendUrl();
        const token = await getAuthentication();
        const { productId } = await context.params;

        if (!backendUrl) {
            return NextResponse.json(
                {
                    message: "BACKEND_URL is missing",
                },
                {
                    status: 500,
                },
            );
        }

        if (!token) {
            return NextResponse.json(
                {
                    message: "You must log in first",
                },
                {
                    status: 401,
                },
            );
        }

        const body = await request.json();

        const backendResponse = await fetch(
            `${backendUrl}/feedbacks/product/${productId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rating: body.rating,
                    comment: body.comment,
                }),
                cache: "no-store",
            },
        );

        return createProxyResponse(backendResponse);
    } catch (error) {
        console.error(
            "[api/feedbacks/product] POST failed:",
            error,
        );

        return NextResponse.json(
            {
                message: "Could not submit product feedback",
            },
            {
                status: 500,
            },
        );
    }
}