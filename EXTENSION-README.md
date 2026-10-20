# Image Size Inspector v1.0.3

Chrome/Edge Extension สำหรับตรวจขนาดรูปแบบ Inspector โดยไม่ทำ overlay ทั้งหน้าเป็นค่าเริ่มต้น

## ติดตั้งเพื่อทดลอง

1. แตกไฟล์ ZIP นี้ไว้ในเครื่อง
2. เปิด Chrome แล้วเข้า `chrome://extensions` หรือ Edge แล้วเข้า `edge://extensions`
3. เปิด **Developer mode**
4. กด **Load unpacked** แล้วเลือกโฟลเดอร์ที่มี `manifest.json`
5. เปิดหน้าเว็บไซต์ที่ต้องการตรวจ กดไอคอน Extension แล้วกดสวิตช์ให้เป็น **ON**

## วิธีใช้

- เปิด/ปิดโหมดตรวจจากสวิตช์เดียว โดย `OFF` คือปิด และ `ON` คือเปิด แล้วเลื่อนเมาส์ไปบน `<img>`, `<video>` หรือ visual tile ที่ใช้ background เฉพาะก้อน
- ตัวเลขกลางกรอบคือขนาดที่แสดงจริงบนหน้าเว็บ เช่น `1000 × 900 px` พร้อม Ratio
- ขยับเมาส์ออกจากรูปเพื่อซ่อนกรอบ
- กด `Esc` เพื่อปิดโหมดตรวจ

## หลักการตรวจ

- ใช้ `currentSrc` ก่อน `src` เพื่อให้ได้ไฟล์ที่ Browser เลือกจริงจาก `srcset`/`picture`
- ไม่ดึง `data-src` หรือ lazy-load placeholder มานับก่อนรูปโหลดและแสดงจริง
- ใช้ `naturalWidth`/`naturalHeight` เป็นขนาดต้นฉบับ
- ใช้ `getBoundingClientRect()` เป็นขนาดที่แสดงจริงบนหน้า
- ตรวจ `<img>` และ `<video>` ที่กำลังแสดงอยู่เท่านั้น
- ใช้ลำดับชั้นจริงใต้ pointer เพื่อไม่เลือกภาพที่ถูกซ่อนหรือถูก element อื่นบัง
- ตัดกรอบตาม viewport เพื่อไม่ให้ overlay หลุดออกนอกหน้าจอ
- รองรับรูปที่เพิ่มหลังจาก Hover หรือ Lazy load ด้วย DOM observer และการตรวจซ้ำแบบหน่วงเวลา
- ตรวจ full-width CSS background เฉพาะเมื่ออยู่ใน hero/banner/carousel และไม่ตรวจ header หรือ section ทั่วไป

## ข้อจำกัด

- Popup ที่ยังไม่ได้เปิดจะยังไม่ถูกตรวจ เพราะ Extension ตั้งใจตรวจสิ่งที่ผู้ใช้เห็นจริงในหน้านั้น
- หน้า `chrome://`, Chrome Web Store และหน้าระบบบางประเภทไม่อนุญาตให้ Extension อ่านข้อมูล
- ยังไม่มี Export PDF; ใช้ Web Image Report สำหรับทำรายงานลูกค้า
