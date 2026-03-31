'use client'
import Image from "next/image";
import { useEffect, useState } from "react";

import { ImFilesEmpty } from "react-icons/im";
import { PiMagicWandThin } from "react-icons/pi";
import { CiSearch } from "react-icons/ci";
import { MdNavigateNext } from "react-icons/md";
import { HiRefresh } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import { FiBell } from "react-icons/fi";

import { v4 as uuidv4 } from 'uuid';

import { BiLogOut } from "react-icons/bi";
import { BiLogIn } from "react-icons/bi";
import { IoPersonOutline } from "react-icons/io5";


export default function Home() {


    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    method: "GET",
                    // 🔥 สำคัญ: ต้องใส่ include เพื่อให้ Browser ส่ง HttpOnly Cookie ไปด้วย
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                } else if (response.status === 401) {
                    // Token หมดอายุ หรือไม่มีสิทธิ์
                    setError(true);
                }
            } catch (err) {
                console.error("Fetch profile error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, []);





    return (
        <div className="flex flex-col  items-center gap-6 w-full pb-24">
            <div className="w-3/4 text-lg"><b>Profile</b></div>

            <div className="w-3/4 bg-white px-4 gap-3 shadow-xl h-24 rounded-3xl flex flex-row items-center">
                <div className="w-1/4 ">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden ">
                        {user ? <Image
                            src={user?.picture || ""} // เติม ? หลัง user
                            alt={user?.name || "User Profile"}
                            fill
                            className="object-cover"
                        /> :
                           <div className="red-400 h-full flex justify-center items-center text-4xl">
                             <IoPersonOutline />
                           </div>
                        }
                    </div>
                </div>

                <div className="text-sm w-3/4">
                    <b className="">{user?user.name || "":"please Login"}</b>
                    <p className="truncate ">{user?user.email || "":"please Login"}</p>
                </div>
            </div>
           {user? <div onClick={() => { window.confirm("คุณต้องการออกจากระบบไหม") ? window.location.href = "/logout" : "" }} className="w-3/4 bg-white relative px-4 gap-3 shadow-xl h-14 rounded-3xl flex flex-row items-center">
                <div className="fixed text-xl">
                    <BiLogOut />
                </div>
                <p className="w-full text-center font-bold">Logout</p>
            </div>:
            <div onClick={() => {window.location.href="/auth"}} className="w-3/4 bg-white relative px-4 gap-3 shadow-xl h-14 rounded-3xl flex flex-row items-center">
                <div className="fixed text-xl">
                    <BiLogIn />
                </div>
                <p className="w-full text-center font-bold">Login</p>
            </div>
            }


        </div>
    );
}
