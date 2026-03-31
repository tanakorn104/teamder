"use client"
import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  cat: string;
  type: string[];
  ans: { [key: string]: number };
};

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/prsnasmt");
        const json: Question[] = await res.json();
        
        // 1. เรียงข้อมูลให้เสร็จก่อน Set State
        const sortedJson = [...json].sort((a, b) => a.cat.localeCompare(b.cat));
        
        setQuestions(sortedJson);
        // 2. ดึง Category ออกมา
        setCategories([...new Set(sortedJson.map(item => item.cat))]);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }
    load();
  }, []);

  const currentQuestion = questions[currentIdx];

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      alert("จบแบบทดสอบแล้ว!");
    }
  };

  if (questions.length === 0) return (
    <div className="bg-background min-h-screen flex items-center justify-center text-brand-5">
      กำลังโหลดข้อมูล...
    </div>
  );

  // คำนวณ % สำหรับ Progress Bar
  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    // ดึงสีพื้นหลังและสีตัวอักษรตั้งต้นจาก global.css
    <div className="bg-background min-h-screen flex flex-col relative font-sans text-foreground">
      
      {/* Wrapper หลัก: ล็อกความกว้าง max-w-md สำหรับ Responsive */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-6 pt-12 pb-20">
        
        {/* Header Section: หมวดหมู่ (Categories) */}
        <div className="w-full">
          <div className="flex justify-center gap-10 text-sm font-medium mb-6">
            {categories.map((catName) => {
              const isActive = currentQuestion?.cat === catName;
              return (
                <div 
                  key={catName} 
                  className={`px-4 py-1.5 rounded-full transition-colors ${
                    isActive 
                      ? "bg-brand-2 text-background" 
                      : "text-brand-4 bg-transparent"
                  }`}
                >
                  {catName}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-brand-5 mb-2 px-1">
            {currentQuestion?.cat || "Category"}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-[6px] bg-brand-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-4 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card (กล่องคำถาม) */}
        <div className="bg-white rounded-[16px] w-full min-h-[140px] mt-8 flex items-center justify-center p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-brand-1">
          <h2 className="text-[18px] font-normal text-center text-foreground">
            {currentQuestion?.question}
          </h2>
        </div>

        {/* Answers Section (ตัวเลือกคำตอบ) */}
        <div className="w-full mt-8 flex flex-col gap-3.5">
          {currentQuestion && Object.entries(currentQuestion.ans).map(([label, value]) => (
            <button
              key={label}
              onClick={handleNext}
              // ใช้ border-brand-5 เพื่อให้เส้นขอบและตัวอักษรกลืนกับตีมสีหลัก
              className="w-full bg-white text-brand-5 text-[15px] font-medium py-3.5 px-6 rounded-[14px] border-[1.5px] border-brand-5 shadow-[1px_3px_5px_rgba(0,0,0,0.15)] hover:bg-brand-1/20 active:scale-[0.98] transition-all"
            >
              {label}
            </button>
          ))}
        </div>

      </div>

      {/* Footer (แถบด้านล่างสุด) */}
      <div className="absolute bottom-0 w-full bg-brand-1 py-2">
        <p className="text-center text-[11px] text-brand-5">
          Contact Us TeamDER.comEnd@gmail.com
        </p>
      </div>

    </div>
  );
}