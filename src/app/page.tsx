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



import { v4 as uuidv4 } from 'uuid';





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
      label: 'My Second Dataset',
      data: Object.values(personal_data),
      fill: true,
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgb(54, 162, 235)',
      pointBackgroundColor: 'rgb(54, 162, 235)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(54, 162, 235)'
    }]
  };
  const config = {
    type: 'radar',
    data: data,
    options: {
      elements: {
        line: {
          borderWidth: 3
        }
      }
    },
  };
  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // กำหนดเป็น false เพื่อซ่อน Legend
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
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
      "tag": ["Research", "Creative"],
      "members": "3/5"
    },
    {
      "id": 2,
      "group": "Global",
      "name": "malatang  Campus research",
      "description": "ทำไมบริเวณร้านหม่าล่าถึงไม่มีหมาเลยคะ",
      "compatible": 82,
      "tag": ["Research", "Creative", "business"],
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
      "tag": ["Research", "Creative"],
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
      "tag": ["Research", "Creative", "Innovation", "business"],
      "members": "1/3"
    },
    {
      "id": 7,
      "group": "Subject",
      "filter": {
        "subject_code": "02204281",
        "sec": 712
      },
      "name": "กลุ่มพระเจ้าเอกาทศรถ",
      "description": "มาเรียนคนเดียว หากลุ่มอยู่ด้วยครับ",
      "compatible": 87,
      "tag": ["Study"],
      "members": "1/3"
    },
    {
      "id": 7,
      "group": "Subject",
      "filter": {
        "subject_code": "02717112",
        "sec": 700
      },
      "name": "กลุ่มพระเจ้าเสือ",
      "description": "มาเรียนคนเดียว หากลุ่มอยู่ด้วยครับ",
      "compatible": 87,
      "tag": ["Study", "Creative"],
      "members": "1/3"
    }


  ]
  const [group, SetGroup] = useState("");
  const [projects, setProjects] = useState<any[]>([]); // กำหนดค่าเริ่มต้นเป็น Array ว่าง
  
  function fetchData(group: string) {
    // 1. Filter ข้อมูลออกมาก่อน
    const filtered = projectsData.filter((item) => item.group === group);

    // 2. Sort ข้อมูลจากตัวแปรที่ filter มาแล้ว (ใช้ Spread Operator เพื่อไม่ให้กระทบ Data ต้นฉบับ)
    const sorted = [...filtered].sort((a, b) => b.compatible - a.compatible);

    // 3. อัปเดต State ครั้งเดียวด้วยข้อมูลที่พร้อมแล้ว
    setProjects(sorted);
  }

  const stringToColor = (str: string) => {
    // 1. สร้าง Hash จาก String
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      // ใช้ bitwise operator เพื่อสร้างตัวเลขที่เฉพาะตัวจากตัวอักษร
      hash = str.charCodeAt(i) + ((hash << 3) - hash);
    }

    // 2. รายการสีที่ต้องการให้สุ่ม (Tailwind Colors หรือ Hex)
    const colors = [
      '#ff316d', '#ffcf4e', '', '#00da9c', '#008db6',
      '#ffa23e', '#A9B388', '#FEFAE0', '#E9EDC9', '#CCD5AE'
    ];

    // 3. ใช้ Modulo เพื่อเลือก Index จาก Array สี
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };


  useEffect(() => {
    SetGroup(groups[0])
    const filtered = projectsData.filter((item) => item.group === groups[0]);

    // 2. Sort ข้อมูลจากตัวแปรที่ filter มาแล้ว (ใช้ Spread Operator เพื่อไม่ให้กระทบ Data ต้นฉบับ)
    const sorted = [...filtered].sort((a, b) => b.compatible - a.compatible);

    // 3. อัปเดต State ครั้งเดียวด้วยข้อมูลที่พร้อมแล้ว
    setProjects(sorted);

  }, [])

  return (
    <div className="flex flex-col  items-center gap-4 w-full pb-24 pt-5">


      <div className="bg-white w-4/5 flex flex-col items-center justify-center  p-8 rounded-3xl shadow-lg">
        <div className="flex flex-row items-center justify-center gap-3">
          <span className="text-xl"><PiMagicWandThin /></span>
          <p className="font-extralight">Your Personality Profile</p>
        </div>
        <div className="w-60  ">
          <Radar data={data} options={options} />
        </div>
        <div className="w-full text-xs">
          {Object.keys(personal_data).map((item, i) => <div key={uuidv4()} className="flex flex-row gap-3">
            <p>{i + 1}</p>
            <div className="flex flex-row  w-full justify-between">
              <p>{item}</p>
              <p>{personal_data[item as keyof typeof personal_data]} %</p>
            </div>
          </div>)}
        </div>
      </div>

      <div className="w-4/5 flex flex-row items-center justify-between">
        {groups.map(item =>
          <div key={uuidv4()} onClick={() => { fetchData(item); SetGroup(item) }} className={`w-1/4 hover:cursor-pointer ${item == group ? "bg-[var(--color-2)]" : "bg-white"} h-10 rounded-3xl shadow-lg`}>
            <p className="flex justify-center items-center w-full h-full px-4 text-sm">{item}</p>
          </div>
        )}

      </div>


      <div className="w-4/5">
        <div className="flex flex-row  w-full justify-between items-center text-sm ">
          <b>Expolre Projects</b>
          <div className="flex flex-row gap-4 items-center justify-center">
            <span className="flex flex-row gap-2 hover:cursor-pointer">
              <p className=" text-[var(--color-2)]">refresh</p>
              <p className="text-lg "> <HiRefresh /></p>
            </span>
            <p>{projects.length} open</p>
          </div>
        </div>
        {group=="Subject"?<div className="w-full flex justify-center items-center mt-5">
          <div className="bg-white h-10 w-4/5 flex flex-row items-center justify-center   rounded-3xl shadow-lg px-8">
            <input type="text" className="l h-full w-full hover:border-transparent focus:outline-none focus:ring-0 " placeholder="Search" />
            <CiSearch className="size-6 " />
          </div>
        </div>:""}
        <div className="w-full flex items-center justify-center mt-5 ">
          {projects.length == 0 ?
            <div className="w-full flex justify-center items-center flex-col">
              <ImFilesEmpty />
              <p className="text-sm">Sorry No projects for you now</p>
            </div>
            :
            <div className="flex flex-col w-full gap-5 h-full">
              {projects.map(item =>
                <div key={uuidv4()} className="bg-white w-full text-sm rounded-3xl p-5  gap-5">

                  <div className="w-full  flex flex-row justify-between border-b border-gray-300 pb-5">

                    <div className="w-4/5 flex flex-col gap-2">
                      <b>{item.name}</b>
                      <p className="text-gray-500 pl-3">{item.description}</p>
                      <div className={`flex flex-row gap-3 pl-3 `}>
                        {item.tag.map((tagi: string, idx: number) => {
                          const tagColor = stringToColor(tagi); // ฟังก์ชัน Hash ที่เราเขียนกัน

                          return (
                            <p
                              key={uuidv4()}
                              style={{ backgroundColor: tagColor }}
                              className="px-2 py-0.5 rounded-full text-[10px] text-white font-medium shadow-sm"
                            >
                              #{tagi}
                            </p>
                          );
                        })}

                      </div>

                    </div>

                    <div className="w-1/5">
                      <div className="flex flex-row border rounded-3xl p-1">
                        <p className="text-lg"><PiMagicWandThin /></p>
                        <p className="">{item.compatible}%</p>

                      </div>
                    </div>

                  </div>

                  <div className="flex items-center h-6 pt-4 w-full justify-between" >
                    <p>{item.members.split("/")[1]} Members  needed ({item.members})</p>
                    <p className="text-lg"><MdNavigateNext /></p>
                  </div>

                </div>
              )}
            </div>
          }
        </div>




      </div>


    </div>
  );
}
