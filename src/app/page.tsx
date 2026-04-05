'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // 🚀 เพิ่ม useRouter
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

import { ImFilesEmpty } from "react-icons/im";
import { CiSearch } from "react-icons/ci";
import { BsStars } from "react-icons/bs";
import { HiRefresh } from "react-icons/hi";
import { 
  MdNavigateNext, MdSchool, MdWork, MdEmojiEvents, 
  MdAccessTime, MdPlayCircleOutline, MdCheckCircleOutline 
} from "react-icons/md";
import { stringToColor } from "@/lib/utils";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  primary_role: string;
  picture: string | null;
}

export default function Home() {
  const router = useRouter(); // 🚀 เรียกใช้งาน router

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [personalData, setPersonalData] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [userInstName, setUserInstName] = useState<string>("");

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false); 
  
  const groups = ["Global", "University", "Subject"];
  const [group, setGroup] = useState(groups[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [section, setSection] = useState("");
  
  const [envFilter, setEnvFilter] = useState("all");
  
  const envTypes = [
    { id: "all", label: "Any Type", icon: "✨" },
    { id: "education", label: "Education", icon: "🎓" },
    { id: "professional", label: "Professional", icon: "💼" },
    { id: "competition", label: "Competition", icon: "🏆" },
  ];

  useEffect(() => {
    const initUser = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) throw new Error("Not logged in");
        const meData = await meRes.json();
        if (meData.user?.id) setCurrentUser(meData.user);
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initUser();
  }, []);

  const fetchProjects = async (paramsObj: {
    currentOffset: number, 
    isNewSearch?: boolean,
    overrideGroup?: string,
    overrideQ?: string,
    overrideSubCode?: string,
    overrideSec?: string,
    overrideEnv?: string
  }) => {
    if (!currentUser?.id) return;
    setIsFetching(true);

    try {
      const currentGroup = paramsObj.overrideGroup ?? group;
      const currentQ = paramsObj.overrideQ ?? searchQuery;
      const currentSubCode = paramsObj.overrideSubCode ?? subjectCode;
      const currentSec = paramsObj.overrideSec ?? section;
      const currentEnv = currentGroup === "Subject" ? "all" : (paramsObj.overrideEnv ?? envFilter);

      const params = new URLSearchParams({
        userId: currentUser.id.toString(),
        offset: paramsObj.currentOffset.toString(),
        group: currentGroup,
        q: currentQ,
        subjectCode: currentSubCode,
        section: currentSec,
        envType: currentEnv
      });

      const res = await fetch(`/api/home?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (paramsObj.isNewSearch) {
          if (data.personal_data && Object.keys(data.personal_data).length > 0) {
            setPersonalData(data.personal_data);
          }
          if (data.userInstName) {
            setUserInstName(data.userInstName);
          }
          setProjects(data.projectsData || []);
        } else {
          setProjects(prev => [...prev, ...(data.projectsData || [])]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchProjects({ currentOffset: 0, isNewSearch: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); 

  const handleTabChange = (newGroup: string) => {
    setGroup(newGroup);
    setSearchQuery("");
    setSubjectCode("");
    setSection("");
    setEnvFilter("all"); 
    setOffset(0);
    fetchProjects({ currentOffset: 0, isNewSearch: true, overrideGroup: newGroup, overrideQ: "", overrideSubCode: "", overrideSec: "", overrideEnv: "all" });
  };

  const handleEnvChange = (newEnv: string) => {
    setEnvFilter(newEnv);
    setOffset(0);
    fetchProjects({ currentOffset: 0, isNewSearch: true, overrideEnv: newEnv });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchProjects({ currentOffset: 0, isNewSearch: true });
  };

  const handleLoadMore = () => {
    const nextOffset = offset + 6;
    setOffset(nextOffset);
    fetchProjects({ currentOffset: nextOffset, isNewSearch: false });
  };

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
      case 'COMPLETED': return <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-[10px] font-bold"><MdCheckCircleOutline/> Completed</span>;
      default: return null;
    }
  };

  const radarData = {
    labels: Object.keys(personalData),
    datasets: [{
      label: 'My Score',
      data: Object.values(personalData),
      fill: true,
      backgroundColor: 'rgba(165, 243, 252, 0.4)',
      borderColor: 'rgb(34, 211, 238)',
      pointBackgroundColor: 'rgb(34, 211, 238)',
      pointBorderColor: '#fff',
      borderWidth: 2,
    }]
  };
  const options = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { ticks: { display: false, max: 100, min: 0 } } } };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-background flex justify-center w-full font-sans text-foreground pb-20">
      <div className="w-full max-w-[1300px] px-6 md:px-10 py-12 flex flex-col gap-8 md:gap-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-x-10 w-full">
          <div className="order-1 lg:col-span-5 flex flex-col justify-end lg:pb-4 gap-4">
            {currentUser?.picture && (
              <img src={currentUser.picture} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-sm object-cover border-2 border-white"/>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight tracking-tight">
                Hello, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
                  {currentUser?.full_name?.split(' ')[0] || 'User'}
                </span>
              </h1>
              <p className="text-gray-500 font-medium mt-2">{currentUser?.primary_role}</p>
            </div>
          </div>

          <div className="order-2 lg:col-span-7 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8">
            <div className="w-full sm:w-1/2 flex flex-col gap-4">
              <div className="flex flex-row items-center gap-2 mb-2 text-gray-500">
                  <BsStars className="text-lg" />
                  <p className="text-sm font-medium">Your Personality Profile</p>
              </div>
              <div className="flex flex-col gap-3 text-xs md:text-sm text-gray-500 font-medium">
                {Object.keys(personalData).map((item) => (
                  <div key={item} className="flex flex-row justify-between w-full pr-4">
                    <p>{item}</p>
                    <p className="text-gray-400">{personalData[item]} %</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full sm:w-1/2 flex justify-center items-center h-56 md:h-64">
                {Object.keys(personalData).length > 0 ? <Radar data={radarData} options={options} /> : <p className="text-xs text-gray-300">No AI Profile Data</p>}
            </div>
          </div>

          <div className="order-3 lg:col-span-5 flex items-start">
            <div className="flex flex-row gap-3 w-full pb-2 hide-scroll">
              {groups.map(item => (
                <button 
                  key={item} 
                  onClick={() => handleTabChange(item)} 
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    item === group ? "bg-active text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full mt-2">
          
          <form onSubmit={handleSearch} className="w-full flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-gray-50 rounded-full h-14 flex items-center px-6 gap-4 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all shadow-inner">
              <CiSearch className="text-2xl text-gray-400" />
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full w-full bg-transparent outline-none text-base text-gray-600 placeholder:text-gray-400" 
                placeholder="Search by keywords or tags... (Press Enter)" 
              />
            </div>

            {group === "Subject" && (
              <div className="flex gap-4 w-full md:w-auto">
                <input 
                  type="text" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}
                  className="h-14 w-full md:w-40 bg-gray-50 rounded-full px-6 outline-none text-base text-gray-600 placeholder:text-gray-400 border border-transparent focus:border-gray-200 focus:bg-white shadow-inner"
                  placeholder="Code (e.g. 022)"
                />
                <input 
                  type="text" value={section} onChange={(e) => setSection(e.target.value)}
                  className="h-14 w-full md:w-32 bg-gray-50 rounded-full px-6 outline-none text-base text-gray-600 placeholder:text-gray-400 border border-transparent focus:border-gray-200 focus:bg-white shadow-inner"
                  placeholder="Sec (e.g. 712)"
                />
              </div>
            )}
            
            <button type="submit" disabled={isFetching} className="h-14 px-8 rounded-full bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors shadow-sm disabled:opacity-50">
              {isFetching && offset === 0 ? "Searching..." : "Search"}
            </button>
          </form>

          {group !== "Subject" && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wider">Project Type:</span>
              {envTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleEnvChange(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    envFilter === type.id 
                      ? "bg-white border-cyan-500 text-cyan-600 shadow-sm" 
                      : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          )}

        </div>

        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end px-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-bold">Explore Projects</h2>
              {group === "University" && userInstName && (
                <span className="flex items-center w-fit gap-1.5 text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100 mt-1">
                  <MdSchool className="text-base" /> {userInstName}
                </span>
              )}
            </div>
          </div>

          {projects.length === 0 && !isFetching ? (
            <div className="w-full flex justify-center items-center py-20 text-gray-400 flex-col gap-3 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <ImFilesEmpty className="text-6xl text-gray-300 mb-2" />
              <p className="text-xl font-bold text-gray-500">ไม่พบโครงการที่ตรงกับเงื่อนไขค้นหา</p>
              <p className="text-sm">ลองเปลี่ยนคำค้นหา หรือกดเคลียร์ตัวกรองประเภทโครงการดูนะครับ</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {projects.map((item) => (
                  // 🚀 เพิ่ม onClick และปรับ className เพื่อให้กดได้และมีลูกเล่น hover
                  <div 
                    key={item.id} 
                    onClick={() => router.push(`/project/${item.id}`)}
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

                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-bold text-base leading-tight flex-1 group-hover:text-cyan-600 transition-colors">{item.name}</h3>
                      <div className="flex items-center gap-1 bg-score text-score-content px-3 py-1 rounded-full text-sm font-bold shrink-0">
                        <BsStars />
                        {item.compatible}%
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
                        
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold ${item.is_recruiting ? 'text-green-500' : 'text-red-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.is_recruiting ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                          {item.is_recruiting ? 'Recruiting' : 'Closed'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-medium text-gray-400 mt-1">
                        <p className="flex items-center gap-1">
                           <span className="font-bold text-gray-600">{item.members.split("/")[0]}</span> 
                           Enrolled / Need {item.members.split("/")[1]}
                        </p>
                        <div className="flex items-center gap-1 text-cyan-500 font-bold hover:text-cyan-600 transition-colors">
                          View Details <MdNavigateNext className="text-xl" />
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="w-full flex justify-center mt-6 ">
                  <button 
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isFetching && offset > 0 ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <HiRefresh className="text-lg" />
                    )}
                    {isFetching && offset > 0 ? "กำลังโหลด..." : "โหลดโครงการเพิ่มเติม"}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}