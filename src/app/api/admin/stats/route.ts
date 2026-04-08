import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Scan from "@/models/Scan";

export async function GET() {
  const session = await auth();

  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: { $ne: true } });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10).select("name email createdAt role");
    
    // Real-time Scan Analysis
    const totalScans = await Scan.countDocuments();
    const recentScans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "name email");

    const unverifiedUsersList = await User.find({ 
      $or: [{ isVerified: false }, { isVerified: { $exists: false } }] 
    }).sort({ createdAt: -1 }).lean();

    console.log(`Debug API: Total Unverified records found: ${unverifiedUsersList.length}`);

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      totalScans,
      recentUsers: recentUsers.map((u: any) => ({
        id: u._id?.toString(),
        name: u.name || "N/A",
        email: u.email || "N/A",
        createdAt: u.createdAt,
        role: u.role,
        isVerified: u.isVerified === true
      })),
      unverifiedUsersList: unverifiedUsersList.map((u: any) => ({
        id: u._id?.toString(),
        name: u.name || "N/A",
        email: u.email || "N/A",
        createdAt: u.createdAt,
        role: u.role,
        isVerified: false
      })),
      recentScans: recentScans.map(s => ({
        id: s._id,
        userName: (s.userId as any)?.name || "Guest",
        userEmail: (s.userId as any)?.email || "N/A",
        engine: s.engine,
        isAI: s.isAI,
        confidence: s.confidence,
        certainty: s.certainty,
        createdAt: s.createdAt,
        imageUrl: s.imageUrl
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
