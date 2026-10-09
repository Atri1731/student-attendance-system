import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dns from "node:dns";


dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  classroom: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  educationYear: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  rollNo: { type: String, required: true, uppercase: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ["Present", "Absent"], required: true },
  markedBy: { type: String, default: "teacher" },
  markedAt: { type: Date, default: Date.now }
}, { timestamps: true });
attendanceSchema.index({ student: 1, dateKey: 1 }, { unique: true });

const Student = mongoose.model("Student", studentSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in first." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

function allowRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ message: "You do not have permission to access this feature." });
    next();
  };
}

function validDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

app.get("/api/health", (_req, res) => res.json({ ok: true, message: "Attendance API is running" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, classroom, department, rollNo, educationYear, password } = req.body;
    if (![name, classroom, department, rollNo, educationYear, password].every(v => typeof v === "string" && v.trim())) {
      return res.status(400).json({ message: "Please complete all student fields." });
    }
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    const normalizedRoll = rollNo.trim().toUpperCase();
    if (await Student.findOne({ rollNo: normalizedRoll })) {
      return res.status(409).json({ message: "That roll number is already registered." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.create({
      name: name.trim(), classroom: classroom.trim(), department: department.trim(),
      rollNo: normalizedRoll, educationYear: educationYear.trim(), passwordHash
    });
    res.status(201).json({
      message: "Student account created. You can now log in.",
      student: {
        id: student._id, name: student.name, classroom: student.classroom,
        department: student.department, rollNo: student.rollNo, educationYear: student.educationYear
      }
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That roll number is already registered." });
    console.error(error);
    res.status(500).json({ message: "Could not create student account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const rollNo = req.body.rollNo?.trim().toUpperCase();
    const { password } = req.body;
    const student = await Student.findOne({ rollNo });
    if (!student || !password || !(await bcrypt.compare(password, student.passwordHash))) {
      return res.status(401).json({ message: "Invalid roll number or password." });
    }
    const profile = {
      id: student._id.toString(), name: student.name, classroom: student.classroom,
      department: student.department, rollNo: student.rollNo, educationYear: student.educationYear, role: "student"
    };
    res.json({ message: "Login successful.", token: signToken({ id: profile.id, role: "student" }), user: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not log in." });
  }
});

app.post("/api/auth/teacher-login", async (req, res) => {
  const { username, password } = req.body;
  if (!process.env.TEACHER_USERNAME || !process.env.TEACHER_PASSWORD) {
    return res.status(500).json({ message: "Teacher credentials are not configured on the server." });
  }
  if (username !== process.env.TEACHER_USERNAME || password !== process.env.TEACHER_PASSWORD) {
    return res.status(401).json({ message: "Invalid teacher username or password." });
  }
  const user = { name: "Teacher", username, role: "teacher" };
  res.json({ message: "Teacher login successful.", token: signToken({ role: "teacher", username }), user });
});

app.get("/api/students", auth, allowRole("teacher"), async (_req, res) => {
  try {
    const students = await Student.find().select("name classroom department rollNo educationYear").sort({ classroom: 1, rollNo: 1 }).lean();
    res.json({ students, total: students.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load students." });
  }
});

app.get("/api/attendance", auth, allowRole("teacher"), async (req, res) => {
  try {
    const date = req.query.date;
    if (!validDateKey(date)) return res.status(400).json({ message: "Provide a date in YYYY-MM-DD format." });
    const records = await Attendance.find({ dateKey: date }).select("student rollNo dateKey status markedAt").lean();
    res.json({ date, records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load attendance for this date." });
  }
});

app.post("/api/attendance/bulk", auth, allowRole("teacher"), async (req, res) => {
  try {
    const { date, entries } = req.body;
    if (!validDateKey(date)) return res.status(400).json({ message: "Select a valid attendance date." });
    if (!Array.isArray(entries) || entries.length === 0) return res.status(400).json({ message: "There are no attendance entries to save." });

    const ids = entries.map(e => String(e.studentId || ""));
    if (ids.some(id => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: "An attendance entry contains an invalid student." });
    if (entries.some(e => !["Present", "Absent"].includes(e.status))) return res.status(400).json({ message: "Every student must be marked Present or Absent." });

    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== ids.length) return res.status(400).json({ message: "Duplicate student entries were found." });
    const students = await Student.find({ _id: { $in: uniqueIds } }).select("_id rollNo").lean();
    if (students.length !== uniqueIds.length) return res.status(400).json({ message: "One or more students no longer exist. Refresh the page." });
    const studentById = new Map(students.map(s => [String(s._id), s]));

    const operations = entries.map(entry => {
      const student = studentById.get(String(entry.studentId));
      return {
        updateOne: {
          filter: { student: student._id, dateKey: date },
          update: { $set: { rollNo: student.rollNo, status: entry.status, markedBy: req.user.username || "teacher", markedAt: new Date() } },
          upsert: true
        }
      };
    });
    await Attendance.bulkWrite(operations, { ordered: true });
    res.json({ message: `Attendance saved for ${entries.length} students on ${date}.`, saved: entries.length, date });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save attendance. Please try again." });
  }
});

app.get("/api/attendance/me", auth, allowRole("student"), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("name classroom department rollNo educationYear").lean();
    if (!student) return res.status(404).json({ message: "Student account not found." });
    const records = await Attendance.find({ student: student._id }).select("dateKey status markedAt").sort({ dateKey: -1 }).limit(365).lean();
    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    res.json({ student, records, summary: { present, absent, total: records.length, percentage: records.length ? Math.round((present / records.length) * 100) : 0 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load your attendance history." });
  }
});

const PORT = process.env.PORT || 5000;
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in backend/.env");
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
