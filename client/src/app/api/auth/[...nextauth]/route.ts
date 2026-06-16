import { IUser } from "@/lib/types";
import { getUserRepository } from "@/server/repositories";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const userRepo = getUserRepository();
        const data: IUser = {
          role: "admin",
          name: user.name || "",
          email: user.email || "",
        };

        await userRepo.createUser(data);

        console.log("Created user in DB: ", data);

        return true;
      } else {
        return false;
      }
    },
    async session({ session }) {
      if (session?.user?.email) {
        const userRepo = getUserRepository();
        const dbUser = await userRepo.getUserByEmail(session.user.email);

        if (dbUser) {
          session.user.role = dbUser.role || "user";
          session.user.id = dbUser._id?.toString();
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
