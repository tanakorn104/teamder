import { NextResponse } from "next/server";

export async function POST() {
  // สร้าง Response เพื่อส่งข้อความยืนยัน
  const response = NextResponse.json(
    { message: "Logout successful" },
    { status: 200 }
  );

  // ลบคุกกี้ทั้ง Access Token และ Refresh Token
  // การตั้งค่าต้องตรงกับตอนที่สร้าง (Path, SameSite ฯลฯ)
  response.cookies.delete("teamder_access_token");
  response.cookies.delete("teamder_refresh_token");

  return response;
}