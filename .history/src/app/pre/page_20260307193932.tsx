import { db } from '@/lib/db';

// ฟังก์ชันดึงข้อมูลจาก Database (รันบน Server เท่านั้น)
async function getTestData() {
  try {
    const connection = await db();
    
    // ทดสอบดึงข้อมูลเวลาจาก MySQL หรือจะลอง SELECT * FROM ชื่อตาราง ของคุณก็ได้
    const [rows]: any = await connection.query('SELECT NOW() as currentTime, VERSION() as mysqlVersion');
    
    await connection.end();
    return { success: true, data: rows[0] };
  } catch (error: any) {
    console.error('Database Error:', error);
    return { success: false, error: error.message };
  }
}

export default async function TestPage() {
  const result = await getTestData();

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          Teamder DB Status
        </h1>

        {result.success ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600 font-medium">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span>Connected Successfully!</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm font-mono text-gray-600">
              <p><span className="font-bold text-gray-800">Current Time:</span> {result.data.currentTime.toString()}</p>
              <p><span className="font-bold text-gray-800">MySQL Version:</span> {result.data.mysqlVersion}</p>
            </div>

            <p className="text-xs text-gray-400 italic">
              * ข้อมูลชุดนี้ถูกดึงโดยตรงจาก MySQL ผ่าน cloudflared 3307
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-red-600 font-medium">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Connection Failed</span>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-sm text-red-700 break-words">
              {result.error}
            </div>
            <p className="text-xs text-gray-500">
              ตรวจสอบว่าได้รัน cloudflared และตั้งค่า .env.local ถูกต้องแล้ว
            </p>
          </div>
        )}

        <button 
          onClick={undefined} // เป็น Server Component ปุ่มนี้ต้องใช้หน้าอื่นถ้าจะทำ Refresh
          className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Check Again
        </button>
      </div>
    </main>
  );
}