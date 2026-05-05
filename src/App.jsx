import React, { useState, useRef, useEffect } from "react";

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DAY_LABELS = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };
const TIME_OPTIONS = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00"];

const initialSubstitutions = [
  { id: 1, patient: "Gael Tanan", time: "15h às 17h", therapist: "Jennifer Felicio", status: "Designated" },
  { id: 2, patient: "Arthur Tartari", time: "16h", therapist: "", status: "Pending" },
];
const initialFreeSlots = { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };
// therapistSchedules: { SEG: [{therapist, child, time}], ... } — built from import
// stores who each therapist was attending per day/time so absence detection works

// ─── UI Components ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(10,14,20,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem",backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#141b26",border:"1px solid #2a3548",borderRadius:"16px",padding:"1.5rem",width:"100%",maxWidth:"440px",boxShadow:"0 24px 64px rgba(0,0,0,0.6)",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",color:"#e8f0fe" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7a99",cursor:"pointer",fontSize:"1.4rem",lineHeight:1 }}>✕</button>
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
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box" }} />
    </div>
  );
}

function Dropdown({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",cursor:"pointer" }}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, color="#3b82f6", small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:disabled?"#1e2d45":color, border:"none", borderRadius:small?"6px":"8px",
      color:disabled?"#6b7a99":"#fff", fontFamily:"'DM Sans',sans-serif", fontWeight:600,
      fontSize:small?"0.75rem":"0.875rem", padding:small?"0.3rem 0.65rem":"0.65rem 1.2rem",
      cursor:disabled?"not-allowed":"pointer", letterSpacing:"0.02em"
    }}>{children}</button>
  );
}

