import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 15 * 60
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isGuest: { label: "isGuest", type: "text" },
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error("API URL not configured");

        const isGuest = credentials?.isGuest === "true";
        const endpoint = isGuest ? "/auth/guest" : "/auth/login";
        const body = isGuest 
          ? { name: credentials?.name || "Guest" }
          : { email: credentials?.email, password: credentials?.password };

        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
          return {
            id: data.user_id,
            email: credentials?.email || `guest_${data.user_id}@local`,
            name: credentials?.name || (isGuest ? "Guest" : ""),
            accessToken: data.access_token,
            isGuest: !!data.is_guest
          };
        }

        if (data.code === "VERIFICATION_REQUIRED") {
          throw new Error("VERIFICATION_REQUIRED");
        }

        throw new Error(data.error || "Invalid credentials");
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.healthstackAccessToken = (user as any).accessToken;
        token.isGuest = (user as any).isGuest;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isGuest = token.isGuest;
      }
      session.accessToken = token.healthstackAccessToken;
      return session;
    }
  },
  pages: {
    signIn: "/",
    error: "/"
  }
};
