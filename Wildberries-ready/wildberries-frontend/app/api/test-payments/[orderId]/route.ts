import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Context = {
    params: Promise<{ orderId: string }>;
};

export const runtime = "nodejs";

async function forward(
    request: NextRequest,
    context: Context,
) {
    const { orderId } = await context.params;

    if (
        !/^[1-9]\d{0,18}$/.test(orderId) ||
        BigInt(orderId) > BigInt("9223372036854775807")
    ) {
        return NextResponse.json(
            { message: "Invalid order ID" },
            { status: 400 },
        );
    }

    if (request.method === "POST") {
        const protocol =
            request.headers.get("x-forwarded-proto") ??
            request.nextUrl.protocol.replace(":", "");

        const expectedOrigin =
            `${protocol}://${request.headers.get("host")}`;

        if (
            request.headers.get("origin") !== expectedOrigin
        ) {
            return NextResponse.json(
                { message: "Invalid request origin" },
                { status: 403 },
            );
        }
    }

    const token =
        (await cookies()).get("access_token")?.value;

    if (!token) {
        return NextResponse.json(
            { message: "Please sign in again" },
            { status: 401 },
        );
    }

    const base =
        process.env.BACKEND_URL?.replace(/\/$/, "");

    if (!base) {
        return NextResponse.json(
            { message: "BACKEND_URL is missing" },
            { status: 500 },
        );
    }

    let body: string | undefined;

    if (request.method === "POST") {
        if (
            !request.headers
                .get("content-type")
                ?.includes("application/json")
        ) {
            return NextResponse.json(
                { message: "JSON is required" },
                { status: 415 },
            );
        }

        const text = await request.text();

        if (text.length > 1000) {
            return NextResponse.json(
                { message: "Request too large" },
                { status: 413 },
            );
        }

        try {
            const data = JSON.parse(text);

            if (
                !data ||
                !["SUCCESS", "DECLINE", "CANCEL"].includes(
                    data.outcome,
                )
            ) {
                throw new Error();
            }

            body = JSON.stringify({
                outcome: data.outcome,
            });
        } catch {
            return NextResponse.json(
                { message: "Choose a valid test outcome" },
                { status: 400 },
            );
        }
    }

    try {
        const response = await fetch(
            `${base}/shopping/test-payments/${orderId}`,
            {
                method: request.method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body,
                cache: "no-store",
                signal: AbortSignal.timeout(30000),
            },
        );

        const data =
            await response.json().catch(() => null);

        if (!response.ok) {
            return NextResponse.json(
                {
                    message:
                        data?.message ||
                        `Payment request failed (${response.status})`,
                },
                { status: response.status },
            );
        }

        if (!data) {
            return NextResponse.json(
                { message: "Unexpected backend response" },
                { status: 502 },
            );
        }

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch {
        return NextResponse.json(
            {
                message:
                    "Could not confirm the payment status. Refresh the status before trying again.",
            },
            { status: 502 },
        );
    }
}

export const GET = forward;
export const POST = forward;