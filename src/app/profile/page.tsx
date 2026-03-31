'use client'

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BiLogOut, BiLogIn } from "react-icons/bi";
import { IoPersonOutline } from "react-icons/io5";

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                } else if (response.status === 401) {
                    setError(true);
                }
            } catch (err) {
                console.error("Fetch profile error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full font-sans text-foreground pb-24 pt-8 md:pt-12">
            
            {/* กล่องคุมความกว้าง Responsive */}
            <div className="w-full max-w-2xl px-6 md:px-10 flex flex-col gap-6 md:gap-8">
                
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Profile
                </h1>

                {/* --- Profile Card --- */}
                {loading ? (
                    // Skeleton Loading (แสดงตอนกำลัง Fetch ข้อมูล)
                    <div className="w-full bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 rounded-[32px] flex flex-row items-center gap-6 animate-pulse">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 shrink-0"></div>
                        <div className="flex flex-col flex-1 gap-3">
                            <div className="h-6 bg-gray-200 rounded-md w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 rounded-[32px] flex flex-row items-center gap-6 md:gap-8 transition-shadow hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)]">
                        
                        {/* Avatar */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shrink-0 border-4 border-gray-50 shadow-sm bg-gray-100 flex justify-center items-center">
                            {user && user.picture ? (
                                <Image
                                    src={user.picture}
                                    alt={user.name || "User Profile"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <IoPersonOutline className="text-4xl md:text-5xl text-gray-400" />
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <b className="text-xl md:text-2xl text-foreground truncate">
                                {user ? user.name : "Guest User"}
                            </b>
                            <p className="text-sm md:text-base text-gray-500 truncate mt-1">
                                {user ? user.email : "Please login to view your profile"}
                            </p>
                        </div>
                    </div>
                )}

                {/* --- Action Buttons --- */}
                <div className="flex flex-col gap-4 mt-2">
                    {!loading && user ? (
                        // ปุ่ม Logout โทนสีแดงอ่อนๆ
                        <button 
                            onClick={() => { 
                                if (window.confirm("คุณต้องการออกจากระบบไหม?")) {
                                    window.location.href = "/logout";
                                }
                            }} 
                            className="w-full bg-white border border-red-100 text-red-500 hover:bg-red-50 py-4 rounded-2xl flex flex-row items-center justify-center gap-3 shadow-sm transition-all duration-300 font-bold text-base md:text-lg"
                        >
                            <BiLogOut className="text-xl md:text-2xl" />
                            <span>Logout</span>
                        </button>
                    ) : !loading && !user ? (
                        // ปุ่ม Login โทนสี Active (แบรนด์)
                        <button 
                            onClick={() => router.push("/auth")} 
                            className="w-full bg-active text-white hover:opacity-90 py-4 rounded-2xl flex flex-row items-center justify-center gap-3 shadow-[0_8px_20px_rgba(145,178,195,0.4)] transition-all duration-300 hover:-translate-y-1 font-bold text-base md:text-lg"
                        >
                            <BiLogIn className="text-xl md:text-2xl" />
                            <span>Login to Teamder</span>
                        </button>
                    ):""}
                </div>

            </div>
        </div>
    );
}