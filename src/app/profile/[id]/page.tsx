'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { IoMdArrowBack } from "react-icons/io";
import { BiMapPin, BiBuildings } from "react-icons/bi";
import { IoPersonOutline } from "react-icons/io5";

export default function UserProfileDetail() {
    const router = useRouter();
    const params = useParams();
    const targetUserId = params?.id;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // เรียก API เส้นใหม่ที่เราเพิ่งสร้าง
                const res = await fetch(`/api/profile/${targetUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (targetUserId) fetchUserProfile();
    }, [targetUserId]);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-gray-400">Loading Profile...</div>;
    
    if (!user) return (
        <div className="min-h-screen flex flex-col justify-center items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-600">ไม่พบโปรไฟล์ผู้ใช้นี้</h1>
            <button onClick={() => router.back()} className="text-cyan-500 font-bold hover:underline">กลับไปหน้าก่อนหน้า</button>
        </div>
    );

    const displayName = user.full_name || "Unknown User";
    const displayImage = user.profile_image || null;
    const displayInstitution = user.institution_name || "ไม่ได้ระบุมหาวิทยาลัย";

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full pb-24 pt-6 md:pt-10">
            <div className="w-full max-w-2xl px-6 flex flex-col gap-6">
                
                {/* Header พร้อมปุ่มกลับ */}
                <div className="flex flex-row items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex justify-center items-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 transition-all"
                    >
                        <IoMdArrowBack className="text-xl" />
                    </button>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">User Profile</span>
                </div>

                {/* Profile Card (Read-Only) */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center md:items-start gap-6">
                    
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                        <div className="relative w-32 h-32 rounded-[40px] overflow-hidden border-4 border-gray-50 bg-gray-100 flex justify-center items-center shadow-inner shrink-0">
                            {displayImage ? (
                                <Image src={displayImage} alt="Profile" fill className="object-cover" />
                            ) : (
                                <IoPersonOutline size={64} className="text-gray-300" />
                            )}
                        </div>
                        
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-3xl font-bold">{displayName}</h2>
                            <p className="text-gray-400 font-medium mt-1">{user.email}</p>
                            
                            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                <span className="px-4 py-1.5 bg-cyan-50 text-cyan-600 rounded-full text-xs font-black uppercase tracking-tighter border border-cyan-100">
                                    {user.primary_role || "ไม่ได้ระบุสายงาน"}
                                </span>
                                <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-100">
                                    <BiBuildings /> {displayInstitution}
                                </span>
                                <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-100">
                                    <BiMapPin /> {user.province || "ไม่ได้ระบุตำแหน่ง"}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bio Display */}
                    {user.user_description ? (
                        <div className="w-full mt-2 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">About Me</h3>
                            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{user.user_description}</p>
                        </div>
                    ) : (
                        <div className="w-full mt-2 p-6 bg-gray-50 rounded-[32px] border border-gray-100 border-dashed text-center">
                            <p className="text-gray-400 text-sm italic">ผู้ใช้นี้ยังไม่ได้เขียนแนะนำตัวเอง</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}