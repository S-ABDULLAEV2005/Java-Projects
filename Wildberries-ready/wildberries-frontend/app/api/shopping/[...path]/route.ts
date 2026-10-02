import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Context = {
    params: Promise<{ path: string[] }>;
};

async function forward(request: NextRequest, context: Context) {
    const { path } = await context.params;
    const endpoint = path.join("/");
    const method = request.method;

    const allowed =
        ((method === "GET" || method === "POST") &&
            (endpoint === "cart" || endpoint === "favorites")) ||
        (method === "POST" && endpoint === "checkout") ||
        (method === "PATCH" && /^cart\/\d+$/.test(endpoint)) ||
        (method === "DELETE" && /^items\/\d+$/.test(endpoint));

    if (!allowed) {
        return NextResponse.json(
            { message: "Route not found" },
            { status: 404 },
        );
    }

    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        return NextResponse.json(
            { message: "Please sign in" },
            { status: 401 },
        );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        return NextResponse.json(
            { message: "Backend URL is missing" },
            { status: 500 },
        );
    }

    try {
        const response = await fetch(
            `${backendUrl.replace(/\/$/, "")}/shopping/${endpoint}`,
            {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body:
                    method === "POST" || method === "PATCH"
                        ? await request.text()
                        : undefined,
                cache: "no-store",
            },
        );

        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        return new NextResponse(await response.text(), {
            status: response.status,
            headers: {
                "Content-Type":
                    response.headers.get("Content-Type") ??
                    "application/json",
                "Cache-Control": "no-store",
            },
        });
    } catch {
        return NextResponse.json(
            { message: "Could not connect to the backend" },
            { status: 502 },
        );
    }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;