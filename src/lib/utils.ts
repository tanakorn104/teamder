// lib/utils.ts

export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 3) - hash);
    }

    const colors = [
        // --- 5 สีเดิมของคุณ (Base Theme) ---
        '#D8D2C2', // Creamy Grey (color-1)
        '#BE8C74', // Soft Brown (color-2)
        '#B17457', // Terra Cotta (color-3)
        '#896C6C', // Warm Taupe (color-4)
        '#4A4947', // Deep Charcoal (color-5)

        // --- 5 สีใหม่ที่เพิ่มให้เข้ากัน (Complementary Earth Tones) ---
        '#626F47', // Moss Green (ดูเป็นธรรมชาติ เข้ากับงานวิจัย/วิชาการ)
        '#798645', // Olive (โทนอุ่น ช่วยให้ Tag ดูเด่นแต่ไม่โดด)
        '#9A7E6F', // Muted Clay (เชื่อมระหว่างน้ำตาลและเทา)
        '#545B64', // Slate Blue-Grey (ให้ความรู้สึก Tech/Engineering)
        '#A68966'  // Golden Oak (เพิ่มความสว่างแบบหรูหรา)
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};