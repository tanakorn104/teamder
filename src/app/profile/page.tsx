'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

import roleData from "../../data/roles.json"; 

// @ts-ignore
import { searchAddressByDistrict, searchAddressByZipcode } from 'thai-address-database';

import { BiLogOut, BiEditAlt, BiSave, BiX, BiMapPin } from "react-icons/bi";
import { IoPersonOutline, IoBriefcaseOutline } from "react-icons/io5";

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [allRoles, setAllRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        full_name: "",
        primary_role: "",
        user_description: "",
        province: "",
        district: "",
        subdistrict: "",
        zipcode: ""
    });

    useEffect(() => {
        // ข้อมูล roleData เป็น Array แบบ 1 มิติที่คลีนแล้ว
        setAllRoles(roleData);

        const fetchMe = async () => {
            try {
                // 🚀 เอาแคชออกด้วยการเติม Timestamp และกำหนด Headers
                const timestamp = new Date().getTime();
                const response = await fetch(`/api/auth/me?t=${timestamp}`, { 
                    cache: 'no-store',
                    headers: {
                        'Pragma': 'no-cache',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const u = data.user || data;
                    setUser(u);
                    setFormData({
                        full_name: u.full_name || u.name || "",
                        primary_role: u.primary_role || "",
                        user_description: u.user_description || "",
                        province: u.province || "",
                        district: u.district || "",
                        subdistrict: u.subdistrict || "",
                        zipcode: u.zipcode || ""
                    });
                }
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchMe();
    }, []);

    const handleAddressSearch = (query: string) => {
        setFormData({ ...formData, district: query });
        if (query.length < 2) {
            setAddressSuggestions([]);
            return;
        }
        const results = [
            ...searchAddressByDistrict(query),
            ...searchAddressByZipcode(query)
        ].slice(0, 8);
        setAddressSuggestions(results);
    };

    const selectAddress = (item: any) => {
        setFormData({
            ...formData,
            subdistrict: item.subdistrict,
            district: item.district,
            province: item.province,
            zipcode: item.zipcode.toString()
        });
        setAddressSuggestions([]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post("/api/profile", formData);
            
            // 🚀 อัปเดต UI ทันทีโดยไม่ต้องรอโหลดหน้าเว็บใหม่
            setUser((prev: any) => ({
                ...prev,
                full_name: formData.full_name,
                primary_role: formData.primary_role,
                province: formData.province,
                district: formData.district,
                user_description: formData.user_description
            }));
            
            // 🚀 สั่ง Next.js เคลียร์ Router Cache หลังบ้าน
            router.refresh();
            
            setIsEditing(false); // ปิดโหมด Edit ทันที
        } catch (error) {
            console.error(error);
            alert("บันทึกไม่สำเร็จ");
        } finally { 
            setSaving(false); 
        }
    };

    if (loading) return <div className="min-h-screen bg-background" />;

    const displayName = user?.full_name || user?.name || "Guest User";
    const displayImage = user?.profile_image || user?.picture || null;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full pb-24 pt-12">
            <div className="w-full max-w-2xl px-6 flex flex-col gap-8">
                
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold">Profile</h1>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-active font-bold flex items-center gap-2">
                        {isEditing ? <><BiX size={28}/> Cancel</> : <><BiEditAlt size={20}/> Edit</>}
                    </button>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 transition-all">
                    {isEditing ? (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Name</label>
                                <input 
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-active"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <IoBriefcaseOutline />Career
                                </label>
                                <input 
                                    list="roles-options"
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-active"
                                    value={formData.primary_role}
                                    placeholder="ค้นหาอาชีพ..."
                                    onChange={(e) => setFormData({...formData, primary_role: e.target.value})}
                                />
                                <datalist id="roles-options">
                                    {allRoles.map((r, i) => <option key={i} value={r} />)}
                                </datalist>
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <BiMapPin /> Location Search
                                </label>
                                <input 
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-active"
                                    value={formData.district}
                                    placeholder="พิมพ์เขต/อำเภอ หรือ รหัสไปรษณีย์..."
                                    onChange={(e) => handleAddressSearch(e.target.value)}
                                />
                                {addressSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white border shadow-2xl rounded-3xl mt-2 z-50 overflow-hidden">
                                        {addressSuggestions.map((item, i) => (
                                            <div key={i} onClick={() => selectAddress(item)} className="p-4 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0">
                                                {item.subdistrict} » {item.district} » <b>{item.province}</b> ({item.zipcode})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 w-full bg-gray-100 rounded-2xl text-gray-500 text-sm">
                                {formData.province || "Province"}
                            </div>
     
                            <button onClick={handleSave} disabled={saving} className="w-full bg-active text-white py-5 rounded-3xl font-bold shadow-lg transition-all active:scale-[0.98]">
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center md:items-start gap-6">
                            <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-gray-50 bg-gray-100 flex justify-center items-center shadow-inner">
                                {displayImage ? (
                                    <Image src={displayImage} alt="Profile" fill className="object-cover" />
                                ) : (
                                    <IoPersonOutline size={64} className="text-gray-300" />
                                )}
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl font-bold">{displayName}</h2>
                                <p className="text-gray-500">{user?.email}</p>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="px-4 py-1.5 bg-active/10 text-active rounded-full text-xs font-black uppercase tracking-tighter">
                                        {user?.primary_role || "No Role Set"}
                                    </span>
                                    <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold flex items-center gap-1">
                                        <BiMapPin /> {user?.province || "Location"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <button 
                        onClick={() => { if(confirm("Logout?")) window.location.href = "/logout"; }} 
                        className="w-full bg-white border border-red-100 text-red-500 py-4 rounded-2xl font-bold transition-colors hover:bg-red-50"
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
}