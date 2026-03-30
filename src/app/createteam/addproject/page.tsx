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
import { FiBell } from "react-icons/fi";


import { IoMdArrowBack } from "react-icons/io";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';


import { stringToColor } from "@/lib/utils";




export default function Home() {


    const [tags, SetTags] = useState<string[]>([]);

    useEffect(() => {
        let tagss = ["Research", "Creative", "Innovation", "Business", "Study"]
        SetTags(tagss);
    }, [])

    return (
        <div className="flex flex-col  items-center gap-6 w-full ">

            <div className="w-3/4 flex flex-row items-center  gap-3">
                <div className="text-4xl bg-[var(--color-2)] rounded-lg "><IoMdArrowBack /></div>
                <b className="text-xl">New Project</b>
            </div>

            <div className="w-3/4 flex flex-col gap-5">
                <div className="">
                    <b className="text-xl">เลือกขอบเขตการทำงาน</b>
                    <p className="text-gray-500">ใครบ้างที่สามารถเห็นและขอเข้าร่วมงานของคุณ</p>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="border rounded-2xl shadow-xl px-5">
                        <b>Global</b>
                        <p className="text-sm text-gray-500">Everyone can join</p>
                    </div>
                    <div className="border rounded-2xl shadow-xl px-5">
                        <b>University</b>
                        <p className="text-sm text-gray-500">Students only</p>
                    </div>
                    <div className="border rounded-2xl shadow-xl px-5">
                        <b>Subject</b>
                        <p className="text-sm text-gray-500">Specific class</p>
                    </div>
                </div>
                <div className="">
                    <b className="text-xl">Project details</b>
                    <p className="text-gray-500 px-3">Tell people what you’re interest</p>
                </div>
                <div className="text-lg flex flex-col gap-5 ">
                    <div className="">
                        <p>Title</p>
                        <input type="text" className="px-3 font-bold hover:border-transparent focus:outline-none focus:ring-0 border border-[var(--color-4)] w-full h-12 rounded-2xl bg-white shadow-xl" />
                    </div>
                    <div className="">
                        <p>Description</p>
                        <textarea className="text-start px-3 font-bold hover:border-transparent focus:outline-none focus:ring-0 border border-[var(--color-4)] w-full h-42 rounded-2xl bg-white shadow-xl" ></textarea>
                    </div>
                    <div className="">
                        <p>Team Size</p>
                        <div className=" flex flex-row items-center justify-between px-5 font-bold  border border-[var(--color-4)] w-full h-24 rounded-2xl bg-white shadow-xl" >
                            <p className="bg-[var(--color-2)] p-1 rounded-full"><FaMinus /></p>
                            <div className="flex flex-col justify-center items-center">
                                <p className="text-2xl font-light">0</p>
                                <p className=" font-light">member</p>
                            </div>
                            <p className="bg-[var(--color-2)] p-1 rounded-full"><FaPlus /></p>
                        </div>
                    </div>
                    <div className="">
                        <p>Tag</p>
                        <div className=" flex flex-row flex-wrap gap-3" >
                            {tags.map(item => <p key={uuidv4()} className="p-3 text-sm h-6 flex justify-center items-center border text-white rounded-full" style={{ backgroundColor: stringToColor(item) }}>#{item}</p>)}
                            <p className="bg-gray-500 p-1 px-2 text-white rounded-full"><FaPlus /></p>

                        </div>

                    </div>
                      <div className="">
                        <div className="flex justify-center items-center px-3 font-bold  border border-[var(--color-4)] w-full h-12 rounded-2xl bg-[var(--color-4)] shadow-xl" >
                            <p>Create Team</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
