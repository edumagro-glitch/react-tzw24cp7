import { useState, useRef, useEffect } from "react";

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DAY_LABELS = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };
const TIME_OPTIONS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];

const initialSubs = [];
const emptyDays = { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(10,14,20,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem",backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#141b26",border:"1px solid #2a3548",borderRadius:"16px",padding:"1.5rem",width:"100%",maxWidth:"440px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
          <span style={{ fontWeight:700,fontSize:"1rem",color:"#e8f0fe" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7a99",cursor:"pointer",fontSize:"1.4rem" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box" }} />
    </div>
  );
}

function DDrop({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",cursor:"pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, color="#3b82f6", small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:disabled?"#1e2d45":color, border:"none", borderRadius:small?"6px":"8px",
      color:disabled?"#6b7a99":"#fff", fontFamily:"inherit", fontWeight:600,
      fontSize:small?"0.75rem":"0.875rem", padding:small?"0.3rem 0.65rem":"0.65rem 1.2rem",
      cursor:disabled?"not-allowed":"pointer"
    }}>{children}</button>
  );
}

function SaveCancel({ onCancel, onSave, saveLabel="Salvar" }) {
  return (
    <div style={{ display:"flex",gap:"0.5rem",marginTop:"0.5rem" }}>
      <button onClick={onCancel} style={{ flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>Cancelar</button>
      <button onClick={onSave} style={{ flex:1,padding:"0.65rem",background:"#3b82f6",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>{saveLabel}</button>
    </div>
  );
}

function Empty({ icon="", text, sub }) {
  return (
    <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"2rem 1rem",background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
      {icon && <div style={{ fontSize:"1.5rem",marginBottom:"0.5rem" }}>{icon}</div>}
      {text}
      {sub && <div style={{ fontSize:"0.72rem",marginTop:"0.4rem",color:"#4a5a70" }}>{sub}</div>}
    </div>
  );
}

function Section({ color, bgBadge, label, count, children }) {
  return (
    <div style={{ marginBottom:"1.5rem" }}>
      <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem" }}>
        <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0 }} />
        <span style={{ fontSize:"0.72rem",fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.1em" }}>{label}</span>
        <span style={{ fontSize:"0.7rem",color:"#6b7a99",background:bgBadge,borderRadius:"10px",padding:"0.1rem 0.5rem" }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function SubCard({ s, accent, border, onEdit, onDelete, pending, autoCreated }) {
  return (
    <div style={{ background:"#0d1420",border:`1px solid ${border}`,borderLeft:`3px solid ${accent}`,borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.5rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.2rem",flexWrap:"wrap" }}>
          <span style={{ fontWeight:600,fontSize:"0.875rem" }}>{s.patient}</span>
          {autoCreated && <span style={{ fontSize:"0.65rem",background:"#2a1a40",color:"#a78bfa",borderRadius:"5px",padding:"0.1rem 0.4rem",fontWeight:600 }}>AUTO</span>}
        </div>
        <div style={{ fontSize:"0.78rem",color:"#6b7a99" }}>
          <span style={{ fontFamily:"monospace",color:"#94a3b8" }}>{s.time}</span>
          {s.day && <span style={{ marginLeft:"0.35rem",color:"#64748b" }}>· {DAY_LABELS[s.day]||s.day}</span>}
          {s.therapist && <span style={{ marginLeft:"0.35rem" }}>· {s.therapist}</span>}
          {pending && <span style={{ marginLeft:"0.4rem",color:"#f59e0b",fontSize:"0.7rem" }}>aguardando terapeuta</span>}
        </div>
      </div>
      <div style={{ display:"flex",gap:"0.4rem",flexShrink:0,marginLeft:"0.5rem" }}>
        <Btn onClick={onEdit} small color="#2a3548">✏️</Btn>
        <Btn onClick={onDelete} small color="#3d1515">🗑</Btn>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("subs");
  const [activeDay, setActiveDay] = useState("SEG");
  const [absenceDay, setAbsenceDay] = useState("SEG");

  // Persisted state
  const [subs, setSubs] = useState(() => load("g_subs", initialSubs));
  const [freeSlots, setFreeSlots] = useState(() => load("g_free", emptyDays));
  const [schedules, setSchedules] = useState(() => load("g_sched", emptyDays)); // {day:[{therapist,child,time}]}
  const [childActivities, setChildActivities] = useState(() => load("g_acts", emptyDays));
  const [absences, setAbsences] = useState(() => load("g_abs", emptyDays));
  const [childAbsences, setChildAbsences] = useState(() => load("g_cabs", emptyDays));
  const [discharged, setDischarged] = useState(() => load("g_dis", []));
  const [dischargedT, setDischargedT] = useState(() => load("g_dist", []));

  // Modals & forms
  const [showSubModal, setShowSubModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showMultiSlot, setShowMultiSlot] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [editingTherapist, setEditingTherapist] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [subForm, setSubForm] = useState({ patient:"", time:"", therapist:"", status:"Pending" });
  const [slotForm, setSlotForm] = useState({ time:"13:00", therapist:"" });
  const [multiSlot, setMultiSlot] = useState({ therapist:"", times:[] });
  const [bulkForm, setBulkForm] = useState({ patient:"", timeFrom:"08:00", timeTo:"11:00", therapist:"" });
  const [bulkSearch, setBulkSearch] = useState("");
  const [absencePeriods, setAbsencePeriods] = useState({});

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileRef = useRef();

  // Search/filter
  const [childSearch, setChildSearch] = useState("");
  const [childViewDay, setChildViewDay] = useState("SEG");
  const [manageTab, setManageTab] = useState("therapists");
  const [manageSearch, setManageSearch] = useState("");
  const [agendaFilter, setAgendaFilter] = useState("");
  const [agendaDay, setAgendaDay] = useState("ALL");
  const [entryFilter, setEntryFilter] = useState("ALL");
  const [dischargeTab, setDischargeTab] = useState("children");
  const [dischargeInput, setDischargeInput] = useState("");
  const [dischargeInputT, setDischargeInputT] = useState("");

  // Persist
  useEffect(() => { localStorage.setItem("g_subs", JSON.stringify(subs)); }, [subs]);
  useEffect(() => { localStorage.setItem("g_free", JSON.stringify(freeSlots)); }, [freeSlots]);
  useEffect(() => { localStorage.setItem("g_sched", JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem("g_acts", JSON.stringify(childActivities)); }, [childActivities]);
  useEffect(() => { localStorage.setItem("g_abs", JSON.stringify(absences)); }, [absences]);
  useEffect(() => { localStorage.setItem("g_cabs", JSON.stringify(childAbsences)); }, [childAbsences]);
  useEffect(() => { localStorage.setItem("g_dis", JSON.stringify(discharged)); }, [discharged]);
  useEffect(() => { localStorage.setItem("g_dist", JSON.stringify(dischargedT)); }, [dischargedT]);

  // Derived
  const allTherapists = [...new Set(DAYS.flatMap(d => (freeSlots[d]||[]).map(s => s.therapist)))].sort();
  const allChildren = [...new Set(DAYS.flatMap(d => (schedules[d]||[]).map(s => s.child)))].sort();
  const designated = subs.filter(s => s.status === "Designated");
  const pending = subs.filter(s => s.status === "Pending");
  const autoPendingCount = pending.filter(s => s.autoCreated).length;

  const slotsByTime = TIME_OPTIONS.reduce((acc, t) => {
    const found = (freeSlots[activeDay]||[]).filter(s => s.time === t);
    if (found.length) acc[t] = found;
    return acc;
  }, {});

  // ── Subs CRUD ──
  const openAddSub = () => { setEditingSub(null); setSubForm({ patient:"", time:"", therapist:"", status:"Pending" }); setShowSubModal(true); };
  const openEditSub = s => { setEditingSub(s.id); setSubForm({ patient:s.patient, time:s.time, therapist:s.therapist, status:s.status }); setShowSubModal(true); };
  const saveSub = () => {
    if (!subForm.patient || !subForm.time) return;
    if (editingSub) setSubs(p => p.map(s => s.id === editingSub ? { ...s, ...subForm } : s));
    else setSubs(p => [...p, { id: Date.now(), ...subForm }]);
    setShowSubModal(false);
  };
  const deleteSub = id => setSubs(p => p.filter(s => s.id !== id));

  // ── Free Slots CRUD ──
  const openAddSlot = () => { setEditingSlot(null); setSlotForm({ time:"13:00", therapist:"" }); setShowSlotModal(true); };
  const openEditSlot = s => { setEditingSlot(s.id); setSlotForm({ time:s.time, therapist:s.therapist }); setShowSlotModal(true); };
  const saveSlot = () => {
    if (!slotForm.therapist) return;
    if (editingSlot) setFreeSlots(p => ({ ...p, [activeDay]: p[activeDay].map(s => s.id === editingSlot ? { ...s, ...slotForm } : s) }));
    else setFreeSlots(p => ({ ...p, [activeDay]: [...p[activeDay], { id: Date.now(), ...slotForm }] }));
    setShowSlotModal(false);
  };
  const deleteSlot = id => setFreeSlots(p => ({ ...p, [activeDay]: p[activeDay].filter(s => s.id !== id) }));

  const saveMultiSlot = () => {
    if (!multiSlot.therapist || !multiSlot.times.length) return;
    setFreeSlots(prev => {
      const next = { ...prev };
      multiSlot.times.forEach(time => {
        const exists = (next[activeDay]||[]).some(s => s.therapist === multiSlot.therapist && s.time === time);
        if (!exists) next[activeDay] = [...(next[activeDay]||[]), { id: Date.now()+Math.random(), time, therapist: multiSlot.therapist }];
      });
      next[activeDay].sort((a,b) => a.time.localeCompare(b.time));
      return next;
    });
    setMultiSlot({ therapist:"", times:[] });
    setShowMultiSlot(false);
  };

  const saveBulk = () => {
    if (!bulkForm.patient || !bulkForm.therapist) return;
    const patLower = bulkForm.patient.toLowerCase().trim();
    let matched = false;
    setSubs(prev => prev.map(s => {
      if (s.status !== "Pending" || s.patient.toLowerCase().trim() !== patLower) return s;
      matched = true;
      return { ...s, therapist: bulkForm.therapist, status: "Designated" };
    }));
    if (!matched) {
      const timeStr = bulkForm.timeFrom === bulkForm.timeTo ? bulkForm.timeFrom : `${bulkForm.timeFrom} às ${bulkForm.timeTo}`;
      setSubs(prev => [...prev, { id: Date.now(), patient: bulkForm.patient, time: timeStr, therapist: bulkForm.therapist, status: "Designated" }]);
    }
    setBulkForm({ patient:"", timeFrom:"08:00", timeTo:"11:00", therapist:"" });
    setShowBulk(false);
  };

  const clearSubs = type => {
    if (type === "designated") setSubs(p => p.filter(s => s.status !== "Designated"));
    else if (type === "pending") setSubs(p => p.filter(s => s.status !== "Pending"));
    else setSubs([]);
    setShowClearConfirm(null);
  };

  // ── Absences ──
  const toggleAbsence = (day, name) => {
    setAbsences(prev => {
      const cur = prev[day]||[];
      return { ...prev, [day]: cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name] };
    });
  };

  const getPeriod = (day, name) => absencePeriods[`${day}||${name}`] || "integral";
  const inPeriod = (time, period) => {
    const h = parseInt(time.split(":")[0], 10);
    if (period === "manha") return h < 12;
    if (period === "tarde") return h >= 12;
    return true;
  };

  const applyAbsences = day => {
    const absent = absences[day]||[];
    if (!absent.length) return 0;
    setFreeSlots(prev => {
      const next = { ...prev };
      absent.forEach(name => {
        const period = getPeriod(day, name);
        next[day] = (next[day]||[]).filter(s => s.therapist.toLowerCase() !== name.toLowerCase() || !inPeriod(s.time, period));
      });
      return next;
    });
    const newPending = [];
    absent.forEach(name => {
      const period = getPeriod(day, name);
      (schedules[day]||[])
        .filter(s => s.therapist.toLowerCase() === name.toLowerCase() && inPeriod(s.time, period))
        .forEach(({ child, time }) => {
          const exists = subs.some(s => s.patient.toLowerCase() === child.toLowerCase() && s.day === day && s.status === "Pending");
          if (!exists) newPending.push({ id: Date.now()+Math.random(), patient: child, time, day, therapist:"", status:"Pending", autoCreated:true, absentTherapist:name, activities:[] });
        });
    });
    if (newPending.length) setSubs(prev => [...prev, ...newPending]);
    return newPending.length;
  };

  // ── Rename / Remove ──
  const renameTherapist = (oldName, newName) => {
    if (!newName.trim() || newName.trim() === oldName) { setEditingTherapist(null); return; }
    const n = newName.trim();
    const lo = oldName.toLowerCase();
    const ren = arr => arr.map(s => s.therapist && s.therapist.toLowerCase() === lo ? { ...s, therapist:n } : s);
    setFreeSlots(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=ren(nx[d]);}); return nx; });
    setSchedules(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=ren(nx[d]);}); return nx; });
    setChildActivities(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=ren(nx[d]);}); return nx; });
    setAbsences(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).map(nm=>nm.toLowerCase()===lo?n:nm);}); return nx; });
    setSubs(prev => prev.map(s => s.therapist && s.therapist.toLowerCase()===lo ? {...s,therapist:n} : s));
    setEditingTherapist(null);
  };

  const removeTherapist = name => {
    const lo = name.toLowerCase();
    setFreeSlots(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(s=>s.therapist.toLowerCase()!==lo);}); return nx; });
    setSchedules(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(s=>s.therapist.toLowerCase()!==lo);}); return nx; });
    setAbsences(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(n=>n.toLowerCase()!==lo);}); return nx; });
    setConfirmRemove(null);
  };

  const removeChild = name => {
    const lo = name.toLowerCase();
    setSchedules(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(s=>s.child.toLowerCase()!==lo);}); return nx; });
    setChildActivities(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(a=>a.child.toLowerCase()!==lo);}); return nx; });
    setSubs(prev => prev.filter(s=>s.patient.toLowerCase()!==lo));
    setConfirmRemove(null);
  };

  const dischargeChild = name => {
    if (!name.trim() || discharged.includes(name)) return;
    setDischarged(prev => [...prev, name]);
    setSubs(prev => prev.filter(s => s.patient.toLowerCase() !== name.toLowerCase()));
    setFreeSlots(prevSlots => {
      const ns = {...prevSlots};
      DAYS.forEach(day => {
        const sessions = (schedules[day]||[]).filter(s=>s.child.toLowerCase()===name.toLowerCase());
        sessions.forEach(({therapist,time}) => {
          if (!(ns[day]||[]).some(s=>s.therapist===therapist&&s.time===time))
            ns[day]=[...(ns[day]||[]),{id:Date.now()+Math.random(),time,therapist,dischargedChild:name}];
        });
        if (ns[day]) ns[day].sort((a,b)=>a.time.localeCompare(b.time));
      });
      return ns;
    });
  };

  const reactivateChild = name => {
    setDischarged(prev => prev.filter(n=>n!==name));
    setFreeSlots(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(s=>s.dischargedChild!==name);}); return nx; });
  };

  const dischargeTherapist = name => {
    if (!name.trim() || dischargedT.includes(name)) return;
    const lo = name.toLowerCase();
    setDischargedT(prev => [...prev, name]);
    setFreeSlots(prev => { const nx={...prev}; DAYS.forEach(d=>{nx[d]=(nx[d]||[]).filter(s=>s.therapist.toLowerCase()!==lo);}); return nx; });
    const newPending = [];
    DAYS.forEach(day => {
      (schedules[day]||[]).filter(s=>s.therapist.toLowerCase()===lo).forEach(({child,time}) => {
        const exists = subs.some(s=>s.patient.toLowerCase()===child.toLowerCase()&&s.day===day&&s.status==="Pending");
        if (!exists) newPending.push({id:Date.now()+Math.random(),patient:child,time,day,therapist:"",status:"Pending",autoCreated:true,dischargedTherapist:name,activities:[]});
      });
    });
    if (newPending.length) setSubs(prev=>[...prev,...newPending]);
  };

  const reactivateTherapist = name => {
    setDischargedT(prev=>prev.filter(n=>n!==name));
    setSubs(prev=>prev.filter(s=>!(s.dischargedTherapist===name&&s.status==="Pending")));
  };

  // ── Upload ──
  const toBase64 = file => new Promise((res,rej) => {
    const r=new FileReader();
    r.onload=()=>res(r.result.split(",")[1]);
    r.onerror=()=>rej(new Error("Falha na leitura"));
    r.readAsDataURL(file);
  });

  const extractJSON = str => {
    const start=str.indexOf("{");
    if(start===-1) return null;
    let depth=0;
    for(let i=start;i<str.length;i++){
      if(str[i]==="{") depth++;
      else if(str[i]==="}"){depth--;if(depth===0)return str.slice(start,i+1);}
    }
    return null;
  };

  const handleFiles = async files => {
    if (!files||!files.length) return;
    setUploading(true); setUploadStatus(null); setUploadPreview(null);
    try {
      const imageParts = await Promise.all(Array.from(files).map(async file => {
        const b64 = await toBase64(file);
        const mt = file.type || (file.name.match(/\.jpe?g$/i) ? "image/jpeg" : "image/png");
        return { inlineData:{ data:b64, mimeType:mt } };
      }));

      const apiKey = typeof VITE_GEMINI_API_KEY !== "undefined" ? VITE_GEMINI_API_KEY : (window.__GEMINI_KEY__||"");
      if (!apiKey) throw new Error("Configure VITE_GEMINI_API_KEY no .env do projeto.");

      const prompt = `Você é um extrator de agendas de clínica ABA. Responda APENAS com JSON válido, sem texto fora dele.

TIPO A - TERAPEUTA: cabeçalho com nome do terapeuta, colunas SEG/TER/QUA/QUI/SEX, linhas=horários HH:MM, células=nome do paciente, VAZIA, AT, ou FUNDO PRETO.
TIPO B - PACIENTE: cabeçalho "PACIENTE - NOME", células=tipo de atividade.

REGRAS:
- Linha FUNDO PRETO = terapeuta ausente o dia inteiro (absentDays)
- Célula "AT" = ausente naquele horário (não livre, não ocupado)
- Célula VAZIA em dia sem fundo preto = livre (reason:"empty")
- "Autocuidado (TO)" ou "Hab. Sociais (Psicoterapia)" na agenda do paciente = terapeuta livre (reason:"specialist") E não gerar pendência
- Qualquer outra atividade sem terapeuta correspondente = pendência
- occupiedSlots = horários em que o terapeuta ESTÁ atendendo (não livre, não AT, não ausente)

RETORNE APENAS:
{"therapists":[{"name":"Nome","absentDays":["SEG"],"freeSlots":{"SEG":[],"TER":[{"time":"08:00","reason":"empty"}],"QUA":[],"QUI":[],"SEX":[]},"occupiedSlots":{"SEG":[{"time":"08:00","child":"Nome"}],"TER":[],"QUA":[],"QUI":[],"SEX":[]}}],"crossReferences":[{"child":"Nome","therapist":"Nome","day":"QUA","time":"13:00","activity":"Autocuidado (TO)","therapistFree":true}],"pendingChildren":[{"child":"Nome","day":"TER","time":"14:00","activity":"Hab. Academicas"}]}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ systemInstruction:{parts:[{text:prompt}]}, contents:[{role:"user",parts:[...imageParts,{text:`Analise as ${files.length} imagem(ns) e retorne o JSON.`}]}], generationConfig:{temperature:0.1,maxOutputTokens:8192} })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text||"";
      const jsonStr = extractJSON(rawText);
      if (!jsonStr) {
        const lower = rawText.toLowerCase();
        if (lower.includes("tipo b")||lower.includes("paciente")) throw new Error("Só agendas de crianças detectadas — inclua também as agendas dos terapeutas.");
        throw new Error("Nenhum JSON encontrado na resposta.");
      }
      const parsed = JSON.parse(jsonStr);
      setUploadPreview({ therapists:parsed.therapists||[], crossRefs:parsed.crossReferences||[], pendingChildren:parsed.pendingChildren||[] });
      setUploading(false);
    } catch(err) {
      setUploading(false);
      setUploadStatus({ ok:false, message:"Erro: "+err.message });
    }
  };

  const confirmUpload = () => {
    if (!uploadPreview) return;
    const { therapists, pendingChildren, crossRefs=[] } = uploadPreview;

    // Build schedules & activities
    const newSched = { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };
    const newActs = { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };
    therapists.forEach(({ name, occupiedSlots }) => {
      if (occupiedSlots) DAYS.forEach(day => {
        (occupiedSlots[day]||[]).forEach(({ time, child }) => {
          newSched[day].push({ therapist:name, child, time });
          if (child) newActs[day].push({ child, time, activity:"", therapist:name });
        });
      });
    });
    crossRefs.forEach(({ child, therapist, day, time, activity }) => {
      if (!newActs[day].some(a=>a.child===child&&a.time===time)) newActs[day].push({ child, time, activity:activity||"", therapist:therapist||"Especialista" });
    });
    pendingChildren.forEach(({ child, day, time, activity }) => {
      if (!newActs[day].some(a=>a.child===child&&a.time===time)) newActs[day].push({ child, time, activity:activity||"", therapist:"" });
    });

    setSchedules(prev => {
      const merged={...prev};
      DAYS.forEach(day => {
        const newNames=new Set(newSched[day].map(s=>s.therapist.toLowerCase()));
        merged[day]=[...prev[day].filter(s=>!newNames.has(s.therapist.toLowerCase())),...newSched[day]];
      });
      return merged;
    });
    setChildActivities(prev => {
      const merged={...prev};
      DAYS.forEach(day => {
        const newCh=new Set(newActs[day].map(a=>a.child.toLowerCase()));
        merged[day]=[...prev[day].filter(a=>!newCh.has(a.child.toLowerCase())),...newActs[day]];
        merged[day].sort((a,b)=>a.time.localeCompare(b.time));
      });
      return merged;
    });

    // Free slots
    const newSlots={...emptyDays, SEG:[...freeSlots.SEG], TER:[...freeSlots.TER], QUA:[...freeSlots.QUA], QUI:[...freeSlots.QUI], SEX:[...freeSlots.SEX]};
    const uNames=therapists.map(t=>t.name.toLowerCase().trim());
    DAYS.forEach(day=>{newSlots[day]=newSlots[day].filter(s=>!uNames.includes(s.therapist.toLowerCase().trim()));});
    therapists.forEach(({name,freeSlots:fs})=>{
      DAYS.forEach(day=>{
        (fs[day]||[]).forEach(slot=>{
          const time=typeof slot==="string"?slot:slot.time;
          newSlots[day].push({id:Date.now()+Math.random(),time,therapist:name});
        });
      });
    });
    DAYS.forEach(day=>{newSlots[day].sort((a,b)=>a.time.localeCompare(b.time));});
    setFreeSlots(newSlots);

    // Auto-pending
    if (pendingChildren.length) {
      const grouped={};
      pendingChildren.forEach(({child,day,time,activity})=>{
        const key=`${child}||${day}`;
        if (!grouped[key]) grouped[key]={child,day,times:[],activities:[]};
        grouped[key].times.push(time); grouped[key].activities.push(activity);
      });
      const newPending=Object.values(grouped).map(({child,day,times,activities})=>{
        times.sort();
        const timeStr=times.length===1?times[0]:`${times[0]} às ${times[times.length-1]}`;
        return {id:Date.now()+Math.random(),patient:child,time:timeStr,day,therapist:"",status:"Pending",autoCreated:true,activities:[...new Set(activities)]};
      });
      setSubs(prev=>{
        const keys=newPending.map(p=>`${p.patient.toLowerCase()}||${p.day}`);
        return [...prev.filter(s=>!s.autoCreated||!keys.includes(`${s.patient.toLowerCase()}||${s.day}`)),...newPending];
      });
    }

    setUploadPreview(null);
    setUploadStatus({ ok:true, message:`✅ ${therapists.length} terapeuta(s) importado(s)${pendingChildren.length?` · ${pendingChildren.length} pendência(s) criadas`:""}` });
    setTimeout(()=>setUploadStatus(null),5000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#0a0e14;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#2a3548;border-radius:4px;}
        input::placeholder,textarea::placeholder{color:#3a4a60;}
      `}</style>
      <div style={{ minHeight:"100vh",background:"#0a0e14",fontFamily:"'DM Sans',sans-serif",color:"#e8f0fe",maxWidth:"480px",margin:"0 auto" }}>

        {/* Header */}
        <div style={{ padding:"1.5rem 1.25rem 0.75rem",borderBottom:"1px solid #141b26" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"1.25rem" }}>
            <div style={{ width:"32px",height:"32px",borderRadius:"8px",background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem" }}>🏥</div>
            <div>
              <div style={{ fontWeight:700,fontSize:"0.95rem",letterSpacing:"-0.02em" }}>Gestão de Substituições</div>
              <div style={{ fontSize:"0.7rem",color:"#6b7a99" }}>Controle diário</div>
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"0.35rem" }}>
            <div style={{ display:"flex",gap:"0.4rem" }}>
              {[["subs",`🔁 Substituições${pending.length>0?` (${pending.length})`:""}`,null],["free","🧑‍⚕️ Terapeutas Livres",null]].map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{ flex:1,padding:"0.55rem 0.4rem",borderRadius:"10px",border:"none",cursor:"pointer",background:tab===key?"#1e2d45":"transparent",color:tab===key?"#3b82f6":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.73rem",borderBottom:tab===key?"2px solid #3b82f6":"2px solid transparent" }}>{label}</button>
              ))}
            </div>
            <div style={{ display:"flex",gap:"0.3rem",overflowX:"auto",paddingBottom:"0.1rem" }}>
              {[
                ["absent","📌 Faltas","#f87171","#dc2626"],
                ["discharged","🚪 Deslig.","#fb923c","#f97316"],
                ["children","👶 Crianças","#a78bfa","#7c3aed"],
                ["entries","🗺️ Entradas","#34d399","#10b981"],
                ["agenda","📅 Agenda","#60a5fa","#2563eb"],
                ["upload","📋 Importar","#3b82f6","#3b82f6"],
                ["manage","⚙️ Gerenciar","#94a3b8","#64748b"],
              ].map(([key,label,activeColor,activeBorder])=>(
                <button key={key} onClick={()=>setTab(key)} style={{ flexShrink:0,padding:"0.5rem 0.55rem",borderRadius:"8px",border:"none",cursor:"pointer",background:tab===key?"#1e2d45":"transparent",color:tab===key?activeColor:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.62rem",borderBottom:tab===key?`2px solid ${activeBorder}`:"2px solid transparent",whiteSpace:"nowrap" }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SUBSTITUIÇÕES ── */}
        {tab==="subs" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem" }}>
              <span style={{ fontWeight:700,fontSize:"0.85rem" }}>Todas as Substituições</span>
              <div style={{ display:"flex",gap:"0.4rem" }}>
                <Btn onClick={()=>setShowBulk(true)} small color="#16a34a">⚡ Designar</Btn>
                <Btn onClick={openAddSub} small>+ Adicionar</Btn>
              </div>
            </div>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem" }}>
              {[["designated","🗑 Designadas"],["pending","🗑 Pendentes"],["all","🗑 Tudo"]].map(([type,label])=>(
                <button key={type} onClick={()=>setShowClearConfirm(type)} style={{ flex:1,padding:"0.35rem 0.4rem",background:type==="all"?"#3d1515":"#1e2d45",border:`1px solid ${type==="all"?"#7f1d1d":"#2a3548"}`,borderRadius:"7px",color:type==="all"?"#f87171":"#6b7a99",fontFamily:"inherit",fontWeight:500,fontSize:"0.68rem",cursor:"pointer" }}>{label}</button>
              ))}
            </div>
            {autoPendingCount>0 && (
              <div style={{ background:"#1a1040",border:"1px solid #4c1d95",borderRadius:"10px",padding:"0.75rem 1rem",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"0.6rem" }}>
                <span>🤖</span>
                <div>
                  <div style={{ fontSize:"0.78rem",fontWeight:600,color:"#a78bfa" }}>{autoPendingCount} pendência(s) criadas automaticamente</div>
                  <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.1rem" }}>Crianças sem terapeuta detectadas</div>
                </div>
              </div>
            )}
            <Section color="#3b82f6" bgBadge="#1e2d45" label="Designadas" count={designated.length}>
              {designated.length===0 ? <Empty text="Nenhuma substituição designada" /> : designated.map(s=><SubCard key={s.id} s={s} accent="#3b82f6" border="#1e2d45" onEdit={()=>openEditSub(s)} onDelete={()=>deleteSub(s.id)} />)}
            </Section>
            <Section color="#f59e0b" bgBadge="#2a2010" label="Pendentes" count={pending.length}>
              {pending.length===0 ? <Empty text="Nenhuma substituição pendente" /> : pending.map(s=><SubCard key={s.id} s={s} accent="#f59e0b" border="#2a2010" onEdit={()=>openEditSub(s)} onDelete={()=>deleteSub(s.id)} pending autoCreated={s.autoCreated} />)}
            </Section>
          </div>
        )}

        {/* ── TERAPEUTAS LIVRES ── */}
        {tab==="free" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setActiveDay(d)} style={{ flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",background:activeDay===d?"#3b82f6":"#141b26",color:activeDay===d?"#fff":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.78rem" }}>
                  {DAY_LABELS[d]}{freeSlots[d].length>0&&<span style={{ marginLeft:"0.3rem",background:activeDay===d?"rgba(255,255,255,0.25)":"#1e2d45",borderRadius:"10px",padding:"0.05rem 0.35rem",fontSize:"0.65rem" }}>{freeSlots[d].length}</span>}
                </button>
              ))}
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem" }}>
              <span style={{ fontWeight:700,fontSize:"0.85rem" }}>{DAY_LABELS[activeDay]}</span>
              <div style={{ display:"flex",gap:"0.4rem" }}>
                <Btn onClick={()=>{setMultiSlot({therapist:"",times:[]});setShowMultiSlot(true);}} small color="#16a34a">⚡ Múltiplos</Btn>
                <Btn onClick={openAddSlot} small>+ Adicionar</Btn>
              </div>
            </div>
            {Object.keys(slotsByTime).length===0 ? <Empty icon="📭" text={`Nenhum terapeuta livre em ${DAY_LABELS[activeDay]}`} sub="Importe agendas ou adicione manualmente" /> :
              Object.entries(slotsByTime).map(([time,therapists])=>(
                <div key={time} style={{ marginBottom:"1.1rem" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"0.5rem" }}>
                    <span style={{ fontFamily:"monospace",fontWeight:500,fontSize:"0.9rem",color:"#3b82f6",background:"#1e2d45",borderRadius:"6px",padding:"0.15rem 0.55rem" }}>{time}</span>
                    <div style={{ flex:1,height:"1px",background:"#1e2d45" }} />
                  </div>
                  {therapists.map(s=>(
                    <div key={s.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.5rem 0.75rem",marginBottom:"0.3rem",background:"#0d1420",border:"1px solid #1e2d45",borderRadius:"8px" }}>
                      <span style={{ fontSize:"0.875rem",color:"#cbd5e1" }}>{s.therapist}</span>
                      <div style={{ display:"flex",gap:"0.35rem" }}>
                        <Btn onClick={()=>openEditSlot(s)} small color="#1e2d45">✏️</Btn>
                        <Btn onClick={()=>deleteSlot(s.id)} small color="#3d1515">🗑</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}

        {/* ── FALTAS ── */}
        {tab==="absent" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Registrar Faltas</div>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",lineHeight:1.5,marginBottom:"1.25rem" }}>Selecione o dia e marque quem faltou. As crianças daquele terapeuta viram pendências automaticamente.</div>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setAbsenceDay(d)} style={{ flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",background:absenceDay===d?"#dc2626":"#141b26",color:absenceDay===d?"#fff":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.78rem" }}>
                  {DAY_LABELS[d]}{(absences[d]||[]).length>0&&<span style={{ marginLeft:"0.3rem",background:absenceDay===d?"rgba(255,255,255,0.25)":"#3d1515",borderRadius:"10px",padding:"0.05rem 0.35rem",fontSize:"0.65rem",color:absenceDay===d?"#fff":"#f87171" }}>{absences[d].length}</span>}
                </button>
              ))}
            </div>

            {/* Therapist absence list */}
            <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>🧑‍⚕️ Terapeutas — {DAY_LABELS[absenceDay]}</div>
            {allTherapists.length===0 ? <Empty icon="📋" text="Nenhum terapeuta importado ainda" sub="Importe as agendas na aba 📋" /> :
              allTherapists.map(name => {
                const isAbsent=(absences[absenceDay]||[]).includes(name);
                const daySchedule=(schedules[absenceDay]||[]).filter(s=>s.therapist.toLowerCase()===name.toLowerCase());
                const period=getPeriod(absenceDay,name);
                return (
                  <div key={name} style={{ marginBottom:"0.4rem" }}>
                    <div onClick={()=>toggleAbsence(absenceDay,name)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.65rem 1rem",borderRadius:isAbsent?"10px 10px 0 0":"10px",cursor:"pointer",background:isAbsent?"#2a0a0a":"#0d1420",border:`1px solid ${isAbsent?"#dc2626":"#1e2d45"}`,borderBottom:isAbsent?"none":undefined }}>
                      <div>
                        <div style={{ fontWeight:600,fontSize:"0.875rem",color:isAbsent?"#f87171":"#e8f0fe" }}>{name}</div>
                        <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.15rem" }}>
                          {daySchedule.length>0?`${daySchedule.length} criança(s): ${daySchedule.map(s=>s.child).join(", ")}`:"sem agenda nesse dia"}
                        </div>
                      </div>
                      <div style={{ width:"22px",height:"22px",borderRadius:"6px",flexShrink:0,background:isAbsent?"#dc2626":"#1e2d45",border:`2px solid ${isAbsent?"#dc2626":"#2a3548"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem" }}>{isAbsent?"✓":""}</div>
                    </div>
                    {isAbsent && (
                      <div style={{ display:"flex",background:"#1a0808",border:"1px solid #dc2626",borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden" }}>
                        {[["manha","☀️ Manhã"],["tarde","🌙 Tarde"],["integral","📅 Integral"]].map(([p,label])=>(
                          <button key={p} onClick={e=>{e.stopPropagation();setAbsencePeriods(prev=>({...prev,[`${absenceDay}||${name}`]:p}));}} style={{ flex:1,padding:"0.35rem 0.25rem",border:"none",borderRight:p!=="integral"?"1px solid #3d1010":"none",background:period===p?"#dc2626":"transparent",color:period===p?"#fff":"#9a6060",fontFamily:"inherit",fontWeight:600,fontSize:"0.65rem",cursor:"pointer" }}>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            }

            {(absences[absenceDay]||[]).length>0 && (
              <div style={{ marginTop:"1rem" }}>
                <div style={{ background:"#2a0a0a",border:"1px solid #dc2626",borderRadius:"10px",padding:"0.75rem 1rem",marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.78rem",fontWeight:600,color:"#f87171",marginBottom:"0.25rem" }}>⛔ {absences[absenceDay].length} faltante(s) em {DAY_LABELS[absenceDay]}</div>
                  <div style={{ fontSize:"0.72rem",color:"#78716c" }}>
                    {(()=>{
                      const affected=absences[absenceDay].flatMap(name=>(schedules[absenceDay]||[]).filter(s=>s.therapist.toLowerCase()===name.toLowerCase()).map(s=>s.child));
                      return affected.length?`Crianças afetadas: ${[...new Set(affected)].join(", ")}`:"Nenhuma criança afetada (sem agenda registrada)";
                    })()}
                  </div>
                </div>
                <button onClick={()=>{ const c=applyAbsences(absenceDay); if(c===0){alert("Nenhuma criança nova. Verifique se as agendas foram importadas.");}else{setTab("subs");} }} style={{ width:"100%",padding:"0.75rem",background:"#dc2626",border:"none",borderRadius:"10px",color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:"0.875rem",cursor:"pointer" }}>⛔ Aplicar Faltas e Criar Pendências</button>
                <button onClick={()=>setAbsences(prev=>({...prev,[absenceDay]:[]}))} style={{ width:"100%",padding:"0.55rem",background:"none",border:"none",color:"#6b7a99",fontFamily:"inherit",fontSize:"0.78rem",cursor:"pointer",marginTop:"0.4rem" }}>Limpar seleção</button>
              </div>
            )}

            {/* Child absences */}
            <div style={{ marginTop:"2rem" }}>
              <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>👶 Faltas de Crianças — {DAY_LABELS[absenceDay]}</div>
              <div style={{ fontSize:"0.75rem",color:"#6b7a99",marginBottom:"0.75rem" }}>Marque a criança ausente — o terapeuta fica livre naquele horário.</div>
              {(()=>{
                const childrenToday=[...new Set((schedules[absenceDay]||[]).map(s=>s.child))].sort();
                if(!childrenToday.length) return <Empty text="Nenhuma criança com agenda nesse dia" />;
                return childrenToday.map(child=>{
                  const isAbsent=(childAbsences[absenceDay]||[]).includes(child);
                  const slots=(schedules[absenceDay]||[]).filter(s=>s.child===child);
                  return (
                    <div key={child} onClick={()=>{
                      setChildAbsences(prev=>{
                        const cur=prev[absenceDay]||[];
                        const updated=cur.includes(child)?cur.filter(n=>n!==child):[...cur,child];
                        if(!cur.includes(child)){
                          setFreeSlots(ps=>{
                            const ns={...ps};
                            slots.forEach(({therapist,time})=>{
                              if(!(ns[absenceDay]||[]).some(s=>s.therapist===therapist&&s.time===time))
                                ns[absenceDay]=[...(ns[absenceDay]||[]),{id:Date.now()+Math.random(),time,therapist,childAbsence:child}];
                            });
                            ns[absenceDay].sort((a,b)=>a.time.localeCompare(b.time));
                            return ns;
                          });
                        } else {
                          setFreeSlots(ps=>({...ps,[absenceDay]:(ps[absenceDay]||[]).filter(s=>s.childAbsence!==child)}));
                        }
                        return {...prev,[absenceDay]:updated};
                      });
                    }} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",marginBottom:"0.4rem",borderRadius:"10px",cursor:"pointer",background:isAbsent?"#1a1208":"#0d1420",border:`1px solid ${isAbsent?"#f59e0b":"#1e2d45"}` }}>
                      <div>
                        <div style={{ fontWeight:600,fontSize:"0.875rem",color:isAbsent?"#fcd34d":"#e8f0fe" }}>{child}</div>
                        <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.15rem" }}>{slots.map(s=>`${s.time} com ${s.therapist}`).join(" · ")}</div>
                      </div>
                      <div style={{ width:"22px",height:"22px",borderRadius:"6px",flexShrink:0,background:isAbsent?"#f59e0b":"#1e2d45",border:`2px solid ${isAbsent?"#f59e0b":"#2a3548"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",color:"#000" }}>{isAbsent?"✓":""}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ── IMPORTAR ── */}
        {tab==="upload" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Importar Agendas</div>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",lineHeight:1.6,marginBottom:"1rem" }}>
              Faça upload das agendas dos <strong style={{color:"#94a3b8"}}>terapeutas</strong> e das <strong style={{color:"#94a3b8"}}>crianças</strong> juntas. A IA cruza os dados, detecta horários livres e cria pendências automaticamente.
            </div>
            <div style={{ display:"flex",gap:"0.6rem",marginBottom:"1rem",flexWrap:"wrap" }}>
              {[["#16a34a","Terapeuta livre"],["#6366f1","Livre por TO/Psico"],["#f59e0b","Pendência auto"],["#dc2626","Linha preta/AT (ausente)"]].map(([color,label])=>(
                <div key={label} style={{ display:"flex",alignItems:"center",gap:"0.35rem",fontSize:"0.7rem",color:"#94a3b8" }}>
                  <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0 }} />
                  {label}
                </div>
              ))}
            </div>
            {!uploading ? (
              <div style={{ marginBottom:"1rem" }}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)} />
                <button onClick={()=>fileRef.current.click()} style={{ width:"100%",padding:"1.1rem",background:"#1e2d45",border:"2px dashed #3b82f6",borderRadius:"14px",color:"#3b82f6",fontFamily:"inherit",fontWeight:700,fontSize:"0.9rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginBottom:"0.5rem" }}>
                  <span style={{fontSize:"1.4rem"}}>📂</span> Selecionar imagens das agendas
                </button>
                <div style={{ textAlign:"center",fontSize:"0.72rem",color:"#4a5a70" }}>Terapeutas + crianças juntos no mesmo upload</div>
              </div>
            ) : (
              <div style={{ border:"2px dashed #2a3548",borderRadius:"14px",padding:"2rem 1rem",textAlign:"center",background:"#0d1420",marginBottom:"1rem" }}>
                <div style={{ fontSize:"2rem",marginBottom:"0.5rem" }}>⏳</div>
                <div style={{ fontWeight:600,fontSize:"0.875rem",color:"#e8f0fe",marginBottom:"0.25rem" }}>IA analisando as agendas...</div>
                <div style={{ fontSize:"0.75rem",color:"#6b7a99" }}>Aguarde alguns segundos</div>
              </div>
            )}
            {uploadStatus && (
              <div style={{ padding:"0.75rem 1rem",borderRadius:"10px",marginBottom:"1rem",background:uploadStatus.ok?"#0a2010":"#2a0a0a",border:`1px solid ${uploadStatus.ok?"#16a34a":"#dc2626"}`,color:uploadStatus.ok?"#4ade80":"#f87171",fontSize:"0.82rem",fontWeight:500 }}>
                {uploadStatus.message}
              </div>
            )}
            {uploadPreview && (
              <div>
                {uploadPreview.pendingChildren.length>0 && (
                  <div style={{ background:"#1a1208",border:"1px solid #92400e",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"1rem" }}>
                    <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.6rem" }}>⚠️ Crianças sem terapeuta</div>
                    {(()=>{
                      const grp={};
                      uploadPreview.pendingChildren.forEach(({child,day,time})=>{
                        const k=`${child}||${day}`;
                        if(!grp[k]) grp[k]={child,day,times:[]};
                        grp[k].times.push(time);
                      });
                      return Object.values(grp).map((g,i)=>{
                        g.times.sort();
                        return <div key={i} style={{fontSize:"0.78rem",color:"#94a3b8",marginBottom:"0.4rem",paddingLeft:"0.5rem",borderLeft:"2px solid #f59e0b"}}><span style={{color:"#fcd34d",fontWeight:600}}>{g.child}</span>{" — "}<span style={{fontFamily:"monospace",color:"#d97706"}}>{DAY_LABELS[g.day]} {g.times.length===1?g.times[0]:`${g.times[0]} às ${g.times[g.times.length-1]}`}</span></div>;
                      });
                    })()}
                    <div style={{ fontSize:"0.7rem",color:"#78716c",marginTop:"0.6rem" }}>→ Serão criadas como substituições pendentes</div>
                  </div>
                )}
                {uploadPreview.crossRefs.length>0 && (
                  <div style={{ background:"#0d1a2e",border:"1px solid #2d3f6e",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"1rem" }}>
                    <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.6rem" }}>🔗 Liberados por TO/Psicoterapia</div>
                    {uploadPreview.crossRefs.map((cr,i)=>(
                      <div key={i} style={{fontSize:"0.78rem",color:"#94a3b8",marginBottom:"0.4rem",paddingLeft:"0.5rem",borderLeft:"2px solid #6366f1"}}>
                        <span style={{color:"#e8f0fe",fontWeight:600}}>{cr.therapist}</span>{" livre em "}<span style={{fontFamily:"monospace",color:"#818cf8"}}>{DAY_LABELS[cr.day]} {cr.time}</span>{" — "}<span style={{color:"#a5b4fc"}}>{cr.child}</span>{" com "}<span style={{color:"#6366f1",fontWeight:600}}>{cr.activity}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontWeight:700,fontSize:"0.82rem",color:"#e8f0fe",marginBottom:"0.75rem" }}>{uploadPreview.therapists.length} terapeuta(s) — revise:</div>
                {uploadPreview.therapists.map((t,i)=>{
                  const totalFree=DAYS.reduce((a,d)=>a+(t.freeSlots[d]||[]).length,0);
                  const specCount=DAYS.reduce((a,d)=>a+(t.freeSlots[d]||[]).filter(s=>s.reason==="specialist").length,0);
                  const absentDays=t.absentDays||[];
                  return (
                    <div key={i} style={{ background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.6rem" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.6rem" }}>
                        <div style={{ fontWeight:600,fontSize:"0.875rem",color:"#3b82f6" }}>{t.name}</div>
                        <div style={{ display:"flex",gap:"0.35rem",flexWrap:"wrap",justifyContent:"flex-end" }}>
                          {absentDays.length>0&&<span style={{fontSize:"0.68rem",background:"#2a0a0a",color:"#f87171",borderRadius:"5px",padding:"0.12rem 0.45rem",fontWeight:600}}>⛔ {absentDays.map(d=>DAY_LABELS[d]).join(", ")}</span>}
                          {totalFree>0&&<span style={{fontSize:"0.68rem",background:"#0a2010",color:"#4ade80",borderRadius:"5px",padding:"0.12rem 0.45rem",fontWeight:600}}>{totalFree} livre{totalFree!==1?"s":""}</span>}
                          {specCount>0&&<span style={{fontSize:"0.68rem",background:"#1a1040",color:"#a5b4fc",borderRadius:"5px",padding:"0.12rem 0.45rem",fontWeight:600}}>↗ {specCount} especialista</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"0.35rem" }}>
                        {DAYS.map(day=>{
                          const slots=t.freeSlots[day]||[];
                          const isAbsent=absentDays.includes(day);
                          if(isAbsent) return <div key={day} style={{background:"#1a0808",borderRadius:"6px",padding:"0.3rem 0.55rem",fontSize:"0.7rem",border:"1px solid #3d1515"}}><span style={{color:"#6b3333",fontWeight:600}}>{DAY_LABELS[day]}: </span><span style={{color:"#f87171"}}>ausente</span></div>;
                          if(!slots.length) return null;
                          return <div key={day} style={{background:"#141b26",borderRadius:"6px",padding:"0.3rem 0.55rem",fontSize:"0.7rem"}}><span style={{color:"#6b7a99",fontWeight:600}}>{DAY_LABELS[day]}: </span>{slots.map((s,si)=>{const time=typeof s==="string"?s:s.time;const isSpec=s.reason==="specialist";return <span key={si} style={{color:isSpec?"#a5b4fc":"#94a3b8",marginRight:"0.25rem"}}>{time}{isSpec?"✦":""}</span>;})}</div>;
                        })}
                        {absentDays.length===0&&DAYS.every(d=>(t.freeSlots[d]||[]).length===0)&&<span style={{color:"#f59e0b",fontSize:"0.75rem"}}>Nenhum horário livre</span>}
                      </div>
                    </div>
                  );
                })}
                <div style={{fontSize:"0.7rem",color:"#6366f1",marginBottom:"0.75rem"}}>✦ = livre por TO ou Psicoterapia</div>
                <div style={{ display:"flex",gap:"0.5rem" }}>
                  <button onClick={()=>setUploadPreview(null)} style={{flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>Cancelar</button>
                  <button onClick={confirmUpload} style={{flex:1,padding:"0.65rem",background:"#16a34a",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>✅ Confirmar Importação</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CRIANÇAS ── */}
        {tab==="children" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"1rem" }}>Agenda por Criança</div>
            <input value={childSearch} onChange={e=>setChildSearch(e.target.value)} placeholder="🔍 Buscar criança..." style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.65rem 0.9rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"1rem" }} />
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {DAYS.map(d=><button key={d} onClick={()=>setChildViewDay(d)} style={{ flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",background:childViewDay===d?"#7c3aed":"#141b26",color:childViewDay===d?"#fff":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.78rem" }}>{DAY_LABELS[d]}</button>)}
            </div>
            {(()=>{
              const slots=schedules[childViewDay]||[];
              let kids=[...new Set(slots.map(s=>s.child))].sort();
              if(childSearch.trim()) kids=kids.filter(c=>c.toLowerCase().includes(childSearch.toLowerCase()));
              if(!slots.length) return <Empty icon="📋" text={`Nenhuma agenda para ${DAY_LABELS[childViewDay]}`} sub="Importe as agendas na aba 📋" />;
              if(!kids.length) return <Empty text={`Nenhuma criança encontrada para "${childSearch}"`} />;
              return kids.map(child=>{
                const cs=slots.filter(s=>s.child===child).sort((a,b)=>a.time.localeCompare(b.time));
                const isAbsent=(childAbsences[childViewDay]||[]).includes(child);
                return (
                  <div key={child} style={{ background:"#0d1420",border:`1px solid ${isAbsent?"#92400e":"#1e2d45"}`,borderLeft:`3px solid ${isAbsent?"#f59e0b":"#2a3548"}`,borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.75rem" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.6rem" }}>
                      <span style={{ fontWeight:700,fontSize:"0.9rem" }}>{child}</span>
                      {isAbsent&&<span style={{fontSize:"0.65rem",background:"#451a03",color:"#fbbf24",borderRadius:"5px",padding:"0.1rem 0.4rem",fontWeight:600}}>FALTOU</span>}
                    </div>
                    {cs.map((s,i)=>{
                      const actEntry=(childActivities[childViewDay]||[]).find(a=>a.child===child&&a.time===s.time);
                      return (
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.3rem" }}>
                          <span style={{ fontFamily:"monospace",fontSize:"0.78rem",color:"#3b82f6",background:"#1e2d45",borderRadius:"5px",padding:"0.12rem 0.45rem",minWidth:"52px",textAlign:"center",flexShrink:0 }}>{s.time}</span>
                          <span style={{ fontSize:"0.82rem",color:"#cbd5e1",flexShrink:0 }}>{s.therapist}</span>
                          {actEntry?.activity&&<span style={{fontSize:"0.72rem",color:"#a78bfa",background:"#1a0a2e",borderRadius:"5px",padding:"0.1rem 0.4rem"}}>{actEntry.activity}</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── ENTRADAS ── */}
        {tab==="entries" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Mapeamento de Entradas</div>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem" }}>Horário de chegada de cada criança por dia.</div>
            <div style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1.25rem" }}>
              <button onClick={()=>setEntryFilter("ALL")} style={{ padding:"0.4rem 0.75rem",borderRadius:"7px",border:`1px solid ${entryFilter==="ALL"?"#34d399":"#2a3548"}`,background:entryFilter==="ALL"?"#0a2e1a":"#0d1420",color:entryFilter==="ALL"?"#34d399":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.75rem",cursor:"pointer" }}>Todos</button>
              {TIME_OPTIONS.map(t=><button key={t} onClick={()=>setEntryFilter(t)} style={{ padding:"0.4rem 0.65rem",borderRadius:"7px",border:`1px solid ${entryFilter===t?"#34d399":"#2a3548"}`,background:entryFilter===t?"#0a2e1a":"#0d1420",color:entryFilter===t?"#34d399":"#6b7a99",fontFamily:"monospace",fontWeight:600,fontSize:"0.75rem",cursor:"pointer" }}>{t}</button>)}
            </div>
            {DAYS.map(day=>{
              const allSlots=schedules[day]||[];
              const first={};
              allSlots.forEach(({child,time})=>{if(!first[child]||time<first[child])first[child]=time;});
              let entries=Object.entries(first).sort((a,b)=>a[1].localeCompare(b[1])||a[0].localeCompare(b[0]));
              if(entryFilter!=="ALL") entries=entries.filter(([,t])=>t===entryFilter);
              if(!entries.length) return null;
              const byTime={};
              entries.forEach(([child,time])=>{ if(!byTime[time]) byTime[time]=[]; byTime[time].push(child); });
              return (
                <div key={day} style={{ marginBottom:"1.25rem" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.6rem" }}>
                    <span style={{ fontSize:"0.72rem",fontWeight:700,color:"#34d399",background:"#0a2e1a",borderRadius:"6px",padding:"0.2rem 0.6rem",textTransform:"uppercase",letterSpacing:"0.07em" }}>{DAY_LABELS[day]}</span>
                    <span style={{ fontSize:"0.7rem",color:"#6b7a99" }}>{entries.length} criança(s)</span>
                    <div style={{ flex:1,height:"1px",background:"#1e2d45" }} />
                  </div>
                  {Object.entries(byTime).sort((a,b)=>a[0].localeCompare(b[0])).map(([time,children])=>(
                    <div key={time} style={{ marginBottom:"0.75rem" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.35rem" }}>
                        <span style={{ fontFamily:"monospace",fontSize:"0.8rem",color:"#34d399",background:"#0a2e1a",borderRadius:"5px",padding:"0.12rem 0.5rem",flexShrink:0 }}>{time}</span>
                        <span style={{ fontSize:"0.7rem",color:"#4a5a70" }}>Chegada</span>
                      </div>
                      {children.map(child=>(
                        <div key={child} style={{ display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.5rem 0.85rem",marginBottom:"0.3rem",background:"#0d1420",border:"1px solid #1e2d45",borderRadius:"8px" }}>
                          <span style={{ fontSize:"0.85rem",color:"#e8f0fe",flex:1 }}>{child}</span>
                          <span style={{ fontSize:"0.7rem",color:"#6b7a99" }}>{(allSlots.filter(s=>s.child===child)).length} slot(s)</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
            {DAYS.every(day=>{const f={};(schedules[day]||[]).forEach(({child,time})=>{if(!f[child]||time<f[child])f[child]=time;});const e=Object.entries(f);return entryFilter==="ALL"?!e.length:!e.some(([,t])=>t===entryFilter);}) && (
              <Empty icon="🗺️" text={entryFilter==="ALL"?"Nenhuma agenda importada ainda":`Nenhuma criança chega às ${entryFilter}`} sub={entryFilter==="ALL"?"Importe as agendas na aba 📋":undefined} />
            )}
          </div>
        )}

        {/* ── AGENDA ── */}
        {tab==="agenda" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"1rem" }}>Agenda dos Terapeutas</div>
            <input value={agendaFilter} onChange={e=>setAgendaFilter(e.target.value)} placeholder="🔍 Buscar terapeuta..." style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.65rem 0.9rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"1rem" }} />
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {[["ALL","Todos"],...DAYS.map(d=>[d,DAY_LABELS[d]])].map(([key,label])=>(
                <button key={key} onClick={()=>setAgendaDay(key)} style={{ flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",background:agendaDay===key?"#2563eb":"#141b26",color:agendaDay===key?"#fff":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.75rem" }}>{label}</button>
              ))}
            </div>
            {(()=>{
              const daysToShow=agendaDay==="ALL"?DAYS:[agendaDay];
              const allT=[...new Set(DAYS.flatMap(d=>(schedules[d]||[]).map(s=>s.therapist)))].sort();
              const filtered=agendaFilter?allT.filter(n=>n.toLowerCase().includes(agendaFilter.toLowerCase())):allT;
              if(!allT.length) return <Empty icon="📅" text="Nenhuma agenda importada ainda" sub="Importe as agendas na aba 📋" />;
              if(!filtered.length) return <Empty text={`Nenhum resultado para "${agendaFilter}"`} />;
              return filtered.map(name=>{
                const hasAny=daysToShow.some(d=>(schedules[d]||[]).some(s=>s.therapist===name));
                if(!hasAny) return null;
                return (
                  <div key={name} style={{ background:"#0d1420",border:"1px solid #1e2d45",borderLeft:"3px solid #2563eb",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.75rem" }}>
                    <div style={{ fontWeight:700,fontSize:"0.9rem",color:"#60a5fa",marginBottom:"0.75rem" }}>{name}</div>
                    {daysToShow.map(day=>{
                      const slots=(schedules[day]||[]).filter(s=>s.therapist===name).sort((a,b)=>a.time.localeCompare(b.time));
                      if(!slots.length) return null;
                      return (
                        <div key={day} style={{ marginBottom:"0.6rem" }}>
                          {agendaDay==="ALL"&&<div style={{ fontSize:"0.7rem",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"0.4rem" }}>{DAY_LABELS[day]}</div>}
                          {slots.map((s,i)=>{
                            const act=(childActivities[day]||[]).find(a=>a.child===s.child&&a.therapist===name&&a.time===s.time);
                            return (
                              <div key={i} style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.3rem",flexWrap:"wrap" }}>
                                <span style={{ fontFamily:"monospace",fontSize:"0.78rem",color:"#3b82f6",background:"#1e2d45",borderRadius:"5px",padding:"0.12rem 0.45rem",minWidth:"52px",textAlign:"center",flexShrink:0 }}>{s.time}</span>
                                <span style={{ fontSize:"0.82rem",color:"#e8f0fe",flexShrink:0 }}>{s.child}</span>
                                {act?.activity&&<span style={{ fontSize:"0.7rem",color:"#a78bfa",background:"#1a0a2e",borderRadius:"5px",padding:"0.1rem 0.4rem" }}>{act.activity}</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── DESLIGAMENTOS ── */}
        {tab==="discharged" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem" }}>
              {[["children","👶 Crianças"],["therapists","🧑‍⚕️ Terapeutas"]].map(([key,label])=>(
                <button key={key} onClick={()=>setDischargeTab(key)} style={{ flex:1,padding:"0.5rem",borderRadius:"8px",border:"none",cursor:"pointer",background:dischargeTab===key?"#3d2410":"#0d1420",color:dischargeTab===key?"#fb923c":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.8rem",borderBottom:dischargeTab===key?"2px solid #f97316":"2px solid transparent" }}>{label}</button>
              ))}
            </div>
            {dischargeTab==="children" && (
              <>
                <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Crianças Desligadas</div>
                <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem" }}>A criança sai da agenda e os terapeutas ficam com horário livre.</div>
                <div style={{ display:"flex",gap:"0.5rem",marginBottom:"1.25rem" }}>
                  <select value={dischargeInput} onChange={e=>setDischargeInput(e.target.value)} style={{ flex:1,background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.65rem 0.9rem",color:dischargeInput?"#e8f0fe":"#3a4a60",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",cursor:"pointer" }}>
                    <option value="">Selecionar criança...</option>
                    {allChildren.filter(c=>!discharged.includes(c)).map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={()=>{if(dischargeInput){dischargeChild(dischargeInput);setDischargeInput("");}}} disabled={!dischargeInput} style={{ padding:"0.65rem 1rem",background:dischargeInput?"#f97316":"#1e2d45",border:"none",borderRadius:"10px",color:dischargeInput?"#fff":"#6b7a99",fontFamily:"inherit",fontWeight:700,fontSize:"0.82rem",cursor:dischargeInput?"pointer":"not-allowed",flexShrink:0 }}>Desligar</button>
                </div>
                {discharged.length===0?<Empty icon="🚪" text="Nenhuma criança desligada" />:discharged.map(child=>(
                  <div key={child} style={{ background:"#0d1420",border:"1px solid #7c2d12",borderLeft:"3px solid #f97316",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.5rem",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontWeight:600,color:"#fed7aa" }}>{child}</span>
                    <button onClick={()=>reactivateChild(child)} style={{ background:"#1e2d45",border:"none",borderRadius:"6px",color:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.7rem",cursor:"pointer",padding:"0.3rem 0.6rem" }}>↩ Reativar</button>
                  </div>
                ))}
              </>
            )}
            {dischargeTab==="therapists" && (
              <>
                <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Terapeutas Desligados</div>
                <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem" }}>Os horários livres somem e as crianças viram pendências de substituição.</div>
                <div style={{ display:"flex",gap:"0.5rem",marginBottom:"1.25rem" }}>
                  <select value={dischargeInputT} onChange={e=>setDischargeInputT(e.target.value)} style={{ flex:1,background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.65rem 0.9rem",color:dischargeInputT?"#e8f0fe":"#3a4a60",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",cursor:"pointer" }}>
                    <option value="">Selecionar terapeuta...</option>
                    {allTherapists.filter(t=>!dischargedT.includes(t)).map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={()=>{if(dischargeInputT){dischargeTherapist(dischargeInputT);setDischargeInputT("");}}} disabled={!dischargeInputT} style={{ padding:"0.65rem 1rem",background:dischargeInputT?"#f97316":"#1e2d45",border:"none",borderRadius:"10px",color:dischargeInputT?"#fff":"#6b7a99",fontFamily:"inherit",fontWeight:700,fontSize:"0.82rem",cursor:dischargeInputT?"pointer":"not-allowed",flexShrink:0 }}>Desligar</button>
                </div>
                {dischargedT.length===0?<Empty icon="🚪" text="Nenhum terapeuta desligado" />:dischargedT.map(name=>(
                  <div key={name} style={{ background:"#0d1420",border:"1px solid #7c2d12",borderLeft:"3px solid #f97316",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.5rem",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontWeight:600,color:"#fed7aa" }}>{name}</span>
                    <button onClick={()=>reactivateTherapist(name)} style={{ background:"#1e2d45",border:"none",borderRadius:"6px",color:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.7rem",cursor:"pointer",padding:"0.3rem 0.6rem" }}>↩ Reativar</button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── GERENCIAR ── */}
        {tab==="manage" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Gerenciar Cadastros</div>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem" }}>Edite nomes ou remova registros. Para alterar agenda, reimporte na aba 📋.</div>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem" }}>
              {[["therapists","🧑‍⚕️ Terapeutas"],["children","👶 Crianças"]].map(([key,label])=>(
                <button key={key} onClick={()=>{setManageTab(key);setManageSearch("");}} style={{ flex:1,padding:"0.5rem",borderRadius:"8px",border:"none",cursor:"pointer",background:manageTab===key?"#1e2d45":"#0d1420",color:manageTab===key?"#e8f0fe":"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.8rem",borderBottom:manageTab===key?"2px solid #64748b":"2px solid transparent" }}>{label}</button>
              ))}
            </div>
            <input value={manageSearch} onChange={e=>setManageSearch(e.target.value)} placeholder={`🔍 Buscar ${manageTab==="therapists"?"terapeuta":"criança"}...`} style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.65rem 0.9rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"1rem" }} />
            {manageTab==="therapists" && (()=>{
              const allT=[...new Set(DAYS.flatMap(d=>[...(freeSlots[d]||[]).map(s=>s.therapist),...(schedules[d]||[]).map(s=>s.therapist)]))].sort();
              const filtered=manageSearch?allT.filter(n=>n.toLowerCase().includes(manageSearch.toLowerCase())):allT;
              if(!allT.length) return <Empty icon="📋" text="Nenhum terapeuta importado" />;
              if(!filtered.length) return <Empty text={`Nenhum resultado para "${manageSearch}"`} />;
              return filtered.map(name=>(
                <div key={name} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",marginBottom:"0.4rem",borderRadius:"10px",background:"#0d1420",border:"1px solid #1e2d45" }}>
                  <div>
                    <div style={{ fontWeight:600,fontSize:"0.875rem" }}>{name}</div>
                    <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.15rem" }}>{DAYS.reduce((a,d)=>a+(freeSlots[d]||[]).filter(s=>s.therapist===name).length,0)} livre(s) · {DAYS.reduce((a,d)=>a+(schedules[d]||[]).filter(s=>s.therapist===name).length,0)} atend./sem</div>
                  </div>
                  <div style={{ display:"flex",gap:"0.35rem" }}>
                    <Btn onClick={()=>setEditingTherapist({oldName:name,newName:name})} small color="#1e3a5f">✏️</Btn>
                    <Btn onClick={()=>setConfirmRemove({type:"therapist",name})} small color="#3d1515">🗑</Btn>
                  </div>
                </div>
              ));
            })()}
            {manageTab==="children" && (()=>{
              const allC=[...new Set(DAYS.flatMap(d=>(schedules[d]||[]).map(s=>s.child)))].sort();
              const filtered=manageSearch?allC.filter(n=>n.toLowerCase().includes(manageSearch.toLowerCase())):allC;
              if(!allC.length) return <Empty icon="📋" text="Nenhuma criança importada" />;
              if(!filtered.length) return <Empty text={`Nenhum resultado para "${manageSearch}"`} />;
              return filtered.map(name=>(
                <div key={name} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",marginBottom:"0.4rem",borderRadius:"10px",background:"#0d1420",border:"1px solid #1e2d45" }}>
                  <div>
                    <div style={{ fontWeight:600,fontSize:"0.875rem" }}>{name}</div>
                    <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.15rem" }}>{DAYS.reduce((a,d)=>a+(schedules[d]||[]).filter(s=>s.child===name).length,0)} horário(s)</div>
                  </div>
                  <Btn onClick={()=>setConfirmRemove({type:"child",name})} small color="#3d1515">🗑</Btn>
                </div>
              ));
            })()}
          </div>
        )}

        {/* ── MODALS ── */}
        {showSubModal && (
          <Modal title={editingSub?"Editar Substituição":"Nova Substituição"} onClose={()=>setShowSubModal(false)}>
            <Field label="Paciente" value={subForm.patient} onChange={v=>setSubForm(f=>({...f,patient:v}))} placeholder="Ex: Gael Tanan" />
            <Field label="Horário" value={subForm.time} onChange={v=>setSubForm(f=>({...f,time:v}))} placeholder="Ex: 15h às 17h ou 16h" />
            <Field label="Terapeuta (opcional)" value={subForm.therapist} onChange={v=>setSubForm(f=>({...f,therapist:v}))} placeholder="Ex: Jennifer Felicio" />
            <DDrop label="Status" value={subForm.status} onChange={v=>setSubForm(f=>({...f,status:v}))} options={[{value:"Pending",label:"🟡 Pendente"},{value:"Designated",label:"🔵 Designada"}]} />
            <SaveCancel onCancel={()=>setShowSubModal(false)} onSave={saveSub} />
          </Modal>
        )}
        {showSlotModal && (
          <Modal title={editingSlot?"Editar Horário":"Novo Terapeuta Livre"} onClose={()=>setShowSlotModal(false)}>
            <DDrop label="Horário" value={slotForm.time} onChange={v=>setSlotForm(f=>({...f,time:v}))} options={TIME_OPTIONS.map(t=>({value:t,label:t}))} />
            <Field label="Terapeuta" value={slotForm.therapist} onChange={v=>setSlotForm(f=>({...f,therapist:v}))} placeholder="Ex: Isabella" />
            <SaveCancel onCancel={()=>setShowSlotModal(false)} onSave={saveSlot} />
          </Modal>
        )}
        {showMultiSlot && (
          <Modal title="⚡ Múltiplos Horários" onClose={()=>setShowMultiSlot(false)}>
            <div style={{fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1rem"}}>Terapeuta em <strong style={{color:"#94a3b8"}}>{DAY_LABELS[activeDay]}</strong></div>
            <Field label="Terapeuta" value={multiSlot.therapist} onChange={v=>setMultiSlot(f=>({...f,therapist:v}))} placeholder="Nome do terapeuta..." />
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.6rem"}}>Horários ({multiSlot.times.length} selecionados)</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
                {TIME_OPTIONS.map(t=>{const sel=multiSlot.times.includes(t);return <button key={t} onClick={()=>setMultiSlot(f=>({...f,times:sel?f.times.filter(x=>x!==t):[...f.times,t]}))} style={{padding:"0.35rem 0.65rem",borderRadius:"7px",border:`1px solid ${sel?"#3b82f6":"#2a3548"}`,background:sel?"#1e2d45":"#0d1420",color:sel?"#3b82f6":"#6b7a99",fontFamily:"monospace",fontSize:"0.78rem",cursor:"pointer",fontWeight:sel?600:400}}>{t}</button>;})}
              </div>
            </div>
            <SaveCancel onCancel={()=>setShowMultiSlot(false)} onSave={saveMultiSlot} />
          </Modal>
        )}
        {showBulk && (
          <Modal title="⚡ Designação Rápida" onClose={()=>setShowBulk(false)}>
            <div style={{fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1rem"}}>Converte pendências do paciente para Designada, ou cria nova entrada.</div>
            <Field label="Paciente" value={bulkForm.patient} onChange={v=>setBulkForm(f=>({...f,patient:v}))} placeholder="Ex: Gael Tanan" />
            <div style={{display:"flex",gap:"0.75rem",marginBottom:"1rem"}}>
              <div style={{flex:1}}><label style={{display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem"}}>De</label><select value={bulkForm.timeFrom} onChange={e=>setBulkForm(f=>({...f,timeFrom:e.target.value}))} style={{width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",cursor:"pointer"}}>{TIME_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{flex:1}}><label style={{display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem"}}>Até</label><select value={bulkForm.timeTo} onChange={e=>setBulkForm(f=>({...f,timeTo:e.target.value}))} style={{width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",cursor:"pointer"}}>{TIME_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <label style={{display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem"}}>Terapeuta</label>
            <input value={bulkSearch} onChange={e=>setBulkSearch(e.target.value)} placeholder="🔍 Filtrar..." style={{width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.55rem 0.8rem",color:"#e8f0fe",fontSize:"0.82rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"0.35rem"}} />
            <div style={{maxHeight:"120px",overflowY:"auto",border:"1px solid #2a3548",borderRadius:"8px",background:"#0d1420",marginBottom:"0.5rem"}}>
              {allTherapists.filter(n=>!bulkSearch||n.toLowerCase().includes(bulkSearch.toLowerCase())).map(name=>(
                <div key={name} onClick={()=>{setBulkForm(f=>({...f,therapist:name}));setBulkSearch("");}} style={{padding:"0.5rem 0.85rem",cursor:"pointer",fontSize:"0.875rem",background:bulkForm.therapist===name?"#1e2d45":"transparent",color:bulkForm.therapist===name?"#3b82f6":"#cbd5e1",borderBottom:"1px solid #1a2335"}}>{name}</div>
              ))}
              {allTherapists.length===0&&<div style={{padding:"0.5rem 0.85rem",fontSize:"0.8rem",color:"#6b7a99"}}>Nenhum terapeuta importado</div>}
            </div>
            {bulkForm.therapist&&<div style={{fontSize:"0.72rem",color:"#34d399",marginBottom:"0.5rem"}}>✓ {bulkForm.therapist}</div>}
            <SaveCancel onCancel={()=>setShowBulk(false)} onSave={saveBulk} />
          </Modal>
        )}
        {showClearConfirm && (
          <Modal title="⚠️ Confirmar limpeza" onClose={()=>setShowClearConfirm(null)}>
            <div style={{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"1.25rem",lineHeight:1.6}}>
              {showClearConfirm==="designated"&&"Remover todas as substituições designadas?"}
              {showClearConfirm==="pending"&&"Remover todas as substituições pendentes?"}
              {showClearConfirm==="all"&&<span style={{color:"#f87171"}}>Remover <strong>todas</strong> as substituições?</span>}
            </div>
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button onClick={()=>setShowClearConfirm(null)} style={{flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>clearSubs(showClearConfirm)} style={{flex:1,padding:"0.65rem",background:"#dc2626",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>Confirmar</button>
            </div>
          </Modal>
        )}
        {editingTherapist && (
          <Modal title="✏️ Editar Terapeuta" onClose={()=>setEditingTherapist(null)}>
            <div style={{fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1rem"}}>Nome atual: <strong style={{color:"#94a3b8"}}>{editingTherapist.oldName}</strong></div>
            <Field label="Novo nome" value={editingTherapist.newName} onChange={v=>setEditingTherapist(p=>({...p,newName:v}))} placeholder="Digite o nome correto..." />
            <SaveCancel onCancel={()=>setEditingTherapist(null)} onSave={()=>renameTherapist(editingTherapist.oldName,editingTherapist.newName)} />
          </Modal>
        )}
        {confirmRemove && (
          <Modal title={`⚠️ Remover ${confirmRemove.type==="therapist"?"Terapeuta":"Criança"}`} onClose={()=>setConfirmRemove(null)}>
            <div style={{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem",lineHeight:1.6}}>Remover <strong style={{color:"#e8f0fe"}}>{confirmRemove.name}</strong> de todos os registros?</div>
            <div style={{fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem"}}>{confirmRemove.type==="therapist"?"Horários livres, agendas e faltas serão removidos.":"Agendas, pendências e faltas serão removidos."}</div>
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button onClick={()=>setConfirmRemove(null)} style={{flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>confirmRemove.type==="therapist"?removeTherapist(confirmRemove.name):removeChild(confirmRemove.name)} style={{flex:1,padding:"0.65rem",background:"#dc2626",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"inherit",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>Remover</button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
