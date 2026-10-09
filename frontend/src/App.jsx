import {useCallback, useEffect, useMemo, useState} from "react";
import {
  GraduationCap,
  LogIn,
  LogOut,
  UserRound,
  CalendarDays,
  CheckCircle2,
  XCircle,
  History,
  Users,
  ShieldCheck,
  LoaderCircle,
  BookOpen,
  Building2,
  Search,
  RefreshCw,
  ClipboardCheck,
  CircleHelp,
  Eye,
  EyeOff,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function request(path, options = {}, token = "") {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

const blankRegistration = {
  name: "",
  classroom: "",
  department: "Computer Engineering",
  rollNo: "",
  educationYear: "1st Year",
  password: "",
};

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("attendanceToken") || "",
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("attendanceUser") || "null");
    } catch {
      return null;
    }
  });
  const [loginRole, setLoginRole] = useState("student");
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({rollNo: "", password: ""});
  const [teacherForm, setTeacherForm] = useState({username: "", password: ""});
  const [registration, setRegistration] = useState(blankRegistration);
  const [message, setMessage] = useState({text: "", type: ""});
  const [busy, setBusy] = useState(false);

  const notify = useCallback(
    (text, type = "success") => setMessage({text, type}),
    [],
  );

  function storeSession(data) {
    localStorage.setItem("attendanceToken", data.token);
    localStorage.setItem("attendanceUser", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }


function logout() {
  // Clear saved login session
  localStorage.removeItem("attendanceToken");
  localStorage.removeItem("attendanceUser");

  // Clear student and teacher login fields
  setLoginForm({ rollNo: "", password: "" });
  setTeacherForm({ username: "", password: "" });

  // Clear registration fields and password visibility messages
  setRegistration(blankRegistration);
  setLoginRole("student");
  setAuthMode("login");
  setMessage({ text: "", type: "" });

  // Clear current session
  setToken("");
  setUser(null);
}


  async function submitStudentLogin(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({text: "", type: ""});
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      storeSession(data);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitTeacherLogin(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({text: "", type: ""});
    try {
      const data = await request("/auth/teacher-login", {
        method: "POST",
        body: JSON.stringify(teacherForm),
      });
      storeSession(data);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitRegistration(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({text: "", type: ""});
    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(registration),
      });
      notify(data.message);
      setLoginForm({rollNo: registration.rollNo.toUpperCase(), password: ""});
      setRegistration(blankRegistration);
      setAuthMode("login");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-4 sm:p-8">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[.9fr_1.1fr]">
          <aside className="hidden flex-col justify-between bg-indigo-800 p-10 text-white lg:flex">
            <div>
              <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <GraduationCap size={32} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-indigo-200">
                Campus Portal
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Attendance made simple.
              </h1>
              <p className="mt-4 max-w-sm leading-7 text-indigo-100">
                A single place to manage student information and keep daily
                attendance records organized.
              </p>
            </div>
            <div className="space-y-4 text-sm text-indigo-100">
              <Feature
                icon={<ShieldCheck size={18} />}
                text="Role-based student and teacher access"
              />
              <Feature
                icon={<ClipboardCheck size={18} />}
                text="Daily Present / Absent tracking"
              />
              <Feature
                icon={<History size={18} />}
                text="Attendance history saved in the database"
              />
            </div>
            <p className="text-xs text-indigo-200">
              Student Attendance Management System
            </p>
          </aside>

          <section className="flex items-center justify-center p-5 sm:p-10">
            <div className="w-full max-w-xl">
              <div className="mb-7 flex items-center gap-3 lg:hidden">
                <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                  <GraduationCap size={26} />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900">
                    Campus Attendance
                  </h1>
                  <p className="text-xs text-slate-500">
                    Student management portal
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-indigo-700">WELCOME</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {authMode === "register"
                  ? "Create student account"
                  : "Sign in to continue"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {authMode === "register"
                  ? "Enter your student details to create an account."
                  : "Choose your account type and enter your details."}
              </p>

              {authMode === "login" && (
                <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <button
                  onClick={() => {
  setLoginRole("student");
  setTeacherForm({ username: "", password: "" });
  setMessage({ text: "", type: "" });
}}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ${loginRole === "student" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
                  >
                    <UserRound size={17} /> Student
                  </button>
                  <button
                    onClick={() => {
                      setLoginRole("teacher");
                      setMessage({text: "", type: ""});
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ${loginRole === "teacher" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
                  >
                    <ShieldCheck size={17} /> Teacher
                  </button>
                </div>
              )}

              {authMode === "register" ? (
                <form onSubmit={submitRegistration} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Student name"
                      value={registration.name}
                      onChange={(v) =>
                        setRegistration((p) => ({...p, name: v}))
                      }
                      placeholder="Full name"
                    />
                    <Field
                      label="Roll number"
                      value={registration.rollNo}
                      onChange={(v) =>
                        setRegistration((p) => ({
                          ...p,
                          rollNo: v.toUpperCase(),
                        }))
                      }
                      placeholder="e.g. CE001"
                    />
                    <Field
                      label="Classroom"
                      value={registration.classroom}
                      onChange={(v) =>
                        setRegistration((p) => ({...p, classroom: v}))
                      }
                      placeholder="e.g. CE-A"
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Department
                      </label>
                      <select
                        required
                        value={registration.department}
                        onChange={(e) =>
                          setRegistration((p) => ({
                            ...p,
                            department: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      >
                        <option>Computer Engineering</option>
                        <option>Information Technology</option>
                        <option>Mechanical Engineering</option>
                        <option>Civil Engineering</option>
                        <option>Electrical Engineering</option>
                        <option>Electronics Engineering</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Education year
                      </label>
                      <select
                        required
                        value={registration.educationYear}
                        onChange={(e) =>
                          setRegistration((p) => ({
                            ...p,
                            educationYear: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      >
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <Field
                      label="Create password"
                      type="password"
                      value={registration.password}
                      onChange={(v) =>
                        setRegistration((p) => ({...p, password: v}))
                      }
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <Message message={message} />
                  <button
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 py-3.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <UserRound size={18} />
                    )}{" "}
                    Create Account
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setMessage({text: "", type: ""});
                      }}
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      Back to login
                    </button>
                  </p>
                </form>
              ) : loginRole === "student" ? (
                <form onSubmit={submitStudentLogin} className="mt-6 space-y-4">
                  <Field
                    label="Roll number"
                    value={loginForm.rollNo}
                    onChange={(v) =>
                      setLoginForm((p) => ({...p, rollNo: v.toUpperCase()}))
                    }
                    placeholder="Enter your roll number"
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={loginForm.password}
                    onChange={(v) => setLoginForm((p) => ({...p, password: v}))}
                    placeholder="Enter your password"
                  />
                  <Message message={message} />
                  <button
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 py-3.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <LogIn size={18} />
                    )}{" "}
                    Student Login
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    New student?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setMessage({text: "", type: ""});
                      }}
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={submitTeacherLogin} className="mt-6 space-y-4">
                  <Field
                    label="Teacher username"
                    value={teacherForm.username}
                    onChange={(v) =>
                      setTeacherForm((p) => ({...p, username: v}))
                    }
                    placeholder="Enter teacher username"
                  />
                  <Field
                    label="Teacher password"
                    type="password"
                    value={teacherForm.password}
                    onChange={(v) =>
                      setTeacherForm((p) => ({...p, password: v}))
                    }
                    placeholder="Enter teacher password"
                  />
                  <Message message={message} />
                  <button
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 py-3.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <ShieldCheck size={18} />
                    )}{" "}
                    Teacher Login
                  </button>
                  {/* <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    Teacher credentials are configured in the backend .env file.
                    Change the sample password before using this project.
                  </p> */}
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return user.role === "teacher" ? (
    <TeacherDashboard
      user={user}
      token={token}
      onLogout={logout}
      notify={notify}
      message={message}
      setMessage={setMessage}
    />
  ) : (
    <StudentDashboard
      user={user}
      token={token}
      onLogout={logout}
      notify={notify}
      message={message}
      setMessage={setMessage}
    />
  );
}

function TeacherDashboard({
  user,
  token,
  onLogout,
  notify,
  message,
  setMessage,
}) {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(today());
  const [statuses, setStatuses] = useState({});
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [classFilter, setClassFilter] = useState("All classrooms");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(
    async (selectedDate = date) => {
      setLoading(true);
      setMessage({text: "", type: ""});
      try {
        const [studentData, attendanceData] = await Promise.all([
          request("/students", {}, token),
          request(
            `/attendance?date=${encodeURIComponent(selectedDate)}`,
            {},
            token,
          ),
        ]);
        setStudents(studentData.students);
        const next = {};
        studentData.students.forEach((s) => {
          next[s._id || s.id] = "Present";
        });
        attendanceData.records.forEach((r) => {
          next[String(r.student)] = r.status;
        });
        setStatuses(next);
      } catch (err) {
        notify(err.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [token, date, notify, setMessage],
  );

  useEffect(() => {
    loadData(date);
  }, []); // initial load; date changes use the date input handler

  async function changeDate(nextDate) {
    setDate(nextDate);
    await loadData(nextDate);
  }

  const classrooms = useMemo(
    () => [...new Set(students.map((s) => s.classroom).filter(Boolean))].sort(),
    [students],
  );
  const departments = useMemo(
    () =>
      [...new Set(students.map((s) => s.department).filter(Boolean))].sort(),
    [students],
  );
  const visibleStudents = useMemo(
    () =>
      students.filter((s) => {
        const q = filter.toLowerCase();
        return (
          (!q ||
            s.name.toLowerCase().includes(q) ||
            s.rollNo.toLowerCase().includes(q)) &&
          (departmentFilter === "All departments" ||
            s.department === departmentFilter) &&
          (classFilter === "All classrooms" || s.classroom === classFilter)
        );
      }),
    [students, filter, departmentFilter, classFilter],
  );
  const presentCount = visibleStudents.filter(
    (s) => statuses[s._id || s.id] === "Present",
  ).length;
  const absentCount = visibleStudents.filter(
    (s) => statuses[s._id || s.id] === "Absent",
  ).length;

  async function saveAttendance() {
    if (!visibleStudents.length)
      return notify("No students match the current filters.", "error");
    setSaving(true);
    setMessage({text: "", type: ""});
    try {
      const entries = visibleStudents.map((s) => ({
        studentId: s._id || s.id,
        status: statuses[s._id || s.id] || "Present",
      }));
      const data = await request(
        "/attendance/bulk",
        {method: "POST", body: JSON.stringify({date, entries})},
        token,
      );
      notify(data.message);
      await loadData(date);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Student Management"
      subtitle="Teacher dashboard · manage daily attendance"
      userLabel={user.username}
      onLogout={onLogout}
    >
      <Message message={message} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Users size={21} />}
          label="Total Students"
          value={students.length}
          tint="indigo"
        />
        <SummaryCard
          icon={<CheckCircle2 size={21} />}
          label="Marked Present"
          value={presentCount}
          tint="green"
        />
        <SummaryCard
          icon={<XCircle size={21} />}
          label="Marked Absent"
          value={absentCount}
          tint="red"
        />
        <SummaryCard
          icon={<CalendarDays size={21} />}
          label="Attendance Date"
          value={date}
          tint="violet"
          small
        />
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daily attendance register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a date, then mark every listed student present or absent.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <CalendarDays size={17} className="text-indigo-600" />
              <input
                type="date"
                max={today()}
                value={date}
                onChange={(e) => changeDate(e.target.value)}
                className="min-w-0 outline-none"
              />
            </label>
            <button
              onClick={() => loadData(date)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={17}
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search name or roll number"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            <option>All classrooms</option>
            {classrooms.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            <option>All departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <Loading />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students registered yet"
            detail="Register student accounts first. They will appear here automatically."
          />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            title="No matching students"
            detail="Try changing your search or filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student</th>
                  <th className="px-4 py-4 font-semibold">Roll No.</th>
                  <th className="px-4 py-4 font-semibold">
                    Class / Department
                  </th>
                  <th className="px-4 py-4 font-semibold">Education year</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map((s, i) => {
                  const id = s._id || s.id;
                  const status = statuses[id] || "Present";
                  return (
                    <tr key={id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                            {s.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {s.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              Student {i + 1}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-600">
                        {s.rollNo}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {s.classroom}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {s.department}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {s.educationYear}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <StatusButton
                            active={status === "Absent"}
                            status="Absent"
                            onClick={() =>
                              setStatuses((p) => ({...p, [id]: "Absent"}))
                            }
                          />
                          <StatusButton
                            active={status === "Present"}
                            status="Present"
                            onClick={() =>
                              setStatuses((p) => ({...p, [id]: "Present"}))
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:px-5">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <strong className="text-slate-700">{visibleStudents.length}</strong>{" "}
            of {students.length} students · Date: {date}
          </p>
          <button
            onClick={saveAttendance}
            disabled={saving || loading || visibleStudents.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ClipboardCheck size={18} />
            )}{" "}
            Save Attendance
          </button>
        </div>
      </section>
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <CircleHelp size={19} className="mt-0.5 shrink-0" />
        <p>
          Only a teacher account can save attendance. Students can log in
          separately to view their own attendance history.
        </p>
      </div>
    </AppShell>
  );
}

function StudentDashboard({
  user,
  token,
  onLogout,
  notify,
  message,
  setMessage,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/attendance/me", {}, token)
      .then(setData)
      .catch((err) => notify(err.message, "error"))
      .finally(() => setLoading(false));
  }, [token, notify]);

  const student = data?.student || user;
  const summary = data?.summary || {
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
  };
  return (
    <AppShell
      title="My Attendance"
      subtitle="Student dashboard · your personal records"
      userLabel={user.rollNo}
      onLogout={onLogout}
    >
      <Message message={message} />
      <section className="rounded-2xl bg-gradient-to-r from-indigo-800 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-200">WELCOME BACK</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {student.name}
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              {student.rollNo} · {student.classroom} · {student.department}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <GraduationCap size={34} />
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<CalendarDays size={21} />}
          label="Records"
          value={summary.total}
          tint="indigo"
        />
        <SummaryCard
          icon={<CheckCircle2 size={21} />}
          label="Present days"
          value={summary.present}
          tint="green"
        />
        <SummaryCard
          icon={<XCircle size={21} />}
          label="Absent days"
          value={summary.absent}
          tint="red"
        />
        <SummaryCard
          icon={<ClipboardCheck size={21} />}
          label="Attendance rate"
          value={`${summary.percentage}%`}
          tint="violet"
        />
      </div>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            My attendance history
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Attendance entered by your teacher.
          </p>
        </div>
        {loading ? (
          <Loading />
        ) : !data?.records?.length ? (
          <EmptyState
            title="No attendance records yet"
            detail="Your teacher's saved attendance will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Day status</th>
                  <th className="px-5 py-4 font-semibold">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.records.map((r) => (
                  <tr key={r._id}>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {r.dateKey}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${r.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      Teacher marked
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
        Your account can view your own attendance only. Contact your teacher if
        a record needs correction.
      </div>
    </AppShell>
  );
}

function AppShell({title, subtitle, userLabel, onLogout, children}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-indigo-900/10 bg-indigo-800 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2.5">
              <GraduationCap size={25} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold">{title}</p>
              <p className="truncate text-xs text-indigo-200">{subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{userLabel}</p>
              <p className="text-xs capitalize text-indigo-200">Signed in</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl border border-white/25 px-3 py-2.5 text-sm font-medium hover:bg-white/10"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
        <footer className="pb-3 pt-2 text-center text-xs text-slate-400">
          Student Attendance System · React · Express · MongoDB
        </footer>
      </main>
    </div>
  );
}

function Feature({icon, text}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function Field({label, value, onChange, placeholder, type = "text"}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          required
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={isPassword ? 6 : undefined}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Message({message}) {
  if (!message?.text) return null;
  return (
    <div
      role="status"
      className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "error" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}
    >
      {message.text}
    </div>
  );
}
function SummaryCard({icon, label, value, tint, small = false}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p
            className={`mt-2 font-bold text-slate-900 ${small ? "text-lg" : "text-3xl"}`}
          >
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${styles[tint]}`}>{icon}</div>
      </div>
    </div>
  );
}
function StatusButton({active, status, onClick}) {
  const isPresent = status === "Present";
  const activeClass = isPresent
    ? "border-emerald-600 bg-emerald-600 text-white"
    : "border-rose-600 bg-rose-600 text-white";
  const inactiveClass = isPresent
    ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
    : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50";
  return (
    <button
      onClick={onClick}
      className={`flex min-w-[96px] items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${active ? activeClass : inactiveClass}`}
    >
      {isPresent ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {status}
    </button>
  );
}
function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
      <LoaderCircle className="animate-spin" size={19} /> Loading data...
    </div>
  );
}
function EmptyState({title, detail}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <BookOpen size={23} />
      </div>
      <h3 className="mt-4 font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}
