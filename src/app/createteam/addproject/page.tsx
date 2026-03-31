'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdArrowBack } from "react-icons/io";
import { FaMinus, FaPlus } from "react-icons/fa6"; // เปลี่ยนมาใช้ fa6 ให้เหมือนหน้าอื่นๆ

import { stringToColor } from "@/lib/utils";

export default function AddProject() {
    const router = useRouter();

    // States สำหรับให้ UI ขยับและตอบสนองได้จริง
    const [scope, setScope] = useState("Global");
    const [teamSize, setTeamSize] = useState(1);
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        // จำลองข้อมูล Tag เบื้องต้น
        let initialTags = ["Research", "Creative", "Innovation", "Business", "Study"];
        setTags(initialTags);
    }, []);

    const handleDecrease = () => setTeamSize(prev => (prev > 1 ? prev - 1 : 1));
    const handleIncrease = () => setTeamSize(prev => prev + 1);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full font-sans text-foreground pb-24 pt-6 md:pt-10">
            
            {/* คุมความกว้างไม่ให้ฟอร์มยืดเกินไปบนจอคอม */}
            <div className="w-full max-w-2xl px-6 md:px-8 flex flex-col gap-8 md:gap-10">
                
                {/* --- Header & Back Button --- */}
                <div className="flex flex-row items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex justify-center items-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 hover:shadow transition-all"
                    >
                        <IoMdArrowBack className="text-xl" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Project</h1>
                </div>

                <div className="flex flex-col gap-10">
                    
                    {/* --- Section 1: Scope Selection --- */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold">เลือกขอบเขตการทำงาน</h2>
                            <p className="text-sm text-gray-500 mt-1">ใครบ้างที่สามารถเห็นและขอเข้าร่วมงานของคุณ</p>
                        </div>
                        
                        {/* Grid สลับการเรียง: มือถือ 1 คอลัมน์, จอใหญ่ 3 คอลัมน์ */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            {[
                                { name: "Global", desc: "Everyone can join" },
                                { name: "University", desc: "Students only" },
                                { name: "Subject", desc: "Specific class" }
                            ].map((item) => (
                                <div 
                                    key={item.name}
                                    onClick={() => setScope(item.name)}
                                    className={`flex flex-col justify-center border p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                                        scope === item.name 
                                            ? "border-active bg-active/10 shadow-[0_4px_15px_rgba(145,178,195,0.2)]" 
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                    }`}
                                >
                                    <b className={`text-base ${scope === item.name ? "text-active" : "text-gray-800"}`}>
                                        {item.name}
                                    </b>
                                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Section 2: Project Details --- */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold">Project details</h2>
                            <p className="text-sm text-gray-500 mt-1">Tell people what you’re interested in</p>
                        </div>
                        
                        <div className="flex flex-col gap-5 text-sm md:text-base">
                            
                            {/* Title Input */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700">Title</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Al Chatbot for mystery"
                                    className="px-4 py-3 border border-gray-200 w-full rounded-xl bg-white shadow-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-active focus:border-transparent transition-all" 
                                />
                            </div>

                            {/* Description Textarea */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700">Description</label>
                                <textarea 
                                    placeholder="Describe your project here..."
                                    rows={4}
                                    className="px-4 py-3 border border-gray-200 w-full rounded-xl bg-white shadow-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-active focus:border-transparent transition-all resize-none" 
                                ></textarea>
                            </div>

                            {/* Team Size Counter */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700">Team Size</label>
                                <div className="flex flex-row items-center justify-between px-6 py-4 border border-gray-200 w-full rounded-xl bg-white shadow-sm">
                                    <button 
                                        onClick={handleDecrease}
                                        className="flex justify-center items-center w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors"
                                    >
                                        <FaMinus />
                                    </button>
                                    <div className="flex flex-col justify-center items-center">
                                        <p className="text-3xl font-light text-foreground">{teamSize}</p>
                                        <p className="text-xs text-gray-400 font-medium">members needed</p>
                                    </div>
                                    <button 
                                        onClick={handleIncrease}
                                        className="flex justify-center items-center w-10 h-10 bg-active text-white rounded-full shadow-sm hover:opacity-90 hover:scale-105 transition-all"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-col gap-3 mt-2">
                                <label className="font-bold text-gray-700">Tags</label>
                                <div className="flex flex-row flex-wrap gap-2 items-center">
                                    {tags.map(item => {
                                        const tagTheme = stringToColor(item);
                                        return (
                                            <span 
                                                key={item} 
                                                style={{ 
                                                    backgroundColor: tagTheme.bg, 
                                                    color: tagTheme.text,
                                                    borderColor: tagTheme.border 
                                                }}
                                                className="px-4 py-1.5 text-xs md:text-sm font-bold border rounded-full shadow-sm"
                                            >
                                                #{item}
                                            </span>
                                        );
                                    })}
                                    <button className="flex justify-center items-center px-3 py-1.5 bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full border border-gray-200 border-dashed transition-colors gap-1 text-xs md:text-sm font-bold">
                                        <FaPlus className="text-[10px]" /> Add Tag
                                    </button>
                                </div>
                            </div>
                            
                        </div>

                        {/* --- Submit Button --- */}
                        <div className="mt-8">
                            <button className="flex justify-center items-center w-full py-4 rounded-xl bg-active text-white font-bold text-base md:text-lg shadow-[0_8px_20px_rgba(145,178,195,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(145,178,195,0.5)] transition-all duration-300">
                                Create Team
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}