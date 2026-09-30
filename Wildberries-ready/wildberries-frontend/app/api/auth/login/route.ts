import { NextResponse } from "next/server";

type AuthResponse = {
    token: string;
    type: string;
    expiresIn: number;
};

function getErrorMessage(data: unknown): string {
    if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
    ) {
        return data.message;
    }

    return "Invalid username or password";
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

        const backendResponse = await fetch(`${backendUrl}/auth/login`, {
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

        const authResponse = data as AuthResponse;

        if (!authResponse.token) {
            return NextResponse.json(
                { message: "The backend did not return a token" },
                { status: 500 },
            );
        }

        /*
         * Cookie maxAge expects seconds.
         * If expiresIn is very large, we assume Spring returned milliseconds.
         */
        const maxAge =
            authResponse.expiresIn > 31_536_000
                ? Math.floor(authResponse.expiresIn / 1000)
                : authResponse.expiresIn;

        const response = NextResponse.json({
            message: "Login successful",
            type: authResponse.type,
        });

        response.cookies.set({
            name: "access_token",
            value: authResponse.token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: maxAge > 0 ? maxAge : 3600,
        });

        return response;
    } catch (error) {
        console.error("[api/auth/login] Login failed:", error);

        return NextResponse.json(
            {
                message:
                    "Could not connect to the authentication service",
            },
            {
                status: 500,
            },
        );
    }
}