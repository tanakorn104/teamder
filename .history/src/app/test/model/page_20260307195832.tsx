'use client';
import { useState } from 'react';

export default function TeamPredictionPage() {
    const [members, setMembers] = useState([
        { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5, Lead: 0.5, Plan: 0.5, Support: 0.5, Skill: 0.5, Env_Type: 1 }
    ]);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // ฟังก์ชันอัปเดตค่าในตัวแปร members
    const updateMember = (index: number, field: string, value: string) => {
        const newMembers = [...members] as any;
        newMembers[index][field] = parseFloat(value);
        setMembers(newMembers);
    };

    // ฟังก์ชันเพิ่มสมาชิกใหม่
    const addMember = () => {
        setMembers([...members, { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5, Lead: 0.5, Plan: 0.5, Support: 0.5, Skill: 0.5, Env_Type: 1 }]);
    };

    const handlePredict = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/test/model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert('Error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Team Formation Predictor</h1>
            
            <div className="space-y-6">
                {members.map((member, index) => (
                    <div key={index} className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-blue-600 mb-4">Member #{index + 1}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {['O', 'C', 'E', 'A', 'N', 'Lead', 'Plan', 'Support', 'Skill'].map((field) => (
                                <div key={field}>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">{field}</label>
                                    <input 
                                        type="number" step="0.01" min="0" max="1"
                                        value={member[field as keyof typeof member]}
                                        onChange={(e) => updateMember(index, field, e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={addMember} className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-all">
                    + Add Member
                </button>
                <button 
                    onClick={handlePredict}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-all"
                >
                    {loading ? 'Analyzing Team...' : 'Predict Performance'}
                </button>
            </div>

            {result && (
                <div className="mt-10 p-6 bg-white rounded-xl border-t-4 border-green-500 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Prediction Result</h2>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}