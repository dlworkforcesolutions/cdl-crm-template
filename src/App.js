import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

const PIPELINE_STAGES = ["New Lead", "Contacted", "Qualified", "Docs Sent", "Placed", "Inactive"];

const MOCK_DRIVERS = [
  {
    id: 1,
    firstName: "James", lastName: "Holloway", email: "james.h@email.com", phone: "817-555-0101",
    city: "Fort Worth", state: "TX", zip: "76101",
    drivingExperienceMonths: 84, experienceLevel: "Experienced",
    currentEmployer: "Swift Transport", employmentStatus: "Seeking Employment",
    cdlClass: "Class A", cdlState: "TX", cdlExpiry: "2026-08-15",
    endorsements: ["Hazmat (H)", "Tank (N)"],
    preferredRunTypes: ["OTR (Over The Road)", "Regional"],
    homeTimePreference: "Home Weekly", maxDaysOut: 14,
    accidents: 0, violations: 0, dui: false, cleanRecord: true, sap: false, terminated: false,
    salaryExpectation: 75000, startDate: "2024-02-01",
    workAvailability: ["Weekend work OK"],
    transmissionPreference: "Both Automatic & Manual",
    freightPreferences: ["Dry Van", "Refrigerated"],
    military: false, preferredContact: "Phone", bestTimeToContact: "Morning",
    notes: "Looking for steady regional runs near DFW.",
    stage: "Qualified", addedDate: "2024-01-10",
    communications: [
      { type: "email", direction: "out", date: "2024-01-11", subject: "Welcome to Direct Line!", preview: "Hi James, thanks for applying..." },
      { type: "sms", direction: "out", date: "2024-01-12", preview: "James, following up on your application." },
      { type: "sms", direction: "in", date: "2024-01-12", preview: "Sounds good, I'm interested." },
    ]
  },
  {
    id: 2,
    firstName: "Maria", lastName: "Reyes", email: "m.reyes@gmail.com", phone: "214-555-0202",
    city: "Dallas", state: "TX", zip: "75201",
    drivingExperienceMonths: 36, experienceLevel: "Mid-Level",
    currentEmployer: "Amazon Freight", employmentStatus: "Employed",
    cdlClass: "Class A", cdlState: "TX", cdlExpiry: "2025-11-30",
    endorsements: ["Passenger (P)"],
    preferredRunTypes: ["Local", "Semi Local"],
    homeTimePreference: "Home Daily", maxDaysOut: 0,
    accidents: 1, violations: 0, dui: false, cleanRecord: false, sap: false, terminated: false,
    salaryExpectation: 60000, startDate: "2024-03-01",
    workAvailability: ["Night driving OK"],
    transmissionPreference: "Automatic",
    freightPreferences: ["Dry Van"],
    military: true, preferredContact: "Email", bestTimeToContact: "Evening",
    notes: "Veteran, prefers local only.",
    stage: "Contacted", addedDate: "2024-01-15",
    communications: [
      { type: "email", direction: "out", date: "2024-01-16", subject: "Local Routes Available", preview: "Hi Maria, we have local openings..." },
    ]
  },
  {
    id: 3,
    firstName: "Darnell", lastName: "Washington", email: "d.washington@outlook.com", phone: "972-555-0303",
    city: "Arlington", state: "TX", zip: "76010",
    drivingExperienceMonths: 144, experienceLevel: "Veteran",
    currentEmployer: "", employmentStatus: "Seeking Employment",
    cdlClass: "Class A", cdlState: "TX", cdlExpiry: "2027-03-20",
    endorsements: ["Hazmat (H)", "Tank (N)", "Hazmat + Tank (X)"],
    preferredRunTypes: ["OTR (Over The Road)"],
    homeTimePreference: "Home Bi-Weekly", maxDaysOut: 21,
    accidents: 0, violations: 1, dui: false, cleanRecord: false, sap: false, terminated: false,
    salaryExpectation: 90000, startDate: "2024-01-15",
    workAvailability: ["Overnight stays OK", "Weekend work OK", "Night driving OK"],
    transmissionPreference: "Manual",
    freightPreferences: ["Tanker", "Hazmat"],
    military: false, preferredContact: "Phone", bestTimeToContact: "Anytime",
    notes: "12 years experience, HazMat specialist.",
    stage: "Docs Sent", addedDate: "2024-01-05",
    communications: [
      { type: "sms", direction: "out", date: "2024-01-06", preview: "Darnell, great profile! Let's connect." },
      { type: "email", direction: "out", date: "2024-01-07", subject: "Application Documents", preview: "Please find attached your onboarding docs..." },
      { type: "email", direction: "in", date: "2024-01-08", subject: "Re: Application Documents", preview: "Got them, will review and send back." },
    ]
  },
];

const STAGE_COLORS = {
  "New Lead": "#6366f1",
  "Contacted": "#f59e0b",
  "Qualified": "#3b82f6",
  "Docs Sent": "#8b5cf6",
  "Placed": "#10b981",
  "Inactive": "#6b7280",
};

const CDL_CLASSES = ["Class A", "Class B", "Class C"];
const ENDORSEMENT_OPTIONS = ["Hazmat (H)", "Tank (N)", "Passenger (P)", "School Bus (S)", "Double/Triple (T)", "Hazmat + Tank (X)"];
const RUN_TYPE_OPTIONS = ["Local", "Semi Local", "Regional", "OTR (Over The Road)"];
const FREIGHT_OPTIONS = ["Dry Van", "Refrigerated", "Flatbed", "Tanker", "Hazmat", "Auto Transport"];
const AVAILABILITY_OPTIONS = ["Overnight stays OK", "Weekend work OK", "Night driving OK"];
const EXPERIENCE_LEVELS = ["Entry Level", "Mid-Level", "Experienced", "Veteran"];
const CONTACT_METHODS = ["Phone", "Email", "Text"];
const EMPLOYMENT_STATUSES = ["Seeking Employment", "Employed", "Unemployed"];
const TRANSMISSION_OPTIONS = ["Automatic", "Manual", "Both Automatic & Manual"];

