import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PaymentPanel from "./PaymentPanel";

export default async function PaymentPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (
        !/^[1-9]\d{0,18}$/.test(id) ||
        BigInt(id) > BigInt("9223372036854775807")
    ) {
        notFound();
    }

    const token =
        (await cookies()).get("access_token")?.value;

    if (!token) {
        redirect("/login");
    }

    return <PaymentPanel orderId={id} />;
}