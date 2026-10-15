import { cookies } from "next/headers";

type AdminSession = {
    token: string;
    base: string;
    username: string;
};

type AdminAccess =
    | { session: AdminSession; status?: never }
    | { status: number; session?: never };

export async function getAdminAccess(): Promise<AdminAccess> {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        return { status: 401 };
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is missing");
    }

    const base = backendUrl.replace(/\/$/, "");

    const response = await fetch(`${base}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        return { status: response.status };
    }

    const user: {
        username: string;
        authorities?: { authority: string }[];
    } = await response.json();

    const isAdmin = user.authorities?.some(
        (role) => role.authority === "ROLE_ADMIN",
    );

    if (!isAdmin) {
        return { status: 403 };
    }

    return {
        session: {
            token,
            base,
            username: user.username,
        },
    };
}