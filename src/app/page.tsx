'use client'
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);
import { ImFilesEmpty } from "react-icons/im";
import { PiMagicWandThin } from "react-icons/pi";
import { CiSearch } from "react-icons/ci";
import { MdNavigateNext } from "react-icons/md";
import { HiRefresh } from "react-icons/hi";
import { BsStars } from "react-icons/bs";

import { stringToColor } from "@/lib/utils";

export default function Home() {
  const personal_data = {
    'Eating': 28,
    'Drinking': 48,
    'Sleeping': 40,
    'Designing': 19,
    'Coding': 96,
    'Cycling': 27,
    'Running': 100
  }

  const data = {
    labels: Object.keys(personal_data),
    datasets: [{
      label: 'My Score',
      data: Object.values(personal_data),
      fill: true,
      backgroundColor: 'rgba(165, 243, 252, 0.4)',
      borderColor: 'rgb(34, 211, 238)',
      pointBackgroundColor: 'rgb(34, 211, 238)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(34, 211, 238)',
      borderWidth: 2,
    }]
  };
  
  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      r: {
        angleLines: { display: true, color: '#f3f4f6' },
        grid: { color: '#f3f4f6' },
        pointLabels: { font: { size: 10 }, color: '#6b7280' },
        ticks: { display: false, max: 100, min: 0 }
      }
    }
  };

  const groups = ["Global", "University", "Subject"];

  const projectsData = [
    {
      "id": 1,
      "group": "Global",
      "name": "Al Chatbot for mistery",
      "description": "ต้องการถามแชทจีพีทีว่าทำยังไงถึงจะจีบผีตานีได้ ต้องการทฤษฎีบทนี้ครับ ใครสนใจลองกดมาได้ ",
      "compatible": 94,
      "tag": ["Research", "Creative", "Mystery"],
      "members": "3/5"
    },
    {
      "id": 2,
      "group": "Global",
      "name": "malatang  Campus research",
      "description": "ทำไมบริเวณร้านหม่าล่าถึงไม่มีหมาเลยคะ",
      "compatible": 82,
      "tag": ["Research", "Creative", "business", "Food"],
      "members": "2/5"
    },
    {
      "id": 3,
      "group": "Global",
      "name": "Study Group Finder",
      "description": "หาตี้อ่านหนังสือครับ อ่าน allday allnight มีนัดไปกินหมูกระทะ สี่ทุ่มถ้าร้านไม่ปิดครับ",
      "compatible": 70,
      "tag": ["Research", "Creative"],
      "members": "4/5"
    },
    {
      "id": 4,
      "group": "University",
      "name": "Environment  research",
      "description": "ทำวิจัยอะไรก็ได้เกี่ยวกับสิ่งแวดล้อมค่า",
      "compatible": 87,
      "tag": ["Research", "Environment", "Science"],
      "members": "1/3"
    },
    {
      "id": 5,
      "group": "University",
      "name": "ไปแข่งงานมหาลัย คณะวิทย์",
      "description": "ฟอร์มทีมรอประกาศธีมงานครับ ",
      "compatible": 76,
      "tag": ["Research", "Creative", "Innovation", "business"],
      "members": "1/3"
    },
    {
      "id": 6,
      "group": "University",
      "name": "Chem is try",
      "description": "เอกเคมี ใครสะดวกมาช่วยสอนหน่อยจ้า จะตายแล่ว ติวออนไลน์คับ แต่ถ้าสะดวกเจอก็ค่อยว่ากัน ",
      "compatible": 76,
      "tag": ["Tutor", "Chemistry", "Study"],
      "members": "1/3"
    },
    {
      "id": 7,
      "group": "Subject",
      "filter": { "subject_code": "02204281", "sec": 712 },
      "name": "กลุ่มพระเจ้าเอกาทศรถ",
      "description": "มาเรียนคนเดียว หากลุ่มอยู่ด้วยครับ",
      "compatible": 87,
      "tag": ["Study"],
      "members": "1/3"
    },
    {
      "id": 8,
      "group": "Subject",
      "filter": { "subject_code": "02717112", "sec": 700 },
      "name": "กลุ่มพระเจ้าเสือ",
      "description": "มาเรียนคนเดียว หากลุ่มอยู่ด้วยครับ",
      "compatible": 87,
      "tag": ["Study", "Creative"],
      "members": "1/3"
    }
  ];
  
  const [group, setGroup] = useState(groups[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    let filtered = projectsData.filter((item) => item.group === group);
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tag.some((t: string) => t.toLowerCase().includes(lowerQuery))
      );
    }
    const sorted = [...filtered].sort((a, b) => b.compatible - a.compatible);
    setProjects(sorted);
  }, [group, searchQuery]);

  return (
    <div className="min-h-screen bg-background flex justify-center w-full font-sans text-foreground">
      <div className="w-full max-w-[1300px] px-6 md:px-10 py-12 flex flex-col gap-8 md:gap-10">

        {/* --- Top Section: Grid Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-x-10 w-full">
          <div className="order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1 flex flex-col justify-end lg:pb-4">
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight tracking-tight">
              Hello, Mr. Beemo<br/>Nikifovrolf
            </h1>
          </div>

          <div className="order-2 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8">
            <div className="w-full sm:w-1/2 flex flex-col gap-4">
              <div className="flex flex-row items-center gap-2 mb-2 text-gray-500">
                  <BsStars className="text-lg" />
                  <p className="text-sm font-medium">Your Personality Profile</p>
              </div>
              <div className="flex flex-col gap-3 text-xs md:text-sm text-gray-500 font-medium">
                {Object.keys(personal_data).map((item) => (
                  <div key={item} className="flex flex-row justify-between items-center w-full pr-4">
                    <p>{item}</p>
                    <p className="text-gray-300">{personal_data[item as keyof typeof personal_data]} %</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-1/2 flex justify-center items-center h-56 md:h-64">
                <Radar data={data} options={options} />
            </div>
          </div>

          <div className="order-3 lg:col-span-5 lg:col-start-1 lg:row-start-2 flex items-start">
            <div className="flex flex-row gap-3 w-full pb-2 hide-scroll">
              {groups.map(item => (
                <button 
                  key={item} 
                  onClick={() => { setGroup(item); setSearchQuery(""); }} 
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    item === group 
                      ? "bg-active text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Middle Section: Search Bar --- */}
        <div className="w-full bg-gray-50 rounded-full h-14 md:h-16 flex items-center px-6 gap-4 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all shadow-inner mt-2">
          <CiSearch className="text-2xl text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-full w-full bg-transparent outline-none text-base text-gray-600 placeholder:text-gray-400" 
            placeholder="Search projects" 
          />
        </div>

        {/* --- Bottom Section: Projects Grid --- */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-row justify-between items-end px-2">
            <h2 className="text-xl font-bold">Explore Projects</h2>
            <div className="bg-badge text-badge-content px-4 py-1.5 rounded-full text-xs font-bold">
              {projects.length} open
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="w-full flex justify-center items-center py-20 text-gray-400 flex-col gap-3">
              <ImFilesEmpty className="text-5xl opacity-30" />
              <p>{searchQuery ? "No projects found" : "Sorry, no projects for you right now"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {projects.map((item) => (
                <div key={item.id} className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col h-full hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-bold text-base leading-tight flex-1">{item.name}</h3>
                    <div className="flex items-center gap-1 bg-score text-score-content px-3 py-1 rounded-full text-sm font-bold shrink-0">
                      <BsStars />
                      {item.compatible}%
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 mb-4 grow">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {item.tag.map((tagi: string) => {
                      // เรียกใช้ฟังก์ชันเพื่อให้ได้ Object ที่มี .bg, .text, .border ทันที
                      const tagTheme = stringToColor(tagi);
                      
                      return (
                        <span 
                          key={tagi} 
                          // ดึงค่ามาลง Inline Style ให้สวยงามและอ่านง่าย
                          style={{ 
                            backgroundColor: tagTheme.bg,
                            color: tagTheme.text,
                            borderColor: tagTheme.border 
                          }}
                          className="px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm"
                        >
                          #{tagi}
                        </span>
                      );
                    })}
                  </div>

                  <hr className="border-gray-100 mb-4" />

                  <div className="flex justify-between items-center text-xs font-medium text-gray-400">
                    <p>{item.members.split("/")[1]} Members needed ({item.members})</p>
                    <MdNavigateNext className="text-xl text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}