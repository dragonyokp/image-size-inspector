# Optiwise Image Inspector

Repository นี้รวม Web Inspector, API Server และ Chrome Extension ไว้ในชุดเดียวกัน

เครื่องมือตรวจรูปภาพและ Video ที่แสดงอยู่จริงบนเว็บไซต์ Public โดยใช้ Playwright เปิดเว็บใน viewport ที่เลือก แล้วเทียบขนาดที่พบกับ Website Specification ของ AWC, EGCO, MICRO, PTTGC, PTTGC SD, RABBIT และ TURTLE

ผู้ใช้วาง URL แล้วกดตรวจสอบ ระบบจะอ่าน `currentSrc` ของรูป Responsive, ขนาดต้นฉบับ, ขนาดที่แสดงจริง, Ratio และประเภทไฟล์ จากนั้นจัดกลุ่มเป็น Section เช่น Banner, News และ Gallery ปุ่ม Export PDF ใช้พิมพ์รายงานเป็น PDF เพื่อส่งให้ลูกค้า

ระบบตรวจ `<img>`, `<video>` และ CSS `background-image` ที่เป็นภาพของ Hero, Banner, Carousel หรือ Tile ที่แสดงจริง โดยกรองรูปที่ยังไม่โหลด รูปซ่อน และรูปที่ถูกตัดด้วย container ออก การตรวจจะมี hover sweep สั้น ๆ เพื่อจับรูปที่แสดงหลัง Hover หรือ Carousel เปลี่ยนสถานะ

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

## ติดตั้ง Extension

ไฟล์ Extension อยู่ใน Root เดียวกัน (`manifest.json`, `content.js`, `popup.html`, `icons/`) เพื่อให้ดาวน์โหลด Repository นี้แล้วใช้งานได้ทันที

1. ดาวน์โหลด Repository แล้วแตกไฟล์
2. เปิด `chrome://extensions`
3. เปิด Developer mode
4. กด Load unpacked
5. เลือกโฟลเดอร์นี้

Extension ใช้ตรวจรูปและ Video แบบเอาเมาส์ชี้บนหน้าเว็บปัจจุบัน ส่วน Web Inspector ใช้ตรวจเว็บไซต์จาก URL และทำรายงาน
