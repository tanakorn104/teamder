'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

import { ImMagicWand } from "react-icons/im";
import { BsPeopleFill } from "react-icons/bs";
import { IoMdCreate } from "react-icons/io";
import { IoPerson } from "react-icons/io5";

export default function BottomBar() {
    const pathname = usePathname();

    // จัดกลุ่มเมนูเพื่อง่ายต่อการเพิ่ม/ลดในอนาคต
    const navItems = [
        { name: "Projects", path: "/", icon: <ImMagicWand className="text-lg md:text-xl" /> },
        { name: "Teams", path: "/myteam", icon: <BsPeopleFill className="text-lg md:text-xl" /> },
        { name: "Create", path: "/createteam", icon: <IoMdCreate className="text-lg md:text-xl" /> },
        { name: "Profile", path: "/profile", icon: <IoPerson className="text-lg md:text-xl" /> },
    ];

    return (
        // 1. คุมตำแหน่งให้ลอยอยู่ตรงกลางจอด้านล่างเสมอ
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[90%] sm:w-[80%] max-w-[400px]">
            
            {/* 2. ดีไซน์แบบ Glassmorphism (พื้นหลังเบลอๆ) ทรงแคปซูล */}
            <div className="bg-white/80 backdrop-blur-lg shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-1.5 md:p-2 rounded-full flex flex-row items-center justify-between">
                
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    
                    return (
                        <Link 
                            key={item.path} 
                            href={item.path} 
                            // 3. Effect เวลา Active และ Hover (เปลี่ยนมาใช้ bg-active จาก global.css)
                            className={`flex flex-col items-center justify-center w-1/4 py-2 rounded-full transition-all duration-300 ${
                                isActive 
                                    ? "bg-active text-white shadow-sm scale-100" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 scale-95 hover:scale-100" 
                            }`}
                        >
                            {item.icon}
                            <p className="text-[10px] md:text-xs font-medium mt-1">{item.name}</p>
                        </Link>
                    );
                })}

            </div>
        </div>
    );
}