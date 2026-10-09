# Student Attendance System — Updated Mentor Version

Stack: React + Vite + Tailwind CSS + Node.js + Express + MongoDB Atlas + JWT.

## Features
- Student login and student account registration.
- Registration fields: name, classroom, department, roll number, education year, password.
- Teacher login (credentials configured in backend `.env`).
- Teacher dashboard: total students, date selection, student table, Present/Absent controls, save attendance for the selected date.
- Student dashboard: own profile and own attendance history only.
- Password hashing, JWT auth, role-based API protection.
- One attendance record per student per date.

## Requirements
Install Node.js LTS and VS Code. Create a MongoDB Atlas database or use a local MongoDB server.

## 1. Configure backend
Open a terminal at this folder:
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and fill in your real MongoDB URI and a long random JWT secret. Change the teacher username/password from the example values before using the app.

Run:
```bash
npm run dev
```
Expected output:
```text
MongoDB connected
Server running on http://localhost:5000
```

## 2. Configure frontend
Open a second terminal from the project root:
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints, normally `http://localhost:5173`.

## 3. Test as a student
On the login page select Student, click Create account, fill the student details and create the account. Log in with that roll number and password. Students can only see their own attendance history.

## 4. Test as a teacher
On the login page select Teacher and use the credentials from `backend/.env`:
- `TEACHER_USERNAME`
- `TEACHER_PASSWORD`

Register two or more demo students first. Log in as teacher, select the attendance date, set each student's status to Present or Absent, and click Save Attendance.

## 5. MongoDB Atlas notes
- Create a database user.
- Add your current IP in Network Access.
- Copy the application connection string and replace the username/password/cluster.
- URL-encode special characters in the database password.
- Never commit `.env` to GitHub.

## API routes
- `POST /api/auth/register` — student registration
- `POST /api/auth/login` — student login
- `POST /api/auth/teacher-login` — teacher login
- `GET /api/students` — teacher only
- `GET /api/attendance?date=YYYY-MM-DD` — teacher only, selected date
- `POST /api/attendance/bulk` — teacher only, save selected date for multiple students
- `GET /api/attendance/me` — logged-in student only, own history

For real institutional use, configure HTTPS, secure secrets, rate limiting, backups, and appropriate privacy controls.
