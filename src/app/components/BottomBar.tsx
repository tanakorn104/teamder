'use client'

import { ImFilesEmpty } from "react-icons/im";
import { PiMagicWandThin } from "react-icons/pi";
import { CiSearch } from "react-icons/ci";
import { MdNavigateNext } from "react-icons/md";
import { HiRefresh } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import { FiBell } from "react-icons/fi";

import { ImMagicWand } from "react-icons/im";
import { BsPeopleFill } from "react-icons/bs";
import { IoMdCreate } from "react-icons/io";
import { IoPerson } from "react-icons/io5";


import { v4 as uuidv4 } from 'uuid';





export default function BottomBar() {
    return (
        <div className="flex flex-col h-16 z-[999] items-center gap-6 w-full fixed bottom-16 ">
           <div className="w-5/6 text-sm shadow-xl gap-2 bg-white p-3 rounded-xl border border-[var(--color-3)] flex flex-row items-center justify-between">
            <div className="flex flex-col items-center justify-center w-1/4">
                <ImMagicWand />
                <p>Projects</p>
            </div>
            <div className="flex flex-col items-center justify-center w-1/4">
                <BsPeopleFill />
                <p>Teams</p>
            </div>
            <div className="flex flex-col items-center justify-center w-1/4">
                <IoMdCreate />
                <p>Create</p>
            </div>
            <div className="flex flex-col items-center justify-center w-1/4">
                <IoPerson />
                <p>Profile</p>
            </div>
           </div>
        </div>
    );
}
