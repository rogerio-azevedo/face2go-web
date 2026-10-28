import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
    const headers = new Headers(req.headers);
    headers.set("x-pathname", req.nextUrl.pathname);
    return NextResponse.next({ request: { headers } });
});

export const config = {
    matcher: [
        /*
         * /display é público (TV) / não passa pelo auth middleware.
         */
        "/((?!api|_next/static|_next/image|display|privacy-policy|terms-of-use|privacidade|ajuda|orientacoes-facial|ienh/ajuda|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
