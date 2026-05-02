import { auth } from "@/auth";
import { getDashboardPathForRole } from "@/lib/dashboard-path";
import { redirect } from "next/navigation";

export default async function HomePage() {
    const session = await auth();
    const user = session?.user;
    if (!user) {
        redirect("/login");
    }
    redirect(getDashboardPathForRole(user.role));
}
