"use client"
import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  cat: string;
  ans: Record<string, number>;
};

type UserAnswer = {
  questionId: string;
  cat: string;
  points: number;
};

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // สมมติ ID ผู้ใช้คือ 20 (ในระบบจริงอาจดึงจาก Context หรือ Session)
  const USER_ID = 20;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/prsnasmt");
        const json: Question[] = await res.json();
        const sortedJson = [...json].sort((a, b) => a.cat.localeCompare(b.cat));
        setQuestions(sortedJson);
        setCategories([...new Set(sortedJson.map(item => item.cat))]);
      } catch (err) {
        console.error("Failed to load", err);
      }
    }
    load();
  }, []);

  const handleNext = (id: string, point: number, category: string) => {
    const newAnswer: UserAnswer = {
      questionId: id,
      cat: category,
      points: point
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsFinished(true);
      submitAnswers(updatedAnswers);
    }
  };

  const submitAnswers = async (finalAnswers: UserAnswer[]) => {
    try {
      // สร้างก้อนข้อมูลที่จะส่ง (Payload)
      const payload = {
        userId: 20, // หรือใส่ ID ที่คุณต้องการ
        results: finalAnswers,
        submittedAt: new Date().toISOString()
      };

      // บรรทัดนี้จะพ่น JSON ออกมาให้เราดูใน Console ของ Browser
      console.log("-----------------------------------------");
      console.log("JSON ที่ส่งไปคือ:", JSON.stringify(payload, null, 2));
      console.log("-----------------------------------------");

      const res = await fetch("/api/prsnasmt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("บันทึกสำเร็จ!");
      } else {
        console.error("Server Error (500)");
      }
    } catch (err) {
      console.error("Network Error:", err);
    }
  };

  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center bg-background">กำลังโหลด...</div>;
  if (isFinished) return <div className="min-h-screen flex items-center justify-center bg-background text-brand-5 font-bold text-xl">ส่งแบบทดสอบเรียบร้อย!</div>;

  const currentQuestion = questions[currentIdx];
  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="bg-background min-h-screen flex flex-col relative font-sans text-foreground">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-6 pt-12 pb-20">
        
        {/* Progress & Category Header */}
        <div className="w-full">
          <div className="flex justify-center gap-4 text-[10px] font-medium mb-6 overflow-x-auto hide-scroll">
            {categories.map((catName) => (
              <div key={catName} className={`px-3 py-1 rounded-full whitespace-nowrap ${currentQuestion?.cat === catName ? "bg-brand-2 text-white" : "text-brand-4 opacity-40"}`}>
                {catName}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-brand-4 mb-2 uppercase tracking-widest">{currentQuestion?.cat}</p>
          <div className="w-full h-1.5 bg-brand-1 rounded-full overflow-hidden">
            <div className="h-full bg-brand-3 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl w-full min-h-[160px] mt-10 flex items-center justify-center p-8 shadow-sm border border-brand-1">
          <h2 className="text-lg font-medium text-center leading-relaxed text-brand-5">{currentQuestion?.question}</h2>
        </div>

        {/* Answer Buttons */}
        <div className="w-full mt-10 flex flex-col gap-4">
          {Object.entries(currentQuestion.ans).map(([label, value]) => (
            <button
              key={label}
              onClick={() => handleNext(currentQuestion.id, value, currentQuestion.cat)}
              className="w-full bg-white text-brand-5 text-base font-semibold py-4 px-6 rounded-xl border-[1.5px] border-brand-5 shadow-[2px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-brand-1 py-2 text-center text-[10px] text-brand-4 opacity-60">
        Contact Us TeamDER.comEnd@gmail.com
      </div>
    </div>
  );
}