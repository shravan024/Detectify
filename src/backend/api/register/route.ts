import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { sendOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ message: "Email already exists" }, { status: 400 });
      }
      // If unverified, we could resend OTP, but for simplicity here we delete and recreate or just update
      await User.deleteOne({ email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp: hashedOtp,
      otpExpiry,
    });

    try {
      await sendOTP(email, otp);
      return NextResponse.json({ message: "OTP sent successfully" }, { status: 201 });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      await User.deleteOne({ email }); // Rollback if email fails
      return NextResponse.json({ message: "Failed to send verification email" }, { status: 500 });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 });
  }
}
