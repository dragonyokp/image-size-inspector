# Optiwise Web Image Inspector

เครื่องมือตรวจขนาดรูปภาพที่แสดงจริงบนเว็บไซต์ Public โดยใช้ Playwright เปิดเว็บใน viewport ที่เลือก แล้วอ่านขนาด rendered และขนาดต้นฉบับของรูปภาพ

## Deploy บน Render

1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไว้ที่ root ของ GitHub repository
2. สร้าง Render Web Service จาก repository นี้
3. เลือก Docker และใช้แผน Free
4. เปิด URL ที่ Render แสดงให้ใช้งาน

ระบบมี `GET /health` สำหรับตรวจสถานะ และ `POST /api/scan` สำหรับตรวจเว็บไซต์
