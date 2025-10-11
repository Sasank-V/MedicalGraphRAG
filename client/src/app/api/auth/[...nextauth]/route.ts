import { IUser } from "@/lib/types";
import { getUserRepository } from "@/server/repositories";
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "google") {
        const userRepo = getUserRepository();
        const data : IUser = {
          name: user.name || "",
          email: user.email || "",
        }

        await userRepo.createUser(data);

        return true;
      } else {
        return false;
      }
    }
  }
})

export { handler as GET, handler as POST }