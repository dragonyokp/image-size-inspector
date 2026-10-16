# Optiwise Web Image Inspector

เวอร์ชันนี้เป็นเว็บเต็มรูปแบบ: User วาง URL หน้าเว็บไซต์ แล้วระบบเปิดหน้าเว็บด้วย Browser จำลองเพื่ออ่านขนาดที่แสดงจริงของรูปภาพ วิดีโอ และ CSS background image

## วิธีนำไปใช้

อัปโหลดไฟล์ทั้ง 5 ไฟล์ไว้ที่หน้าแรกของ GitHub Repository เดียวกัน:

- `index.html`
- `server.js`
- `package.json`
- `Dockerfile`
- `render.yaml`

จากนั้นนำ Repository นี้ไปสร้างเป็น Render Web Service โดยเลือก Runtime เป็น Docker และกด Deploy ระบบจะได้ URL เดียวสำหรับใช้งาน ทั้งหน้าเว็บและ API อยู่ใน Service เดียวกัน

## ข้อจำกัด

- เวอร์ชันนี้ตรวจเว็บไซต์ที่เปิดได้โดยไม่ต้อง Login
- ไม่เก็บ URL หรือรูปภาพที่ตรวจ
- ไม่ควรใส่รหัสผ่านหรือข้อมูลลับในระบบ
- Free Web Service อาจใช้เวลาปลุกเครื่องเมื่อไม่มีการใช้งานระยะหนึ่ง
