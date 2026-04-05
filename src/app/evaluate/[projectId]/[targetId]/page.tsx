"use client"
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoPersonCircleOutline, IoBriefcaseOutline } from "react-icons/io5";

export default function EvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const { projectId, targetId } = params;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State สำหรับเก็บข้อมูลที่ดึงมาจาก API
  const [metaInfo, setMetaInfo] = useState({
      projectTitle: "Loading Project...",
      evaluatorName: "You",
      targetName: "Loading Name..."
  });

  useEffect(() => {
    async function initPage() {
      try {
        const res = await fetch(`/api/evaluate?projectId=${projectId}&targetId=${targetId}`);
        const data = await res.json();
        
        if (!res.ok) {
          alert(data.error || "คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
          router.push('/'); // เปลี่ยนเป็น / เพื่อความชัวร์ว่ากลับหน้าหลัก
          return;
        }

        if (data.alreadyDone) {
          setAlreadyDone(true);
        } else if (data.success) {
          setQuestions(data.questions);
          if (data.meta) setMetaInfo(data.meta); // เก็บข้อมูลมาโชว์
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
        router.push('/'); 
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black text-gray-400 tracking-widest animate-pulse">
      AUTHENTICATING...
    </div>
  );

  if (alreadyDone) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F4F4F0]">
      <div className="bg-white border-4 border-black p-10 rounded-[40px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-sm">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-black mb-4 uppercase">Completed!</h1>
        <p className="font-bold text-gray-600 mb-8 leading-relaxed">
          คุณได้ทำการประเมินเพื่อนคนนี้ <br/>ในโปรเจกต์นี้ไปเรียบร้อยแล้ว
        </p>
        <button 
          onClick={() => router.push('/')}
          className="w-full py-4 bg-yellow-400 border-4 border-black font-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );

  if (isSubmitting) return (
    <div className="h-screen flex items-center justify-center font-black text-blue-600 text-2xl animate-bounce tracking-widest">
      SAVING DATA...
    </div>
  );

  const q = questions[currentIdx];

  return (
    <div className=" min-h-screen">
      <div className="max-w-md mx-auto p-6 pt-12 pb-24">
        
        {/* --- Header Section (ข้อมูลคนประเมิน & โปรเจกต์) --- */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-end">
            <h1 className="text-4xl font-black text-black uppercase">Peer Eval</h1>
            <span className="text-sm font-black bg-black text-white px-3 py-1.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(100,100,100,1)]">
              {currentIdx + 1} / {questions.length}
            </span>
          </div>

          {/* Info Card แบบ Brutalism */}
          <div className="bg-[#FFE066] border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-sm border-b-2 border-black/20 pb-2">
                <IoBriefcaseOutline className="text-lg" />
                <span className="truncate flex-1">Project: <span className="font-black">{metaInfo.projectTitle}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <p className="text-black/60 font-bold uppercase tracking-wider mb-1">Evaluating</p>
                  <p className="font-black bg-white border-2 border-black px-2 py-1 rounded-md truncate shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {metaInfo.targetName}
                  </p>
                </div>
                <div>
                  <p className="text-black/60 font-bold uppercase tracking-wider mb-1">Evaluator</p>
                  <p className="font-black bg-white border-2 border-black px-2 py-1 rounded-md truncate shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {metaInfo.evaluatorName}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white border-4 border-black rounded-full h-4 mt-2">
            <div 
              className="bg-[#FF90E8] border-r-4 border-black h-full transition-all duration-500 rounded-l-sm" 
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* --- Question Card --- */}
        <div className="bg-white p-8 rounded-[32px] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mb-10 min-h-[180px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-400 rounded-full border-4 border-black"></div>
          <p className="text-2xl font-black text-center leading-tight z-10">
            {q?.question}
          </p>
        </div>

        {/* --- Answer Buttons --- */}
        <div className="grid gap-4">
          {q?.ans && Object.entries(q.ans)
            .sort((a: any, b: any) => b[1] - a[1]) // เรียง 5 ไป 1
            .map(([label, val]: any) => (
              <button
                key={label}
                onClick={() => handleAnswer(val)}
                className="w-full py-5 px-6 bg-white border-4 border-black rounded-2xl font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#90FFB9] active:shadow-none active:translate-y-1.5 active:translate-x-1.5 transition-all text-left flex items-center justify-between group"
              >
                <span>{label}</span>
                <span className="w-6 h-6 border-2 border-black rounded-full group-hover:bg-black transition-colors"></span>
              </button>
          ))}
        </div>

      </div>
    </div>
  );
}