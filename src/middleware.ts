export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Match all routes except /login and static assets
    "/((?!login|_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};

