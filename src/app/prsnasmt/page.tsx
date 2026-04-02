"use client"
import { useEffect, useState } from "react";

// --- 1. ปรับปรุง Type ให้ตรงกับข้อมูลจริง ---
type Question = {
  id: string;
  question: string;
  cat: string;
  type?: string[]; // ใส่ ? เผื่อกรณีไม่มีข้อมูล type ส่งมา
  ans: Record<string, number>; // ใช้ Record สำหรับ Object ที่ key เป็น string และ value เป็น number
};

type UserAnswer = {
  questionId: string;
  answerLabel: string;
  points: number;
};

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/prsnasmt");
        const json: Question[] = await res.json();
        const sortedJson = [...json].sort((a, b) => a.cat.localeCompare(b.cat));
        setQuestions(sortedJson);
        setCategories([...new Set(sortedJson.map(item => item.cat))]);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }
    load();
  }, []);

  const currentQuestion = questions[currentIdx];

  // --- 2. แก้ไขฟังก์ชันให้รับ Parameter (แก้ Error บรรทัด 103) ---
  const handleNext = (id: string, ansLabel: string, point: number) => {
    const newAnswer: UserAnswer = {
      questionId: id,
      answerLabel: ansLabel,
      points: point
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitAnswers(updatedAnswers);
    }
  };

  const submitAnswers = async (finalAnswers: UserAnswer[]) => {
    try {
      const res = await fetch("api/prsnasmt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: finalAnswers,
          totalScore: finalAnswers.reduce((sum, item) => sum + item.points, 0),
        }),
      });

      if (res.ok) alert("จบแบบทดสอบและส่งข้อมูลแล้ว!");
    } catch (err) {
      console.error("Submit error", err);
    }
  };

  if (questions.length === 0) return <div className="bg-background min-h-screen flex items-center justify-center">Loading...</div>;

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="bg-background min-h-screen flex flex-col relative font-sans text-foreground">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-6 pt-12 pb-20">
        
        {/* Header & Progress */}
        <div className="w-full">
          <div className="flex justify-center gap-10 text-sm font-medium mb-6">
            {categories.map((catName) => (
              <div key={catName} className={`px-4 py-1.5 rounded-full transition-all ${currentQuestion?.cat === catName ? "bg-brand-2 text-background" : "text-brand-4 opacity-50"}`}>
                {catName}
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-5 mb-2 px-1">{currentQuestion?.cat}</p>
          <div className="w-full h-[6px] bg-brand-1 rounded-full overflow-hidden">
            <div className="h-full bg-brand-4 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-[16px] w-full min-h-[140px] mt-8 flex items-center justify-center p-6 shadow-sm border border-brand-1">
          <h2 className="text-[18px] font-medium text-center">{currentQuestion?.question}</h2>
        </div>

        {/* Answers Section (จุดที่เคยแดง) */}
        <div className="w-full mt-8 flex flex-col gap-3.5">
          {currentQuestion && Object.entries(currentQuestion.ans).map(([label, value]) => (
            <button
              key={label}
              // ส่งค่าเข้าไปใน handleNext ตามที่กำหนดไว้ข้างบน
              onClick={() => handleNext(currentQuestion.id, label, value)}
              className="w-full bg-white text-brand-5 text-[15px] font-medium py-3.5 px-6 rounded-[14px] border-[1.5px] border-brand-5 shadow-[1px_3px_5px_rgba(0,0,0,0.1) ] hover:bg-brand-1/10 active:scale-[0.98] transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-brand-1 py-2 text-center text-[10px] text-brand-5 opacity-70">
        Contact Us TeamDER.comEnd@gmail.com
      </div>
    </div>
  );
}