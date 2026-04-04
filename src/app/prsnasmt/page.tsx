"use client"
import { useEffect, useState } from "react";

export default function Page() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/prsnasmt`);
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleNext = (id: string, point: number, category: string) => {
    const updated = [...userAnswers, { questionId: id, cat: category, points: point }];
    setUserAnswers(updated);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsFinished(true);
      submitAnswers(updated);
    }
  };

  const submitAnswers = async (finalAnswers: any[]) => {
    try {
      const res = await fetch("/api/prsnasmt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: finalAnswers }),
      });
      if (res.ok) alert("บันทึกสำเร็จ!");
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังจัดเตรียมคำถามสั้น...</div>;
  if (isFinished) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-blue-600">วิเคราะห์ผลเรียบร้อย!</div>;

  const q = questions[currentIdx];
  return (
    <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{q?.cat}</span>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                 style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
          </div>
          <p className="text-[10px] mt-1 text-gray-400">ข้อที่ {currentIdx + 1} จาก {questions.length}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 min-h-[160px] flex items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-gray-700">{q?.question}</h2>
        </div>

        <div className="grid gap-3">
          {q?.ans && Object.entries(q.ans).map(([label, val]: any) => (
            <button key={label} onClick={() => handleNext(q.id, val, q.cat)}
              className="w-full bg-white border-2 border-gray-900 py-4 rounded-2xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}