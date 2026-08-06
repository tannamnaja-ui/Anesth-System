# Anesth System

ระบบบันทึกข้อมูลวิสัญญี — Login + ตั้งค่าการเชื่อมต่อฐานข้อมูล + หน้าทะเบียนผู้ป่วย

## โครงสร้างโปรเจกต์

```
backend/    Express API (auth, settings, patients)
frontend/   React + Vite (Login, Settings, Index)
```

## วิธีรัน (production-style, พอร์ตเดียว)

Backend serve ทั้ง API และหน้าเว็บ (frontend build) รวมกันที่พอร์ตเดียว: **http://localhost:8020**

```
cd frontend
npm install   # ครั้งแรกครั้งเดียว
npm run build # สร้าง frontend/dist

cd ../backend
npm install   # ครั้งแรกครั้งเดียว
npm start     # รันที่ http://localhost:8020 (ทั้ง API และหน้าเว็บ)
```

ทุกครั้งที่แก้โค้ด frontend ต้องรัน `npm run build` ใหม่ (backend จะ serve จากโฟลเดอร์ `frontend/dist`)

เปิดเบราว์เซอร์ที่ http://localhost:8020 — จะเจอหน้า Login ก่อน

## วิธีรัน (development, แก้ frontend บ่อย)

เปิด 2 terminal — backend `npm run dev` (พอร์ต 8020) และ frontend `npm run dev` (พอร์ต 5173, proxy ไป 8020 ให้อัตโนมัติ) แล้วเปิดที่ http://localhost:5173

## หน้าตั้งค่าการเชื่อมต่อ

กดปุ่ม "ตั้งค่าการเชื่อมต่อ" ที่หน้า Login เพื่อ:
1. เลือกชนิดฐานข้อมูล (MySQL / PostgreSQL)
2. กรอกข้อมูลการเชื่อมต่อโดยตรง: IP Server, Port, Database, Username, Password
3. กด "ทดสอบการเชื่อมต่อ" เพื่อเช็คว่าเชื่อมต่อได้จริง
4. กด "บันทึกข้อมูลเชื่อมต่อ" — ระบบจะบันทึก host/port/database/username/password
   ไว้ที่ `backend/config/connection.json` (ไม่ถูกส่งกลับไปแสดงที่หน้าเว็บหลังบันทึก) แล้วเด้งกลับไปหน้า Login

## Login

ใช้ตาราง `officer` ในฐานข้อมูลที่ตั้งค่าไว้ โดยตรวจสอบกับ
`officer.officer_login_name` และ `officer.password`
(รองรับทั้งรหัสผ่านที่เก็บเป็น plain text และ MD5 — ดู `backend/routes/auth.js`)

## หน้า Index (หลัง login)

- ค้นหาผู้ป่วยด้วย AN / HN / ช่วงวันที่
- เมนูซ้าย "ทะเบียนผู้ป่วย" ดึงจากตาราง `operation_list`
  **หมายเหตุ:** query ใน `backend/routes/patients.js` (`GET /search`) เป็น placeholder
  (คอลัมน์ `an`, `hn`, `patient_name`, `operation_date`) — ต้องแก้ให้ตรงกับ schema จริงของ `operation_list`
- คลิกชื่อผู้ป่วยเพื่อเปิดรายละเอียด พร้อม 4 แถบเมนู:
  1. New Anesth new form
  2. Postop. visit รายเคส
  3. ใส่ท่อช่วยหายใจนอกสถานที่
  4. เลื่อน/งดผ่าตัด

  เนื้อหาของทั้ง 4 แถบยังเป็น placeholder ("อยู่ระหว่างพัฒนา") — รอ spec/ฟอร์มจริงของแต่ละแถบ
