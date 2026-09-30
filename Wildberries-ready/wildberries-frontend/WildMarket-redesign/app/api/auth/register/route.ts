import { NextResponse } from "next/server";

function getErrorMessage(data: unknown): string {
    if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
    ) {
        return data.message;
    }

    return "Registration failed";
}

export async function POST(request: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL;

        if (!backendUrl) {
            return NextResponse.json(
                { message: "BACKEND_URL is missing" },
                { status: 500 },
            );
        }

        const body = await request.json();

        const backendResponse = await fetch(`${backendUrl}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: body.username,
                password: body.password,
            }),
            cache: "no-store",
        });

        const data = await backendResponse.json().catch(() => null);

        if (!backendResponse.ok) {
            return NextResponse.json(
                {
                    message: getErrorMessage(data),
                },
                {
                    status: backendResponse.status,
                },
            );
        }

        return NextResponse.json(
            {
                message: "Account created successfully",
                user: data,
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        console.error("[api/auth/register] Registration failed:", error);

        return NextResponse.json(
            {
                message:
                    "Could not connect to the registration service",
            },
            {
                status: 500,
            },
        );
    }
}