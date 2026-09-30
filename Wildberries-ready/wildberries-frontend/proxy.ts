import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
        const loginUrl = new URL("/login", request.url);

        loginUrl.searchParams.set(
            "next",
            request.nextUrl.pathname,
        );

        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/products/:path*",
        "/categories/:path*",
        "/alif/:path*",
    ],
};
