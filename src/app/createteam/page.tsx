'use client'

import { FaPlus } from "react-icons/fa6";
import { MdNavigateNext } from "react-icons/md";
import { useRouter, usePathname } from "next/navigation";

export default function CreateProject() {
    const router = useRouter();
    const pathname = usePathname();

    const handleCreateClick = () => {
        // ใช้ replace เพื่อเปลี่ยนหน้าโดยไม่เก็บประวัติหน้านี้ไว้ (ป้องกันการกดย้อนกลับมาหน้านี้ซ้ำ)
        router.push(`${pathname}/addproject`);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full font-sans text-foreground pb-24 pt-8 md:pt-12">
            
            <div className="w-full max-w-4xl px-6 md:px-10 flex flex-col gap-6 md:gap-8">
                
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Create
                </h1>

                {/* --- 🌟 The Beautiful Card --- */}
                <div 
                    onClick={handleCreateClick}
                    className="relative overflow-hidden flex flex-col md:flex-row justify-between bg-white text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 md:p-10 rounded-[32px] gap-8 md:gap-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(145,178,195,0.15)] cursor-pointer group"
                >
                    {/* ของตกแต่ง (Decorative Background Blobs) ให้การ์ดดูมีมิติ */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-active rounded-full mix-blend-multiply filter blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-score rounded-full mix-blend-multiply filter blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

                    {/* Content ซ้าย */}
                    <div className="relative z-10 flex flex-col gap-4 md:gap-6">
                        <div className="flex flex-row items-center gap-5 md:gap-6">
                            
                            {/* วงกลมไอคอนที่มีลูกเล่นตอน Hover */}
                            <div className="flex justify-center items-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-active/10 group-hover:bg-active group-hover:shadow-[0_0_20px_rgba(145,178,195,0.4)] transition-all duration-300 shrink-0">
                                <FaPlus className="text-2xl md:text-3xl text-active group-hover:text-white transition-colors duration-300" />
                            </div>
                            
                            <div className="text-2xl md:text-3xl font-bold leading-tight">
                                <p>Start a</p>
                                <p className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-gray-400">
                                    New Project
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-500 font-medium text-sm md:text-base">
                            Bring your ideas to life. <span className="text-active font-bold">Find your team.</span>
                        </p>
                    </div>

                    {/* Content ขวา (ปุ่ม) */}
                    <div className="relative z-10 flex items-end justify-start md:justify-end mt-2 md:mt-0">
                        {/* ปุ่ม Create Now สไตล์ Modern */}
                        <div className="flex flex-row items-center gap-2 bg-gray-50 text-foreground group-hover:bg-active group-hover:text-white py-3 px-8 rounded-full transition-all duration-500 shadow-sm border border-gray-100 group-hover:border-active">
                            <p className="font-bold text-sm md:text-base">Create Now</p>
                            <MdNavigateNext className="text-xl md:text-2xl group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
//  <div className="w-3/4 bg-white   shadow-xl h-20 rounded-3xl">
//             <div className="w-full px-2  h-full flex flex-row item-center justify-between">
//                     <p className="text-4xl flex justify-center items-center"><FiBell /></p>
//                     <p className="h-auto flex justify-center items-center text-xl font-bold">Join Request</p>
//                     <div className="h-auto flex justify-center items-center text-white "><p className="bg-red-500 rounded-full text-center w-6 h-6">n</p></div>
//                     <p className="text-4xl flex justify-center items-center"> <MdNavigateNext /></p>
                    
//             </div>


//             </div>