import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
        return NextResponse.json(
            { message: "Invalid product ID." },
            { status: 400 },
        );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        return NextResponse.json(
            { message: "Feedback is temporarily unavailable." },
            { status: 503 },
        );
    }

    const token = (await cookies()).get("access_token")?.value;

    try {
        const response = await fetch(
            `${backendUrl.replace(/\/+$/, "")}/feedbacks/product/${id}`,
            {
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    ...(token
                        ? { Authorization: `Bearer ${token}` }
                        : {}),
                },
                signal: AbortSignal.timeout(15000),
            },
        );

        if (!response.ok) {
            const message =
                response.status === 401
                    ? "Please sign in to view feedback."
                    : response.status === 403
                        ? "You don’t have permission to view this feedback."
                        : "Feedback is temporarily unavailable.";

            return NextResponse.json(
                { message },
                { status: response.status },
            );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
            return NextResponse.json(
                { message: "The feedback response could not be read." },
                { status: 502 },
            );
        }

        return NextResponse.json(data, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch {
        return NextResponse.json(
            { message: "Could not connect to the feedback service." },
            { status: 502 },
        );
    }
}