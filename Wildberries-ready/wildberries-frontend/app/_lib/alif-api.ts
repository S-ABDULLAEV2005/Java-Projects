import { cookies } from "next/headers";

export async function fetchAlif<T>(path: string): Promise<T> {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) throw new Error("BACKEND_URL is missing in .env.local");

    const token = (await cookies()).get("access_token")?.value;
    if (!token) throw new Error("Authentication token is missing");

    const response = await fetch(`${backendUrl}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`AlifShop request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}
