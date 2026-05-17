import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/family/:path*",
    "/prescriptions/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/trends/:path*"
  ]
};
