# Optiwise Image Inspector

เครื่องมือตรวจรูปภาพและ Video ที่แสดงอยู่จริงบนเว็บไซต์ Public โดยใช้ Playwright เปิดเว็บใน viewport ที่เลือก แล้วเทียบขนาดที่พบกับ Website Specification ของ AWC, EGCO, MICRO, PTTGC, PTTGC SD, RABBIT และ TURTLE

ผู้ใช้วาง URL แล้วกดตรวจสอบ ระบบจะอ่าน `currentSrc` ของรูป Responsive, ขนาดต้นฉบับ, ขนาดที่แสดงจริง, Ratio และประเภทไฟล์ จากนั้นจัดกลุ่มเป็น Section เช่น Banner, News และ Gallery ปุ่ม Export PDF ใช้พิมพ์รายงานเป็น PDF เพื่อส่งให้ลูกค้า

ระบบตั้งใจตรวจเฉพาะ `<img>` และ `<video>` ที่แสดงอยู่จริง ไม่รวม CSS `background-image` เพื่อไม่ให้รายการรกและลดเวลาโหลด การตรวจจะมี hover sweep สั้น ๆ เพื่อจับรูปที่แสดงหลัง Hover หรือ Carousel เปลี่ยนสถานะ

## Deploy บน Render

1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไว้ที่ root ของ GitHub repository
2. สร้าง Render Web Service จาก repository นี้
3. เลือก Docker และใช้แผน Free
4. เปิด URL ที่ Render แสดงให้ใช้งาน

ระบบมี `GET /health` สำหรับตรวจสถานะ และ `POST /api/scan` สำหรับตรวจเว็บไซต์

## ใช้ร่วมกับ GitHub Pages

หน้า GitHub Pages เป็น Static Site จึงต้องให้หน้าเว็บเรียก API ที่ Deploy บน Render แยกต่างหาก

- API ที่คาดไว้: `https://image-size-inspector.onrender.com`
- ตรวจสถานะ API: `https://image-size-inspector.onrender.com/health`
- ตั้งค่า CORS ผ่าน `CORS_ORIGINS` เป็น `https://dragonyokp.github.io`

ถ้า URL ของ Render เปลี่ยน ให้แก้ค่า `optiwise-api-base` ใน `index.html` ให้ตรงกับ URL จริงก่อน Deploy หน้า GitHub Pages
