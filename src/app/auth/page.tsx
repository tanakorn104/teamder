"use client"
import Image from "next/image";

export default function AuthPage() {
    return (
        // คุมความสูงเต็มจอ และใช้ flex ให้เนื้อหาจัดกึ่งกลาง
        <div className="min-h-screen bg-background flex justify-center items-center w-full font-sans text-foreground py-10">
            
            {/* แบ่งเป็น 2 คอลัมน์บนจอใหญ่ (md:flex-row) */}
            <div className="w-full max-w-6xl px-6 md:px-12 flex flex-col md:flex-row gap-12 md:gap-20 items-center justify-between">

                {/* --- ฝั่งซ้าย: Hero Text & Features --- */}
                <div className="w-full md:w-1/2 flex flex-col gap-10">
                    
                    {/* Hero Text */}
                    <div className="flex flex-col text-5xl md:text-6xl lg:text-[72px] font-bold leading-[1.1] tracking-tight">
                        <div className="text-brand-3">
                            <p>The Smarter</p>
                            <p>way to</p>
                        </div>
                        <b className="text-foreground mt-2">build your team.</b>
                    </div>

                    {/* Features List */}
                    <div className="flex flex-col gap-4 w-full max-w-md">
                        
                        {/* Feature 1 */}
                        <div className="flex flex-row gap-5 bg-white p-4 rounded-2xl items-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 transition-transform hover:-translate-y-1">
                            <div className="bg-brand-1/20 p-3 rounded-full text-brand-3 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <b className="text-base text-gray-800">Know yourself</b>
                                <p className="text-sm text-gray-500">AI-Powered Personality Analysis</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex flex-row gap-5 bg-white p-4 rounded-2xl items-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 transition-transform hover:-translate-y-1">
                            <div className="bg-active/20 p-3 rounded-full text-active shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <b className="text-base text-gray-800">Smart Matching</b>
                                <p className="text-sm text-gray-500">Team Compatibility Matching</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex flex-row gap-5 bg-white p-4 rounded-2xl items-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 transition-transform hover:-translate-y-1">
                            <div className="bg-score text-score-content p-3 rounded-full shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <b className="text-base text-gray-800">High Performance Team</b>
                                <p className="text-sm text-gray-500">Find Your Ideal Teammates</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ฝั่งขวา: Login Box --- */}
                <div className="w-full md:w-5/12 lg:w-1/3 flex flex-col justify-center items-center bg-white p-10 rounded-[40px] shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100">
                    
                    <div className="w-16 h-16 bg-brand-3 rounded-2xl mb-6 flex items-center justify-center shadow-inner">
                         <span className="text-white font-bold text-3xl">T</span>
                    </div>

                    <h2 className="text-xl font-bold mb-2">Welcome to Teamder</h2>
                    <p className="text-gray-500 text-sm mb-8 text-center">
                        Sign in to start building your dream team today.
                    </p>

                    {/* Google Login Button */}
                    <button 
                        onClick={() => { window.location.href = "/api/auth" }} 
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 py-3 px-6 rounded-full hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium"
                    >
                        <svg aria-label="Google logo" width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <g>
                                <path d="m0 0H512V512H0" fill="#fff" fillOpacity="0"></path>
                                <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
                                <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
                                <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
                                <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
                            </g>
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-xs text-gray-400 mt-8 text-center px-4">
                        By continuing, you agree to Teamder's Terms of Service and Privacy Policy.
                    </p>
                </div>

            </div>
        </div>
    );
}