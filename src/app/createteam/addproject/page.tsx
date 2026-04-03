'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdArrowBack } from "react-icons/io";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { BiSearch, BiX } from "react-icons/bi";
import { stringToColor } from "@/lib/utils";

export default function AddProject() {
    const router = useRouter();

    // Form States
    const [scope, setScope] = useState("Global");
    const [envType, setEnvType] = useState("education");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [section, setSection] = useState("");
    const [teamSize, setTeamSize] = useState(5); // Default เป็น 5

    // Tags States
    const [allTags, setAllTags] = useState<any[]>([]);
    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const [tagSearch, setTagSearch] = useState("");
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 🚀 ดึง Tags จาก DB ด้วย fetch (ไม่ใช้ axios)
        const fetchTags = async () => {
            try {
                const res = await fetch('/api/tags');
                if (res.ok) {
                    const data = await res.json();
                    setAllTags(data.tags || []);
                }
            } catch (error) {
                console.error("Failed to load tags");
            }
        };
        fetchTags();
    }, []);

    // --- Handlers ---
    const handleDecrease = () => setTeamSize(prev => (prev > 1 ? prev - 1 : 1));
    const handleIncrease = () => setTeamSize(prev => prev + 1);

    const handleAddTag = (tag: any) => {
        if (!selectedTags.find(t => t.id === tag.id)) {
            if (selectedTags.length >= 5) {
                alert("เลือกแท็กได้สูงสุด 5 แท็กครับ");
                return;
            }
            setSelectedTags([...selectedTags, tag]);
        }
        setTagSearch("");
        setShowTagDropdown(false);
    };

    const handleRemoveTag = (tagId: number) => {
        setSelectedTags(selectedTags.filter(t => t.id !== tagId));
    };

    // ค้นหา Tag ที่ยังไม่ได้เลือก
    const filteredTags = allTags
        .filter(t => t.tag_name.toLowerCase().includes(tagSearch.toLowerCase()))
        .filter(t => !selectedTags.find(st => st.id === t.id))
        .slice(0, 10); // โชว์แค่ 10 อันพอให้ไม่ล้นจอ

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            alert("กรุณากรอกชื่อและรายละเอียดโปรเจกต์ให้ครบถ้วน");
            return;
        }
        if (scope === "Subject" && !subjectCode.trim()) {
            alert("กรุณากรอกรหัสวิชา");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                description,
                visibility_type: scope,
                env_type: scope === "Subject" ? "education" : envType, // ถ้าวิชาเรียน บังคับเป็น education
                max_members: teamSize,
                subject_code: scope === "Subject" ? subjectCode : null,
                section: scope === "Subject" ? section : null,
                tags: selectedTags.map(t => t.id)
            };

            // 🚀 ส่งข้อมูลไปที่ API ด้วย fetch (ไม่ใช้ axios)
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // เด้งไปหน้าแรก หรือหน้าโปรเจกต์
                    router.push('/');
                    router.refresh();
                } else {
                    alert(data.error || "เกิดข้อผิดพลาดในการสร้างโปรเจกต์");
                }
            } else {
                alert("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
            }
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full font-sans text-foreground pb-24 pt-6 md:pt-10">
            <div className="w-full max-w-2xl px-6 md:px-8 flex flex-col gap-8 md:gap-10">
                
                {/* --- Header --- */}
                <div className="flex flex-row items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex justify-center items-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 transition-all"
                    >
                        <IoMdArrowBack className="text-xl" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Project</h1>
                </div>

                <div className="flex flex-col gap-10">
                    
                    {/* --- Section 1: Scope Selection --- */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold">1. Visibility Scope</h2>
                            <p className="text-sm text-gray-500 mt-1">ใครบ้างที่สามารถเห็นและขอเข้าร่วมงานของคุณ</p>
                        </div>
                        
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
                                            ? "border-cyan-500 bg-cyan-50 shadow-[0_4px_15px_rgba(6,182,212,0.2)]" 
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                    }`}
                                >
                                    <b className={`text-base ${scope === item.name ? "text-cyan-700" : "text-gray-800"}`}>
                                        {item.name}
                                    </b>
                                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* ฟิลด์เฉพาะเมื่อเลือก Subject */}
                        {scope === "Subject" && (
                            <div className="flex gap-4 mt-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-blue-700 uppercase">Subject Code *</label>
                                    <input 
                                        type="text" value={subjectCode} onChange={(e)=>setSubjectCode(e.target.value)}
                                        placeholder="e.g. 01204212" className="px-4 py-2.5 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                    />
                                </div>
                                <div className="w-1/3 flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-blue-700 uppercase">Section</label>
                                    <input 
                                        type="text" value={section} onChange={(e)=>setSection(e.target.value)}
                                        placeholder="e.g. 712" className="px-4 py-2.5 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Section 2: Project Details --- */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold">2. Project Details</h2>
                            <p className="text-sm text-gray-500 mt-1">รายละเอียดงาน ประเภท และจำนวนคนที่ต้องการ</p>
                        </div>
                        
                        <div className="flex flex-col gap-5 text-sm md:text-base">
                            
                            {/* Title */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700">Project Title <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. AI Chatbot for e-commerce"
                                    className="px-4 py-3 border border-gray-200 w-full rounded-xl bg-white shadow-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                                />
                            </div>

                            {/* Env Type (ซ่อนเมื่อเป็น Subject เพราะ Subject ต้องเป็นการศึกษาอยู่แล้ว) */}
                            {scope !== "Subject" && (
                                <div className="flex flex-col gap-2">
                                    <label className="font-bold text-gray-700">Project Type</label>
                                    <select 
                                        value={envType} onChange={(e) => setEnvType(e.target.value)}
                                        className="px-4 py-3 border border-gray-200 w-full rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                                    >
                                        <option value="education">🎓 Education (เพื่อการศึกษา/ฝึกฝน)</option>
                                        <option value="professional">💼 Professional (ระดับทำงาน/ทำธุรกิจ)</option>
                                        <option value="competition">🏆 Competition (แข่งขันทักษะ/Hackathon)</option>
                                    </select>
                                </div>
                            )}

                            {/* Description */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700">Description <span className="text-red-500">*</span></label>
                                <textarea 
                                    value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your project, goals, and what kind of roles you are looking for..."
                                    rows={4}
                                    className="px-4 py-3 border border-gray-200 w-full rounded-xl bg-white shadow-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none" 
                                ></textarea>
                            </div>

                            {/* Team Size */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700">Total Members Needed</label>
                                <div className="flex flex-row items-center justify-between px-6 py-4 border border-gray-200 w-full rounded-xl bg-white shadow-sm">
                                    <button onClick={handleDecrease} className="flex justify-center items-center w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                                        <FaMinus />
                                    </button>
                                    <div className="flex flex-col justify-center items-center">
                                        <p className="text-3xl font-light text-slate-800">{teamSize}</p>
                                        <p className="text-xs text-gray-400 font-medium">people</p>
                                    </div>
                                    <button onClick={handleIncrease} className="flex justify-center items-center w-10 h-10 bg-cyan-500 text-white rounded-full shadow-sm hover:bg-cyan-600 transition-all">
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>

                            {/* Tags Selection (Autocomplete) */}
                            <div className="flex flex-col gap-3 mt-2 relative">
                                <label className="font-bold text-gray-700">Tags (Max 5)</label>
                                
                                {/* Selected Tags Display */}
                                <div className="flex flex-row flex-wrap gap-2 items-center min-h-[36px]">
                                    {selectedTags.map(item => {
                                        const tagTheme = stringToColor(item.tag_name);
                                        return (
                                            <span 
                                                key={item.id} 
                                                onClick={() => handleRemoveTag(item.id)}
                                                style={{ backgroundColor: tagTheme.bg, color: tagTheme.text, borderColor: tagTheme.border }}
                                                className="px-3 py-1.5 text-xs font-bold border rounded-full shadow-sm cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1"
                                            >
                                                #{item.tag_name} <BiX className="text-sm ml-0.5" />
                                            </span>
                                        );
                                    })}
                                    {selectedTags.length === 0 && <p className="text-xs text-gray-400 italic">ยังไม่ได้เลือกแท็ก...</p>}
                                </div>

                                {/* Tag Search Input */}
                                {selectedTags.length < 5 && (
                                    <div className="relative">
                                        <BiSearch className="absolute left-3.5 top-3.5 text-gray-400 text-lg" />
                                        <input 
                                            type="text" 
                                            value={tagSearch} 
                                            onChange={(e) => { setTagSearch(e.target.value); setShowTagDropdown(true); }}
                                            onFocus={() => setShowTagDropdown(true)}
                                            placeholder="Search tags (e.g. AI, React, Marketing...)"
                                            className="px-4 py-3 pl-10 border border-gray-200 w-full rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                        />
                                        
                                        {/* Dropdown Suggestions */}
                                        {showTagDropdown && tagSearch && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                                {filteredTags.length > 0 ? (
                                                    filteredTags.map(tag => (
                                                        <div 
                                                            key={tag.id} 
                                                            onClick={() => handleAddTag(tag)}
                                                            className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                        >
                                                            #{tag.tag_name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No matching tags found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* --- Submit Button --- */}
                        <div className="mt-8">
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex justify-center items-center w-full py-4 rounded-xl bg-cyan-600 text-white font-bold text-base md:text-lg shadow-lg hover:bg-cyan-700 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {isSubmitting ? "Creating Project..." : "Create Team"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}