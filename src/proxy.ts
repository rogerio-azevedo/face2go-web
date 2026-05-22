import { auth } from "@/auth";

export default auth;

export const config = {
    matcher: [
        /*
         * /display é público (TV) — não passa pelo auth middleware.
         */
        "/((?!api|_next/static|_next/image|display|privacy-policy|privacidade|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
