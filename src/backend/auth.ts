import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        await dbConnect();
        const user = await User.findOne({ email: credentials.email }).select("+password +isVerified");
        if (!user) {
          throw new Error("Invalid credentials");
        }
        if (!user.isVerified) {
          throw new Error("Please verify your email before logging in");
        }
        if (!user.password) {
          throw new Error("Invalid credentials");
        }
        const isPasswordMatch = await bcrypt.compare(credentials.password as string, user.password as string);
        if (!isPasswordMatch) {
          throw new Error("Invalid credentials");
        }
        return {
           id: user._id.toString(),
           name: user.name,
           email: user.email,
        };
      }
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "azure-ad") {
        await dbConnect();
        
        let existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            isVerified: true, // OAuth emails are already verified
          });
        }
        
        return true;
      }
      return true; // Credentials signin is handled in authorize
    },
  },
});
