"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  question: string;
  cat: string;
  ans: Record<string, string | number>;
};

type UserAnswer = {
  questionId: string;
  cat: string;
  points: number;
};

export default function Page() {
  const router = useRouter(); 
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 🚀 อย่าลืมเปลี่ยนเป็นรับค่าจากระบบ Login ของคุณเวลาใช้งานจริง
  const USER_ID = 9906; 

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/prsnasmt");
        const json = await res.json();

        // 🚀 ถ้าระบบบอกว่าเคยทำไปแล้ว ให้เด้งกลับหน้าแรกทันที
        if (json.alreadyCompleted) {
            alert("คุณได้ทำแบบประเมินบุคลิกภาพไปแล้วครับ ระบบจะพากลับไปหน้าหลัก");
            router.push("/");
            return;
        }

        const sortedJson = [...json.data].sort((a: any, b: any) => a.cat.localeCompare(b.cat));
        setQuestions(sortedJson);
        
        // 🚀 แก้ไขเออเร่อ TypeScript ตรงนี้โดยใช้ Array.from()
        setCategories(Array.from(new Set(sortedJson.map((item: any) => item.cat as string))));

      } catch (err) {
        console.error("Failed to load", err);
      } finally {
        setIsChecking(false);
      }
    }
    load();
  }, [router]);

  const handleNext = (id: string, point: number, category: string) => {
    const newAnswer: UserAnswer = {
      questionId: id,
      cat: category,
      points: point // ส่งไปเป็นตัวเลขเสมอ
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
      const payload = {
        userId: USER_ID, 
        results: finalAnswers,
      };

      const res = await fetch("/api/prsnasmt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("บันทึกผลการประเมินเรียบร้อยแล้ว!");
        router.push("/"); // 🚀 กลับหน้าหลักเมื่อส่งสำเร็จ
      } else {
        const errorData = await res.json();
        console.error("Server Error:", errorData);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error("Network Error:", err);
    }
  };

  // แสดง Loading ตอนกำลังเช็คว่าเคยทำหรือยัง
  if (isChecking) return <div className="min-h-screen flex items-center justify-center bg-background">กำลังตรวจสอบข้อมูล...</div>;
  if (questions.length === 0) return null;
  if (isFinished) return <div className="min-h-screen flex items-center justify-center bg-background text-brand-5 font-bold text-xl">กำลังบันทึกข้อมูล...</div>;

  const currentQuestion = questions[currentIdx];
  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="bg-background min-h-screen flex flex-col font-sans text-foreground">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-6 pt-12 pb-20">
        
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

        <div className="bg-white rounded-2xl w-full min-h-[160px] mt-10 flex items-center justify-center p-8 shadow-sm border border-brand-1">
          <h2 className="text-lg font-medium text-center leading-relaxed text-brand-5">{currentQuestion?.question}</h2>
        </div>

        <div className="w-full mt-10 flex flex-col gap-4">
          {Object.entries(currentQuestion.ans).map(([scoreKey, choiceText]) => (
            <button
              key={scoreKey}
              onClick={() => handleNext(currentQuestion.id, Number(scoreKey), currentQuestion.cat)}
              className="w-full bg-white text-brand-5 text-base font-semibold py-4 px-6 rounded-xl border-[1.5px] border-brand-5 shadow-[2px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all text-left"
            >
              {choiceText as string}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}