'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logout() {
    const router = useRouter();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const response = await fetch("/api/auth/logout", {
                    method: "POST", // หรือ GET ตามที่หลังบ้านกำหนดไว้ (แนะนำ POST)
                    credentials: 'include', // 🔥 สำคัญ: เพื่อให้ส่ง Cookie ไปเคลียร์ที่ Server
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    // ล้างข้อมูลในฝั่ง Client (ถ้ามี)
                    localStorage.clear(); 
                    
                    // 🚀 ใช้ window.location เพื่อ Hard Refresh ให้สถานะ Auth ในทุก Component หายไปจริง ๆ
                    // หรือใช้ router.replace('/') ถ้าจัดการ State ได้นิ่งแล้ว
                    window.location.href = "/"; 
                } else {
                    console.error("Logout failed");
                    router.replace("/"); // ถ้าพังก็กลับหน้าหลักไปก่อน
                }
            } catch (error) {
                console.error("Error during logout:", error);
                router.replace("/");
            }
        };

        handleLogout();
    }, [router]);

    return (
        <div className="flex flex-col z-[999] items-center justify-center w-full text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-3)] mb-4"></div>
            <p className="text-[var(--color-5)] font-medium">Logging out...</p>
            <p className="text-gray-400 text-xs mt-2">กำลังออกจากระบบ Teamder</p>
        </div>
    );
}