import crypto from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

function timingSafeMatch(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const expectedUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
        const expectedPassword = process.env.ADMIN_PASSWORD?.trim() || "";

        if (!expectedPassword) return null;

        const username = typeof credentials?.username === "string" ? credentials.username.trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        const usernameMatch = timingSafeMatch(expectedUsername, username);
        const passwordMatch = timingSafeMatch(expectedPassword, password);

        if (!usernameMatch || !passwordMatch) return null;

        return { id: "admin", name: expectedUsername };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});
