import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "../../../_lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    const protocol =
        request.headers.get("x-forwarded-proto") ??
        request.nextUrl.protocol.replace(":", "");

    const expectedOrigin =
        `${protocol}://${request.headers.get("host")}`;

    if (request.headers.get("origin") !== expectedOrigin) {
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
                        "Admin access is required. Sign in again if your session expired.",
                },
                { status: access.status },
            );
        }

        if (
            !request.headers
                .get("content-type")
                ?.startsWith("multipart/form-data")
        ) {
            return NextResponse.json(
                { message: "An image upload is required" },
                { status: 415 },
            );
        }

        const length = Number(
            request.headers.get("content-length"),
        );

        if (length > 4 * 1024 * 1024) {
            return NextResponse.json(
                { message: "Image upload is too large" },
                { status: 413 },
            );
        }

        let incoming: FormData;

        try {
            incoming = await request.formData();
        } catch {
            return NextResponse.json(
                { message: "Invalid upload" },
                { status: 400 },
            );
        }

        const file = incoming.get("file");

        if (
            !(file instanceof File) ||
            !file.size ||
            file.size > 3 * 1024 * 1024
        ) {
            return NextResponse.json(
                { message: "Choose an image up to 3 MB" },
                { status: 400 },
            );
        }

        if (
            !["image/jpeg", "image/png"].includes(file.type)
        ) {
            return NextResponse.json(
                { message: "Choose a JPEG or PNG image" },
                { status: 415 },
            );
        }

        const outgoing = new FormData();

        outgoing.append(
            "file",
            file,
            file.type === "image/png"
                ? "product.png"
                : "product.jpg",
        );

        const response = await fetch(
            `${access.session.base}/products/images/upload`,
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${access.session.token}`,
                },
                body: outgoing,
                cache: "no-store",
                signal: AbortSignal.timeout(50000),
            },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            return NextResponse.json(
                {
                    message:
                        data?.message || "Image upload failed",
                },
                { status: response.status },
            );
        }

        if (typeof data?.imageUrl !== "string") {
            return NextResponse.json(
                { message: "Unexpected upload response" },
                { status: 502 },
            );
        }

        return NextResponse.json(
            { imageUrl: data.imageUrl },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch {
        return NextResponse.json(
            {
                message:
                    "Could not finish the image upload. Please try again.",
            },
            { status: 502 },
        );
    }
}