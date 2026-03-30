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
import { FaPlus } from "react-icons/fa6";
import { FiBell } from "react-icons/fi";

import { v4 as uuidv4 } from 'uuid';





export default function Home() {



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




    return (
        <div className="flex flex-col  items-center gap-6 w-full pb-24">
            <div className="w-3/4 text-lg"><b>create</b></div>
            <div className="flex flex-col justify-between text-white shadow-xl p-3 bg-[var(--color-3)] h-44 w-3/4 rounded-3xl">
                <div className="flex flex-row gap-4">
                    <p className="text-3xl flex justify-center items-center w-14 h-14 rounded-full bg-[var(--color-2)]"><FaPlus /></p>
                    <div className="text-2xl">
                        <p>Start a</p>
                        <p>New Project</p>
                    </div>

                </div>
                <p className="px-3">Find your team  Find your Dream.</p>
                <div className="px-3  flex flex-row w-full items-center">
                    <div className="flex flex-row items-center bg-transparent border border-gray-300  p-1 px-4 rounded-3xl">
                        <p>Create Now</p>
                        <MdNavigateNext />
                    </div>
                </div>
            </div>
            <div className="w-3/4 bg-white   shadow-xl h-20 rounded-3xl">
            <div className="w-full px-2  h-full flex flex-row item-center justify-between">
                    <p className="text-4xl flex justify-center items-center"><FiBell /></p>
                    <p className="h-auto flex justify-center items-center text-xl font-bold">Join Request</p>
                    <div className="h-auto flex justify-center items-center text-white "><p className="bg-red-500 rounded-full text-center w-6 h-6">n</p></div>
                    <p className="text-4xl flex justify-center items-center"> <MdNavigateNext /></p>
                    
            </div>


            </div>
        </div>
    );
}
