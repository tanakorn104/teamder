'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImFilesEmpty } from "react-icons/im";
import { BsStars } from "react-icons/bs";
import { MdNavigateNext, MdSchool, MdWork, MdEmojiEvents, MdAccessTime, MdPlayCircleOutline, MdCheckCircleOutline, MdRateReview } from "react-icons/md";
import { stringToColor } from "@/lib/utils";

interface UserProfile { id: number; email: string; full_name: string; primary_role: string; picture: string | null; }

export default function MyTeam() {
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [ownedProjects, setOwnedProjects] = useState<any[]>([]);
    const [joinedProjects, setJoinedProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initUser = async () => {
            try {
                const meRes = await fetch('/api/auth/me');
                if (!meRes.ok) throw new Error("Not logged in");
                const meData = await meRes.json();
                if (meData.user?.id) setCurrentUser(meData.user);
            } catch (error) {
                console.error("Auth error:", error);
                router.push('/login'); 
            }
        };
        initUser();
    }, [router]);

    useEffect(() => {
        const fetchMyTeams = async () => {
            if (!currentUser?.id) return;
            try {
                const res = await fetch(`/api/myteam?userId=${currentUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOwnedProjects(data.ownedProjects || []);
                    setJoinedProjects(data.joinedProjects || []);
                }
            } catch (error) {
                console.error("Failed to fetch my teams", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyTeams();
    }, [currentUser]);

    // 🚀 แยกโปรเจกต์ที่ยังไม่เสร็จ (Active) กับที่เสร็จแล้ว (Completed)
    const activeOwned = ownedProjects.filter(p => p.status !== 'COMPLETED');
    const completedOwned = ownedProjects.filter(p => p.status === 'COMPLETED');
    const activeJoined = joinedProjects.filter(p => p.status !== 'COMPLETED');
    const completedJoined = joinedProjects.filter(p => p.status === 'COMPLETED');

    const getEnvBadge = (env_type: string) => {
        switch(env_type) {
            case 'education': return <span className="flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-[10px] font-bold"><MdSchool/> Education</span>;
            case 'professional': return <span className="flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-100 px-2 py-1 rounded text-[10px] font-bold"><MdWork/> Professional</span>;
            case 'competition': return <span className="flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded text-[10px] font-bold"><MdEmojiEvents/> Competition</span>;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'PLANNING': return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-[10px] font-bold"><MdAccessTime/> Planning</span>;
            case 'IN_PROGRESS': return <span className="flex items-center gap-1 text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md text-[10px] font-bold"><MdPlayCircleOutline/> In Progress</span>;
            case 'COMPLETED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-[10px] font-bold"><MdCheckCircleOutline/> Completed</span>;
            default: return null;
        }
    };

    const ProjectCard = ({ item, isOwner }: { item: any, isOwner: boolean }) => (
        <div 
            onClick={() => isOwner ? router.push(`/myteam/${item.id}`) : router.push(`/project/${item.id}`)}
            className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 relative overflow-hidden"
        >
            <div className="flex flex-wrap gap-2 mb-3">
                {item.env_type && item.group !== 'Subject' && getEnvBadge(item.env_type)}
                {item.group === 'Subject' && item.subject_code && (
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                        <MdSchool /> {item.subject_code} {item.section ? `(Sec ${item.section})` : ''}
                    </span>
                )}
            </div>

            {isOwner && (item.pending_join_count > 0 || item.pending_leave_count > 0) && item.status !== 'COMPLETED' && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {item.pending_join_count > 0 && (
                        <span className="bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse shadow-sm">
                            🔔 {item.pending_join_count} คำขอเข้าทีม
                        </span>
                    )}
                    {item.pending_leave_count > 0 && (
                        <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse shadow-sm">
                            ⚠️ {item.pending_leave_count} ขอออกจากทีม
                        </span>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="font-bold text-base leading-tight flex-1 group-hover:text-cyan-600 transition-colors">{item.name}</h3>
                <div className="flex items-center gap-1 bg-score text-score-content px-3 py-1 rounded-full text-sm font-bold shrink-0">
                    <BsStars /> {item.compatible}%
                </div>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2 mb-4 grow">{item.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
                {item.tag.map((tagi: string) => {
                    const tagTheme = stringToColor(tagi);
                    return (
                        <span key={tagi} style={{ backgroundColor: tagTheme.bg, color: tagTheme.text, borderColor: tagTheme.border }} className="px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm">
                            #{tagi}
                        </span>
                    );
                })}
            </div>

            <hr className="border-gray-100 mb-3" />

            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    {item.status && getStatusBadge(item.status)}
                    {item.status !== 'COMPLETED' && (
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold ${item.is_recruiting ? 'text-green-500' : 'text-red-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${item.is_recruiting ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                            {item.is_recruiting ? 'Recruiting' : 'Closed'}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-gray-400 mt-1">
                    <p className="flex items-center gap-1">
                        <span className="font-bold text-gray-600">{item.members.split("/")[0]}</span> 
                        Enrolled / Need {item.members.split("/")[1]}
                    </p>
                    
                    {/* 🚀 ถ้าโปรเจกต์ Complete ให้เปลี่ยนข้อความเป็นปุ่มประเมิน หรือแสดงสถานะประเมิน */}
                    <div className={`flex items-center gap-1 font-bold transition-colors ${item.status === 'COMPLETED' ? 'text-green-600 hover:text-green-700' : 'text-cyan-500 hover:text-cyan-600'}`}>
                        {item.status === 'COMPLETED' ? (
                            <span className="flex items-center gap-1"><MdRateReview className="text-lg"/> Evaluate Team</span>
                        ) : (
                            isOwner ? "Manage Team" : "View Details"
                        )} 
                        <MdNavigateNext className="text-xl" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading My Teams...</div>;

    return (
        <div className="min-h-screen bg-background flex justify-center w-full font-sans text-foreground pb-20">
            <div className="w-full max-w-[1300px] px-6 md:px-10 py-12 flex flex-col gap-12">
                
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">My Teams</h1>
                    <p className="text-gray-500 font-medium">จัดการโครงการที่คุณเป็นเจ้าของ และโครงการที่คุณเข้าร่วม</p>
                </div>

                {/* --- ส่วนที่ 1: โปรเจกต์ที่กำลังดำเนินการ (Active) --- */}
                <div className="space-y-12">
                    {/* Owned Active */}
                    <div className="flex flex-col gap-6 w-full">
                        <div className="flex items-end gap-3 px-2 border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">👑 Projects I Created</h2>
                            <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                {activeOwned.length} Active
                            </span>
                        </div>
                        {activeOwned.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-sm">ไม่มีโครงการที่กำลังดำเนินการ</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {activeOwned.map(item => <ProjectCard key={item.id} item={item} isOwner={true} />)}
                            </div>
                        )}
                    </div>

                    {/* Joined Active */}
                    <div className="flex flex-col gap-6 w-full">
                        <div className="flex items-end gap-3 px-2 border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">👥 Projects I Joined</h2>
                            <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                {activeJoined.length} Active
                            </span>
                        </div>
                        {activeJoined.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-sm">ยังไม่ได้เข้าร่วมโครงการที่กำลังดำเนินการ</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {activeJoined.map(item => <ProjectCard key={item.id} item={item} isOwner={false} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- ส่วนที่ 2: โปรเจกต์ที่เสร็จสิ้นแล้ว (Completed / Evaluation Zone) --- */}
                {(completedOwned.length > 0 || completedJoined.length > 0) && (
                    <div className="mt-8 pt-12 border-t-4 border-double border-gray-200">
                        <div className="flex flex-col gap-2 mb-8 text-center md:text-left">
                            <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-3">
                                <span className="text-4xl">🏁</span> COMPLETED PROJECTS
                            </h2>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">คุณสามารถเข้าประเมินเพื่อนร่วมทีมได้ในส่วนนี้</p>
                        </div>

                        <div className="space-y-12 bg-gray-50/30 p-4 md:p-8 rounded-[40px] border-2 border-gray-100">
                            {/* Owned Completed */}
                            {completedOwned.length > 0 && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-lg font-black text-amber-700 px-4 py-1 bg-amber-100 w-fit rounded-lg">MY OWN PROJECTS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {completedOwned.map(item => <ProjectCard key={item.id} item={item} isOwner={true} />)}
                                    </div>
                                </div>
                            )}

                            {/* Joined Completed */}
                            {completedJoined.length > 0 && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-lg font-black text-green-700 px-4 py-1 bg-green-100 w-fit rounded-lg">PROJECTS I JOINED</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {completedJoined.map(item => <ProjectCard key={item.id} item={item} isOwner={false} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}