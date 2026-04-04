'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import roleData from "../../data/roles.json"; 

// @ts-ignore
import { searchAddressByDistrict, searchAddressByZipcode } from 'thai-address-database';
import { BiLogOut, BiEditAlt, BiSave, BiX, BiMapPin, BiBuildings } from "react-icons/bi";
import { IoPersonOutline, IoBriefcaseOutline, IoDocumentTextOutline } from "react-icons/io5";

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [allRoles, setAllRoles] = useState<string[]>([]);
    const [institutions, setInstitutions] = useState<any[]>([]); // สำหรับเก็บรายชื่อมหาลัย
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
        zipcode: "",
        institution_id: 1 // Default
    });

    useEffect(() => {
        setAllRoles(roleData);

        const fetchData = async () => {
            try {
                const timestamp = new Date().getTime();
                
                // 🚀 ดึงข้อมูล 2 อย่างพร้อมกันเพื่อความรวดเร็ว
                const [meRes, instRes] = await Promise.all([
                    fetch(`/api/auth/me?t=${timestamp}`, { cache: 'no-store' }),
                    fetch('/api/institutions')
                ]);
                
                if (instRes.ok) {
                    const instData = await instRes.json();
                    setInstitutions(instData.institutions || []);
                }

                if (meRes.ok) {
                    const data = await meRes.json();
                    const u = data.user || data;
                    setUser(u);
                    
                    // 🚀 แปลง institution_id เป็น Number ให้ชัวร์ เพื่อให้ตรงกับ Dropdown
                    const savedInstId = u.institution_id ? Number(u.institution_id) : 1;

                    setFormData({
                        full_name: u.full_name || u.name || "",
                        primary_role: u.primary_role || "",
                        user_description: u.user_description || "",
                        province: u.province || "",
                        district: u.district || "",
                        subdistrict: u.subdistrict || "",
                        zipcode: u.zipcode || "",
                        institution_id: savedInstId
                    });
                }
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, []);

    const handleAddressSearch = (query: string) => {
        setFormData({ ...formData, district: query });
        if (query.length < 2) {
            setAddressSuggestions([]);
            return;
        }
        const results = [...searchAddressByDistrict(query), ...searchAddressByZipcode(query)].slice(0, 8);
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
            
            setUser((prev: any) => ({
                ...prev,
                ...formData
            }));
            
            router.refresh();
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("บันทึกไม่สำเร็จ");
        } finally { 
            setSaving(false); 
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-gray-400">Loading Profile...</div>;

    const displayName = user?.full_name || user?.name || "Guest User";
    const displayImage = user?.profile_image || user?.picture || null;
    
    // 🚀 หาชื่อมหาวิทยาลัยมาแสดงในหน้า Profile ปกติ
    const displayInstitution = institutions.find(inst => inst.id === (user?.institution_id ? Number(user.institution_id) : formData.institution_id))?.name_th || "ยังไม่ได้เลือกมหาวิทยาลัย";

    return (
        <div className="min-h-screen bg-background flex flex-col items-center w-full pb-24 pt-12">
            <div className="w-full max-w-2xl px-6 flex flex-col gap-8">
                
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold italic tracking-tighter">Profile</h1>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-active font-bold flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-all">
                        {isEditing ? <><BiX size={28}/> Cancel</> : <><BiEditAlt size={20}/> Edit</>}
                    </button>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 transition-all">
                    {isEditing ? (
                        <div className="space-y-6">
                            {/* Name */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Display Name</label>
                                <input 
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-active"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>

                            {/* Institution */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <BiBuildings /> University / Institution
                                </label>
                                <select 
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-active appearance-none"
                                    value={formData.institution_id}
                                    onChange={(e) => setFormData({...formData, institution_id: parseInt(e.target.value)})}
                                >
                                    {institutions.map((inst) => (
                                        <option key={inst.id} value={inst.id}>{inst.name_th}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Career */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <IoBriefcaseOutline /> Primary Role
                                </label>
                                <input 
                                    list="roles-options"
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-active"
                                    value={formData.primary_role}
                                    placeholder="เช่น Web Developer, Designer..."
                                    onChange={(e) => setFormData({...formData, primary_role: e.target.value})}
                                />
                                <datalist id="roles-options">
                                    {allRoles.map((r, i) => <option key={i} value={r} />)}
                                </datalist>
                            </div>

                            {/* Bio / Description */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <IoDocumentTextOutline /> Bio / Description
                                </label>
                                <textarea 
                                    rows={4}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[32px] outline-none focus:ring-2 focus:ring-active resize-none"
                                    value={formData.user_description}
                                    placeholder="บอกเล่าเรื่องราวของคุณ ความสนใจ หรือทักษะที่มี..."
                                    onChange={(e) => setFormData({...formData, user_description: e.target.value})}
                                />
                            </div>

                            {/* Location */}
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

                            <div className="p-4 w-full bg-gray-100 rounded-2xl text-gray-500 text-sm font-bold flex items-center gap-2">
                                <BiMapPin /> {formData.province || "กรุณาเลือกที่อยู่ด้านบน"}
                            </div>
     
                            <button onClick={handleSave} disabled={saving} className="w-full bg-active text-white py-5 rounded-3xl font-bold shadow-lg shadow-active/20 transition-all active:scale-[0.98] disabled:bg-gray-300">
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center md:items-start gap-6">
                            <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                                <div className="relative w-32 h-32 rounded-[40px] overflow-hidden border-4 border-gray-50 bg-gray-100 flex justify-center items-center shadow-inner shrink-0">
                                    {displayImage ? (
                                        <Image src={displayImage} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <IoPersonOutline size={64} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h2 className="text-3xl font-bold">{displayName}</h2>
                                    <p className="text-gray-400 font-medium">{user?.email}</p>
                                    <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className="px-4 py-1.5 bg-active/10 text-active rounded-full text-xs font-black uppercase tracking-tighter border border-active/5">
                                            {user?.primary_role || "No Role Set"}
                                        </span>
                                        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-100">
                                            <BiBuildings /> {displayInstitution}
                                        </span>
                                        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-100">
                                            <BiMapPin /> {user?.province || "No Location"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bio Display */}
                            {user?.user_description && (
                                <div className="w-full mt-2 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{user.user_description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <button 
                        onClick={() => { if(confirm("Logout?")) window.location.href = "/logout"; }} 
                        className="w-full bg-white border border-red-50 text-red-400 py-4 rounded-[28px] font-bold transition-all hover:bg-red-50 hover:border-red-100 active:scale-[0.99]"
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
}