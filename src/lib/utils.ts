// lib/utils.ts

export const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 3) - hash);
    }

    // เก็บเป็นชุดสี { พื้นหลังโปร่งใส 20%, ขอบโปร่งใส 40%, ตัวอักษรสีทึบ }
    // สำหรับสีสว่างอย่างเหลืองหรือฟ้า จะใช้ตัวอักษรเฉดสีเดียวกันที่เข้มขึ้นแทนสีดำ เพื่อให้ดูพรีเมียมและเข้าโทน
    const colors = [
       { bg: '#FF316D20', border: '#FF316D40', text: '#FF316D' }, // Vibrant Pink
       { bg: '#FFCF4E20', border: '#FFCF4E60', text: '#B08816' }, // Bright Yellow (ปรับ Text ให้เป็นสีทองเข้มเพื่อให้อ่านง่าย)
       { bg: '#00DA9C20', border: '#00DA9C40', text: '#00966B' }, // Teal Green (ปรับ Text เข้ม)
       { bg: '#008DB620', border: '#008DB640', text: '#008DB6' }, // Cerulean Blue
       { bg: '#FFA23E20', border: '#FFA23E40', text: '#C76A00' }, // Bright Orange (ปรับ Text เป็นส้มอิฐ)
       { bg: '#9C27B020', border: '#9C27B040', text: '#9C27B0' }, // Vivid Purple
       { bg: '#4CAF5020', border: '#4CAF5040', text: '#2E7D32' }, // Lime Green (ปรับ Text เขียวเข้ม)
       { bg: '#FF572220', border: '#FF572240', text: '#D84315' }, // Deep Orange
       { bg: '#00BCD420', border: '#00BCD440', text: '#008394' }, // Cyan Blue (ปรับ Text ฟ้าเข้ม)
       { bg: '#EA1E6320', border: '#EA1E6340', text: '#EA1E63' }  // Deep Pink
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};