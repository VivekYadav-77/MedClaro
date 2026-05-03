import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 15 * 60
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const email = typeof profile?.email === "string" ? profile.email : undefined;
      const name = typeof profile?.name === "string" ? profile.name : "";
      const avatar = typeof (profile as { picture?: string } | undefined)?.picture === "string"
        ? (profile as { picture?: string }).picture
        : undefined;
      if (account && email) {
        token.email = email;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (apiUrl) {
          const response = await fetch(`${apiUrl}/auth/callback`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              google_id: account.providerAccountId,
              email,
              name,
              avatar_url: avatar
            })
          });
          if (response.ok) {
            const data = (await response.json()) as { access_token: string };
            token.healthstackAccessToken = data.access_token;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      session.accessToken = token.healthstackAccessToken;
      return session;
    }
  },
  pages: {
    signIn: "/"
  }
};
