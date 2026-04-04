"use client"
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EvaluatePage() {
  const params = useParams();
  const router = useRouter();
  
  // ดึงค่าจาก URL /evaluate/[projectId]/[targetId]
  const { projectId, targetId } = params;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. เช็คสิทธิ์และโหลดคำถามทันทีที่เข้าหน้าเว็บ
  useEffect(() => {
    async function initPage() {
      try {
        // ส่ง Query String ไปให้ API เช็คสิทธิ์ในตาราง project_member
        const res = await fetch(`/api/evaluate?projectId=${projectId}&targetId=${targetId}`);
        const data = await res.json();
        
        if (!res.ok) {
          // ถ้าหลังบ้านตอบกลับว่าไม่มีสิทธิ์ (403) หรือ Error อื่นๆ
          alert(data.error || "คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
          router.push('/dashboard');
          return;
        }

        if (data.alreadyDone) {
          setAlreadyDone(true);
        } else if (data.success) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        setLoading(false);
      }
    }
    initPage();
  }, [projectId, targetId, router]);

  // 2. ฟังก์ชันเมื่อกดเลือกคะแนน
  const handleAnswer = (point: number) => {
    const q = questions[currentIdx];
    const updated = [...userAnswers, { 
      questionId: q.id, 
      cat: q.cat, 
      points: point 
    }];
    
    setUserAnswers(updated);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitAll(updated);
    }
  };

  // 3. ส่งข้อมูลไปบันทึก (POST)
  const submitAll = async (finalAnswers: any[]) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId, 
          targetId, 
          results: finalAnswers 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      } else {
        alert("ประเมินเพื่อนร่วมทีมสำเร็จ!");
      }
      router.push('/dashboard'); 
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- กรณีที่ 1: กำลังโหลดข้อมูล/เช็คสิทธิ์ ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-gray-400">
      AUTHENTICATING...
    </div>
  );

  // --- กรณีที่ 2: เคยทำไปแล้ว ---
  if (alreadyDone) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="bg-white border-4 border-black p-10 rounded-[40px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-sm">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-black mb-4 uppercase">Completed!</h1>
        <p className="font-bold text-gray-600 mb-8 leading-relaxed">
          คุณได้ทำการประเมินเพื่อนคนนี้ไปแล้ว <br/> ขอบคุณสำหรับการสละเวลา
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 bg-yellow-400 border-4 border-black font-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    </div>
  );

  // --- กรณีที่ 3: กำลังส่งข้อมูล ---
  if (isSubmitting) return (
    <div className="h-screen flex items-center justify-center font-black text-blue-600 text-2xl animate-pulse">
      SAVING DATA...
    </div>
  );

  const q = questions[currentIdx];

  return (
    <div className="max-w-md mx-auto p-6 pt-12 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-3xl font-black text-black">PEER EVAL</h1>
          <div className="text-right">
            <span className="text-xs font-black bg-black text-white px-3 py-1 rounded-md">
              {currentIdx + 1} / {questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 border-2 border-black rounded-full h-3">
          <div 
            className="bg-green-400 h-full transition-all duration-500 rounded-full" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-8 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 min-h-[180px] flex items-center justify-center">
        <p className="text-xl font-black text-center">
          {q?.question}
        </p>
      </div>

      {/* Answer Buttons */}
      <div className="grid gap-3">
        {q?.ans && Object.entries(q.ans)
          .sort((a: any, b: any) => b[1] - a[1]) // เรียง 5 ไป 1
          .map(([label, val]: any) => (
            <button
              key={label}
              onClick={() => handleAnswer(val)}
              className="w-full py-4 bg-white border-4 border-black rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300 active:shadow-none active:translate-y-1 transition-all"
            >
              {label}
            </button>
        ))}
      </div>

      <div className="mt-10 text-center space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Peer ID: {targetId}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project: {projectId}</p>
      </div>
    </div>
  );
}