function SaveCancel({ onCancel, onSave }) {
  return (
    <div style={{ display:"flex",gap:"0.5rem",marginTop:"0.25rem" }}>
      <button onClick={onCancel} style={{ flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>Cancelar</button>
      <button onClick={onSave} style={{ flex:1,padding:"0.65rem",background:"#3b82f6",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>Salvar</button>
    </div>
  );
}

function Empty({ icon="", text, sub }) {
  return (
    <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"2rem 1rem",background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
      {icon&&<div style={{ fontSize:"1.5rem",marginBottom:"0.5rem" }}>{icon}</div>}
      {text}
      {sub&&<div style={{ fontSize:"0.72rem",marginTop:"0.4rem",color:"#4a5a70" }}>{sub}</div>}
    </div>
  );
}

function Section({ color, bg, label, count, children }) {
  return (
    <div style={{ marginBottom:"1.5rem" }}>
      <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem" }}>
        <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0 }} />
        <span style={{ fontSize:"0.72rem",fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.1em" }}>{label}</span>
        <span style={{ fontSize:"0.7rem",color:"#6b7a99",background:bg,borderRadius:"10px",padding:"0.1rem 0.5rem" }}>{count}</span>
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
          {autoCreated && (
            <span style={{ fontSize:"0.65rem",background:"#2a1a40",color:"#a78bfa",borderRadius:"5px",padding:"0.1rem 0.4rem",fontWeight:600,flexShrink:0 }}>AUTO</span>
          )}
        </div>
        <div style={{ fontSize:"0.78rem",color:"#6b7a99" }}>
          <span style={{ fontFamily:"'DM Mono',monospace",color:"#94a3b8" }}>{s.time}</span>
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

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("subs");
  const [activeDay, setActiveDay] = useState("SEG");

  // Lendo do Local Save ao abrir o app
  const [subs, setSubs] = useState(() => {
    const saved = localStorage.getItem("gestor_subs");
    return saved ? JSON.parse(saved) : initialSubstitutions;
  });

  const [freeSlots, setFreeSlots] = useState(() => {
    const saved = localStorage.getItem("gestor_freeSlots");
    return saved ? JSON.parse(saved) : initialFreeSlots;
  });

  // therapistSchedules stores occupied slots per day: { SEG:[{therapist,child,time}], ... }
  const [therapistSchedules, setTherapistSchedules] = useState(() => {
    const saved = localStorage.getItem("gestor_schedules");
    return saved ? JSON.parse(saved) : { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };
  });

  const [showSubModal, setShowSubModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(null); // null | "designated" | "pending" | "all"
  const [editingSub, setEditingSub] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [subForm, setSubForm] = useState({ patient:"", time:"", therapist:"", status:"Pending" });
  const [slotForm, setSlotForm] = useState({ time:"13:00", therapist:"" });
  const [bulkForm, setBulkForm] = useState({ patient:"", timeFrom:"08:00", timeTo:"11:00", therapist:"" });
  const [childSearch, setChildSearch] = useState("");
  const [childViewDay, setChildViewDay] = useState("SEG");

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileRef = useRef();

  // ── Absence filters ──
  const [absenceTherapistSearch, setAbsenceTherapistSearch] = useState("");
  const [absenceChildSearch, setAbsenceChildSearch] = useState("");

  // ── Absences ──
  // absences: { SEG: ["Leticia Alves", "Cassio"], TER: [], ... }
  const [absences, setAbsences] = useState(() => {
    const saved = localStorage.getItem("gestor_absences");
    return saved ? JSON.parse(saved) : { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };
  });
  const [absenceDay, setAbsenceDay] = useState("SEG");

  const [childAbsences, setChildAbsences] = useState(() => {
    const saved = localStorage.getItem("gestor_childAbsences");
    return saved ? JSON.parse(saved) : { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };
  });

  // Crianças desligadas — removidas das agendas, terapeutas ficam livres
  const [dischargedChildren, setDischargedChildren] = useState(() => {
    const saved = localStorage.getItem("gestor_discharged");
    return saved ? JSON.parse(saved) : [];
  });
  const [dischargeInput, setDischargeInput] = useState("");
  const [showDischargeTab, setShowDischargeTab] = useState(false);

  // Gravando no Local Save automaticamente toda vez que algo mudar
  useEffect(() => { localStorage.setItem("gestor_subs", JSON.stringify(subs)); }, [subs]);
  useEffect(() => { localStorage.setItem("gestor_freeSlots", JSON.stringify(freeSlots)); }, [freeSlots]);
  useEffect(() => { localStorage.setItem("gestor_schedules", JSON.stringify(therapistSchedules)); }, [therapistSchedules]);
  useEffect(() => { localStorage.setItem("gestor_absences", JSON.stringify(absences)); }, [absences]);
  useEffect(() => { localStorage.setItem("gestor_childAbsences", JSON.stringify(childAbsences)); }, [childAbsences]);
  useEffect(() => { localStorage.setItem("gestor_discharged", JSON.stringify(dischargedChildren)); }, [dischargedChildren]);
  
  // All known therapist names from freeSlots
  const allTherapists = [...new Set(
    DAYS.flatMap(d => freeSlots[d].map(s => s.therapist))
  )].sort();

  // All known children from schedules
  const allChildren = [...new Set(
    DAYS.flatMap(d => (therapistSchedules[d] || []).map(s => s.child))
  )].sort();

  const dischargeChild = (childName) => {
    if (!childName.trim()) return;
    const name = childName.trim();
    if (dischargedChildren.includes(name)) return;
    setDischargedChildren(prev => [...prev, name]);
    // Remove pending subs for this child
    setSubs(prev => prev.filter(s => s.patient.toLowerCase() !== name.toLowerCase()));
    // Add therapist free slots for each day this child had sessions
    setFreeSlots(prevSlots => {
      const newSlots = { ...prevSlots };
      DAYS.forEach(day => {
        const sessions = (therapistSchedules[day] || []).filter(s => s.child.toLowerCase() === name.toLowerCase());
        sessions.forEach(({ therapist, time }) => {
          const already = (newSlots[day] || []).some(s => s.therapist === therapist && s.time === time);
          if (!already) {
            newSlots[day] = [...(newSlots[day] || []), { id: Date.now() + Math.random(), time, therapist, dischargedChild: name }];
          }
        });
        if (newSlots[day]) newSlots[day].sort((a,b) => a.time.localeCompare(b.time));
      });
      return newSlots;
    });
  };

  const reactivateChild = (childName) => {
    setDischargedChildren(prev => prev.filter(n => n !== childName));
    // Remove the free slots that came from this child's discharge
    setFreeSlots(prevSlots => {
      const newSlots = { ...prevSlots };
      DAYS.forEach(day => {
        newSlots[day] = (newSlots[day] || []).filter(s => s.dischargedChild !== childName);
      });
      return newSlots;
    });
  };

  const toggleAbsence = (day, name) => {
    setAbsences(prev => {
      const current = prev[day] || [];
      const updated = current.includes(name) ? current.filter(n=>n!==name) : [...current, name];
      return { ...prev, [day]: updated };
    });
  };

  const applyAbsences = (day) => {
    const absentTherapists = absences[day] || [];
    if (!absentTherapists.length) return;

    // Find all children that were being attended by absent therapists on this day
    const affectedSlots = (freeSlots[day] || []).filter(s => {
      // freeSlots are therapists who are FREE — we need the occupied slots
      // We look at the therapistSchedule derived from import (stored in therapistSchedules state)
      return false; // placeholder - handled via therapistSchedules below
    });

    // Use therapistSchedules to find children
    const newPending = [];
    absentTherapists.forEach(therapistName => {
      const schedule = therapistSchedules[day] || [];
      schedule
        .filter(s => s.therapist.toLowerCase() === therapistName.toLowerCase())
        .forEach(({ child, time }) => {
          // Check not already pending for this child+day
          const alreadyExists = subs.some(s =>
            s.patient.toLowerCase() === child.toLowerCase() &&
            s.day === day && s.status === "Pending"
          );
          if (!alreadyExists) {
            newPending.push({
              id: Date.now() + Math.random(),
              patient: child,
              time,
              day,
              therapist: "",
              status: "Pending",
              autoCreated: true,
              absentTherapist: therapistName,
              activities: []
            });
          }
        });
    });

    if (newPending.length > 0) {
      setSubs(prev => [...prev, ...newPending]);
    }
    return newPending.length;
  };

  // ── Subs CRUD ──
  const openAddSub = () => { setEditingSub(null); setSubForm({patient:"",time:"",therapist:"",status:"Pending"}); setShowSubModal(true); };
  const openEditSub = s => { setEditingSub(s.id); setSubForm({patient:s.patient,time:s.time,therapist:s.therapist,status:s.status}); setShowSubModal(true); };
  const saveSub = () => {
    if (!subForm.patient || !subForm.time) return;
    if (editingSub) setSubs(p=>p.map(s=>s.id===editingSub?{...s,...subForm}:s));
    else setSubs(p=>[...p,{id:Date.now(),...subForm}]);
    setShowSubModal(false);
  };
  const deleteSub = id => setSubs(p=>p.filter(s=>s.id!==id));

  const saveBulk = () => {
    if (!bulkForm.patient || !bulkForm.therapist || !bulkForm.timeFrom || !bulkForm.timeTo) return;
    const from = bulkForm.timeFrom;
    const to = bulkForm.timeTo;
    const patLower = bulkForm.patient.toLowerCase().trim();

    // Build the time string for the designated entry
    const timeStr = from === to ? from : `${from} às ${to}`;

    // Check if there are matching pending entries for this patient
    const hasPending = subs.some(s =>
      s.status === "Pending" && s.patient.toLowerCase().trim() === patLower
    );

    if (hasPending) {
      // Check if there's already a Designated entry for same patient+therapist
      const existingDesignated = subs.find(s =>
        s.status === "Designated" &&
        s.patient.toLowerCase().trim() === patLower &&
        s.therapist.toLowerCase().trim() === bulkForm.therapist.toLowerCase().trim()
      );

      if (existingDesignated) {
        // Merge: extend the time range of the existing designated entry, remove all pending
        setSubs(prev => {
          const filtered = prev.filter(s => {
            if (s.id === existingDesignated.id) return false; // remove old designated (will re-add merged)
            if (s.status === "Pending" && s.patient.toLowerCase().trim() === patLower) return false; // remove pending
            return true;
          });
          // Build merged time string
          const existFrom = existingDesignated.time.split(" às ")[0].trim();
          const existTo = existingDesignated.time.split(" às ").pop().trim();
          const mergedFrom = existFrom < from ? existFrom : from;
          const mergedTo = existTo > to ? existTo : to;
          const mergedTime = mergedFrom === mergedTo ? mergedFrom : `${mergedFrom} às ${mergedTo}`;
          return [...filtered, { ...existingDesignated, time: mergedTime }];
        });
      } else {
        // Remove all pending for this patient, add one Designated
        setSubs(prev => {
          const filtered = prev.filter(s =>
            !(s.status === "Pending" && s.patient.toLowerCase().trim() === patLower)
          );
          return [...filtered, {
            id: Date.now(),
            patient: bulkForm.patient,
            time: timeStr,
            therapist: bulkForm.therapist,
            status: "Designated",
            autoCreated: false
          }];
        });
      }
    } else {
      // No pending found — check if same patient+therapist designated already exists to merge
      const existingDesignated = subs.find(s =>
        s.status === "Designated" &&
        s.patient.toLowerCase().trim() === patLower &&
        s.therapist.toLowerCase().trim() === bulkForm.therapist.toLowerCase().trim()
      );
      if (existingDesignated) {
        setSubs(prev => {
          const filtered = prev.filter(s => s.id !== existingDesignated.id);
          const existFrom = existingDesignated.time.split(" às ")[0].trim();
          const existTo = existingDesignated.time.split(" às ").pop().trim();
          const mergedFrom = existFrom < from ? existFrom : from;
          const mergedTo = existTo > to ? existTo : to;
          const mergedTime = mergedFrom === mergedTo ? mergedFrom : `${mergedFrom} às ${mergedTo}`;
          return [...filtered, { ...existingDesignated, time: mergedTime }];
        });
      } else {
        setSubs(prev => [...prev, {
          id: Date.now(),
          patient: bulkForm.patient,
          time: timeStr,
          therapist: bulkForm.therapist,
          status: "Designated"
        }]);
      }
    }

    setBulkForm({ patient:"", timeFrom:"08:00", timeTo:"11:00", therapist:"" });
    setShowBulkModal(false);
  };

  const clearSubs = (type) => {
    if (type === "designated") setSubs(p => p.filter(s => s.status !== "Designated"));
    else if (type === "pending") setSubs(p => p.filter(s => s.status !== "Pending"));
    else setSubs([]);
    setShowClearConfirm(null);
  };

  // ── Free Slots CRUD ──
  const openAddSlot = () => { setEditingSlot(null); setSlotForm({time:"13:00",therapist:""}); setShowSlotModal(true); };
  const openEditSlot = s => { setEditingSlot(s.id); setSlotForm({time:s.time,therapist:s.therapist}); setShowSlotModal(true); };
  const saveSlot = () => {
    if (!slotForm.therapist) return;
    if (editingSlot) setFreeSlots(p=>({...p,[activeDay]:p[activeDay].map(s=>s.id===editingSlot?{...s,...slotForm}:s)}));
    else setFreeSlots(p=>({...p,[activeDay]:[...p[activeDay],{id:Date.now(),...slotForm}]}));
    setShowSlotModal(false);
  };
  const deleteSlot = id => setFreeSlots(p=>({...p,[activeDay]:p[activeDay].filter(s=>s.id!==id)}));

  const slotsByTime = TIME_OPTIONS.reduce((acc,t)=>{
    const found=(freeSlots[activeDay]||[]).filter(s=>s.time===t);
    if(found.length) acc[t]=found;
    return acc;
  },{});

  // ── Upload & AI ──
  const toBase64 = file => new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(",")[1]);
    r.onerror=()=>rej(new Error("Falha na leitura"));
    r.readAsDataURL(file);
  });

  const handleFiles = async files => {
    if (!files||!files.length) return;
    setUploading(true);
    setUploadStatus(null);
    setUploadPreview(null);

    try {
      const imageParts = await Promise.all(
        Array.from(files).map(async file => {
          const b64 = await toBase64(file);
          const mt = file.type && file.type !== "" ? file.type : (file.name.match(/\.jpe?g$/i) ? "image/jpeg" : "image/png");
          return { inlineData: { data: b64, mimeType: mt } };
        })
      );

      const systemPrompt = `Você é um extrator de dados de agendas de clínica de terapia infantil. Responda APENAS com JSON, sem texto antes ou depois.

DOIS tipos de agenda:

TIPO A - TERAPEUTA:
- Cabecalho: nome do terapeuta (ex: "ATC 05 - LETICIA ALVES SOBRAL" converte para "Leticia Alves Sobral")
- Colunas: SEG, TER, QUA, QUI, SEX
- Linhas: horarios HH:MM
- Celulas: nome do paciente, VAZIA, "AT", ou linha com FUNDO PRETO

CELULAS COM BARRA "/" (paciente original / substituto):
- Quando uma celula contém "NomeA/ NomeB" ou "NomeA/NomeB", significa que NomeA é o paciente ORIGINAL e NomeB é quem está sendo ATENDIDO no lugar dele.
- Para occupiedSlots do terapeuta: registrar NomeB (o da DIREITA da barra) como paciente atendido.
- NomeA (ESQUERDA) só é atendido nos horários em que a célula NÃO tem barra (célula simples com apenas NomeA).
- Exemplo: se 08:00, 08:30, 09:00, 09:30 têm "Davi" simples e 10:00, 10:30, 11:00, 11:30 têm "Davi/ Guilherme", então:
  - Davi é atendido de 08:00 a 09:30 (horários sem barra)
  - Guilherme é atendido de 10:00 a 11:30 (horários COM barra, usar o nome APÓS a barra)
  - Davi NAO é considerado atendido nos horários com barra
- Para pendencias: usar o nome APÓS a barra (DIREITA) como paciente daquele horário.
- NUNCA incluir "NomeA/" com a barra no occupiedSlots. Limpar o nome: remover tudo antes e incluindo a barra.

TIPO B - PACIENTE/CRIANCA:
- Cabecalho: "PACIENTE - NOME"
- Celulas: tipo de atividade

AUSENCIA DO TERAPEUTA (nao esta na clinica):
- Linha com FUNDO PRETO em qualquer horario do dia: terapeuta AUSENTE o dia inteiro. Nenhum horario desse dia e livre. Adicionar o dia em absentDays.
- Celula com "AT" ou "A.T.": terapeuta ausente naquele horario especifico. Nao e livre nem ocupado.

TERAPEUTA LIVRE (presente na clinica, sem paciente):
- Celula VAZIA em dia sem linha preta: livre, reason:"empty"
// DEPOIS
- "Autocuidado (TO)", "Hab. Sociais (Psicoterapia)", "ESPECIFICA / FONO", "ESPECIFICA / MOTORAS" ou "PSICOMOTRICIDADE": com especialista, nao gerar pendencia

TERAPEUTA OCUPADO:
- Celula com nome de paciente sem cruzamento com especialista
- "Autocuidado" sem "(TO)": ocupado
- "Hab. Sociais" sem "(Psicoterapia)": ocupado

PENDENCIAS:
Para cada crianca TIPO B, em cada dia/hora com atividade:
// DEPOIS
- "Autocuidado (TO)", "Hab. Sociais (Psicoterapia)", "ESPECIFICA / FONO", "ESPECIFICA / MOTORAS" ou "PSICOMOTRICIDADE": com especialista, nao gerar pendencia
- Qualquer outra atividade: verificar se algum terapeuta TIPO A tem o nome dessa crianca nesse dia/hora E nao esta ausente
  - SIM: OK, tem terapeuta
  - NAO: pendencia automatica

RETORNE APENAS ESTE JSON SEM MARKDOWN:
{"therapists":[{"name":"Nome Terapeuta","absentDays":["SEG"],"freeSlots":{"SEG":[],"TER":[{"time":"08:00","reason":"empty"}],"QUA":[{"time":"13:00","reason":"specialist","child":"Nome","activity":"Autocuidado (TO)"}],"QUI":[],"SEX":[]},"occupiedSlots":{"SEG":[],"TER":[{"time":"09:00","child":"Nome Paciente"}],"QUA":[],"QUI":[],"SEX":[]}}],"crossReferences":[{"child":"Nome","therapist":"Nome","day":"QUA","time":"13:00","activity":"Autocuidado (TO)","therapistFree":true}],"pendingChildren":[{"child":"Nome","day":"TER","time":"14:00","activity":"Hab. Academicas"}],"occupiedSlots":{"SEG":[{"time":"08:00","child":"Nome Paciente"}],"TER":[],"QUA":[],"QUI":[],"SEX":[]}}

Regras finais:
- absentDays: dias com linha preta
- Sem agendas de criancas: pendingChildren:[], crossReferences:[]
- Sem agendas de terapeutas: therapists:[]
- occupiedSlots: para cada terapeuta, os horarios em que ele ESTA ATENDENDO um paciente (nao livre, nao AT, nao linha preta). Em celulas com barra "NomeA/ NomeB", registrar APENAS NomeB (pos-barra) como child naquele horario. Celulas sem barra: registrar o nome completo. Formato: {"SEG":[{"time":"08:00","child":"Nome Paciente"}], ...}
- NUNCA escreva texto fora do JSON`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Chave de API da IA não encontrada nas configurações.");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            role: "user",
            parts: [
              ...imageParts,
              { text: `Analise as ${files.length} imagem(ns). Identifique terapeutas e pacientes, aplique todas as regras e retorne o JSON completo.` }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(`API: ${data.error.message}`);
      if (!data.candidates || data.candidates.length === 0) throw new Error(`Resposta vazia da IA.`);

      const rawText = data.candidates[0].content.parts[0].text;

      // Detect case where only patient agendas were uploaded (no therapist agendas)
      const lower = rawText.toLowerCase();
      const noTherapists = !rawText.includes("{") && (
        lower.includes("tipo b") || lower.includes("não há") ||
        lower.includes("nenhuma agenda tipo a") || lower.includes("apenas agenda")
      );
      if (noTherapists) {
        setUploading(false);
        setUploadStatus({ ok:false, message:"⚠️ Só foram detectadas agendas de crianças. Inclua também as agendas dos terapeutas (ATC) no mesmo upload para gerar os horários livres e pendências." });
        return;
      }

      // Robust JSON extraction — find outermost { } block
      const extractJSON = (str) => {
        const start = str.indexOf("{");
        if (start === -1) {
          setUploadStatus({ ok:false, message:`⚠️ Só foram detectadas agendas de crianças. Inclua também as agendas dos terapeutas (ATC) no mesmo upload.` });
          throw new Error("NO_JSON");
        }
        let depth = 0;
        for (let i = start; i < str.length; i++) {
          if (str[i] === "{") depth++;
          else if (str[i] === "}") { depth--; if (depth === 0) return str.slice(start, i+1); }
        }
        throw new Error("JSON incompleto na resposta da IA");
      };

      const jsonStr = extractJSON(rawText);
      if (jsonStr === null) return;
      const parsed = JSON.parse(jsonStr);

      const therapists = parsed.therapists || (Array.isArray(parsed)?parsed:[]);
      const crossRefs = parsed.crossReferences || [];
      const pendingChildren = parsed.pendingChildren || [];

      setUploadPreview({ therapists, crossRefs, pendingChildren });
      setUploading(false);

    } catch(err) {
      setUploading(false);
      setUploadStatus({ ok:false, message:"Erro ao processar: "+err.message });
    }
  };

  const confirmUpload = () => {
    if (!uploadPreview) return;
    const { therapists, pendingChildren } = uploadPreview;

    // Build therapistSchedules: occupied slots per day (therapist→child mappings)
    const newSchedules = { SEG:[], TER:[], QUA:[], QUI:[], SEX:[] };

    // Helper: extract the real child name from slash notation ("NomeA/ NomeB" → "NomeB")
    const cleanChildName = (raw) => {
      if (!raw) return raw;
      if (raw.includes("/")) {
        const right = raw.split("/").pop().trim();
        return right || raw.trim();
      }
      return raw.trim();
    };

    therapists.forEach(({ name, freeSlots: fs, occupiedSlots }) => {
      // occupiedSlots may be provided, otherwise we can't reconstruct from freeSlots alone
      // Store what we know from the raw therapist data
      if (occupiedSlots) {
        DAYS.forEach(day => {
          (occupiedSlots[day]||[]).forEach(({ time, child }) => {
            const cleanChild = cleanChildName(child);
            if (cleanChild) newSchedules[day].push({ therapist: name, child: cleanChild, time });
          });
        });
      }
    });
    // Merge with existing (keep schedules from previous imports)
    setTherapistSchedules(prev => {
      const merged = { ...prev };
      DAYS.forEach(day => {
        const existingTherapists = new Set(newSchedules[day].map(s=>s.therapist.toLowerCase()));
        merged[day] = [
          ...prev[day].filter(s=>!existingTherapists.has(s.therapist.toLowerCase())),
          ...newSchedules[day]
        ];
      });
      return merged;
    });

    // ── Update free slots ──
    const newSlots = { SEG:[...freeSlots.SEG], TER:[...freeSlots.TER], QUA:[...freeSlots.QUA], QUI:[...freeSlots.QUI], SEX:[...freeSlots.SEX] };
    const uploadedNames = therapists.map(t=>t.name.toLowerCase().trim());
    DAYS.forEach(day=>{ newSlots[day]=newSlots[day].filter(s=>!uploadedNames.includes(s.therapist.toLowerCase().trim())); });
    therapists.forEach(({ name, freeSlots: fs })=>{
      DAYS.forEach(day=>{
        (fs[day]||[]).forEach(slot=>{
          const time = typeof slot==="string"?slot:slot.time;
          newSlots[day].push({ id:Date.now()+Math.random(), time, therapist:name });
        });
      });
    });
    DAYS.forEach(day=>{ newSlots[day].sort((a,b)=>a.time.localeCompare(b.time)); });
    setFreeSlots(newSlots);

    // ── Auto-create pending substitutions ──
    // Group pending by child+day so we build a time range string
    if (pendingChildren.length > 0) {
      const grouped = {};
      pendingChildren.forEach(({ child, day, time, activity }) => {
        const cleanChild = cleanChildName(child);
        const key = `${cleanChild}||${day}`;
        if (!grouped[key]) grouped[key] = { child: cleanChild, day, times:[], activities:[] };
        grouped[key].times.push(time);
        grouped[key].activities.push(activity);
      });

      const newPending = Object.values(grouped).map(({ child, day, times, activities }) => {
        times.sort();
        const timeStr = times.length===1
          ? times[0]
          : `${times[0]} às ${times[times.length-1]}`;
        return {
          id: Date.now()+Math.random(),
          patient: child,
          time: timeStr,
          day,
          therapist: "",
          status: "Pending",
          autoCreated: true,
          activities: [...new Set(activities)]
        };
      });

      // Avoid duplicates: remove existing auto-pending for same child+day, then add new
      setSubs(prev => {
        const childDayKeys = newPending.map(p=>`${p.patient.toLowerCase()}||${p.day}`);
        const filtered = prev.filter(s => {
          if (!s.autoCreated) return true;
          const k = `${s.patient.toLowerCase()}||${s.day}`;
          return !childDayKeys.includes(k);
        });
        return [...filtered, ...newPending];
      });
    }

    setUploadPreview(null);
    const pendingMsg = pendingChildren.length>0 ? ` · ${Object.keys(
      pendingChildren.reduce((a,c)=>({...a,[`${c.child}||${c.day}`]:1}),{})
    ).length} pendência(s) criadas automaticamente` : "";
    setUploadStatus({ ok:true, message:`✅ ${therapists.length} terapeuta(s) importado(s)${pendingMsg}` });
    setTimeout(()=>setUploadStatus(null), 5000);
  };

  const designated = subs.filter(s=>s.status==="Designated");
  const pending = subs.filter(s=>s.status==="Pending");
  const autoPendingCount = pending.filter(s=>s.autoCreated).length;

  // ── Render ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#0a0e14;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#2a3548;border-radius:4px;}
        input::placeholder{color:#3a4a60;}
      `}</style>

      <div style={{ minHeight:"100vh",background:"#0a0e14",fontFamily:"'DM Sans',sans-serif",color:"#e8f0fe",maxWidth:"480px",margin:"0 auto" }}>

        {/* ── Header ── */}
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
              {[
                ["subs", pending.length>0 ? `🔁 Substituições (${pending.length})` : "🔁 Substituições"],
                ["free","🧑‍⚕️ Terapeutas Livres"]
              ].map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{
                  flex:1,padding:"0.55rem 0.4rem",borderRadius:"10px",border:"none",cursor:"pointer",
                  background:tab===key?"#1e2d45":"transparent",
                  color:tab===key?"#3b82f6":"#6b7a99",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.73rem",
                  borderBottom:tab===key?"2px solid #3b82f6":"2px solid transparent"
                }}>{label}</button>
              ))}
            </div>
            <div style={{ display:"flex",gap:"0.4rem" }}>
              {[
                ["absent", (absences[absenceDay]||[]).length>0 ? `📌 Faltas (${DAYS.reduce((a,d)=>a+(absences[d]||[]).length,0)})` : "📌 Faltas"],
                ["discharged", dischargedChildren.length>0 ? `🚪 Desligadas (${dischargedChildren.length})` : "🚪 Desligadas"],
                ["children","👶 Crianças"],
                ["upload","📋 Importar"]
              ].map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{
                  flex:1,padding:"0.55rem 0.4rem",borderRadius:"10px",border:"none",cursor:"pointer",
                  background:tab===key?"#1e2d45":"transparent",
                  color:tab===key?(key==="absent"?"#f87171":key==="discharged"?"#fb923c":key==="children"?"#a78bfa":"#3b82f6"):"#6b7a99",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.65rem",
                  borderBottom:tab===key?`2px solid ${key==="absent"?"#dc2626":key==="discharged"?"#f97316":key==="children"?"#7c3aed":"#3b82f6"}`:"2px solid transparent"
                }}>{label}</button>
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
                <Btn onClick={()=>setShowBulkModal(true)} small color="#16a34a">⚡ Designar</Btn>
                <Btn onClick={openAddSub} small>+ Adicionar</Btn>
              </div>
            </div>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem" }}>
              <button onClick={()=>setShowClearConfirm("designated")} style={{ flex:1,padding:"0.35rem 0.5rem",background:"#1e2d45",border:"1px solid #2a3548",borderRadius:"7px",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.7rem",cursor:"pointer" }}>🗑 Limpar Designadas</button>
              <button onClick={()=>setShowClearConfirm("pending")} style={{ flex:1,padding:"0.35rem 0.5rem",background:"#1e2d45",border:"1px solid #2a3548",borderRadius:"7px",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.7rem",cursor:"pointer" }}>🗑 Limpar Pendentes</button>
              <button onClick={()=>setShowClearConfirm("all")} style={{ flex:1,padding:"0.35rem 0.5rem",background:"#3d1515",border:"1px solid #7f1d1d",borderRadius:"7px",color:"#f87171",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.7rem",cursor:"pointer" }}>🗑 Limpar Tudo</button>
            </div>

            {/* Auto-pending notice */}
            {autoPendingCount>0 && (
              <div style={{ background:"#1a1040",border:"1px solid #4c1d95",borderRadius:"10px",padding:"0.75rem 1rem",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"0.6rem" }}>
                <span style={{ fontSize:"1rem" }}>🤖</span>
                <div>
                  <div style={{ fontSize:"0.78rem",fontWeight:600,color:"#a78bfa" }}>{autoPendingCount} pendência(s) criadas automaticamente</div>
                  <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.1rem" }}>Crianças sem terapeuta detectadas na importação</div>
                </div>
              </div>
            )}

            <Section color="#3b82f6" bg="#1e2d45" label="Designadas" count={designated.length}>
              {designated.length===0
                ? <Empty text="Nenhuma substituição designada" />
                : designated.map(s=>(
                  <SubCard key={s.id} s={s} accent="#3b82f6" border="#1e2d45"
                    onEdit={()=>openEditSub(s)} onDelete={()=>deleteSub(s.id)} />
                ))}
            </Section>

            <Section color="#f59e0b" bg="#2a2010" label="Pendentes" count={pending.length}>
              {pending.length===0
                ? <Empty text="Nenhuma substituição pendente" />
                : pending.map(s=>(
                  <SubCard key={s.id} s={s} accent="#f59e0b" border="#2a2010"
                    onEdit={()=>openEditSub(s)} onDelete={()=>deleteSub(s.id)}
                    pending autoCreated={s.autoCreated} />
                ))}
            </Section>
          </div>
        )}

        {/* ── TERAPEUTAS LIVRES ── */}
        {tab==="free" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setActiveDay(d)} style={{
                  flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",
                  background:activeDay===d?"#3b82f6":"#141b26",
                  color:activeDay===d?"#fff":"#6b7a99",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.78rem"
                }}>
                  {DAY_LABELS[d]}
                  {freeSlots[d].length>0&&<span style={{ marginLeft:"0.3rem",background:activeDay===d?"rgba(255,255,255,0.25)":"#1e2d45",borderRadius:"10px",padding:"0.05rem 0.35rem",fontSize:"0.65rem" }}>{freeSlots[d].length}</span>}
                </button>
              ))}
            </div>

            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem" }}>
              <span style={{ fontWeight:700,fontSize:"0.85rem" }}>{DAY_LABELS[activeDay]}</span>
              <Btn onClick={openAddSlot} small>+ Adicionar</Btn>
            </div>

            {Object.keys(slotsByTime).length===0
              ? <Empty icon="📭" text={`Nenhum terapeuta livre em ${DAY_LABELS[activeDay]}`} sub="Importe agendas na aba 📋 ou adicione manualmente" />
              : Object.entries(slotsByTime).map(([time,therapists])=>(
                <div key={time} style={{ marginBottom:"1.1rem" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"0.5rem" }}>
                    <span style={{ fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:"0.9rem",color:"#3b82f6",background:"#1e2d45",borderRadius:"6px",padding:"0.15rem 0.55rem" }}>{time}</span>
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

        {/* ── IMPORTAR AGENDA ── */}
        {tab==="upload" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ marginBottom:"1.25rem" }}>
              <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Importar Agendas</div>
              <div style={{ fontSize:"0.78rem",color:"#6b7a99",lineHeight:1.6 }}>
                Faça upload das agendas dos <strong style={{color:"#94a3b8"}}>terapeutas</strong> e das <strong style={{color:"#94a3b8"}}>crianças</strong> juntas. A IA cruza os dados, detecta horários livres e cria pendências automaticamente para crianças sem terapeuta.
              </div>
            </div>

            {/* Legend */}
            <div style={{ display:"flex",gap:"0.6rem",marginBottom:"1rem",flexWrap:"wrap" }}>
              {[
                { color:"#16a34a", label:"Terapeuta livre" },
                { color:"#6366f1", label:"Livre por TO/Psico" },
                { color:"#f59e0b", label:"Pendência auto" },
              ].map(({ color, label })=>(
                <div key={label} style={{ display:"flex",alignItems:"center",gap:"0.35rem",fontSize:"0.7rem",color:"#94a3b8" }}>
                  <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0 }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Drop zone — mobile friendly */}
            {!uploading ? (
              <div style={{ marginBottom:"1rem" }}>
                {/* Hidden input — accepts images from gallery or files */}
                <input ref={fileRef} type="file" accept="image/*,image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif" multiple capture={false}
                  style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)} />

                {/* Primary button — opens gallery on mobile */}
                <button onClick={()=>fileRef.current.click()}
                  style={{ width:"100%",padding:"1.1rem",background:"#1e2d45",border:"2px dashed #3b82f6",borderRadius:"14px",color:"#3b82f6",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.9rem",cursor:"pointer",marginBottom:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
                  <span style={{fontSize:"1.4rem"}}>📂</span> Selecionar imagens
                </button>

                <div style={{ textAlign:"center",fontSize:"0.72rem",color:"#4a5a70" }}>
                  Selecione uma ou mais fotos das agendas
                </div>
              </div>
            ) : (
              <div style={{ border:"2px dashed #2a3548",borderRadius:"14px",padding:"2rem 1rem",textAlign:"center",background:"#0d1420",marginBottom:"1rem" }}>
                <div style={{ fontSize:"2rem",marginBottom:"0.5rem" }}>⏳</div>
                <div style={{ fontWeight:600,fontSize:"0.875rem",color:"#e8f0fe",marginBottom:"0.25rem" }}>IA analisando e cruzando os dados...</div>
                <div style={{ fontSize:"0.75rem",color:"#6b7a99" }}>Aguarde — pode levar alguns segundos</div>
              </div>
            )}

            {uploadStatus && (
              <div style={{ padding:"0.75rem 1rem",borderRadius:"10px",marginBottom:"1rem",
                background:uploadStatus.ok?"#0a2010":"#2a0a0a",
                border:`1px solid ${uploadStatus.ok?"#16a34a":"#dc2626"}`,
                color:uploadStatus.ok?"#4ade80":"#f87171",fontSize:"0.82rem",fontWeight:500 }}>
                {uploadStatus.message}
              </div>
            )}

            {/* Preview */}
            {uploadPreview && (
              <div>
                {/* Pending children detected */}
                {uploadPreview.pendingChildren.length>0 && (
                  <div style={{ background:"#1a1208",border:"1px solid #92400e",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"1rem" }}>
                    <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.6rem" }}>
                      ⚠️ Crianças sem terapeuta detectadas
                    </div>
                    {(() => {
                      const grouped = {};
                      uploadPreview.pendingChildren.forEach(({ child, day, time, activity }) => {
                        const key = `${child}||${day}`;
                        if (!grouped[key]) grouped[key] = { child, day, times:[], activities:[] };
                        grouped[key].times.push(time);
                        grouped[key].activities.push(activity);
                      });
                      return Object.values(grouped).map((g,i)=>{
                        g.times.sort();
                        const timeStr = g.times.length===1 ? g.times[0] : `${g.times[0]} às ${g.times[g.times.length-1]}`;
                        return (
                          <div key={i} style={{ fontSize:"0.78rem",color:"#94a3b8",marginBottom:"0.4rem",paddingLeft:"0.5rem",borderLeft:"2px solid #f59e0b" }}>
                            <span style={{ color:"#fcd34d",fontWeight:600 }}>{g.child}</span>
                            {" — "}<span style={{ fontFamily:"'DM Mono',monospace",color:"#d97706" }}>{DAY_LABELS[g.day]} {timeStr}</span>
                            <span style={{ color:"#78716c",marginLeft:"0.3rem" }}>({[...new Set(g.activities)].join(", ")})</span>
                          </div>
                        );
                      });
                    })()}
                    <div style={{ fontSize:"0.7rem",color:"#78716c",marginTop:"0.6rem" }}>
                      → Serão criadas automaticamente como substituições pendentes
                    </div>
                  </div>
                )}

                {/* Cross references */}
                {uploadPreview.crossRefs.length>0 && (
                  <div style={{ background:"#0d1a2e",border:"1px solid #2d3f6e",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"1rem" }}>
                    <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.6rem" }}>
                      🔗 Liberados por TO / Psicoterapia
                    </div>
                    {uploadPreview.crossRefs.map((cr,i)=>(
                      <div key={i} style={{ fontSize:"0.78rem",color:"#94a3b8",marginBottom:"0.4rem",paddingLeft:"0.5rem",borderLeft:"2px solid #6366f1" }}>
                        <span style={{ color:"#e8f0fe",fontWeight:600 }}>{cr.therapist}</span>
                        {" "}livre em{" "}
                        <span style={{ fontFamily:"'DM Mono',monospace",color:"#818cf8" }}>{DAY_LABELS[cr.day]} {cr.time}</span>
                        {" — "}<span style={{ color:"#a5b4fc" }}>{cr.child}</span> com{" "}
                        <span style={{ color:"#6366f1",fontWeight:600 }}>{cr.activity}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Per-therapist preview */}
                <div style={{ fontWeight:700,fontSize:"0.82rem",color:"#e8f0fe",marginBottom:"0.75rem" }}>
                  {uploadPreview.therapists.length} terapeuta(s) — revise e confirme:
                </div>
                {uploadPreview.therapists.map((t,i)=>{
                  const totalFree = DAYS.reduce((acc,d)=>acc+(t.freeSlots[d]||[]).length,0);
                  const specCount = DAYS.reduce((acc,d)=>acc+(t.freeSlots[d]||[]).filter(s=>s.reason==="specialist").length,0);
                  const absentDays = t.absentDays||[];
                  return (
                    <div key={i} style={{ background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.6rem" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.6rem" }}>
                        <div style={{ fontWeight:600,fontSize:"0.875rem",color:"#3b82f6" }}>{t.name}</div>
                        <div style={{ display:"flex",gap:"0.35rem",flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"55%" }}>
                          {absentDays.length>0&&<span style={{ fontSize:"0.68rem",background:"#2a0a0a",color:"#f87171",borderRadius:"5px",padding:"0.12rem 0.45rem",fontWeight:600 }}>⛔ {absentDays.map(d=>DAY_LABELS[d]||d).join(", ")}</span>}
                          {totalFree>0&&<span style={{ fontSize:"0.68rem",background:"#0a2010",color:"#4ade80",borderRadius:"5px",padding:"0.12rem 0.45rem",fontWeight:600 }}>{totalFree} livre{totalFree!==1?"s":""}</span>}
                          {specCount>0&&<span style={{ fontSize:"0.68rem",background:"#1a1040",color:"#a5b4fc",borderRadius:"5px",padding:"0.12rem 0.45rem",fontWeight:600 }}>↗ {specCount} especialista</span>}
                        </div>
                      </div>
                      {absentDays.length>0&&(
                        <div style={{ fontSize:"0.72rem",color:"#f87171",background:"#1a0808",borderRadius:"6px",padding:"0.3rem 0.6rem",marginBottom:"0.5rem",borderLeft:"2px solid #dc2626" }}>
                          ⛔ Linha preta — ausente o dia todo em: {absentDays.map(d=>DAY_LABELS[d]||d).join(", ")}
                        </div>
                      )}
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"0.35rem" }}>
                        {DAYS.map(day=>{
                          const slots=t.freeSlots[day]||[];
                          const isAbsent=absentDays.includes(day);
                          if(isAbsent) return (
                            <div key={day} style={{ background:"#1a0808",borderRadius:"6px",padding:"0.3rem 0.55rem",fontSize:"0.7rem",border:"1px solid #3d1515" }}>
                              <span style={{ color:"#6b3333",fontWeight:600 }}>{DAY_LABELS[day]}: </span>
                              <span style={{ color:"#f87171" }}>ausente</span>
                            </div>
                          );
                          if(!slots.length) return null;
                          return (
                            <div key={day} style={{ background:"#141b26",borderRadius:"6px",padding:"0.3rem 0.55rem",fontSize:"0.7rem" }}>
                              <span style={{ color:"#6b7a99",fontWeight:600 }}>{DAY_LABELS[day]}: </span>
                              {slots.map((s,si)=>{
                                const time=typeof s==="string"?s:s.time;
                                const isSpec=s.reason==="specialist";
                                return <span key={si} style={{ color:isSpec?"#a5b4fc":"#94a3b8",marginRight:"0.25rem" }}>{time}{isSpec?"✦":""}</span>;
                              })}
                            </div>
                          );
                        })}
                        {absentDays.length===0&&DAYS.every(d=>(t.freeSlots[d]||[]).length===0)&&(
                          <span style={{ color:"#f59e0b",fontSize:"0.75rem" }}>Nenhum horário livre</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div style={{ fontSize:"0.7rem",color:"#6366f1",marginBottom:"0.75rem" }}>✦ = livre por TO ou Psicoterapia</div>

                <div style={{ display:"flex",gap:"0.5rem" }}>
                  <button onClick={()=>setUploadPreview(null)} style={{ flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>Cancelar</button>
                  <button onClick={confirmUpload} style={{ flex:1,padding:"0.65rem",background:"#16a34a",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>✅ Confirmar Importação</button>
                </div>
              </div>
            )}

            {!uploadPreview&&!uploading&&(
              <div style={{ marginTop:"1.5rem" }}>
                <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>Como funciona</div>
                {[
                  ["📸","Upload misturado","Suba PNGs de terapeutas e crianças juntos — a IA identifica cada tipo automaticamente"],
                  ["🔗","Cruzamento de dados","Célula vazia = livre. \"Autocuidado (TO)\" / \"Hab. Sociais (Psicoterapia)\" = terapeuta liberado pelo especialista"],
                  ["⚠️","Pendências automáticas","Se uma criança tem atividade mas nenhum terapeuta tem seu nome naquele slot → pendência criada automaticamente"],
                  ["✅","Revise e confirme","Veja tudo antes de salvar — terapeutas livres + cruzamentos + pendências detectadas"],
                ].map(([icon,title,desc],i)=>(
                  <div key={i} style={{ display:"flex",gap:"0.75rem",padding:"0.75rem",background:"#0d1420",borderRadius:"10px",marginBottom:"0.5rem",border:"1px solid #1a2335" }}>
                    <span style={{ fontSize:"1.2rem",flexShrink:0 }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight:600,fontSize:"0.8rem",marginBottom:"0.2rem" }}>{title}</div>
                      <div style={{ fontSize:"0.75rem",color:"#6b7a99",lineHeight:1.4 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ── FALTAS ── */}
        {tab==="absent" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ marginBottom:"1.25rem" }}>
              <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Registrar Faltas</div>
              <div style={{ fontSize:"0.78rem",color:"#6b7a99",lineHeight:1.5 }}>
                Selecione o dia e marque os terapeutas que faltaram. As crianças que eles atenderiam naquele dia viram substituições pendentes automaticamente.
              </div>
            </div>

            {/* Day selector */}
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setAbsenceDay(d)} style={{
                  flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",
                  background:absenceDay===d?"#dc2626":"#141b26",
                  color:absenceDay===d?"#fff":"#6b7a99",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.78rem"
                }}>
                  {DAY_LABELS[d]}
                  {(absences[d]||[]).length>0&&<span style={{ marginLeft:"0.3rem",background:absenceDay===d?"rgba(255,255,255,0.25)":"#3d1515",borderRadius:"10px",padding:"0.05rem 0.35rem",fontSize:"0.65rem",color:absenceDay===d?"#fff":"#f87171" }}>{absences[d].length}</span>}
                </button>
              ))}
            </div>

            {/* Therapist list to mark absent */}
            <div style={{ marginBottom:"1.25rem" }}>
              <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>
                Terapeutas em {DAY_LABELS[absenceDay]}
              </div>

              {allTherapists.length > 0 && (
                <div style={{ position:"relative",marginBottom:"0.75rem" }}>
                  <input
                    value={absenceTherapistSearch}
                    onChange={e=>setAbsenceTherapistSearch(e.target.value)}
                    placeholder="🔍  Filtrar terapeuta..."
                    style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",
                      padding:"0.55rem 0.9rem",color:"#e8f0fe",fontSize:"0.82rem",outline:"none",
                      fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box" }}
                  />
                  {absenceTherapistSearch && (
                    <button onClick={()=>setAbsenceTherapistSearch("")}
                      style={{ position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",
                        background:"none",border:"none",color:"#6b7a99",cursor:"pointer",fontSize:"1rem" }}>✕</button>
                  )}
                </div>
              )}

              {allTherapists.length === 0 ? (
                <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"2rem 1rem",background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
                  <div style={{ fontSize:"1.5rem",marginBottom:"0.5rem" }}>📋</div>
                  Nenhum terapeuta importado ainda
                  <div style={{ fontSize:"0.72rem",marginTop:"0.4rem",color:"#4a5a70" }}>Importe as agendas primeiro na aba 📋</div>
                </div>
              ) : (
                <div>
                  {allTherapists
                    .filter(name => !absenceTherapistSearch.trim() || name.toLowerCase().includes(absenceTherapistSearch.toLowerCase()))
                    .map(name => {
                    const isAbsent = (absences[absenceDay]||[]).includes(name);
                    const daySchedule = (therapistSchedules[absenceDay]||[]).filter(s=>s.therapist.toLowerCase()===name.toLowerCase());
                    return (
                      <div key={name} onClick={()=>toggleAbsence(absenceDay, name)}
                        style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",marginBottom:"0.4rem",borderRadius:"10px",cursor:"pointer",
                          background:isAbsent?"#2a0a0a":"#0d1420",
                          border:`1px solid ${isAbsent?"#dc2626":"#1e2d45"}`,
                          transition:"all 0.15s" }}>
                        <div>
                          <div style={{ fontWeight:600,fontSize:"0.875rem",color:isAbsent?"#f87171":"#e8f0fe" }}>{name}</div>
                          {daySchedule.length>0 && (
                            <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.15rem" }}>
                              {daySchedule.length} criança{daySchedule.length!==1?"s":""}: {daySchedule.map(s=>s.child).join(", ")}
                            </div>
                          )}
                          {daySchedule.length===0 && (
                            <div style={{ fontSize:"0.72rem",color:"#4a5a70",marginTop:"0.15rem" }}>sem agenda nesse dia</div>
                          )}
                        </div>
                        <div style={{ width:"22px",height:"22px",borderRadius:"6px",flexShrink:0,
                          background:isAbsent?"#dc2626":"#1e2d45",
                          border:`2px solid ${isAbsent?"#dc2626":"#2a3548"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem" }}>
                          {isAbsent?"✓":""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Apply button */}
            {(absences[absenceDay]||[]).length > 0 && (
              <div>
                <div style={{ background:"#2a0a0a",border:"1px solid #dc2626",borderRadius:"10px",padding:"0.75rem 1rem",marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.78rem",fontWeight:600,color:"#f87171",marginBottom:"0.25rem" }}>
                    ⛔ {absences[absenceDay].length} terapeuta(s) marcado(s) como faltante em {DAY_LABELS[absenceDay]}
                  </div>
                  <div style={{ fontSize:"0.72rem",color:"#78716c" }}>
                    {(() => {
                      const affected = absences[absenceDay].flatMap(name =>
                        (therapistSchedules[absenceDay]||[])
                          .filter(s=>s.therapist.toLowerCase()===name.toLowerCase())
                          .map(s=>s.child)
                      );
                      if (!affected.length) return "Nenhuma criança afetada (sem agenda registrada para esse dia)";
                      return `Crianças afetadas: ${[...new Set(affected)].join(", ")}`;
                    })()}
                  </div>
                </div>
                <button onClick={()=>{
                  const count = applyAbsences(absenceDay);
                  if (count === 0) {
                    alert("Nenhuma criança nova adicionada às pendências. Verifique se as agendas foram importadas.");
                  } else {
                    setTab("subs");
                  }
                }} style={{ width:"100%",padding:"0.75rem",background:"#dc2626",border:"none",borderRadius:"10px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.875rem",cursor:"pointer" }}>
                  ⛔ Aplicar Faltas e Criar Pendências
                </button>
                <button onClick={()=>setAbsences(prev=>({...prev,[absenceDay]:[]}))}
                  style={{ width:"100%",padding:"0.55rem",background:"none",border:"none",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"0.78rem",cursor:"pointer",marginTop:"0.4rem" }}>
                  Limpar seleção
                </button>
              </div>
            )}

            {/* ── FALTA DE CRIANÇAS ── */}
            <div style={{ marginTop:"2rem" }}>
              <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>
                👶 Faltas de Crianças em {DAY_LABELS[absenceDay]}
              </div>
              <div style={{ fontSize:"0.75rem",color:"#6b7a99",marginBottom:"0.75rem",lineHeight:1.5 }}>
                Marque a criança ausente — o terapeuta fica livre naquele horário.
              </div>

              {(() => {
                const childrenToday = [...new Set(
                  (therapistSchedules[absenceDay] || []).map(s => s.child)
                )].sort();

                if (!childrenToday.length) return (
                  <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"1.5rem 1rem",background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
                    Nenhuma criança com agenda importada nesse dia
                  </div>
                );

                const filtered = childrenToday.filter(c =>
                  !absenceChildSearch.trim() || c.toLowerCase().includes(absenceChildSearch.toLowerCase())
                );

                return (
                  <>
                    <div style={{ position:"relative",marginBottom:"0.75rem" }}>
                      <input
                        value={absenceChildSearch}
                        onChange={e=>setAbsenceChildSearch(e.target.value)}
                        placeholder="🔍  Filtrar criança..."
                        style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",
                          padding:"0.55rem 0.9rem",color:"#e8f0fe",fontSize:"0.82rem",outline:"none",
                          fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box" }}
                      />
                      {absenceChildSearch && (
                        <button onClick={()=>setAbsenceChildSearch("")}
                          style={{ position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",
                            background:"none",border:"none",color:"#6b7a99",cursor:"pointer",fontSize:"1rem" }}>✕</button>
                      )}
                    </div>
                    {filtered.map(child => {
                  const isAbsent = (childAbsences[absenceDay] || []).includes(child);
                  const slots = (therapistSchedules[absenceDay] || []).filter(s => s.child === child);

                  return (
                    <div key={child} onClick={() => {
                      setChildAbsences(prev => {
                        const current = prev[absenceDay] || [];
                        const updated = current.includes(child)
                          ? current.filter(n => n !== child)
                          : [...current, child];

                        if (!current.includes(child)) {
                          setFreeSlots(prevSlots => {
                            const newSlots = { ...prevSlots };
                            slots.forEach(({ therapist, time }) => {
                              const alreadyFree = (newSlots[absenceDay] || []).some(
                                s => s.therapist === therapist && s.time === time
                              );
                              if (!alreadyFree) {
                                newSlots[absenceDay] = [
                                  ...(newSlots[absenceDay] || []),
                                  { id: Date.now() + Math.random(), time, therapist, childAbsence: child }
                                ];
                              }
                            });
                            newSlots[absenceDay].sort((a,b) => a.time.localeCompare(b.time));
                            return newSlots;
                          });
                        } else {
                          setFreeSlots(prevSlots => ({
                            ...prevSlots,
                            [absenceDay]: (prevSlots[absenceDay] || []).filter(
                              s => s.childAbsence !== child
                            )
                          }));
                        }

                        return { ...prev, [absenceDay]: updated };
                      });
                    }}
                      style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"0.75rem 1rem",marginBottom:"0.4rem",borderRadius:"10px",cursor:"pointer",
                        background:isAbsent?"#1a1208":"#0d1420",
                        border:`1px solid ${isAbsent?"#f59e0b":"#1e2d45"}` }}>
                      <div>
                        <div style={{ fontWeight:600,fontSize:"0.875rem",color:isAbsent?"#fcd34d":"#e8f0fe" }}>{child}</div>
                        <div style={{ fontSize:"0.72rem",color:"#6b7a99",marginTop:"0.15rem" }}>
                          {slots.map(s=>`${s.time} com ${s.therapist}`).join(" · ")}
                        </div>
                      </div>
                      <div style={{ width:"22px",height:"22px",borderRadius:"6px",flexShrink:0,
                        background:isAbsent?"#f59e0b":"#1e2d45",
                        border:`2px solid ${isAbsent?"#f59e0b":"#2a3548"}`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",color:"#000" }}>
                        {isAbsent?"✓":""}
                      </div>
                    </div>
                  );
                })}
                  </>
                );
              })()}
            </div>
          </div>
        )}


        {/* ── CRIANÇAS DESLIGADAS ── */}
        {tab==="discharged" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Crianças Desligadas</div>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem",lineHeight:1.5 }}>
              Informe o nome da criança desligada. Ela sai da agenda e os terapeutas ficam com horário livre.
            </div>

            {/* Add discharge input */}
            <div style={{ display:"flex",gap:"0.5rem",marginBottom:"1.25rem" }}>
              <div style={{ flex:1,position:"relative" }}>
                <select
                  value={dischargeInput}
                  onChange={e=>setDischargeInput(e.target.value)}
                  style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",
                    padding:"0.65rem 0.9rem",color:dischargeInput?"#e8f0fe":"#3a4a60",fontSize:"0.875rem",outline:"none",
                    fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",cursor:"pointer" }}>
                  <option value="">Selecionar criança...</option>
                  {allChildren.filter(c=>!dischargedChildren.includes(c)).map(c=>(
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button onClick={()=>{ if(dischargeInput){ dischargeChild(dischargeInput); setDischargeInput(""); } }}
                disabled={!dischargeInput}
                style={{ padding:"0.65rem 1rem",background:dischargeInput?"#f97316":"#1e2d45",border:"none",borderRadius:"10px",
                  color:dischargeInput?"#fff":"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.82rem",cursor:dischargeInput?"pointer":"not-allowed",flexShrink:0 }}>
                Desligar
              </button>
            </div>

            {/* List of discharged children */}
            {dischargedChildren.length === 0 ? (
              <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"2rem 1rem",background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
                <div style={{ fontSize:"1.5rem",marginBottom:"0.5rem" }}>🚪</div>
                Nenhuma criança desligada registrada
              </div>
            ) : (
              <div>
                <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>
                  {dischargedChildren.length} criança(s) desligada(s)
                </div>
                {dischargedChildren.map(child => {
                  const freedSlots = DAYS.flatMap(d =>
                    (therapistSchedules[d]||[]).filter(s=>s.child===child).map(s=>({...s,day:d}))
                  );
                  return (
                    <div key={child} style={{ background:"#0d1420",border:"1px solid #7c2d12",borderLeft:"3px solid #f97316",borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.5rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontWeight:600,fontSize:"0.875rem",color:"#fed7aa",marginBottom:"0.2rem" }}>{child}</div>
                        {freedSlots.length > 0 ? (
                          <div style={{ fontSize:"0.72rem",color:"#6b7a99" }}>
                            {freedSlots.slice(0,3).map((s,i)=>(
                              <span key={i} style={{ marginRight:"0.5rem" }}>{DAY_LABELS[s.day]} {s.time} · {s.therapist}</span>
                            ))}
                            {freedSlots.length>3&&<span style={{ color:"#4a5a70" }}>+{freedSlots.length-3} mais</span>}
                          </div>
                        ) : (
                          <div style={{ fontSize:"0.72rem",color:"#4a5a70" }}>Terapeutas agora livres nos horários dessa criança</div>
                        )}
                      </div>
                      <button onClick={()=>reactivateChild(child)}
                        style={{ background:"#1e2d45",border:"none",borderRadius:"6px",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.7rem",cursor:"pointer",padding:"0.3rem 0.6rem",flexShrink:0,marginLeft:"0.5rem" }}>
                        ↩ Reativar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* ── CRIANÇAS ── */}
        {tab==="children" && (
          <div style={{ padding:"1.25rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",marginBottom:"0.35rem" }}>Agenda por Criança</div>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1.25rem",lineHeight:1.5 }}>
              Veja todos os terapeutas de cada criança, por dia e horário.
            </div>

            {/* Search */}
            <div style={{ position:"relative",marginBottom:"1rem" }}>
              <input
                value={childSearch}
                onChange={e=>setChildSearch(e.target.value)}
                placeholder="🔍  Buscar criança..."
                style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"10px",
                  padding:"0.65rem 0.9rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",
                  fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box" }}
              />
              {childSearch && (
                <button onClick={()=>setChildSearch("")}
                  style={{ position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",color:"#6b7a99",cursor:"pointer",fontSize:"1rem" }}>✕</button>
              )}
            </div>

            {/* Day selector */}
            <div style={{ display:"flex",gap:"0.4rem",marginBottom:"1.25rem",overflowX:"auto",paddingBottom:"0.25rem" }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setChildViewDay(d)} style={{
                  flexShrink:0,padding:"0.45rem 0.75rem",borderRadius:"8px",border:"none",cursor:"pointer",
                  background:childViewDay===d?"#7c3aed":"#141b26",
                  color:childViewDay===d?"#fff":"#6b7a99",
                  fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.78rem"
                }}>{DAY_LABELS[d]}</button>
              ))}
            </div>

            {/* Children list */}
            {(() => {
              const slots = therapistSchedules[childViewDay] || [];
              // Get all unique children
              let allChildren = [...new Set(slots.map(s=>s.child))].sort();
              // Apply search filter
              if (childSearch.trim()) {
                const q = childSearch.toLowerCase();
                allChildren = allChildren.filter(c=>c.toLowerCase().includes(q));
              }

              if (!slots.length) return (
                <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"2rem 1rem",
                  background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
                  <div style={{ fontSize:"1.5rem",marginBottom:"0.5rem" }}>📋</div>
                  Nenhuma agenda importada para {DAY_LABELS[childViewDay]}
                  <div style={{ fontSize:"0.72rem",marginTop:"0.4rem",color:"#4a5a70" }}>Importe as agendas na aba 📋</div>
                </div>
              );

              if (!allChildren.length) return (
                <div style={{ textAlign:"center",color:"#6b7a99",fontSize:"0.8rem",padding:"2rem 1rem",
                  background:"#0d1420",borderRadius:"12px",border:"1px dashed #2a3548" }}>
                  Nenhuma criança encontrada para "{childSearch}"
                </div>
              );

              return allChildren.map(child => {
                const childSlots = slots
                  .filter(s=>s.child===child)
                  .sort((a,b)=>a.time.localeCompare(b.time));
                const isAbsent = (childAbsences[childViewDay]||[]).includes(child);
                // Unique therapists for this child today
                const therapists = [...new Set(childSlots.map(s=>s.therapist))];
                const multiTherapist = therapists.length > 1;

                return (
                  <div key={child} style={{ background:"#0d1420",border:`1px solid ${isAbsent?"#92400e":multiTherapist?"#4c1d95":"#1e2d45"}`,
                    borderLeft:`3px solid ${isAbsent?"#f59e0b":multiTherapist?"#7c3aed":"#2a3548"}`,
                    borderRadius:"10px",padding:"0.85rem 1rem",marginBottom:"0.75rem" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.6rem" }}>
                      <span style={{ fontWeight:700,fontSize:"0.9rem",color:"#e8f0fe" }}>{child}</span>
                      {isAbsent && <span style={{ fontSize:"0.65rem",background:"#451a03",color:"#fbbf24",borderRadius:"5px",padding:"0.1rem 0.4rem",fontWeight:600 }}>FALTOU</span>}
                      {multiTherapist && !isAbsent && <span style={{ fontSize:"0.65rem",background:"#2e1065",color:"#a78bfa",borderRadius:"5px",padding:"0.1rem 0.4rem",fontWeight:600 }}>+{therapists.length} terapeutas</span>}
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:"0.35rem" }}>
                      {childSlots.map((s,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
                          <span style={{ fontFamily:"'DM Mono',monospace",fontSize:"0.8rem",color:"#3b82f6",
                            background:"#1e2d45",borderRadius:"5px",padding:"0.15rem 0.5rem",
                            minWidth:"52px",textAlign:"center",flexShrink:0 }}>{s.time}</span>
                          <span style={{ fontSize:"0.85rem",color:"#cbd5e1" }}>{s.therapist}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── MODALS ── */}

        {/* Designação Rápida */}
        {showBulkModal && (
          <Modal title="⚡ Designar Pendência" onClose={()=>setShowBulkModal(false)}>
            <div style={{ fontSize:"0.78rem",color:"#6b7a99",marginBottom:"1rem",lineHeight:1.5 }}>
              Selecione um paciente pendente e atribua um terapeuta para <strong style={{color:"#3b82f6"}}>Designada</strong>.
            </div>

            {/* Patient selector */}
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>Paciente Pendente</label>
              <select value={bulkForm.patient} onChange={e=>{
                const name = e.target.value;
                // Auto-fill timeFrom/timeTo from the patient's pending entries
                const patPending = pending.filter(s=>s.patient===name);
                let autoFrom = "08:00", autoTo = "08:00";
                if (patPending.length > 0) {
                  // Extract all time tokens from all pending entries of this patient
                  const allTimes = patPending.flatMap(s => {
                    const raw = s.time || "";
                    // Handle "HH:MM às HH:MM" or "HH:MM" or "Hh" formats
                    return raw.split(/às|a /).map(t => {
                      const clean = t.trim().replace(/h$/i,"");
                      // Normalize to HH:MM
                      if (clean.includes(":")) return clean.padStart(5,"0");
                      if (/^\d{1,2}$/.test(clean)) return clean.padStart(2,"0")+":00";
                      return null;
                    }).filter(Boolean);
                  }).sort();
                  if (allTimes.length > 0) {
                    autoFrom = allTimes[0];
                    autoTo = allTimes[allTimes.length-1];
                  }
                }
                setBulkForm(f=>({...f, patient:name, timeFrom:autoFrom, timeTo:autoTo}));
              }}
                style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:bulkForm.patient?"#e8f0fe":"#3a4a60",fontSize:"0.875rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",cursor:"pointer" }}>
                <option value="">Selecionar paciente...</option>
                {[...new Set(pending.map(s=>s.patient))].sort().map(name=>(
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Show the pending time info for selected patient */}
            {bulkForm.patient && (() => {
              const patPending = pending.filter(s=>s.patient===bulkForm.patient);
              return (
                <div style={{ background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.65rem 0.85rem",marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.68rem",fontWeight:700,color:"#6b7a99",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.4rem" }}>Horários pendentes</div>
                  {patPending.map((s,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"0.2rem" }}>
                      <span style={{ fontFamily:"'DM Mono',monospace",fontSize:"0.82rem",color:"#f59e0b",background:"#2a2010",borderRadius:"5px",padding:"0.1rem 0.45rem" }}>{s.time}</span>
                      {s.day && <span style={{ fontSize:"0.75rem",color:"#64748b" }}>{DAY_LABELS[s.day]||s.day}</span>}
                      {s.absentTherapist && <span style={{ fontSize:"0.7rem",color:"#6b7a99" }}>· falta: {s.absentTherapist}</span>}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Time range — only times extracted from this patient's pending entries */}
            {bulkForm.patient && (() => {
              const patPending = pending.filter(s=>s.patient===bulkForm.patient);
              // Build unique sorted set of times from pending entries
              const pendingTimes = [...new Set(patPending.flatMap(s => {
                const raw = s.time || "";
                return raw.split(/às|a /).map(t => {
                  const clean = t.trim().replace(/h$/i,"");
                  if (clean.includes(":")) return clean.padStart(5,"0");
                  if (/^\d{1,2}$/.test(clean)) return clean.padStart(2,"0")+":00";
                  return null;
                }).filter(Boolean);
              }))].sort();

              if (pendingTimes.length === 0) return null;

              return (
                <div style={{ display:"flex",gap:"0.75rem",marginBottom:"1rem" }}>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>De</label>
                    <select value={bulkForm.timeFrom} onChange={e=>setBulkForm(f=>({...f,timeFrom:e.target.value}))}
                      style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",cursor:"pointer" }}>
                      {pendingTimes.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>Até</label>
                    <select value={bulkForm.timeTo} onChange={e=>setBulkForm(f=>({...f,timeTo:e.target.value}))}
                      style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#e8f0fe",fontSize:"0.875rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",cursor:"pointer" }}>
                      {pendingTimes.filter(t=>t>=bulkForm.timeFrom).map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              );
            })()}

            {/* Therapist selector */}
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block",fontSize:"0.7rem",fontWeight:600,color:"#6b7a99",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.4rem" }}>Terapeuta Substituto</label>
              <select value={bulkForm.therapist} onChange={e=>setBulkForm(f=>({...f,therapist:e.target.value}))}
                style={{ width:"100%",background:"#0d1420",border:"1px solid #2a3548",borderRadius:"8px",padding:"0.6rem 0.8rem",color:bulkForm.therapist?"#e8f0fe":"#3a4a60",fontSize:"0.875rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",cursor:"pointer" }}>
                <option value="">Selecionar terapeuta...</option>
                {allTherapists.map(name=>(
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <SaveCancel onCancel={()=>setShowBulkModal(false)} onSave={saveBulk} />
          </Modal>
        )}

        {/* Confirmação de limpeza */}
        {showClearConfirm && (
          <Modal title="⚠️ Confirmar limpeza" onClose={()=>setShowClearConfirm(null)}>
            <div style={{ fontSize:"0.875rem",color:"#94a3b8",marginBottom:"1.25rem",lineHeight:1.6 }}>
              {showClearConfirm==="designated" && "Remover todas as substituições designadas?"}
              {showClearConfirm==="pending" && "Remover todas as substituições pendentes?"}
              {showClearConfirm==="all" && <span style={{color:"#f87171"}}>Remover <strong>todas</strong> as substituições (designadas + pendentes)?</span>}
            </div>
            <div style={{ display:"flex",gap:"0.5rem" }}>
              <button onClick={()=>setShowClearConfirm(null)} style={{ flex:1,padding:"0.65rem",background:"#1e2d45",border:"none",borderRadius:"8px",color:"#6b7a99",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>Cancelar</button>
              <button onClick={()=>clearSubs(showClearConfirm)} style={{ flex:1,padding:"0.65rem",background:"#dc2626",border:"none",borderRadius:"8px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" }}>Confirmar</button>
            </div>
          </Modal>
        )}

        {showSubModal && (
          <Modal title={editingSub?"Editar Substituição":"Nova Substituição"} onClose={()=>setShowSubModal(false)}>
            <Field label="Paciente" value={subForm.patient} onChange={v=>setSubForm(f=>({...f,patient:v}))} placeholder="Ex: Gael Tanan" />
            <Field label="Horário" value={subForm.time} onChange={v=>setSubForm(f=>({...f,time:v}))} placeholder="Ex: 15h às 17h ou 16h" />
            <Field label="Terapeuta (opcional)" value={subForm.therapist} onChange={v=>setSubForm(f=>({...f,therapist:v}))} placeholder="Ex: Jennifer Felicio" />
            <Dropdown label="Status" value={subForm.status} onChange={v=>setSubForm(f=>({...f,status:v}))} options={[{value:"Pending",label:"🟡 Pendente"},{value:"Designated",label:"🔵 Designada"}]} />
            <SaveCancel onCancel={()=>setShowSubModal(false)} onSave={saveSub} />
          </Modal>
        )}

        {showSlotModal && (
          <Modal title={editingSlot?"Editar Horário":"Novo Terapeuta Livre"} onClose={()=>setShowSlotModal(false)}>
            <Dropdown label="Horário" value={slotForm.time} onChange={v=>setSlotForm(f=>({...f,time:v}))} options={TIME_OPTIONS.map(t=>({value:t,label:t}))} />
            <Field label="Terapeuta" value={slotForm.therapist} onChange={v=>setSlotForm(f=>({...f,therapist:v}))} placeholder="Ex: Isabella" />
            <SaveCancel onCancel={()=>setShowSlotModal(false)} onSave={saveSlot} />
          </Modal>
        )}
      </div>
    </>
  );
}