const blankDriver = () => ({
  id: Date.now(),
  firstName: "", lastName: "", email: "", phone: "",
  city: "", state: "", zip: "",
  drivingExperienceMonths: "", experienceLevel: "",
  currentEmployer: "", employmentStatus: "",
  cdlClass: "", cdlState: "", cdlExpiry: "",
  endorsements: [],
  preferredRunTypes: [],
  homeTimePreference: "", maxDaysOut: 0,
  accidents: 0, violations: 0, dui: false, cleanRecord: false, sap: false, terminated: false,
  salaryExpectation: "", startDate: "",
  workAvailability: [],
  transmissionPreference: "",
  freightPreferences: [],
  military: false, preferredContact: "", bestTimeToContact: "",
  notes: "",
  stage: "New Lead", addedDate: new Date().toISOString().split("T")[0],
  communications: []
});

export default function CRM() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [drivers, setDrivers] = useState(() => {
  const savedDrivers = localStorage.getItem("cdlCrmDrivers");

  if (savedDrivers) {
    try {
      return JSON.parse(savedDrivers);
    } catch (error) {
      console.error("Failed to load saved drivers:", error);
      return MOCK_DRIVERS;
    }
  }

  return MOCK_DRIVERS;
});
useEffect(() => {
  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  checkUser();
}, []);
useEffect(() => {
  localStorage.setItem("cdlCrmDrivers", JSON.stringify(drivers));
}, [drivers]);
  const [view, setView] = useState("contacts"); // contacts | pipeline | profile | add | compose
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [editingDriver, setEditingDriver] = useState(null);
  const [composeType, setComposeType] = useState("email");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [bulkSelected, setBulkSelected] = useState([]);
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvMapping, setCsvMapping] = useState({});
  const [csvPreview, setCsvPreview] = useState([]);
  const [importStep, setImportStep] = useState(1); // 1=upload, 2=map, 3=confirm
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: "", state: "", zip: "",
    cdlClass: "", cdlState: "",
    endorsements: [],
    experienceLevel: "",
    preferredRunTypes: [],
    freightPreferences: [],
    employmentStatus: "",
    transmissionPreference: "",
    cleanRecord: false, military: false, dui: false, sap: false,
    minSalary: "", maxSalary: "",
    minExperience: "", maxExperience: "",
  });
  const activeFilterCount = [
    filters.city, filters.state, filters.zip, filters.cdlClass, filters.cdlState,
    filters.experienceLevel, filters.employmentStatus, filters.transmissionPreference,
    filters.cleanRecord, filters.military, filters.dui, filters.sap,
    filters.minSalary, filters.maxSalary, filters.minExperience, filters.maxExperience,
    ...filters.endorsements, ...filters.preferredRunTypes, ...filters.freightPreferences,
  ].filter(Boolean).length;
  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const toggleFilterArr = (key, val) => setFilters(prev => ({
    ...prev, [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val]
  }));
  const clearFilters = () => setFilters({ city: "", state: "", zip: "", cdlClass: "", cdlState: "", endorsements: [], experienceLevel: "", preferredRunTypes: [], freightPreferences: [], employmentStatus: "", transmissionPreference: "", cleanRecord: false, military: false, dui: false, sap: false, minSalary: "", maxSalary: "", minExperience: "", maxExperience: "" });

  const filtered = useMemo(() => {
    return drivers.filter(d => {
      const name = `${d.firstName} ${d.lastName}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || d.phone.includes(search) || d.email.toLowerCase().includes(search.toLowerCase()) || (d.city || "").toLowerCase().includes(search.toLowerCase()) || (d.state || "").toLowerCase().includes(search.toLowerCase()) || (d.zip || "").includes(search) || (d.cdlClass || "").toLowerCase().includes(search.toLowerCase()) || d.endorsements.some(e => e.toLowerCase().includes(search.toLowerCase()));
      const matchStage = stageFilter === "All" || d.stage === stageFilter;
      const matchCity = !filters.city || (d.city || "").toLowerCase().includes(filters.city.toLowerCase());
      const matchState = !filters.state || (d.state || "").toLowerCase().includes(filters.state.toLowerCase());
      const matchZip = !filters.zip || (d.zip || "").includes(filters.zip);
      const matchCdlClass = !filters.cdlClass || d.cdlClass === filters.cdlClass;
      const matchCdlState = !filters.cdlState || (d.cdlState || "").toLowerCase().includes(filters.cdlState.toLowerCase());
      const matchEndorsements = filters.endorsements.length === 0 || filters.endorsements.every(e => d.endorsements.includes(e));
      const matchExpLevel = !filters.experienceLevel || d.experienceLevel === filters.experienceLevel;
      const matchRunTypes = filters.preferredRunTypes.length === 0 || filters.preferredRunTypes.some(r => d.preferredRunTypes.includes(r));
      const matchFreight = filters.freightPreferences.length === 0 || filters.freightPreferences.some(f => d.freightPreferences.includes(f));
      const matchEmployment = !filters.employmentStatus || d.employmentStatus === filters.employmentStatus;
      const matchTransmission = !filters.transmissionPreference || d.transmissionPreference === filters.transmissionPreference;
      const matchClean = !filters.cleanRecord || d.cleanRecord;
      const matchMilitary = !filters.military || d.military;
      const matchDui = !filters.dui || d.dui;
      const matchSap = !filters.sap || d.sap;
      const matchMinSalary = !filters.minSalary || Number(d.salaryExpectation) >= Number(filters.minSalary);
      const matchMaxSalary = !filters.maxSalary || Number(d.salaryExpectation) <= Number(filters.maxSalary);
      const matchMinExp = !filters.minExperience || Number(d.drivingExperienceMonths) >= Number(filters.minExperience);
      const matchMaxExp = !filters.maxExperience || Number(d.drivingExperienceMonths) <= Number(filters.maxExperience);
      return matchSearch && matchStage && matchCity && matchState && matchZip && matchCdlClass && matchCdlState && matchEndorsements && matchExpLevel && matchRunTypes && matchFreight && matchEmployment && matchTransmission && matchClean && matchMilitary && matchDui && matchSap && matchMinSalary && matchMaxSalary && matchMinExp && matchMaxExp;
    });
  }, [drivers, search, stageFilter, filters]);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.trim().split("\n").map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
      const headers = lines[0];
      const rows = lines.slice(1).filter(r => r.some(c => c));
      setCsvHeaders(headers);
      setCsvData(rows);
      setCsvPreview(rows.slice(0, 3));
      // Auto-map obvious columns
      const autoMap = {};
      const fieldAliases = {
        firstName: ["first name", "firstname", "first"],
        lastName: ["last name", "lastname", "last"],
        email: ["email", "email address"],
        phone: ["phone", "phone number", "mobile", "cell"],
        city: ["city"],
        state: ["state"],
        zip: ["zip", "zip code", "postal"],
        notes: ["notes", "comments"],
        cdlClass: ["cdl class", "cdl"],
        cdlState: ["cdl state"],
        stage: ["stage", "status"],
        salaryExpectation: ["salary", "pay", "salary expectation"],
        experienceLevel: ["experience level", "level"],
        drivingExperienceMonths: ["experience months", "driving experience", "months experience"],
      };
      headers.forEach(h => {
        const lower = h.toLowerCase();
        Object.entries(fieldAliases).forEach(([field, aliases]) => {
          if (aliases.some(a => lower.includes(a))) autoMap[field] = h;
        });
      });
      setCsvMapping(autoMap);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const importCSV = () => {
    const newDrivers = csvData.map(row => {
      const get = (field) => {
        const col = csvMapping[field];
        if (!col) return "";
        const idx = csvHeaders.indexOf(col);
        return idx >= 0 ? row[idx] || "" : "";
      };
      return {
        ...blankDriver(),
        id: Date.now() + Math.random(),
        firstName: get("firstName"),
        lastName: get("lastName"),
        email: get("email"),
        phone: get("phone"),
        city: get("city"),
        state: get("state"),
        zip: get("zip"),
        cdlClass: get("cdlClass"),
        cdlState: get("cdlState"),
        stage: PIPELINE_STAGES.includes(get("stage")) ? get("stage") : "New Lead",
        salaryExpectation: get("salaryExpectation"),
        experienceLevel: get("experienceLevel"),
        drivingExperienceMonths: get("drivingExperienceMonths"),
        notes: get("notes"),
        addedDate: new Date().toISOString().split("T")[0],
      };
    }).filter(d => d.firstName || d.lastName || d.phone || d.email);
    setDrivers(prev => [...prev, ...newDrivers]);
    notify(`✅ Imported ${newDrivers.length} drivers successfully!`);
    setShowImport(false);
    setCsvData(null); setCsvHeaders([]); setCsvMapping({}); setImportStep(1);
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveDriver = (driver) => {
    if (drivers.find(d => d.id === driver.id)) {
      setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d));
      notify("Driver updated successfully.");
    } else {
      setDrivers(prev => [...prev, driver]);
      notify("Driver added successfully.");
    }
    setView("contacts");
    setEditingDriver(null);
  };

  const sendMessage = (driverId) => {
    const msg = {
      type: composeType,
      direction: "out",
      date: new Date().toISOString().split("T")[0],
      subject: composeSubject,
      preview: composeBody.slice(0, 60) + "...",
    };
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, communications: [msg, ...d.communications] } : d));
    notify(`${composeType === "email" ? "Email" : "SMS"} sent to ${drivers.find(d => d.id === driverId)?.firstName}!`);
    setComposeSubject(""); setComposeBody("");
  };

  const moveStage = (driverId, stage) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, stage } : d));
  };
const deleteDriver = (driverId) => {
  const driver = drivers.find(d => d.id === driverId);

  const confirmed = window.confirm(
    `Are you sure you want to delete ${driver?.firstName || "this"} ${driver?.lastName || "driver"}? This cannot be undone.`
  );

  if (!confirmed) return;

  setDrivers(prev => prev.filter(d => d.id !== driverId));
  setSelectedDriver(null);
  setView("contacts");
  notify("Driver deleted successfully.");
};
  const toggleBulk = (id) => setBulkSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const sendBulk = () => {
    const count = bulkSelected.length;
    bulkSelected.forEach(id => {
      const msg = { type: composeType, direction: "out", date: new Date().toISOString().split("T")[0], subject: composeSubject, preview: composeBody.slice(0, 60) };
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, communications: [msg, ...d.communications] } : d));
    });
    notify(`Sent to ${count} driver${count !== 1 ? "s" : ""}!`);
    setBulkSelected([]); setComposeSubject(""); setComposeBody("");
  };
async function signUp() {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Check your email to confirm signup");
  }
}

async function signIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  setUser(data.user);
}

async function signOut() {
  await supabase.auth.signOut();
  setUser(null);
}
if (!user) {
  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={signIn}>Sign In</button>
      <button onClick={signUp}>Sign Up</button>
    </div>
  );
}
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0f1117", color: "#e2e8f0", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1d27; } ::-webkit-scrollbar-thumb { background: #2d3248; border-radius: 3px; }
        input, select, textarea { font-family: inherit; background: #1a1d27; border: 1px solid #2d3248; color: #e2e8f0; border-radius: 8px; padding: 10px 12px; width: 100%; font-size: 14px; outline: none; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #f97316; }
        select option { background: #1a1d27; }
        label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 5px; }
        .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 13px; transition: all 0.2s; }
        .btn-primary { background: #f97316; color: #fff; } .btn-primary:hover { background: #ea6c0a; }
        .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #2d3248; } .btn-ghost:hover { background: #1a1d27; color: #e2e8f0; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #1e2235; color: #94a3b8; margin: 2px; }
        .card { background: #1a1d27; border: 1px solid #2d3248; border-radius: 12px; padding: 20px; }
        .section-title { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #f97316; margin-bottom: 12px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: #94a3b8; transition: all 0.2s; margin-bottom: 2px; }
        .nav-item:hover { background: #1e2235; color: #e2e8f0; }
        .nav-item.active { background: #f97316; color: #fff; }
        .driver-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 10px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #1e2235; }
        .driver-row:hover { background: #1e2235; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
        .comm-item { padding: 12px; border-radius: 8px; background: #0f1117; border: 1px solid #2d3248; margin-bottom: 8px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .checkbox-pill { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid #2d3248; cursor: pointer; font-size: 13px; transition: all 0.2s; user-select: none; }
        .checkbox-pill:hover { border-color: #f97316; }
        .checkbox-pill.checked { background: #f9731620; border-color: #f97316; color: #f97316; }
        .kanban-col { background: #1a1d27; border-radius: 12px; padding: 14px; min-height: 300px; flex: 1; min-width: 160px; }
        .kanban-card { background: #0f1117; border: 1px solid #2d3248; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: border 0.2s; }
        .kanban-card:hover { border-color: #f97316; }
        .notif { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; z-index: 9999; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .form-section { margin-bottom: 28px; }
        .stage-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 0, background: "#13151f", borderRight: "1px solid #2d3248", display: "flex", flexDirection: "column", padding: sidebarOpen ? "24px 12px" : 0, overflow: "hidden", transition: "width 0.3s, padding 0.3s", flexShrink: 0 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <div>
    <div style={{
      fontFamily: "Barlow Condensed, sans-serif",
      fontSize: 22,
      fontWeight: 700,
      color: "#f97316",
      letterSpacing: "0.05em",
      whiteSpace: "nowrap"
    }}>
      CDL CRM
    </div>

    <div style={{
      fontSize: 11,
      color: "#475569",
      fontWeight: 500,
      whiteSpace: "nowrap"
    }}>
      Driver Management
    </div>
  </div>

  <button onClick={signOut}>Logout</button>
</div>
        {[
          { key: "contacts", icon: "👥", label: "Contacts" },
          { key: "pipeline", icon: "📊", label: "Pipeline" },
          { key: "bulk", icon: "📣", label: "Bulk Messaging" },
        ].map(item => (
          <div key={item.key} className={`nav-item${view === item.key ? " active" : ""}`} onClick={() => { setView(item.key); setSelectedDriver(null); }}>
            <span>{item.icon}</span><span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid #2d3248", paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>
            <div style={{ fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>{drivers.length} Drivers</div>
            <div>{drivers.filter(d => d.stage === "Placed").length} Placed</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #2d3248", display: "flex", alignItems: "center", gap: 16, background: "#13151f" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          {view === "contacts" && (
            <>
              <input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ maxWidth: 160 }}>
                <option>All</option>
                {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(s => !s)} style={{ position: "relative" }}>
                🔍 Filters {activeFilterCount > 0 && <span style={{ background: "#f97316", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{activeFilterCount}</span>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowImport(true); setImportStep(1); }}>📥 Import CSV</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingDriver(blankDriver()); setView("add"); }}>+ Add Driver</button>
            </>
          )}
          {view === "profile" && selectedDriver && (
  <>
    <button className="btn btn-ghost btn-sm" onClick={() => setView("contacts")}>← Back</button>
    <span style={{ fontWeight: 600, fontSize: 18 }}>{selectedDriver.firstName} {selectedDriver.lastName}</span>
    <div style={{ flex: 1 }} />
    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingDriver({ ...selectedDriver }); setView("add"); }}>✏️ Edit</button>
    <button 
      className="btn btn-ghost btn-sm" 
      onClick={() => deleteDriver(selectedDriver.id)}
      style={{ color: "#fb7185", borderColor: "#7f1d1d" }}
    >
      🗑 Delete
    </button>
  </>
)}
          {view === "add" && <><button className="btn btn-ghost btn-sm" onClick={() => setView(selectedDriver ? "profile" : "contacts")}>← Back</button><span style={{ fontWeight: 600 }}>{editingDriver?.id && drivers.find(d => d.id === editingDriver.id) ? "Edit Driver" : "Add Driver"}</span></>}
          {view === "pipeline" && <span style={{ fontWeight: 600, fontSize: 16 }}>Pipeline Board</span>}
          {view === "bulk" && <span style={{ fontWeight: 600, fontSize: 16 }}>Bulk Messaging</span>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>

          {/* CONTACTS VIEW */}
          {view === "contacts" && (
            <div>
              {/* Advanced Filter Panel */}
              {showFilters && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div className="section-title" style={{ margin: 0 }}>Advanced Filters</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {activeFilterCount > 0 && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear All ({activeFilterCount})</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(false)}>Close</button>
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>📍 Location</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div><label>City</label><input placeholder="e.g. Dallas" value={filters.city} onChange={e => setFilter("city", e.target.value)} /></div>
                      <div><label>State</label><input placeholder="e.g. TX" value={filters.state} onChange={e => setFilter("state", e.target.value)} /></div>
                      <div><label>ZIP Code</label><input placeholder="e.g. 75201" value={filters.zip} onChange={e => setFilter("zip", e.target.value)} /></div>
                    </div>
                  </div>

                  {/* CDL Info */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>🪪 CDL Info</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div><label>CDL Class</label>
                        <select value={filters.cdlClass} onChange={e => setFilter("cdlClass", e.target.value)}>
                          <option value="">Any</option>{CDL_CLASSES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div><label>CDL State</label><input placeholder="e.g. TX" value={filters.cdlState} onChange={e => setFilter("cdlState", e.target.value)} /></div>
                    </div>
                    <label>Endorsements (must have ALL selected)</label>
                    <div className="checkbox-group">
                      {ENDORSEMENT_OPTIONS.map(opt => (
                        <div key={opt} className={`checkbox-pill${filters.endorsements.includes(opt) ? " checked" : ""}`} onClick={() => toggleFilterArr("endorsements", opt)}>{opt}</div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>⭐ Experience</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div><label>Experience Level</label>
                        <select value={filters.experienceLevel} onChange={e => setFilter("experienceLevel", e.target.value)}>
                          <option value="">Any</option>{EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div><label>Min Experience (mo)</label><input type="number" placeholder="e.g. 12" value={filters.minExperience} onChange={e => setFilter("minExperience", e.target.value)} /></div>
                      <div><label>Max Experience (mo)</label><input type="number" placeholder="e.g. 120" value={filters.maxExperience} onChange={e => setFilter("maxExperience", e.target.value)} /></div>
                    </div>
                  </div>

                  {/* Run Types & Freight */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>🚛 Run Types & Freight</div>
                    <label style={{ marginBottom: 6 }}>Preferred Run Types (any match)</label>
                    <div className="checkbox-group" style={{ marginBottom: 10 }}>
                      {RUN_TYPE_OPTIONS.map(opt => (
                        <div key={opt} className={`checkbox-pill${filters.preferredRunTypes.includes(opt) ? " checked" : ""}`} onClick={() => toggleFilterArr("preferredRunTypes", opt)}>{opt}</div>
                      ))}
                    </div>
                    <label style={{ marginBottom: 6 }}>Freight Preferences (any match)</label>
                    <div className="checkbox-group">
                      {FREIGHT_OPTIONS.map(opt => (
                        <div key={opt} className={`checkbox-pill${filters.freightPreferences.includes(opt) ? " checked" : ""}`} onClick={() => toggleFilterArr("freightPreferences", opt)}>{opt}</div>
                      ))}
                    </div>
                  </div>

                  {/* Employment & Salary */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>💼 Employment & Salary</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                      <div><label>Employment Status</label>
                        <select value={filters.employmentStatus} onChange={e => setFilter("employmentStatus", e.target.value)}>
                          <option value="">Any</option>{EMPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><label>Transmission</label>
                        <select value={filters.transmissionPreference} onChange={e => setFilter("transmissionPreference", e.target.value)}>
                          <option value="">Any</option>{TRANSMISSION_OPTIONS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div><label>Min Salary ($/yr)</label><input type="number" placeholder="e.g. 50000" value={filters.minSalary} onChange={e => setFilter("minSalary", e.target.value)} /></div>
                      <div><label>Max Salary ($/yr)</label><input type="number" placeholder="e.g. 90000" value={filters.maxSalary} onChange={e => setFilter("maxSalary", e.target.value)} /></div>
                    </div>
                  </div>

                  {/* Record Flags */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>🚦 Record Flags</div>
                    <div className="checkbox-group">
                      {[["cleanRecord", "✓ Clean Record"], ["military", "🎖️ Military Veteran"], ["dui", "DUI/DWI History"], ["sap", "SAP Driver"]].map(([key, label]) => (
                        <div key={key} className={`checkbox-pill${filters[key] ? " checked" : ""}`} onClick={() => setFilter(key, !filters[key])}>{label}</div>
                      ))}
                    </div>
                  </div>

                  {filtered.length > 0 && (
                    <div style={{ marginTop: 16, padding: "10px 14px", background: "#0f1117", borderRadius: 8, fontSize: 13, color: "#94a3b8" }}>
                      Showing <strong style={{ color: "#f97316" }}>{filtered.length}</strong> of <strong style={{ color: "#e2e8f0" }}>{drivers.length}</strong> drivers
                    </div>
                  )}
                </div>
              )}

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>No drivers found.</div>}
                {filtered.map(driver => (
                  <div key={driver.id} className="driver-row" onClick={() => { setSelectedDriver(driver); setView("profile"); }}>
                    <div className="avatar" style={{ background: `${STAGE_COLORS[driver.stage]}22`, color: STAGE_COLORS[driver.stage] }}>
                      {driver.firstName[0]}{driver.lastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{driver.firstName} {driver.lastName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{driver.city}, {driver.state} • {driver.cdlClass} • {driver.experienceLevel}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="stage-badge" style={{ background: `${STAGE_COLORS[driver.stage]}22`, color: STAGE_COLORS[driver.stage] }}>{driver.stage}</span>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{driver.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE VIEW */}
          {view === "profile" && selectedDriver && (() => {
            const d = drivers.find(x => x.id === selectedDriver.id) || selectedDriver;
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
                {/* Left: Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Header Card */}
                  <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div className="avatar" style={{ width: 60, height: 60, fontSize: 22, background: `${STAGE_COLORS[d.stage]}22`, color: STAGE_COLORS[d.stage] }}>{d.firstName[0]}{d.lastName[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{d.firstName} {d.lastName}</div>
                      <div style={{ color: "#64748b", fontSize: 14 }}>{d.city}, {d.state} {d.zip}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {d.military && <span className="tag" style={{ background: "#1e3a5f", color: "#60a5fa" }}>🎖️ Veteran</span>}
                        {d.cleanRecord && <span className="tag" style={{ background: "#14532d", color: "#4ade80" }}>✓ Clean Record</span>}
                        {d.sap && <span className="tag" style={{ background: "#7c2d12", color: "#fb923c" }}>SAP Driver</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <select value={d.stage} onChange={e => moveStage(d.id, e.target.value)} style={{ width: "auto", fontWeight: 600, color: STAGE_COLORS[d.stage], borderColor: STAGE_COLORS[d.stage] }}>
                          {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", textAlign: "right" }}>Added {d.addedDate}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Personal */}
                    <div className="card">
                      <div className="section-title">Personal Info</div>
                      <Row label="Email" val={d.email} />
                      <Row label="Phone" val={d.phone} />
                      <Row label="Preferred Contact" val={d.preferredContact} />
                      <Row label="Best Time" val={d.bestTimeToContact} />
                    </div>
                    {/* CDL */}
                    <div className="card">
                      <div className="section-title">CDL Info</div>
                      <Row label="CDL Class" val={d.cdlClass} />
                      <Row label="CDL State" val={d.cdlState} />
                      <Row label="CDL Expiry" val={d.cdlExpiry} />
                      <div style={{ marginTop: 8 }}>
                        <label>Endorsements</label>
                        <div>{d.endorsements.length ? d.endorsements.map(e => <span key={e} className="tag">{e}</span>) : <span style={{ color: "#475569", fontSize: 13 }}>None</span>}</div>
                      </div>
                    </div>
                    {/* Experience */}
                    <div className="card">
                      <div className="section-title">Experience</div>
                      <Row label="Experience" val={`${d.drivingExperienceMonths} months`} />
                      <Row label="Level" val={d.experienceLevel} />
                      <Row label="Current Employer" val={d.currentEmployer || "—"} />
                      <Row label="Status" val={d.employmentStatus} />
                    </div>
                    {/* Preferences */}
                    <div className="card">
                      <div className="section-title">Work Preferences</div>
                      <Row label="Run Types" val={d.preferredRunTypes.join(", ") || "—"} />
                      <Row label="Home Time" val={d.homeTimePreference} />
                      <Row label="Max Days Out" val={d.maxDaysOut} />
                      <Row label="Transmission" val={d.transmissionPreference} />
                      <Row label="Freight" val={d.freightPreferences.join(", ") || "—"} />
                    </div>
                    {/* Driving Record */}
                    <div className="card">
                      <div className="section-title">Driving Record</div>
                      <Row label="Accidents (3yr)" val={d.accidents} />
                      <Row label="Violations (3yr)" val={d.violations} />
                      <Row label="DUI/DWI" val={d.dui ? "Yes" : "No"} />
                      <Row label="Terminated (12mo)" val={d.terminated ? "Yes" : "No"} />
                    </div>
                    {/* Employment */}
                    <div className="card">
                      <div className="section-title">Availability</div>
                      <Row label="Salary Expectation" val={d.salaryExpectation ? `$${Number(d.salaryExpectation).toLocaleString()}/yr` : "—"} />
                      <Row label="Start Date" val={d.startDate || "—"} />
                      <div style={{ marginTop: 8 }}><label>Work Availability</label><div>{d.workAvailability.map(a => <span key={a} className="tag">{a}</span>)}</div></div>
                    </div>
                  </div>

                  {d.notes && (
                    <div className="card">
                      <div className="section-title">Notes</div>
                      <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>{d.notes}</div>
                    </div>
                  )}
                </div>

                {/* Right: Compose + Comms */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="card">
                    <div className="section-title">Send Message</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {["email", "sms"].map(t => (
                        <button key={t} className={`btn btn-sm ${composeType === t ? "btn-primary" : "btn-ghost"}`} onClick={() => setComposeType(t)}>
                          {t === "email" ? "📧 Email" : "💬 SMS"}
                        </button>
                      ))}
                    </div>
                    {composeType === "email" && (
                      <input placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={{ marginBottom: 10 }} />
                    )}
                    <textarea rows={5} placeholder={composeType === "email" ? "Email body..." : "Text message..."} value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ marginBottom: 10, resize: "vertical" }} />
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => sendMessage(d.id)} disabled={!composeBody}>
                      {composeType === "email" ? "Send Email" : "Send SMS"}
                    </button>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 8, textAlign: "center" }}>
                      Via {composeType === "email" ? "SendGrid" : "Twilio"} → {composeType === "email" ? d.email : d.phone}
                    </div>
                  </div>

                  <div className="card">
                    <div className="section-title">Communication History ({d.communications.length})</div>
                    {d.communications.length === 0 && <div style={{ color: "#475569", fontSize: 13 }}>No messages yet.</div>}
                    {d.communications.map((c, i) => (
                      <div key={i} className="comm-item">
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span>{c.type === "email" ? "📧" : "💬"}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: c.direction === "out" ? "#f97316" : "#10b981" }}>{c.direction === "out" ? "Sent" : "Received"}</span>
                          <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{c.date}</span>
                        </div>
                        {c.subject && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.subject}</div>}
                        <div style={{ fontSize: 12, color: "#64748b" }}>{c.preview}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ADD/EDIT VIEW */}
          {view === "add" && editingDriver && (
            <DriverForm driver={editingDriver} onChange={setEditingDriver} onSave={saveDriver} onCancel={() => setView(selectedDriver ? "profile" : "contacts")} />
          )}

          {/* PIPELINE VIEW */}
          {view === "pipeline" && (
            <div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Drag stages or update from driver profile. Click a card to open driver.</div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
                {PIPELINE_STAGES.map(stage => {
                  const stageDrivers = drivers.filter(d => d.stage === stage);
                  return (
                    <div key={stage} className="kanban-col">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[stage] }} />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{stage}</span>
                        <span style={{ marginLeft: "auto", background: "#0f1117", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#64748b" }}>{stageDrivers.length}</span>
                      </div>
                      {stageDrivers.map(d => (
                        <div key={d.id} className="kanban-card" onClick={() => { setSelectedDriver(d); setView("profile"); }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{d.firstName} {d.lastName}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.cdlClass} • {d.city}, {d.state}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{d.phone}</div>
                        </div>
                      ))}
                      {stageDrivers.length === 0 && <div style={{ fontSize: 12, color: "#374151", textAlign: "center", marginTop: 20 }}>Empty</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BULK MESSAGING */}
          {view === "bulk" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
              <div>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "#94a3b8" }}>{bulkSelected.length} selected</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setBulkSelected(filtered.map(d => d.id))}>Select All</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setBulkSelected([])}>Clear</button>
                  <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
                  <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ maxWidth: 160 }}>
                    <option>All</option>
                    {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="card" style={{ padding: 0 }}>
                  {filtered.map(d => (
                    <div key={d.id} className="driver-row" onClick={() => toggleBulk(d.id)}>
                      <input type="checkbox" checked={bulkSelected.includes(d.id)} onChange={() => toggleBulk(d.id)} onClick={e => e.stopPropagation()} style={{ width: 16, height: 16, accentColor: "#f97316" }} />
                      <div className="avatar" style={{ background: `${STAGE_COLORS[d.stage]}22`, color: STAGE_COLORS[d.stage] }}>{d.firstName[0]}{d.lastName[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{d.firstName} {d.lastName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{d.email} • {d.phone}</div>
                      </div>
                      <span className="stage-badge" style={{ background: `${STAGE_COLORS[d.stage]}22`, color: STAGE_COLORS[d.stage] }}>{d.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ alignSelf: "start" }}>
                <div className="section-title">Compose Bulk Message</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["email", "sms"].map(t => (
                    <button key={t} className={`btn btn-sm ${composeType === t ? "btn-primary" : "btn-ghost"}`} onClick={() => setComposeType(t)}>
                      {t === "email" ? "📧 Email" : "💬 SMS"}
                    </button>
                  ))}
                </div>
                {composeType === "email" && <input placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={{ marginBottom: 10 }} />}
                <textarea rows={6} placeholder={composeType === "email" ? "Email body..." : "Text message..."} value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ marginBottom: 10, resize: "vertical" }} />
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={sendBulk} disabled={!composeBody || bulkSelected.length === 0}>
                  Send to {bulkSelected.length} Driver{bulkSelected.length !== 1 ? "s" : ""}
                </button>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 8, textAlign: "center" }}>Via {composeType === "email" ? "SendGrid" : "Twilio"}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <div style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#1a1d27", border: "1px solid #2d3248", borderRadius: 16, padding: 32, width: "100%", maxWidth: 680, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#f97316" }}>Import CSV</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {importStep === 1 && "Upload your CSV file"}
                  {importStep === 2 && "Map your columns to CRM fields"}
                  {importStep === 3 && "Review and confirm import"}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowImport(false); setImportStep(1); setCsvData(null); }}>✕ Close</button>
            </div>

            {/* Step indicators */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {["Upload", "Map Columns", "Confirm"].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: importStep > i ? "#f97316" : importStep === i + 1 ? "#f97316" : "#2d3248", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                  <span style={{ fontSize: 12, color: importStep === i + 1 ? "#e2e8f0" : "#475569" }}>{s}</span>
                  {i < 2 && <div style={{ width: 24, height: 1, background: "#2d3248" }} />}
                </div>
              ))}
            </div>

            {/* Step 1: Upload */}
            {importStep === 1 && (
              <div>
                <div style={{ border: "2px dashed #2d3248", borderRadius: 12, padding: 40, textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Drop your CSV file here or click to browse</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Supports .csv files from Google Sheets, Excel, or Twilio exports</div>
                  <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} id="csv-upload" />
                  <label htmlFor="csv-upload" className="btn btn-primary" style={{ cursor: "pointer" }}>Choose File</label>
                </div>
                <div style={{ background: "#0f1117", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>💡 Tips</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
                    • Your CSV needs at least a Name or Phone column to import<br />
                    • Column headers are auto-matched — you can fix them in the next step<br />
                    • Download a template below to see the ideal format
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => {
                    const headers = "First Name,Last Name,Email,Phone,City,State,ZIP,CDL Class,CDL State,Experience Level,Driving Experience (months),Salary Expectation,Stage,Notes";
                    const blob = new Blob([headers + "\n"], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "driver-import-template.csv"; a.click();
                  }}>⬇ Download Template</button>
                </div>
              </div>
            )}

            {/* Step 2: Map Columns */}
            {importStep === 2 && csvHeaders.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                  Found <strong style={{ color: "#e2e8f0" }}>{csvData.length} rows</strong> and <strong style={{ color: "#e2e8f0" }}>{csvHeaders.length} columns</strong>. Match your CSV columns to the CRM fields below.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    ["firstName", "First Name *"],
                    ["lastName", "Last Name *"],
                    ["email", "Email"],
                    ["phone", "Phone *"],
                    ["city", "City"],
                    ["state", "State"],
                    ["zip", "ZIP"],
                    ["cdlClass", "CDL Class"],
                    ["cdlState", "CDL State"],
                    ["experienceLevel", "Experience Level"],
                    ["drivingExperienceMonths", "Experience (months)"],
                    ["salaryExpectation", "Salary Expectation"],
                    ["stage", "Pipeline Stage"],
                    ["notes", "Notes"],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label>{label}</label>
                      <select value={csvMapping[field] || ""} onChange={e => setCsvMapping(prev => ({ ...prev, [field]: e.target.value }))}>
                        <option value="">— Skip —</option>
                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {csvPreview.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div className="section-title">Preview (first 3 rows)</div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr>{csvHeaders.map(h => <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "#64748b", borderBottom: "1px solid #2d3248", whiteSpace: "nowrap" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((row, i) => (
                            <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: "6px 10px", color: "#94a3b8", borderBottom: "1px solid #1e2235", whiteSpace: "nowrap" }}>{cell || "—"}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" onClick={() => setImportStep(1)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => setImportStep(3)}>Review Import →</button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {importStep === 3 && (
              <div>
                <div style={{ background: "#0f1117", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Import Summary</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><div style={{ fontSize: 11, color: "#475569" }}>TOTAL ROWS</div><div style={{ fontSize: 20, fontWeight: 700, color: "#f97316" }}>{csvData.length}</div></div>
                    <div><div style={{ fontSize: 11, color: "#475569" }}>FIELDS MAPPED</div><div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{Object.values(csvMapping).filter(Boolean).length}</div></div>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div className="section-title">Mapped Fields</div>
                  {Object.entries(csvMapping).filter(([, v]) => v).map(([field, col]) => (
                    <div key={field} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e2235", fontSize: 13 }}>
                      <span style={{ color: "#94a3b8" }}>{field}</span>
                      <span style={{ color: "#f97316" }}>← {col}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#14532d22", border: "1px solid #14532d", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: "#4ade80" }}>
                  ✅ All {csvData.length} drivers will be added as <strong>New Lead</strong> unless your CSV has a Stage column mapped.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" onClick={() => setImportStep(2)}>← Back</button>
                  <button className="btn btn-primary" onClick={importCSV}>Import {csvData.length} Drivers</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="notif" style={{ background: notification.type === "success" ? "#14532d" : "#7c2d12", color: notification.type === "success" ? "#4ade80" : "#fb923c" }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#cbd5e1" }}>{val ?? "—"}</div>
    </div>
  );
}

function DriverForm({ driver, onChange, onSave, onCancel }) {
  const set = (field, val) => onChange(prev => ({ ...prev, [field]: val }));
  const toggleArr = (field, val) => onChange(prev => ({
    ...prev, [field]: prev[field].includes(val) ? prev[field].filter(x => x !== val) : [...prev[field], val]
  }));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="card form-section">
        <div className="section-title">Personal Information</div>
        <div className="field-grid">
          <div><label>First Name *</label><input value={driver.firstName} onChange={e => set("firstName", e.target.value)} /></div>
          <div><label>Last Name *</label><input value={driver.lastName} onChange={e => set("lastName", e.target.value)} /></div>
          <div><label>Email Address *</label><input value={driver.email} onChange={e => set("email", e.target.value)} /></div>
          <div><label>Phone Number *</label><input value={driver.phone} onChange={e => set("phone", e.target.value)} /></div>
          <div><label>City *</label><input value={driver.city} onChange={e => set("city", e.target.value)} /></div>
          <div><label>State *</label><input value={driver.state} onChange={e => set("state", e.target.value)} /></div>
          <div><label>ZIP Code *</label><input value={driver.zip} onChange={e => set("zip", e.target.value)} /></div>
        </div>
      </div>

      <div className="card form-section">
        <div className="section-title">Experience</div>
        <div className="field-grid">
          <div><label>Total Driving Experience (months) *</label><input type="number" value={driver.drivingExperienceMonths} onChange={e => set("drivingExperienceMonths", e.target.value)} /></div>
          <div><label>Experience Level *</label><select value={driver.experienceLevel} onChange={e => set("experienceLevel", e.target.value)}><option value="">Select...</option>{EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
          <div><label>Current/Most Recent Employer</label><input value={driver.currentEmployer} onChange={e => set("currentEmployer", e.target.value)} /></div>
          <div><label>Employment Status</label><select value={driver.employmentStatus} onChange={e => set("employmentStatus", e.target.value)}><option value="">Select...</option>{EMPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
      </div>

      <div className="card form-section">
        <div className="section-title">CDL Information</div>
        <div className="field-grid">
          <div><label>CDL Class *</label><select value={driver.cdlClass} onChange={e => set("cdlClass", e.target.value)}><option value="">Select...</option>{CDL_CLASSES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label>CDL State</label><input placeholder="e.g. TX" value={driver.cdlState} onChange={e => set("cdlState", e.target.value)} /></div>
          <div><label>CDL Expiry Date</label><input type="date" value={driver.cdlExpiry} onChange={e => set("cdlExpiry", e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 14 }}><label>Endorsements</label>
          <div className="checkbox-group">
            {ENDORSEMENT_OPTIONS.map(opt => (
              <div key={opt} className={`checkbox-pill${driver.endorsements.includes(opt) ? " checked" : ""}`} onClick={() => toggleArr("endorsements", opt)}>{opt}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card form-section">
        <div className="section-title">Run Type Preferences</div>
        <div className="checkbox-group">
          {RUN_TYPE_OPTIONS.map(opt => (
            <div key={opt} className={`checkbox-pill${driver.preferredRunTypes.includes(opt) ? " checked" : ""}`} onClick={() => toggleArr("preferredRunTypes", opt)}>{opt}</div>
          ))}
        </div>
        <div className="field-grid" style={{ marginTop: 14 }}>
          <div><label>Home Time Preference</label><input value={driver.homeTimePreference} onChange={e => set("homeTimePreference", e.target.value)} /></div>
          <div><label>Maximum Days Out</label><input type="number" value={driver.maxDaysOut} onChange={e => set("maxDaysOut", e.target.value)} /></div>
        </div>
      </div>

      <div className="card form-section">
        <div className="section-title">Driving Record</div>
        <div className="field-grid">
          <div><label>Accidents in Last 3 Years</label><input type="number" value={driver.accidents} onChange={e => set("accidents", e.target.value)} /></div>
          <div><label>Moving Violations in Last 3 Years</label><input type="number" value={driver.violations} onChange={e => set("violations", e.target.value)} /></div>
        </div>
        <div className="checkbox-group" style={{ marginTop: 12 }}>
          {[["dui", "I have a DUI/DWI history"], ["cleanRecord", "I have a clean driving record"], ["sap", "I am a SAP driver"], ["terminated", "Terminated in last 12 months for Safety"]].map(([field, label]) => (
            <div key={field} className={`checkbox-pill${driver[field] ? " checked" : ""}`} onClick={() => set(field, !driver[field])}>{label}</div>
          ))}
        </div>
      </div>

      <div className="card form-section">
        <div className="section-title">Work Preferences</div>
        <div className="field-grid">
          <div><label>Salary Expectation (per year)</label><input type="number" placeholder="e.g. 60000" value={driver.salaryExpectation} onChange={e => set("salaryExpectation", e.target.value)} /></div>
          <div><label>Available Start Date</label><input type="date" value={driver.startDate} onChange={e => set("startDate", e.target.value)} /></div>
          <div><label>Transmission Preference</label><select value={driver.transmissionPreference} onChange={e => set("transmissionPreference", e.target.value)}><option value="">Select...</option>{TRANSMISSION_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div style={{ marginTop: 14 }}><label>Work Availability</label>
          <div className="checkbox-group">{AVAILABILITY_OPTIONS.map(opt => (
            <div key={opt} className={`checkbox-pill${driver.workAvailability.includes(opt) ? " checked" : ""}`} onClick={() => toggleArr("workAvailability", opt)}>{opt}</div>
          ))}</div>
        </div>
        <div style={{ marginTop: 14 }}><label>Specialty Freight Preferences</label>
          <div className="checkbox-group">{FREIGHT_OPTIONS.map(opt => (
            <div key={opt} className={`checkbox-pill${driver.freightPreferences.includes(opt) ? " checked" : ""}`} onClick={() => toggleArr("freightPreferences", opt)}>{opt}</div>
          ))}</div>
        </div>
      </div>

      <div className="card form-section">
        <div className="section-title">Additional Information</div>
        <div className="field-grid">
          <div><label>Preferred Contact Method</label><select value={driver.preferredContact} onChange={e => set("preferredContact", e.target.value)}><option value="">Select...</option>{CONTACT_METHODS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label>Best Time to Contact</label><input value={driver.bestTimeToContact} onChange={e => set("bestTimeToContact", e.target.value)} /></div>
          <div style={{ gridColumn: "span 2" }}><label>Pipeline Stage</label><select value={driver.stage} onChange={e => set("stage", e.target.value)}>{PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className={`checkbox-pill${driver.military ? " checked" : ""}`} style={{ display: "inline-flex" }} onClick={() => set("military", !driver.military)}>🎖️ I have military experience</div>
        </div>
        <div style={{ marginTop: 14 }}><label>Additional Notes or Comments</label><textarea rows={4} value={driver.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} /></div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave(driver)} disabled={!driver.firstName || !driver.lastName}>Save Driver</button>
      </div>
    </div>
  );
}
