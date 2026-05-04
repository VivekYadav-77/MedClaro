import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isGuest?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    healthstackAccessToken?: string;
    isGuest?: boolean;
    id?: string;
  }
}
