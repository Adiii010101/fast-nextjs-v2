import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/configs/db";
import { usersTable } from "@/configs/schema";
import { currentUser } from "@clerk/nextjs/server";

// ✅ Simple GET route for testing
export async function GET() {
  return NextResponse.json({ status: "User route is working ✅" });
}

// ✅ POST route for creating a new user
export async function POST(req: NextRequest) {
  try {
    // 1. Get the current user from Clerk
    const user = await currentUser();
    console.log("🔍 Clerk currentUser:", user);

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json(
        { error: "Unauthorized or missing email address" },
        { status: 401 }
      );
    }

    const email = user.primaryEmailAddress.emailAddress;
    const name = user.fullName ?? "";

    console.log("📧 Email:", email);

    // 2. Check if the user already exists
    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    console.log("👥 Existing users:", existingUsers);

    if (existingUsers.length > 0) {
      return NextResponse.json(existingUsers[0]);
    }

    // 3. Insert new user
    await db.insert(usersTable).values({
      name,
      email,
    });

    // 4. Fetch the user back (to support MySQL/SQLite which don’t support `.returning()`)
    const newUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    console.log("✅ Inserted user:", newUser[0]);

    return NextResponse.json(newUser[0]);
  } catch (e: any) {
    console.error("❌ API error:", e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
