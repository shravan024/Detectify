import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email }).select("+otp +otpExpiry");
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "User is already verified" }, { status: 400 });
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json({ message: "Invalid OTP request" }, { status: 400 });
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ message: "OTP has expired. Please register again." }, { status: 400 });
    }

    const isOtpValid = await bcrypt.compare(otp.toString(), user.otp);
    if (!isOtpValid) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Mark as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ message: "An error occurred during verification" }, { status: 500 });
  }
}
