'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { IoMdArrowBack } from "react-icons/io";
import { IoPersonOutline } from "react-icons/io5";
import { stringToColor } from "@/lib/utils";

export default function ProjectDetail() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.id;

    const [project, setProject] = useState<any>(null);
    const [userStatus, setUserStatus] = useState<string>("NONE"); 
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    
    // State สำหรับข้อความ
    const [joinMessage, setJoinMessage] = useState("");
    const [showJoinBox, setShowJoinBox] = useState(false);
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjectDetail = async () => {
            try {
                const res = await fetch(`/api/project/${projectId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data.project);
                    setUserStatus(data.userStatus);
                    setSentMessage(data.userRequestMessage); 
                } else {
                    setProject(null);
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) fetchProjectDetail();
    }, [projectId]);

    const handleJoinTeam = async () => {
        setIsJoining(true);
        try {
            const res = await fetch(`/api/project/${projectId}`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: joinMessage }) 
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                alert("ส่งคำขอสำเร็จ! รอหัวหน้าทีมอนุมัติ");
                setUserStatus("PENDING");
                setSentMessage(joinMessage); 
                setShowJoinBox(false); 
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setIsJoining(false);
        }
    };

    // 🚀 ฟังก์ชันยกเลิกคำขอ
    const handleCancelJoin = async () => {
        if (!confirm("คุณต้องการยกเลิกคำขอเข้าร่วมทีมนี้ใช่หรือไม่?")) return;
        
        setIsJoining(true);
        try {
            const res = await fetch(`/api/project/${projectId}`, { 
                method: 'PATCH' 
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                alert("ยกเลิกคำขอเรียบร้อยแล้ว");
                setUserStatus("CANCELED"); // เปลี่ยนสถานะใน UI
            } else {
                alert(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-400">Loading Project...</div>;
    if (!project) return <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-600">ไม่พบข้อมูลโปรเจกต์</h1>
        <button onClick={() => router.back()} className="text-cyan-500 font-bold hover:underline">กลับไปหน้าหลัก</button>
    </div>;

    const isFull = project.current_members >= project.max_members;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full font-sans text-foreground pb-24 pt-6 md:pt-10">
            <div className="w-full max-w-3xl px-6 md:px-8 flex flex-col gap-6">
                
                <div className="flex flex-row items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex justify-center items-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 transition-all"
                    >
                        <IoMdArrowBack className="text-xl" />
                    </button>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Project Detail</span>
                </div>

                <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-6 mt-2 relative overflow-hidden">
                    
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-cyan-50 text-cyan-600 border border-cyan-100 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                {project.env_type}
                            </span>
                            {project.visibility_type === 'Subject' && (
                                <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold">
                                    📚 {project.subject_code} {project.section ? `(Sec ${project.section})` : ''}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                            {project.title}
                        </h1>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-gray-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                        {project.description}
                    </div>

                    {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Required Skills / Tags</span>
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map((tag: string) => {
                                    const tagTheme = stringToColor(tag);
                                    return (
                                        <span key={tag} style={{ backgroundColor: tagTheme.bg, color: tagTheme.text, borderColor: tagTheme.border }} className="px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm">
                                            #{tag}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <hr className="border-gray-100 my-2" />

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Members ({project.current_members}/{project.max_members})</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {project.members_list?.map((member: any) => (
                                <div 
                                    key={member.id} 
                                    onClick={() => router.push(`/profile/${member.id}`)}
                                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-gray-200 flex justify-center items-center shrink-0">
                                        {member.profile_image ? (
                                            <Image src={member.profile_image} alt={member.full_name} width={48} height={48} className="object-cover w-full h-full" />
                                        ) : (
                                            <IoPersonOutline className="text-gray-400 text-xl" />
                                        )}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <p className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                                            {member.full_name}
                                            {member.role === 'OWNER' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded-md ml-1">Owner</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{member.primary_role || "Member"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-end w-full">
                        {userStatus === "OWNER" ? (
                            <button disabled className="w-full md:w-auto px-8 py-4 rounded-xl bg-amber-50 text-amber-600 font-bold border border-amber-200 cursor-not-allowed">👑 นี่คือโปรเจกต์ของคุณ</button>
                        ) : userStatus === "ACTIVE" ? (
                            <button disabled className="w-full md:w-auto px-8 py-4 rounded-xl bg-green-50 text-green-600 font-bold border border-green-200 cursor-not-allowed">✅ คุณอยู่ในทีมนี้แล้ว</button>
                        ) : userStatus === "PENDING" ? (
                            <div className="w-full flex flex-col md:items-end gap-3">
                                {sentMessage && (
                                    <div className="w-full md:w-2/3 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ข้อความที่คุณส่งไป</span>
                                        <p className="text-sm text-gray-600 italic">"{sentMessage}"</p>
                                    </div>
                                )}
                                {/* 🚀 ปุ่มยกเลิกคำขอโผล่มาตรงนี้ */}
                                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={handleCancelJoin}
                                        disabled={isJoining}
                                        className="w-full md:w-auto px-6 py-4 rounded-xl bg-white text-red-500 font-bold border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                                    >
                                        {isJoining ? "..." : "ยกเลิกคำขอ"}
                                    </button>
                                    <button disabled className="w-full md:w-auto px-8 py-4 rounded-xl bg-gray-100 text-gray-500 font-bold border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2">
                                        ⏳ รอหัวหน้าทีมอนุมัติ...
                                    </button>
                                </div>
                            </div>
                        ) : userStatus === "REJECTED" ? (
                            <div className="w-full flex flex-col md:items-end gap-3">
                                {sentMessage && (
                                    <div className="w-full md:w-2/3 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-2 opacity-60">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ข้อความที่เคยส่งไป</span>
                                        <p className="text-sm text-gray-600 italic">"{sentMessage}"</p>
                                    </div>
                                )}
                                <button disabled className="w-full md:w-auto px-8 py-4 rounded-xl bg-red-50 text-red-600 font-bold border border-red-200 cursor-not-allowed">
                                    ❌ คำขอถูกปฏิเสธ
                                </button>
                            </div>
                        ) : isFull ? (
                            <button disabled className="w-full md:w-auto px-8 py-4 rounded-xl bg-slate-100 text-slate-400 font-bold border border-slate-200 cursor-not-allowed">🚫 ทีมเต็มแล้ว</button>
                        ) : (
                            <div className="w-full flex flex-col items-end gap-3">
                                {/* 🚀 ถ้าเคยกดยกเลิกไป จะโชว์ข้อความเก่าให้ดูด้วย แต่ฟอร์มส่งใหม่ได้ */}
                                {userStatus === "CANCELED" && sentMessage && !showJoinBox && (
                                    <div className="w-full md:w-2/3 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-2 opacity-60">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">คำขอเดิมที่ถูกยกเลิกไป</span>
                                        <p className="text-sm text-gray-600 italic">"{sentMessage}"</p>
                                    </div>
                                )}

                                {showJoinBox && (
                                    <div className="w-full bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <label className="text-xs font-bold text-cyan-800 uppercase">ข้อความแนะนำตัว (Optional)</label>
                                        <textarea 
                                            value={joinMessage} 
                                            onChange={(e) => setJoinMessage(e.target.value)}
                                            placeholder="บอกหัวหน้าทีมหน่อยว่าทำไมคุณถึงเหมาะกับโปรเจกต์นี้..."
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-xl border border-cyan-200 outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
                                        ></textarea>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 w-full md:w-auto">
                                    {showJoinBox && (
                                        <button 
                                            onClick={() => setShowJoinBox(false)}
                                            className="w-full md:w-auto px-6 py-4 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                                        >
                                            ยกเลิก
                                        </button>
                                    )}
                                    <button 
                                        onClick={showJoinBox ? handleJoinTeam : () => setShowJoinBox(true)}
                                        disabled={isJoining}
                                        className="w-full md:w-auto px-8 py-4 rounded-xl bg-active text-white font-bold shadow-[0_8px_20px_rgba(145,178,195,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(145,178,195,0.5)] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
                                    >
                                        {isJoining ? "กำลังส่งคำขอ..." : showJoinBox ? "ยืนยันส่งคำขอ" : (userStatus === "CANCELED" ? "🚀 ขอเข้าร่วมทีมอีกครั้ง" : "🚀 ขอเข้าร่วมทีม")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}