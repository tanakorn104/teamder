'use client'

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IoMdArrowBack } from "react-icons/io";
import { MdNavigateNext, MdSchool, MdWork, MdEmojiEvents, MdAccessTime, MdPlayCircleOutline, MdCheckCircleOutline, MdRateReview } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import { BiCheck, BiX, BiTrash } from "react-icons/bi";

export default function ManageTeamDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const projectId = resolvedParams.id;

    const [project, setProject] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); 
    const [formData, setFormData] = useState<any>({});
    
    const [availableTags, setAvailableTags] = useState<any[]>([]);

    useEffect(() => {
        if (projectId) {
            fetchTeamData();
            fetchAvailableTags();
        }
    }, [projectId]);

    const fetchAvailableTags = async () => {
        try {
            const res = await fetch('/api/tags');
            if (res.ok) {
                const data = await res.json();
                setAvailableTags(data.tags || []);
            }
        } catch (error) { console.error("Failed to fetch tags", error); }
    };

    const fetchTeamData = async () => {
        try {
            const res = await fetch(`/api/myteam/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                
                if (data.project.deleted_at) {
                    alert("โปรเจกต์นี้ถูกลบไปแล้ว");
                    router.push('/myteam');
                    return;
                }

                setProject(data.project);
                setMembers(data.members); 
                setRequests(data.requests); 
                
                let parsedTags = [];
                try {
                    parsedTags = typeof data.project.tags === 'string' 
                        ? JSON.parse(data.project.tags) 
                        : (data.project.tags || []);
                } catch (e) {}
                
                setFormData({
                    title: data.project.title || "",
                    description: data.project.description || "",
                    status: data.project.status || "PLANNING",
                    is_recruiting: data.project.is_recruiting,
                    max_members: data.project.max_members || 5,
                    visibility_type: data.project.visibility_type || "Global",
                    env_type: data.project.env_type || "education",
                    subject_code: data.project.subject_code || "",
                    section: data.project.section || "",
                    tags: parsedTags 
                });
            } else {
                router.push('/myteam'); 
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const handleSelectTag = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value);
        if (!selectedId) return;

        const selectedTag = availableTags.find(t => t.id === selectedId);
        if (selectedTag && !(formData.tags || []).some((t: any) => t.id === selectedTag.id)) {
            setFormData({ ...formData, tags: [...(formData.tags || []), selectedTag] });
        }
        e.target.value = ""; 
    };

    const handleRemoveTag = (tagIdToRemove: number) => {
        setFormData({ ...formData, tags: (formData.tags || []).filter((t: any) => t.id !== tagIdToRemove) });
    };

    const handleUpdateProject = async () => {
        if (formData.visibility_type === "Subject" && !formData.subject_code) {
            alert("กรุณากรอกรหัสวิชาหากเลือก Scope เป็น Subject"); return;
        }
        setIsSaving(true);
        try {
            const payload = { ...formData, tag_ids: formData.tags.map((t: any) => t.id) };
            const res = await fetch(`/api/myteam/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_project', payload })
            });
            if (res.ok) alert("บันทึกข้อมูลโปรเจกต์สำเร็จ!");
            else alert("เกิดข้อผิดพลาดในการบันทึก");
        } catch (e) { alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"); }
        finally { setIsSaving(false); }
    };

    const handleDeleteProject = async () => {
        const confirmDelete = prompt("พิมพ์คำว่า 'DELETE' เพื่อยืนยันการลบโปรเจกต์นี้:");
        if (confirmDelete !== 'DELETE') {
            if (confirmDelete !== null) alert("พิมพ์ไม่ถูกต้อง ยกเลิกการลบ"); return;
        }
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/myteam/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_project' })
            });
            if (res.ok) { alert("ลบโปรเจกต์เรียบร้อยแล้ว"); router.push('/myteam'); } 
            else alert("ลบไม่สำเร็จ");
        } catch (e) { alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"); }
        finally { setIsDeleting(false); }
    };

    const handleRequestAction = async (action: 'approve_request' | 'reject_request', requestId: number, userId: number) => {
        const confirmMsg = action === 'approve_request' ? "รับผู้ใช้นี้เข้าทีม?" : "ปฏิเสธคำขอนี้?";
        if (!confirm(confirmMsg)) return;
        try {
            const res = await fetch(`/api/myteam/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload: { request_id: requestId, target_user_id: userId } })
            });
            if (res.ok) fetchTeamData(); 
        } catch (e) { alert("เกิดข้อผิดพลาด"); }
    };

    const handleKickMember = async (userId: number) => {
        const reason = prompt("กรุณาระบุเหตุผลที่ลบสมาชิกคนนี้ออกจากทีม:");
        if (reason === null) return;
        if (!reason.trim()) return alert("จำเป็นต้องระบุเหตุผลเพื่อความโปร่งใสครับ");

        try {
            const res = await fetch(`/api/myteam/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'kick_member', payload: { target_user_id: userId, reason } })
            });
            if (res.ok) fetchTeamData();
            else alert("ดำเนินการไม่สำเร็จ");
        } catch (e) { alert("เกิดข้อผิดพลาด"); }
    };

    const handleApproveLeave = async (userId: number) => {
        if (!confirm("ยืนยันการอนุมัติให้สมาชิกคนนี้ออกจากทีม?")) return;
        try {
            const res = await fetch(`/api/myteam/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve_leave', payload: { target_user_id: userId } })
            });
            if (res.ok) fetchTeamData();
        } catch (e) { alert("เกิดข้อผิดพลาด"); }
    };

    const handleRejectLeave = async (userId: number) => {
        if (!confirm("ปฏิเสธคำขอลาออก และให้สมาชิกท่านนี้อยู่ในทีมต่อไป?")) return;
        try {
            const res = await fetch(`/api/myteam/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject_leave', payload: { target_user_id: userId } })
            });
            if (res.ok) fetchTeamData();
            else alert("ดำเนินการไม่สำเร็จ");
        } catch (e) { alert("เกิดข้อผิดพลาด"); }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center text-gray-400 font-bold tracking-widest animate-pulse">LOADING DASHBOARD...</div>;
    if (!project) return null;

    const unselectedTags = availableTags.filter(at => !(formData.tags || []).some((ft: any) => ft.id === at.id));
    const isCompleted = formData.status === "COMPLETED"; // 🚀 ตัวแปรเช็คสถานะโปรเจกต์

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full font-sans text-foreground pb-24 pt-6 md:pt-10">
            <div className="w-full max-w-5xl px-6 md:px-8 flex flex-col gap-8">
                
                {/* Header Section */}
                <div className="flex flex-row items-center gap-4">
                    <button onClick={() => router.back()} className="flex justify-center items-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:bg-gray-50 transition-all">
                        <IoMdArrowBack className="text-xl" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manage Team</h1>
                        <p className="text-sm text-gray-500">โครงการ: {project.title}</p>
                    </div>
                </div>

                {isCompleted && (
                    <div className="w-full bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center justify-center gap-2 text-green-700 font-bold animate-in fade-in">
                        <MdCheckCircleOutline className="text-xl" /> 
                        โครงการนี้เสร็จสิ้นแล้ว ไม่สามารถแก้ไขข้อมูลหรือรับสมาชิกเพิ่มได้ แต่สามารถเข้าประเมินผลการทำงานของเพื่อนร่วมทีมได้
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Project Settings */}
                    <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-6">
                        <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2">⚙️ Project Settings</h2>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project Title</label>
                            <input 
                                disabled={isCompleted}
                                type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visibility Scope</label>
                                <select 
                                    disabled={isCompleted}
                                    value={formData.visibility_type} onChange={(e) => setFormData({...formData, visibility_type: e.target.value})}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="Global">Global (Everyone)</option>
                                    <option value="University">University Only</option>
                                    <option value="Subject">Specific Subject</option>
                                </select>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project Category</label>
                                <select 
                                    disabled={isCompleted}
                                    value={formData.env_type} onChange={(e) => setFormData({...formData, env_type: e.target.value})}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="education">🎓 Education</option>
                                    <option value="professional">💼 Professional</option>
                                    <option value="competition">🏆 Competition</option>
                                </select>
                            </div>
                        </div>

                        {formData.visibility_type === "Subject" && (
                            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-blue-600 uppercase">Subject Code</label>
                                    <input 
                                        disabled={isCompleted}
                                        type="text" value={formData.subject_code} onChange={(e) => setFormData({...formData, subject_code: e.target.value})}
                                        className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="e.g. 01204XXX"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-blue-600 uppercase">Section</label>
                                    <input 
                                        disabled={isCompleted}
                                        type="text" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})}
                                        className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="e.g. 700"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                            <textarea 
                                disabled={isCompleted}
                                rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="flex flex-col gap-3 bg-gray-50/50 border border-gray-100 p-5 rounded-3xl">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Tags</label>
                            <div className="flex flex-wrap gap-2 min-h-[40px]">
                                {(formData.tags || []).map((tag: any) => (
                                    <span key={tag.id} className="bg-white text-cyan-600 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-cyan-100 shadow-sm">
                                        #{tag.tag_name}
                                        {!isCompleted && <BiX className="cursor-pointer hover:text-red-500 text-lg" onClick={() => handleRemoveTag(tag.id)} />}
                                    </span>
                                ))}
                            </div>
                            {!isCompleted && (
                                <select 
                                    onChange={handleSelectTag}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:border-cyan-400"
                                >
                                    <option value="">+ เพิ่มแท็กที่เกี่ยวข้อง</option>
                                    {unselectedTags.map(tag => (
                                        <option key={tag.id} value={tag.id}>{tag.tag_name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Members</label>
                                <input 
                                    disabled={isCompleted}
                                    type="number" min="1" value={formData.max_members} onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project Status</label>
                                <select 
                                    disabled={isCompleted}
                                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="PLANNING">Planning</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100">
                            <input 
                                disabled={isCompleted}
                                type="checkbox" id="recruiting" checked={!!formData.is_recruiting} 
                                onChange={(e) => setFormData({...formData, is_recruiting: e.target.checked ? 1 : 0})}
                                className="w-6 h-6 accent-cyan-600 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                            />
                            <label htmlFor="recruiting" className={`font-bold select-none ${isCompleted ? 'text-gray-400' : 'text-cyan-800 cursor-pointer'}`}>
                                กำลังเปิดรับสมัครสมาชิกเพิ่ม (Recruiting Mode)
                            </label>
                        </div>

                        {/* ซ่อนปุ่มถ้าสถานะเป็น Completed แล้ว */}
                        {!isCompleted && (
                            <>
                                <button 
                                    onClick={handleUpdateProject} disabled={isSaving}
                                    className="w-full py-4.5 bg-cyan-600 text-white font-bold rounded-2xl shadow-lg hover:bg-cyan-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {isSaving ? "กำลังบันทึก..." : "Update Project Detail"}
                                </button>

                                <div className="mt-6 border-t border-red-50 pt-6">
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Danger Zone</p>
                                    <button 
                                        onClick={handleDeleteProject} disabled={isDeleting}
                                        className="w-full py-4 border-2 border-dashed border-red-100 text-red-400 font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all"
                                    >
                                        {isDeleting ? "Deleting..." : "🗑️ Delete this project"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Requests & Members */}
                    <div className="flex flex-col gap-8">
                        
                        {/* ซ่อนคำขอเข้าทีมถ้าสถานะเป็น Completed */}
                        {!isCompleted && (
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-amber-100 flex flex-col gap-4">
                                <h2 className="text-md font-bold text-amber-600 flex items-center justify-between">
                                    <span className="flex items-center gap-2">🔔 Join Requests</span>
                                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>
                                </h2>
                                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {requests.length === 0 ? (
                                        <div className="py-10 text-center flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 text-xl">📭</div>
                                            <p className="text-xs text-gray-400 italic">No pending requests</p>
                                        </div>
                                    ) : (
                                        requests.map(req => (
                                            <div key={`req-${req.user_id}`} className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-full overflow-hidden border border-amber-200 shrink-0">
                                                        {req.profile_image ? <Image src={req.profile_image} alt="" width={40} height={40} className="object-cover h-full w-full"/> : <IoPersonOutline className="text-gray-300 text-lg m-auto h-full"/>}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="font-bold text-sm text-gray-800 truncate hover:underline cursor-pointer" onClick={() => router.push(`/profile/${req.user_id}`)}>{req.full_name}</p>
                                                        <p className="text-[10px] text-gray-500">{req.primary_role || "Interested Member"}</p>
                                                    </div>
                                                </div>
                                                {req.request_message && (
                                                    <div className="text-[11px] text-amber-800 bg-white/60 p-2.5 rounded-xl border border-amber-100 italic">
                                                        "{req.request_message}"
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRequestAction('approve_request', req.request_id, req.user_id)} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-colors shadow-sm">Accept</button>
                                                    <button onClick={() => handleRequestAction('reject_request', req.request_id, req.user_id)} className="flex-1 bg-white text-red-500 border border-red-100 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">Reject</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Current Members Section */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                            <h2 className="text-md font-bold text-gray-800 flex items-center justify-between">
                                <span className="flex items-center gap-2">👥 Members</span>
                                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{members.length}/{project.max_members}</span>
                            </h2>
                            <div className="flex flex-col gap-3">
                                {members.map(member => (
                                    <div 
                                        key={`mem-${member.user_id}`} 
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${member.member_status === 'LEAVE_PENDING' && !isCompleted ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                            <div className="w-10 h-10 bg-white rounded-full overflow-hidden border border-gray-200 shrink-0 cursor-pointer" onClick={() => router.push(`/profile/${member.user_id}`)}>
                                                {member.profile_image ? <Image src={member.profile_image} alt="" width={40} height={40} className="object-cover h-full w-full"/> : <IoPersonOutline className="text-gray-300 text-lg m-auto h-full"/>}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold text-sm text-gray-800 truncate">
                                                    {member.full_name}
                                                    {project.owner_id_ref === member.user_id && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1 uppercase">Owner</span>}
                                                </p>
                                                {member.member_status === 'LEAVE_PENDING' && !isCompleted ? (
                                                    <p className="text-[10px] text-orange-600 font-medium italic animate-pulse">ขอลาออก: "{member.status_reason}"</p>
                                                ) : (
                                                    <p className="text-[10px] text-gray-500 truncate">{member.primary_role || "Member"}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* 🚀 ควบคุมการแสดงผลปุ่ม Action ของสมาชิก */}
                                        <div className="pl-2 flex items-center gap-2">
                                            {isCompleted ? (
                                                // ถ้าโปรเจกต์ COMPLETED แล้ว ให้แสดงปุ่มประเมิน (เว้นตัวเอง)
                                                project.owner_id_ref !== member.user_id && (
                                                    <button 
                                                        onClick={() => router.push(`/evaluate/${projectId}/${member.user_id}`)}
                                                        className="flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                                    >
                                                        <MdRateReview className="text-sm"/> Evaluate
                                                    </button>
                                                )
                                            ) : (
                                                // ถ้ายังไม่ COMPLETED ให้แสดงปุ่ม อนุมัติ/เตะ เหมือนเดิม
                                                member.member_status === 'LEAVE_PENDING' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleApproveLeave(member.user_id)}
                                                            className="bg-orange-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-md hover:bg-orange-600 active:scale-95"
                                                        >
                                                            อนุมัติ
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRejectLeave(member.user_id)}
                                                            className="w-9 h-9 flex justify-center items-center bg-white border border-orange-200 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                                            title="ปฏิเสธคำขอลาออก"
                                                        >
                                                            <BiX className="text-xl" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    project.owner_id_ref !== member.user_id && (
                                                        <button 
                                                            onClick={() => handleKickMember(member.user_id)}
                                                            className="w-9 h-9 flex justify-center items-center bg-white text-red-300 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all group"
                                                            title="Kick Member"
                                                        >
                                                            <BiTrash className="text-lg group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    )
                                                )
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}