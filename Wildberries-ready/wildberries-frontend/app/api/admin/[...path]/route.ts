import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "../../../_lib/admin-auth";

type Context = {
    params: Promise<{ path: string[] }>;
};

const idPattern = "[1-9][0-9]*";

function imageIsValid(
    value: unknown,
    required = false,
): boolean {
    if (value == null || value === "") {
        return !required;
    }

    if (typeof value !== "string" || value.length > 255) {
        return false;
    }

    if (
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.includes("\\")
    ) {
        return true;
    }

    try {
        const url = new URL(value);

        return (
            ["http:", "https:"].includes(url.protocol) &&
            !url.username &&
            !url.password
        );
    } catch {
        return false;
    }
}

async function forward(
    request: NextRequest,
    context: Context,
) {
    const endpoint = (await context.params).path.join("/");
    const method = request.method;

    const allowed =
        (method === "GET" && endpoint === "products") ||
        (
            method === "POST" &&
            new RegExp(
                `^products/category/${idPattern}$`,
            ).test(endpoint)
        ) ||
        (
            method === "PUT" &&
            new RegExp(
                `^products/${idPattern}/category/${idPattern}$`,
            ).test(endpoint)
        ) ||
        (
            method === "DELETE" &&
            new RegExp(
                `^products/${idPattern}$`,
            ).test(endpoint)
        ) ||
        (
            method === "PATCH" &&
            new RegExp(
                `^products/${idPattern}/image$`,
            ).test(endpoint)
        );

    if (!allowed) {
        return NextResponse.json(
            { message: "Route not found" },
            { status: 404 },
        );
    }

    const origin = request.headers.get("origin");

    const protocol =
        request.headers.get("x-forwarded-proto") ??
        request.nextUrl.protocol.replace(":", "");

    const expectedOrigin =
        `${protocol}://${request.headers.get("host")}`;

    if (method !== "GET" && origin !== expectedOrigin) {
        return NextResponse.json(
            { message: "Invalid request origin" },
            { status: 403 },
        );
    }

    try {
        const access = await getAdminAccess();

        if (!access.session) {
            return NextResponse.json(
                {
                    message:
                        access.status === 401
                            ? "Please sign in again"
                            : "Admin access is required",
                },
                { status: access.status },
            );
        }

        let body: string | undefined;

        if (["POST", "PUT", "PATCH"].includes(method)) {
            const contentType =
                request.headers.get("content-type");

            if (!contentType?.includes("application/json")) {
                return NextResponse.json(
                    { message: "JSON is required" },
                    { status: 415 },
                );
            }

            const text = await request.text();

            if (text.length > 16000) {
                return NextResponse.json(
                    { message: "Request is too large" },
                    { status: 413 },
                );
            }

            let data: Record<string, unknown>;

            try {
                const parsed: unknown = JSON.parse(text);

                if (
                    !parsed ||
                    typeof parsed !== "object" ||
                    Array.isArray(parsed)
                ) {
                    throw new Error("Invalid body");
                }

                data = parsed as Record<string, unknown>;
            } catch {
                return NextResponse.json(
                    { message: "Invalid JSON" },
                    { status: 400 },
                );
            }

            if (method === "PATCH") {
                if (!imageIsValid(data.imageUrl, true)) {
                    return NextResponse.json(
                        {
                            message:
                                "Enter an HTTP(S) image URL or /local-image-path, up to 255 characters",
                        },
                        { status: 400 },
                    );
                }

                body = JSON.stringify({
                    imageUrl: data.imageUrl,
                });
            } else {
                const invalid =
                    typeof data.name !== "string" ||
                    !data.name.trim() ||
                    data.name.length > 255 ||
                    typeof data.price !== "number" ||
                    !Number.isFinite(data.price) ||
                    data.price < 0 ||
                    typeof data.quantity !== "number" ||
                    !Number.isInteger(data.quantity) ||
                    data.quantity < 0 ||
                    data.quantity > 2147483647 ||
                    (
                        data.description != null &&
                        (
                            typeof data.description !== "string" ||
                            data.description.length > 255
                        )
                    ) ||
                    (
                        data.brand != null &&
                        (
                            typeof data.brand !== "string" ||
                            data.brand.length > 255
                        )
                    ) ||
                    !imageIsValid(data.imageUrl);

                if (invalid) {
                    return NextResponse.json(
                        {
                            message:
                                "Check the name, price, quantity and text fields",
                        },
                        { status: 400 },
                    );
                }

                body = JSON.stringify({
                    name: (data.name as string).trim(),
                    description: data.description ?? null,
                    price: data.price,
                    quantity: data.quantity,
                    brand: data.brand ?? null,
                    imageUrl: data.imageUrl ?? null,
                });
            }
        }

        const { base, token } = access.session;

        const response = await fetch(
            `${base}/${endpoint}`,
            {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body,
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
            {
                message:
                    "Could not connect to the backend. If you submitted a change, refresh the catalog before retrying.",
            },
            { status: 502 },
        );
    }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;