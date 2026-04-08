import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Scan from "@/models/Scan";

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { engine, isAI, confidence, certainty, imageUrl } = await req.json();
    await dbConnect();

    const scan = await Scan.create({
      userId: (session.user as any).id,
      engine,
      isAI,
      confidence,
      certainty,
      imageUrl,
    });

    return NextResponse.json(scan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
