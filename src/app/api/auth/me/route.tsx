import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  // 1. ดึง access_token จากคุกกี้ (ที่ถูกเซ็ตไว้เป็น httpOnly)
  const accessToken = request.cookies.get("teamder_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. ส่ง Token ไปถาม Google ว่า "คนนี้คือใคร?"
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 3. ส่งข้อมูลโปรไฟล์กลับไปให้หน้าบ้าน
    return NextResponse.json(response.data);
  } catch (error) {
    // ถ้า Token หมดอายุ หรือใช้ไม่ได้
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}