# Optiwise Web Asset Report

เครื่องมือตรวจ Banner, Hero, Popup และวิดีโอที่แสดงจริงบนเว็บไซต์ Public โดยใช้ Playwright เปิดเว็บใน viewport ที่เลือก แล้วเทียบขนาดกับ Website Specification ของ AWC, EGCO, MICRO, PTTGC, PTTGC SD, RABBIT และ TURTLE

ผู้ใช้วาง URL เลือกมาตรฐานบริษัท แล้วกดตรวจสอบ ระบบจะแสดงตัวอย่าง รูปแบบที่ตรวจพบ ขนาดที่แสดงจริง ขนาดต้นฉบับ สเปกที่คาดหวัง และผลผ่าน/ไม่ตรง/ต้องตรวจเพิ่ม ปุ่ม Export PDF ใช้พิมพ์รายงานเป็น PDF เพื่อส่งให้ลูกค้า

## Deploy บน Render

1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไว้ที่ root ของ GitHub repository
2. สร้าง Render Web Service จาก repository นี้
3. เลือก Docker และใช้แผน Free
4. เปิด URL ที่ Render แสดงให้ใช้งาน

ระบบมี `GET /health` สำหรับตรวจสถานะ และ `POST /api/scan` สำหรับตรวจเว็บไซต์
