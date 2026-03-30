// lib/utils.ts

export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 3) - hash);
    }

    const colors = [
        // --- 5 สีเดิมของคุณ (Base Theme) ---
       '#FF316D', // Vibrant Pink (เดิม) - อ่านเข้ม/ขาวได้
        '#FFCF4E', // Bright Yellow (เดิม) - **แนะนำตัวอักษรสีดำ**
        '#00DA9C', // Teal Green (เดิม) - อ่านเข้ม/ขาวได้
        '#008DB6', // Cerulean Blue (เดิม) - อ่านเข้ม/ขาวได้
        '#FFA23E', // Bright Orange (เดิม) - อ่านเข้ม/ขาวได้

        // --- 5 สีใหม่ที่เพิ่มให้เข้าโทน (Vibrant & Readable Completers) ---
        '#9C27B0', // Vivid Purple (ม่วงสด) - อ่านขาวได้ดี
        '#4CAF50', // Lime Green (เขียวมะนาวเข้ม) - อ่านเข้ม/ขาวได้
        '#FF5722', // Deep Orange (ส้มแดง) - อ่านขาวได้ดี
        '#00BCD4', // Cyan Blue (ฟ้าไซแอน) - **แนะนำตัวอักษรสีดำ**
        '#EA1E63'  // Deep Pink/Rose (ชมพูเข้ม) - อ่านขาวได้ดี
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};