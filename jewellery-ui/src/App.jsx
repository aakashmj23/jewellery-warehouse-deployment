import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   JEWELLERY SHOP — FULLY CONNECTED TO SPRING BOOT BACKEND
   Port: 8085  |  Base: /api

   GET    /api/products           → fetch all
   GET    /api/products/{id}      → fetch one
   GET    /api/products/{id}/image→ fetch image bytes
   POST   /api/products           → add (multipart: product + imageFile)
   PUT    /api/products/{id}      → update (multipart: product + imageFile)
   DELETE /api/products/{id}      → delete
═══════════════════════════════════════════════════════════════════════════ */

const BASE = "/api";

const api = {
  getAll: () =>
    fetch(`${BASE}/products`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),

  // image URL — directly used as <img src>
  imageUrl: (id) => `${BASE}/products/${id}/image`,

  // POST — multipart/form-data  (product JSON + imageFile)
  create: (productObj, imageFile) => {
    const fd = new FormData();
    fd.append("product",   new Blob([JSON.stringify(productObj)], { type: "application/json" }));
    fd.append("imageFile", imageFile);
    return fetch(`${BASE}/products`, { method: "POST", body: fd })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
  },

  // PUT — multipart/form-data
  update: (id, productObj, imageFile) => {
    const fd = new FormData();
    fd.append("product",   new Blob([JSON.stringify(productObj)], { type: "application/json" }));
    fd.append("imageFile", imageFile);
    return fetch(`${BASE}/products/${id}`, { method: "PUT", body: fd })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r; });
  },

  delete: (id) =>
    fetch(`${BASE}/products/${id}`, { method: "DELETE" })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r; }),
};

/* ═══ UTILITIES ════════════════════════════════════════════════════════════ */
const fmtDate = v => {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }); }
  catch { return "—"; }
};

// backend sends dates as "dd-mm-yyyy" strings (from @JsonFormat)
// convert to a displayable value
const parseBackendDate = v => {
  if (!v) return null;
  // if it's already a timestamp number
  if (typeof v === "number") return v;
  // if it's a "dd-mm-yyyy" string
  if (typeof v === "string" && v.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const [dd, mm, yyyy] = v.split("-");
    return new Date(`${yyyy}-${mm}-${dd}`).getTime();
  }
  return new Date(v).getTime();
};

const toInputDate = ts => {
  if (!ts) return "";
  try { return new Date(ts).toISOString().split("T")[0]; }
  catch { return ""; }
};

const CATEGORIES = ["All","Rings","Necklaces","Earrings","Bangles","Pendants"];
const NAV = [
  { id:"home",   icon:"⌂", label:"Home"   },
  { id:"stock",  icon:"◫", label:"Stock"  },
  { id:"update", icon:"✎", label:"Update" },
];
const EMPTY_FORM = {
  id:"", name:"", category:"", weight:"", quantity:"",
  added:"", sold:"", availability:true
};

/* ═══ STYLES ════════════════════════════════════════════════════════════════ */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,600;1,300&family=Outfit:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg:#F9F7F4; --surface:#FFFFFF; --surface2:#F4F1EC;
      --border:#EAE6DF; --border2:#D8D2C8;
      --text:#1E1B17; --muted:#8C8278;
      --accent:#2A2520; --gold:#A67C52; --gold-lt:#C49A6C; --gold-bg:#FBF6EF;
      --green:#3A7558; --green-bg:#ECF4EF;
      --red:#8B3535; --red-bg:#F4ECEC;
      --r:5px;
      --shadow:0 2px 12px rgba(30,27,23,.07);
      --shadow-lg:0 8px 40px rgba(30,27,23,.12);
    }
    html,body { height:100%; font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); font-size:14px; line-height:1.55; -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:4px; }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes shimmer  { from{background-position:-600px 0} to{background-position:600px 0} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
    @keyframes toastIn  { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
    @keyframes toastOut { to{opacity:0;transform:translateX(12px)} }

    .fade-up { animation:fadeUp .32s cubic-bezier(.22,1,.36,1) both; }
    .stagger>* { animation:fadeUp .32s cubic-bezier(.22,1,.36,1) both; }
    .stagger>*:nth-child(1){animation-delay:.04s}.stagger>*:nth-child(2){animation-delay:.08s}
    .stagger>*:nth-child(3){animation-delay:.13s}.stagger>*:nth-child(4){animation-delay:.18s}
    .stagger>*:nth-child(5){animation-delay:.23s}.stagger>*:nth-child(6){animation-delay:.28s}
    .stagger>*:nth-child(7){animation-delay:.33s}.stagger>*:nth-child(8){animation-delay:.38s}
    .stagger>*:nth-child(9){animation-delay:.43s}.stagger>*:nth-child(10){animation-delay:.48s}
    .stagger>*:nth-child(11){animation-delay:.53s}.stagger>*:nth-child(12){animation-delay:.58s}

    .shell { display:flex; height:100vh; overflow:hidden; }

    /* sidebar */
    .sidebar { width:230px; flex-shrink:0; background:var(--accent); display:flex; flex-direction:column; position:relative; overflow:hidden; }
    .sidebar::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 20% 0%,rgba(166,124,82,.18) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(166,124,82,.1) 0%,transparent 50%); pointer-events:none; }
    .sidebar-brand { padding:1.75rem 1.5rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.07); position:relative; }
    .brand-emblem { width:42px; height:42px; border:1.5px solid var(--gold); border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:.85rem; }
    .brand-emblem svg { width:20px; height:20px; fill:none; stroke:var(--gold); stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
    .brand-name { font-family:'Cormorant',serif; font-size:1.15rem; font-weight:400; letter-spacing:1.5px; color:#F2EDE6; text-transform:uppercase; }
    .brand-tagline { font-size:.65rem; color:rgba(242,237,230,.3); letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
    .sidebar-nav { padding:1.25rem .85rem; flex:1; position:relative; }
    .nav-section-label { font-size:.6rem; letter-spacing:2px; text-transform:uppercase; color:rgba(242,237,230,.25); padding:.4rem .65rem; margin-bottom:.3rem; }
    .nav-item { display:flex; align-items:center; gap:.75rem; padding:.6rem .75rem; border-radius:var(--r); font-size:.84rem; color:rgba(242,237,230,.55); cursor:pointer; transition:all .18s; user-select:none; letter-spacing:.3px; margin-bottom:2px; }
    .nav-item:hover { color:rgba(242,237,230,.9); background:rgba(255,255,255,.06); }
    .nav-item.active { color:#F2EDE6; background:rgba(166,124,82,.2); border-left:2px solid var(--gold); padding-left:calc(.75rem - 2px); }
    .nav-icon { font-size:.95rem; width:18px; text-align:center; opacity:.8; }
    .api-pill { margin:.5rem .85rem 1rem; padding:.45rem .85rem; border-radius:20px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:.55rem; font-size:.68rem; color:rgba(242,237,230,.45); letter-spacing:.4px; }
    .api-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
    .api-dot.ok      { background:var(--green); box-shadow:0 0 6px rgba(58,117,88,.6); }
    .api-dot.err     { background:var(--red);   box-shadow:0 0 6px rgba(139,53,53,.6); }
    .api-dot.loading { background:var(--gold);  animation:pulse 1.2s ease infinite; }
    .api-dot.idle    { background:rgba(255,255,255,.2); }
    .sidebar-footer { padding:.85rem 1.5rem; border-top:1px solid rgba(255,255,255,.07); font-size:.65rem; color:rgba(242,237,230,.2); letter-spacing:.5px; position:relative; }

    /* content */
    .content { flex:1; overflow-y:auto; background:var(--bg); }
    .page { padding:2.25rem 2.75rem; max-width:1020px; }
    .page-head { margin-bottom:2rem; }
    .page-head h1 { font-family:'Cormorant',serif; font-size:2rem; font-weight:300; letter-spacing:.5px; margin-bottom:.25rem; }
    .page-head p { color:var(--muted); font-size:.83rem; }
    .page-head-row { display:flex; align-items:flex-start; justify-content:space-between; }
    hr { border:none; border-top:1px solid var(--border); margin:1.75rem 0; }

    /* buttons */
    .btn { display:inline-flex; align-items:center; gap:.4rem; padding:.5rem 1.1rem; border-radius:var(--r); font-family:'Outfit',sans-serif; font-size:.8rem; font-weight:500; cursor:pointer; transition:all .16s; white-space:nowrap; letter-spacing:.3px; }
    .btn-primary { background:var(--accent); color:#fff; border:none; }
    .btn-primary:hover { background:#3a342e; }
    .btn-primary:disabled { opacity:.4; cursor:not-allowed; }
    .btn-ghost  { background:transparent; color:var(--text); border:1px solid var(--border); }
    .btn-ghost:hover { border-color:var(--border2); background:var(--surface2); }
    .btn-gold   { background:var(--gold); color:#fff; border:none; }
    .btn-gold:hover { background:var(--gold-lt); }
    .btn-gold:disabled { opacity:.4; cursor:not-allowed; }
    .btn-danger { background:var(--red); color:#fff; border:none; }
    .btn-danger:hover { opacity:.85; }
    .btn-sm { padding:.36rem .8rem; font-size:.76rem; }
    .btn-xs { padding:.2rem .55rem; font-size:.7rem; }

    /* toolbar */
    .toolbar { display:flex; align-items:center; gap:.6rem; margin-bottom:1.1rem; flex-wrap:wrap; }
    .toolbar-right { margin-left:auto; display:flex; gap:.5rem; align-items:center; }
    .search-wrap { position:relative; }
    .search-icon { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
    .search-input { padding:.5rem .8rem .5rem 2.1rem; border:1px solid var(--border); border-radius:var(--r); font-family:'Outfit',sans-serif; font-size:.82rem; background:var(--surface); color:var(--text); width:230px; transition:border-color .15s,box-shadow .15s,width .2s; }
    .search-input:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgba(166,124,82,.1); width:270px; }
    .search-input::placeholder { color:var(--muted); }
    .sel { padding:.48rem .75rem; border:1px solid var(--border); border-radius:var(--r); font-family:'Outfit',sans-serif; font-size:.8rem; background:var(--surface); color:var(--text); cursor:pointer; }
    .sel:focus { outline:none; border-color:var(--gold); }
    .view-toggle { display:flex; border:1px solid var(--border); border-radius:var(--r); overflow:hidden; }
    .view-btn { padding:.45rem .75rem; background:var(--surface); border:none; cursor:pointer; font-size:.9rem; color:var(--muted); transition:all .15s; }
    .view-btn.active { background:var(--accent); color:#fff; }
    .view-btn:hover:not(.active) { background:var(--surface2); }

    /* chips */
    .chips { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:1rem; }
    .chip { padding:.26rem .75rem; border-radius:20px; font-size:.72rem; font-weight:500; cursor:pointer; border:1px solid var(--border); background:var(--surface); color:var(--muted); transition:all .15s; }
    .chip.active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .chip:hover:not(.active) { border-color:var(--border2); color:var(--text); }
    .result-count { font-size:.77rem; color:var(--muted); margin-bottom:1rem; }

    /* grid */
    .icon-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(165px,1fr)); gap:.9rem; }
    .item-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; cursor:pointer; transition:border-color .18s,box-shadow .18s,transform .18s; }
    .item-card:hover { border-color:var(--gold); box-shadow:var(--shadow); transform:translateY(-2px); }
    .card-thumb { width:100%; aspect-ratio:1; background:var(--surface2); display:flex; align-items:center; justify-content:center; position:relative; font-size:2rem; color:var(--border2); overflow:hidden; }
    .card-thumb img { width:100%; height:100%; object-fit:cover; }
    .card-avail-dot { position:absolute; top:.55rem; right:.55rem; width:7px; height:7px; border-radius:50%; box-shadow:0 0 0 2px var(--surface); z-index:1; }
    .card-body { padding:.7rem .8rem .85rem; }
    .card-id   { font-size:.62rem; color:var(--gold); letter-spacing:.5px; margin-bottom:2px; font-weight:500; }
    .card-name { font-size:.84rem; font-weight:500; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .card-meta { font-size:.71rem; color:var(--muted); line-height:1.6; }

    /* table */
    .tbl-wrap { border:1px solid var(--border); border-radius:var(--r); overflow:hidden; box-shadow:var(--shadow); }
    .tbl { width:100%; border-collapse:collapse; }
    .tbl th { background:var(--surface2); padding:.65rem 1.1rem; font-size:.68rem; letter-spacing:1.2px; text-transform:uppercase; color:var(--muted); font-weight:500; text-align:left; border-bottom:1px solid var(--border); user-select:none; }
    .tbl td { padding:.7rem 1.1rem; font-size:.83rem; border-bottom:1px solid var(--border); vertical-align:middle; }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl tbody tr { transition:background .12s; cursor:pointer; }
    .tbl tbody tr:hover td { background:var(--gold-bg); }
    .row-actions { display:flex; gap:.35rem; opacity:0; transition:opacity .15s; }
    .tbl tr:hover .row-actions { opacity:1; }
    .tbl-thumb { width:36px; height:36px; border-radius:3px; background:var(--surface2); object-fit:cover; display:flex; align-items:center; justify-content:center; font-size:.7rem; color:var(--muted); overflow:hidden; flex-shrink:0; }
    .tbl-thumb img { width:100%; height:100%; object-fit:cover; }

    /* badge */
    .badge { display:inline-flex; align-items:center; gap:4px; padding:.22rem .6rem; border-radius:20px; font-size:.7rem; font-weight:500; }
    .badge-green { background:var(--green-bg); color:var(--green); }
    .badge-red   { background:var(--red-bg);   color:var(--red); }
    .badge-dot   { width:5px; height:5px; border-radius:50%; background:currentColor; }

    /* detail */
    .detail-wrap { display:grid; grid-template-columns:280px 1fr; gap:2.5rem; align-items:start; }
    .detail-img { aspect-ratio:1; background:var(--surface2); border:1px solid var(--border); border-radius:var(--r); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; color:var(--muted); font-size:.7rem; letter-spacing:1px; overflow:hidden; }
    .detail-img img { width:100%; height:100%; object-fit:cover; }
    .detail-img-icon { font-size:2.5rem; color:var(--border2); }
    .field-row { display:flex; align-items:baseline; gap:1rem; padding:.7rem 0; border-bottom:1px solid var(--border); }
    .field-row:last-child { border-bottom:none; }
    .field-label { font-size:.68rem; letter-spacing:1px; text-transform:uppercase; color:var(--muted); min-width:100px; flex-shrink:0; }
    .field-val   { font-size:.88rem; font-weight:500; }
    .detail-actions { display:flex; gap:.6rem; margin-top:1.75rem; }

    /* form */
    .form-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:2rem; box-shadow:var(--shadow); }
    .form-layout { display:grid; grid-template-columns:200px 1fr; gap:2rem; align-items:start; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem; }
    .form-group { display:flex; flex-direction:column; gap:.32rem; }
    .form-group label { font-size:.68rem; letter-spacing:1px; text-transform:uppercase; color:var(--muted); }
    .form-input { padding:.56rem .8rem; border:1px solid var(--border); border-radius:var(--r); font-family:'Outfit',sans-serif; font-size:.85rem; color:var(--text); background:var(--surface2); transition:border-color .15s,box-shadow .15s,background .15s; }
    .form-input:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgba(166,124,82,.1); background:var(--surface); }
    .form-input::placeholder { color:var(--muted); }
    .form-input.err { border-color:var(--red); }
    .form-input:disabled { opacity:.5; cursor:not-allowed; }
    .field-err { font-size:.7rem; color:var(--red); margin-top:.2rem; }

    /* image upload box */
    .img-upload-box {
      aspect-ratio:1; border:1.5px dashed var(--border2); border-radius:var(--r);
      background:var(--surface2); display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:.5rem;
      cursor:pointer; transition:border-color .15s,background .15s;
      overflow:hidden; position:relative;
    }
    .img-upload-box:hover { border-color:var(--gold); background:var(--gold-bg); }
    .img-upload-box img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
    .img-upload-box .upload-icon { font-size:1.75rem; color:var(--border2); pointer-events:none; }
    .img-upload-box .upload-text { font-size:.7rem; color:var(--muted); text-align:center; pointer-events:none; }
    .img-upload-box:hover .upload-icon { color:var(--gold); }
    .img-change-btn {
      position:absolute; bottom:0; left:0; right:0;
      background:rgba(42,37,32,.75); color:#fff;
      font-size:.68rem; text-align:center; padding:.3rem;
      opacity:0; transition:opacity .15s;
    }
    .img-upload-box:hover .img-change-btn { opacity:1; }

    /* toggle */
    .toggle-row { display:flex; align-items:center; gap:.7rem; margin-top:.5rem; }
    .toggle { position:relative; width:40px; height:22px; cursor:pointer; }
    .toggle input { opacity:0; width:0; height:0; }
    .t-sl { position:absolute; inset:0; background:var(--border2); border-radius:22px; transition:.25s; }
    .t-sl::before { content:''; position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; left:3px; top:3px; transition:.25s; box-shadow:0 1px 3px rgba(0,0,0,.15); }
    .toggle input:checked + .t-sl { background:var(--green); }
    .toggle input:checked + .t-sl::before { transform:translateX(18px); }
    .toggle-lbl { font-size:.76rem; color:var(--muted); }
    .form-footer { display:flex; gap:.65rem; margin-top:1.75rem; padding-top:1.35rem; border-top:1px solid var(--border); align-items:center; }

    /* stats */
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:1.35rem 1.25rem; box-shadow:var(--shadow); }
    .stat-label { font-size:.68rem; letter-spacing:1.2px; text-transform:uppercase; color:var(--muted); margin-bottom:.5rem; }
    .stat-val   { font-family:'Cormorant',serif; font-size:2.2rem; font-weight:300; line-height:1; }
    .stat-sub   { font-size:.72rem; color:var(--muted); margin-top:.3rem; }

    /* skeleton */
    .skeleton { background:linear-gradient(90deg,var(--border) 25%,var(--surface2) 50%,var(--border) 75%); background-size:600px 100%; animation:shimmer 1.5s infinite; border-radius:var(--r); }
    .skel-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; }

    /* spinner */
    .spinner { width:16px; height:16px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; flex-shrink:0; }

    /* toast */
    .toast-wrap { position:fixed; bottom:1.75rem; right:1.75rem; display:flex; flex-direction:column; gap:.5rem; z-index:9999; }
    .toast { padding:.7rem 1.15rem; border-radius:var(--r); font-size:.82rem; color:#fff; font-weight:500; animation:toastIn .25s ease both; box-shadow:var(--shadow-lg); display:flex; align-items:center; gap:.5rem; min-width:220px; }
    .toast.out { animation:toastOut .3s ease both; }
    .toast-success { background:var(--accent); }
    .toast-error   { background:var(--red); }
    .toast-info    { background:var(--gold); }

    /* modal */
    .overlay { position:fixed; inset:0; background:rgba(30,27,23,.45); display:flex; align-items:center; justify-content:center; z-index:800; animation:fadeIn .2s ease; }
    .modal   { background:var(--surface); border-radius:var(--r); padding:1.75rem; width:340px; box-shadow:var(--shadow-lg); animation:fadeUp .22s ease; }
    .modal h3 { font-family:'Cormorant',serif; font-size:1.2rem; font-weight:400; margin-bottom:.5rem; }
    .modal p  { font-size:.84rem; color:var(--muted); margin-bottom:1.35rem; line-height:1.55; }
    .modal-actions { display:flex; gap:.6rem; justify-content:flex-end; }

    /* empty */
    .empty { text-align:center; padding:4.5rem 2rem; color:var(--muted); }
    .empty-icon { font-size:2.5rem; margin-bottom:.75rem; opacity:.3; }
    .empty p  { font-size:.88rem; margin-bottom:1.35rem; }

    /* error banner */
    .err-banner { background:var(--red-bg); border:1px solid #e8c4c4; border-radius:var(--r); padding:.9rem 1.1rem; color:var(--red); font-size:.83rem; margin-bottom:1.5rem; display:flex; align-items:flex-start; gap:.6rem; line-height:1.5; }

    /* live badge */
    .live-badge { display:inline-flex; align-items:center; gap:.4rem; padding:.22rem .65rem; border-radius:20px; background:var(--green-bg); color:var(--green); font-size:.68rem; font-weight:500; }
    .live-dot { width:5px; height:5px; border-radius:50%; background:var(--green); animation:pulse 1.5s ease infinite; }

    /* misc */
    .endpoint-tag { display:inline-block; background:var(--surface2); border:1px solid var(--border); border-radius:3px; font-size:.7rem; padding:.1rem .4rem; font-family:monospace; color:var(--muted); }
    .req-star { color:var(--red); margin-left:2px; }
  `}</style>
);

/* ═══ SHARED HOOKS ══════════════════════════════════════════════════════════ */

// Toast
let _tid = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = ++_tid;
    setToasts(t => [...t, { id, msg, type, out:false }]);
    setTimeout(() => setToasts(t => t.map(x => x.id===id ? {...x,out:true} : x)), 2400);
    setTimeout(() => setToasts(t => t.filter(x => x.id!==id)), 2700);
  };
  const ToastContainer = () => (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type} ${t.out?"out":""}`}>
          {t.type==="success"?"✓":t.type==="error"?"✕":"ℹ"} {t.msg}
        </div>
      ))}
    </div>
  );
  return { toast: add, ToastContainer };
}

// Shared product data — fetched once, shared between Stock + Update
function useProducts() {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [apiStatus, setApiStatus] = useState("loading");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setApiStatus("loading");
    try {
      const data = await api.getAll();
      setItems(Array.isArray(data) ? data : []);
      setApiStatus("ok");
    } catch (e) {
      setError(`Cannot reach backend at localhost:8085 — ${e.message}`);
      setApiStatus("err");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { items, setItems, loading, error, apiStatus, reload: load };
}

// Filter + sort
function useFiltered(items, search, cat, sort) {
  return useMemo(() => {
    let r = items.filter(i => {
      const q = search.toLowerCase();
      return (!q || (i.name||"").toLowerCase().includes(q) || String(i.id).includes(q) || (i.category||"").toLowerCase().includes(q))
          && (cat==="All" || i.category===cat);
    });
    if (sort==="id")       r = [...r].sort((a,b) => a.id-b.id);
    if (sort==="name")     r = [...r].sort((a,b) => (a.name||"").localeCompare(b.name||""));
    if (sort==="qty-desc") r = [...r].sort((a,b) => b.quantity-a.quantity);
    if (sort==="qty-asc")  r = [...r].sort((a,b) => a.quantity-b.quantity);
    if (sort==="date")     r = [...r].sort((a,b) => (b.added||0)-(a.added||0));
    return r;
  }, [items, search, cat, sort]);
}

/* ═══ SHARED COMPONENTS ════════════════════════════════════════════════════ */

const Avail = ({ yes }) => (
  <span className={`badge ${yes?"badge-green":"badge-red"}`}>
    <span className="badge-dot"/> {yes ? "Available" : "Unavailable"}
  </span>
);

function Confirm({ title, msg, onOk, onCancel, busy }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3><p>{msg}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onOk} disabled={busy}>
            {busy ? <span className="spinner"/> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="icon-grid">
      {Array.from({length:8}).map((_,i) => (
        <div key={i} className="skel-card">
          <div className="skeleton" style={{aspectRatio:"1",borderRadius:0}}/>
          <div style={{padding:".7rem .8rem .85rem"}}>
            <div className="skeleton" style={{height:9,width:"40%",marginBottom:8}}/>
            <div className="skeleton" style={{height:12,width:"80%",marginBottom:6}}/>
            <div className="skeleton" style={{height:9,width:"60%"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// Product image — fetches from /api/products/{id}/image
// Product image — fetches from /api/products/{id}/image
// Product image — fetches from /api/products/{id}/image
function ProductImage({ id, name, style, className }) {
  const [failedId, setFailedId] = useState(null);
  const src = id ? api.imageUrl(id) : null;

  if (!src || failedId === id) return null;

  return (
    <img
      src={src}
      alt={name || ""}
      style={style}
      className={className}
      onError={() => setFailedId(id)}
    />
  );
}

function ItemCard({ item, onClick }) {
  return (
    <div className="item-card" onClick={() => onClick && onClick(item)}>
      <div className="card-thumb">
        <ProductImage id={item.id} name={item.name} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>
        {!item.imageName && <span>◇</span>}
        <span className="card-avail-dot" style={{background:item.availability?"var(--green)":"var(--red)"}}/>
      </div>
      <div className="card-body">
        <div className="card-id">#{item.id}</div>
        <div className="card-name">{item.name}</div>
        <div className="card-meta">{item.category}</div>
        <div className="card-meta">{item.weight}g · Qty {item.quantity}</div>
      </div>
    </div>
  );
}

function Toolbar({ view, onView, sort, onSort, search, onSearch, showAdd, onAdd, onRefresh, refreshing }) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input className="search-input" placeholder="Search name, ID, category…" value={search} onChange={e => onSearch(e.target.value)}/>
      </div>
      <select className="sel" value={sort} onChange={e => onSort(e.target.value)}>
        <option value="id">Sort: ID</option>
        <option value="name">Sort: Name A–Z</option>
        <option value="qty-desc">Sort: Qty ↓</option>
        <option value="qty-asc">Sort: Qty ↑</option>
        <option value="date">Sort: Date Added</option>
      </select>
      <div className="toolbar-right">
        {onRefresh && (
          <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={refreshing} title="Reload from backend">
            {refreshing ? <span className="spinner"/> : "↺"}
          </button>
        )}
        <div className="view-toggle">
          <button className={`view-btn ${view==="icon"?"active":""}`} onClick={() => onView("icon")} title="Grid">▦</button>
          <button className={`view-btn ${view==="list"?"active":""}`} onClick={() => onView("list")} title="List">≡</button>
        </div>
        {showAdd && <button className="btn btn-gold btn-sm" onClick={onAdd}>+ Add Item</button>}
      </div>
    </div>
  );
}

function CatChips({ active, onChange }) {
  return (
    <div className="chips">
      {CATEGORIES.map(c => (
        <span key={c} className={`chip ${active===c?"active":""}`} onClick={() => onChange(c)}>{c}</span>
      ))}
    </div>
  );
}

/* ═══ HOME PAGE ════════════════════════════════════════════════════════════ */
function HomePage({ items, loading, onNav }) {
  const total    = items.length;
  const avail    = items.filter(i => i.availability).length;
  const totalQty = items.reduce((s,i) => s+Number(i.quantity||0), 0);
  const cats     = new Set(items.map(i => i.category).filter(Boolean)).size;

  return (
    <div className="page fade-up">
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Live overview from your MySQL database</p>
      </div>
      {loading ? (
        <div className="stats-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{height:9,width:"60%",marginBottom:10}}/>
              <div className="skeleton" style={{height:36,width:"40%",marginBottom:8}}/>
              <div className="skeleton" style={{height:9,width:"50%"}}/>
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid stagger">
          <div className="stat-card"><div className="stat-label">Total Items</div><div className="stat-val">{total}</div><div className="stat-sub">in database</div></div>
          <div className="stat-card"><div className="stat-label">Available</div><div className="stat-val" style={{color:"var(--green)"}}>{avail}</div><div className="stat-sub">{total-avail} unavailable</div></div>
          <div className="stat-card"><div className="stat-label">Total Stock</div><div className="stat-val">{totalQty}</div><div className="stat-sub">units in inventory</div></div>
          <div className="stat-card"><div className="stat-label">Categories</div><div className="stat-val">{cats}</div><div className="stat-sub">product types</div></div>
        </div>
      )}
      <hr/>
      <div style={{display:"flex",gap:".75rem",flexWrap:"wrap"}}>
        <button className="btn btn-primary" onClick={() => onNav("stock")}>View Stock</button>
        <button className="btn btn-ghost"   onClick={() => onNav("update")}>Manage Items</button>
      </div>
    </div>
  );
}

/* ═══ STOCK PAGE ════════════════════════════════════════════════════════════ */
function StockPage({ items, loading, error, reload, onSelectItem }) {
  const [view, setView]     = useState("icon");
  const [sort, setSort]     = useState("id");
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("All");
  const filtered = useFiltered(items, search, cat, sort);

  return (
    <div className="page fade-up">
      <div className="page-head-row page-head">
        <div>
          <h1>Stock</h1>
          <p style={{display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap"}}>
            <span className="endpoint-tag">GET /api/products</span>
            {!loading && !error && <span className="live-badge"><span className="live-dot"/>Live</span>}
            {loading && <span style={{fontSize:".75rem",color:"var(--muted)",display:"flex",gap:".4rem",alignItems:"center"}}><span className="spinner" style={{width:11,height:11,borderWidth:1.5}}/>Fetching…</span>}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}>
          {loading ? <span className="spinner"/> : "↺ Refresh"}
        </button>
      </div>

      {error && (
        <div className="err-banner">
          <span>⚠</span>
          <div>{error}<br/><button className="btn btn-ghost btn-sm" style={{marginTop:".6rem"}} onClick={reload}>Retry</button></div>
        </div>
      )}

      {!error && <>
        <Toolbar view={view} onView={setView} sort={sort} onSort={setSort} search={search} onSearch={setSearch}/>
        <CatChips active={cat} onChange={setCat}/>
        {!loading && <div className="result-count">{filtered.length} item{filtered.length!==1?"s":""} found{items.length!==filtered.length?` (of ${items.length} total)`:""}</div>}

        {loading ? <SkeletonGrid/> : filtered.length===0 ? (
          <div className="empty"><div className="empty-icon">◇</div><p>{items.length===0?"No products in database yet.":"No items match your search."}</p></div>
        ) : view==="icon" ? (
          <div className="icon-grid stagger">
            {filtered.map(i => <ItemCard key={i.id} item={i} onClick={onSelectItem}/>)}
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th></th><th>ID</th><th>Name</th><th>Category</th><th>Weight</th><th>Qty</th><th>Added</th><th>Status</th></tr></thead>
              <tbody className="stagger">
                {filtered.map(i => (
                  <tr key={i.id} onClick={() => onSelectItem(i)}>
                    <td style={{width:50,paddingRight:0}}>
                      <div className="tbl-thumb">
                        {i.imageName
                          ? <img src={api.imageUrl(i.id)} alt={i.name} onError={e => e.target.style.display="none"}/>
                          : "◇"}
                      </div>
                    </td>
                    <td style={{color:"var(--gold)",fontWeight:600}}>#{i.id}</td>
                    <td style={{fontWeight:500}}>{i.name}</td>
                    <td>{i.category}</td><td>{i.weight}g</td><td>{i.quantity}</td>
                    <td>{fmtDate(parseBackendDate(i.added))}</td>
                    <td><Avail yes={i.availability}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>}
    </div>
  );
}

/* ═══ PRODUCT DETAIL ════════════════════════════════════════════════════════ */
function ProductDetail({ item, onBack, onEdit }) {
  return (
    <div className="page fade-up">
      <div style={{marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:".75rem"}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <span className="live-badge"><span className="live-dot"/>Live data</span>
      </div>
      <div className="page-head"><h1>{item.name}</h1><p>{item.category} · #{item.id}</p></div>
      <div className="detail-wrap">
        <div>
          <div className="detail-img">
            {item.imageName
              ? <img src={api.imageUrl(item.id)} alt={item.name} onError={e=>{e.target.style.display="none";}}/>
              : <><span className="detail-img-icon">◇</span><span>No image</span></>}
          </div>
          <div style={{marginTop:"1rem"}}><Avail yes={item.availability}/></div>
          {/* Edit goes DIRECTLY to the edit form — not the update list */}
          <div className="detail-actions">
            <button className="btn btn-gold btn-sm" onClick={() => onEdit(item)}>✎ Edit Item</button>
          </div>
        </div>
        <div>
          {[["ID",`#${item.id}`],["Name",item.name],["Category",item.category],
            ["Weight",`${item.weight}g`],["Quantity",item.quantity],
            ["Added On",fmtDate(parseBackendDate(item.added))],
            ["Sold On",fmtDate(parseBackendDate(item.sold))],
            ["Image",item.imageName||"—"]].map(([l,v]) => (
            <div className="field-row" key={l}>
              <span className="field-label">{l}</span>
              <span className="field-val">{v??"—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ ITEM FORM — Add / Edit ════════════════════════════════════════════════
   POST /api/products  — multipart: product (JSON blob) + imageFile
   PUT  /api/products/{id} — same multipart format
═══════════════════════════════════════════════════════════════════════════ */
function ItemForm({ initial, onSave, onCancel, toast }) {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState(() => initial ? {
    id:           String(initial.id ?? ""),
    name:         initial.name ?? "",
    category:     initial.category ?? "",
    weight:       String(initial.weight ?? ""),
    quantity:     String(initial.quantity ?? ""),
    added:        toInputDate(parseBackendDate(initial.added)),
    sold:         toInputDate(parseBackendDate(initial.sold)),
    availability: initial.availability ?? true,
  } : { ...EMPTY_FORM });

  const [imageFile,    setImageFile]    = useState(null);   // File object
  const [imagePreview, setImagePreview] = useState(         // preview URL
    isEdit && initial.imageName ? api.imageUrl(initial.id) : null
  );
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef();

  const set = (k,v) => { setForm(f => ({...f,[k]:v})); setErrors(e => ({...e,[k]:""})); };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!isEdit && (!form.id || isNaN(Number(form.id)))) e.id = "Required numeric ID";
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.category.trim()) e.category = "Category is required";
    if (!form.weight || isNaN(Number(form.weight)))     e.weight   = "Valid weight required";
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = "Valid quantity required";
    if (!isEdit && !imageFile) e.image = "Image is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    // Build product payload matching your Product.java fields
    const productPayload = {
      id:           Number(form.id),
      name:         form.name.trim(),
      category:     form.category.trim(),
      weight:       parseFloat(form.weight),
      quantity:     parseInt(form.quantity),
      added:        form.added ? new Date(form.added).toISOString() : null,
      sold:         form.sold  ? new Date(form.sold).toISOString()  : null,
      availability: form.availability,
    };

    try {
      if (isEdit) {
        // PUT — if no new image selected, send a 1-byte placeholder
        // (your backend requires imageFile in the PUT multipart)
        const imgToSend = imageFile || new File([""], "placeholder.jpg", { type:"image/jpeg" });
        await api.update(productPayload.id, productPayload, imgToSend);
        toast("Item updated successfully ✓", "success");
      } else {
        await api.create(productPayload, imageFile);
        toast("Item added successfully ✓", "success");
      }
      onSave();  // tell parent to reload
    } catch(err) {
      toast("Save failed: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const textFields = [
    {k:"id",       label:"ID",         type:"number", locked:isEdit, req:true},
    {k:"name",     label:"Name",       type:"text",   req:true},
    {k:"category", label:"Category",   type:"text",   req:true},
    {k:"weight",   label:"Weight (g)", type:"number", req:true},
    {k:"quantity", label:"Quantity",   type:"number", req:true},
    {k:"added",    label:"Added On",   type:"date"},
    {k:"sold",     label:"Sold On",    type:"date"},
  ];

  return (
    <div className="page fade-up">
      <div style={{marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:".75rem"}}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>← Cancel</button>
      </div>
      <div className="page-head">
        <h1>{isEdit ? "Edit Item" : "Add New Item"}</h1>
        <p>
          {isEdit
            ? <><span className="endpoint-tag">PUT /api/products/{initial.id}</span> · Editing {initial.name}</>
            : <><span className="endpoint-tag">POST /api/products</span> · Fill in product details</>}
        </p>
      </div>

      <div className="form-card">
        <div className="form-layout">
          {/* ── Image upload ── */}
          <div>
            <div className="form-group" style={{marginBottom:"1rem"}}>
              <label>Product Image{!isEdit && <span className="req-star">*</span>}</label>
              <div
                className="img-upload-box"
                onClick={() => fileRef.current?.click()}
                title="Click to upload image"
              >
                {imagePreview && (
                  <img src={imagePreview} alt="preview" onError={() => setImagePreview(null)}/>
                )}
                {!imagePreview && (
                  <>
                    <span className="upload-icon">⊕</span>
                    <span className="upload-text">Click to upload<br/>JPG, PNG, WEBP</span>
                  </>
                )}
                {imagePreview && <div className="img-change-btn">Click to change</div>}
              </div>
              <input
                ref={fileRef} type="file" accept="image/*"
                style={{display:"none"}} onChange={handleImagePick}
              />
              {errors.image && <div className="field-err">{errors.image}</div>}
              {imageFile && <div style={{fontSize:".7rem",color:"var(--muted)",marginTop:".3rem"}}>📎 {imageFile.name}</div>}
            </div>

            {/* Availability toggle */}
            <div className="form-group">
              <label>Availability</label>
              <div className="toggle-row">
                <label className="toggle">
                  <input type="checkbox" checked={form.availability} onChange={e => set("availability", e.target.checked)}/>
                  <span className="t-sl"/>
                </label>
                <span className="toggle-lbl">{form.availability ? "Available" : "Unavailable"}</span>
              </div>
            </div>
          </div>

          {/* ── Text fields ── */}
          <div className="form-grid">
            {textFields.map(({k,label,type,locked,req}) => (
              <div className="form-group" key={k}>
                <label>{label}{req && <span className="req-star">*</span>}{locked?" (locked)":""}</label>
                <input
                  className={`form-input ${errors[k]?"err":""}`}
                  type={type} placeholder={label}
                  value={form[k]} disabled={locked}
                  onChange={e => set(k, e.target.value)}
                />
                {errors[k] && <div className="field-err">{errors[k]}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="form-footer">
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="spinner"/> Saving…</>
              : isEdit ? "Save Changes" : "Add Item"}
          </button>
          <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ UPDATE PAGE ═══════════════════════════════════════════════════════════ */
function UpdatePage({ items, loading, error, reload, toast }) {
  const [view,    setView]    = useState("icon");
  const [sort,    setSort]    = useState("id");
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState("All");
  const [editing, setEditing] = useState(null);   // null | "new" | item
  const [confirm, setConfirm] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const filtered = useFiltered(items, search, cat, sort);

  // after save, reload from backend
  const handleSaved = () => { setEditing(null); reload(); };

  const handleDelete = async () => {
    setDelBusy(true);
    try {
      await api.delete(confirm.id);
      toast(`"${confirm.name}" deleted`, "success");
      reload();
    } catch(err) {
      toast("Delete failed: " + err.message, "error");
    } finally {
      setDelBusy(false);
      setConfirm(null);
    }
  };

  if (editing==="new") return <ItemForm onSave={handleSaved} onCancel={() => setEditing(null)} toast={toast}/>;
  if (editing)         return <ItemForm initial={editing} onSave={handleSaved} onCancel={() => setEditing(null)} toast={toast}/>;

  return (
    <div className="page fade-up">
      {confirm && (
        <Confirm
          title="Delete Item"
          msg={`Permanently delete "${confirm.name}" (#${confirm.id}) from the database?`}
          onOk={handleDelete} onCancel={() => setConfirm(null)} busy={delBusy}
        />
      )}

      <div className="page-head-row page-head">
        <div>
          <h1>Update</h1>
          <p style={{display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap"}}>
            <span className="endpoint-tag">GET /api/products</span>
            {!loading && !error && <span className="live-badge"><span className="live-dot"/>Live</span>}
            {loading && <span style={{fontSize:".75rem",color:"var(--muted)",display:"flex",gap:".4rem",alignItems:"center"}}><span className="spinner" style={{width:11,height:11,borderWidth:1.5}}/>Fetching…</span>}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}>
          {loading ? <span className="spinner"/> : "↺ Refresh"}
        </button>
      </div>

      {error && (
        <div className="err-banner">
          <span>⚠</span>
          <div>{error}<br/><button className="btn btn-ghost btn-sm" style={{marginTop:".6rem"}} onClick={reload}>Retry</button></div>
        </div>
      )}

      {!error && <>
        <Toolbar view={view} onView={setView} sort={sort} onSort={setSort}
          search={search} onSearch={setSearch}
          showAdd onAdd={() => setEditing("new")}
          onRefresh={reload} refreshing={loading}/>
        <CatChips active={cat} onChange={setCat}/>
        {!loading && <div className="result-count">{filtered.length} item{filtered.length!==1?"s":""}{items.length!==filtered.length?` of ${items.length}`:""}</div>}

        {loading ? <SkeletonGrid/> : filtered.length===0 ? (
          <div className="empty">
            <div className="empty-icon">◇</div>
            <p>{items.length===0?"No products in database.":"No items match."}</p>
            <button className="btn btn-gold btn-sm" onClick={() => setEditing("new")}>+ Add First Item</button>
          </div>
        ) : view==="icon" ? (
          <div className="icon-grid stagger">
            {filtered.map(i => (
              <div key={i.id} className="item-card">
                <div className="card-thumb">
                  {i.imageName
                    ? <img src={api.imageUrl(i.id)} alt={i.name} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}} onError={e=>e.target.style.display="none"}/>
                    : <span>◇</span>}
                  <span className="card-avail-dot" style={{background:i.availability?"var(--green)":"var(--red)"}}/>
                </div>
                <div className="card-body">
                  <div className="card-id">#{i.id}</div>
                  <div className="card-name">{i.name}</div>
                  <div className="card-meta">{i.category} · {i.weight}g</div>
                  <div style={{display:"flex",gap:".35rem",marginTop:".6rem"}}>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditing(i)}>Edit</button>
                    <button className="btn btn-danger btn-xs" onClick={() => setConfirm(i)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th></th><th>ID</th><th>Name</th><th>Category</th><th>Weight</th><th>Qty</th><th>Status</th><th></th></tr></thead>
              <tbody className="stagger">
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td style={{width:50,paddingRight:0}}>
                      <div className="tbl-thumb">
                        {i.imageName
                          ? <img src={api.imageUrl(i.id)} alt={i.name} onError={e=>e.target.style.display="none"}/>
                          : "◇"}
                      </div>
                    </td>
                    <td style={{color:"var(--gold)",fontWeight:600}}>#{i.id}</td>
                    <td style={{fontWeight:500}}>{i.name}</td>
                    <td>{i.category}</td><td>{i.weight}g</td><td>{i.quantity}</td>
                    <td><Avail yes={i.availability}/></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-xs" onClick={e=>{e.stopPropagation();setEditing(i);}}>Edit</button>
                        <button className="btn btn-danger btn-xs" onClick={e=>{e.stopPropagation();setConfirm(i);}}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>}
    </div>
  );
}

/* ═══ SIDEBAR ═══════════════════════════════════════════════════════════════ */
function Sidebar({ page, onNav, apiStatus }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-emblem">
          <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div className="brand-name">Jewellery</div>
        <div className="brand-tagline">Inventory System</div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {NAV.map(n => (
          <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={() => onNav(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {(n.id==="stock"||n.id==="update") && (
              <span style={{marginLeft:"auto",fontSize:".58rem",opacity:.45,letterSpacing:"1px"}}>LIVE</span>
            )}
          </div>
        ))}
      </nav>
      <div className="api-pill">
        <span className={`api-dot ${apiStatus}`}/>
        <span>
          {apiStatus==="ok"      ? "Backend connected"  :
           apiStatus==="err"     ? "Backend offline"    :
           apiStatus==="loading" ? "Connecting…"        : "Not loaded"}
        </span>
      </div>
      <div className="sidebar-footer">localhost:8085/api · v2.0</div>
    </aside>
  );
}

/* ═══ ROOT APP ══════════════════════════════════════════════════════════════ */
export default function App() {
  const [page,     setPage]     = useState("home");
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);  // item to edit (from detail page)
  const { toast, ToastContainer } = useToast();
  const { items, loading, error, apiStatus, reload } = useProducts();

  const nav = (p) => { setPage(p); setSelected(null); setEditItem(null); };

  const sidebarPage =
    page==="detail" ? "stock" :
    page==="editDirect" ? "update" :
    page;

  return (
    <>
      <GlobalStyle/>
      <div className="shell">
        <Sidebar page={sidebarPage} onNav={nav} apiStatus={apiStatus}/>
        <main className="content">

          {page==="home" && <HomePage items={items} loading={loading} onNav={nav}/>}

          {page==="stock" && (
            <StockPage
              items={items} loading={loading} error={error} reload={reload}
              onSelectItem={i => { setSelected(i); setPage("detail"); }}
            />
          )}

          {/* Detail page — Edit button goes DIRECTLY to edit form */}
          {page==="detail" && selected && (
            <ProductDetail
              item={selected}
              onBack={() => nav("stock")}
              onEdit={item => {
                setEditItem(item);
                setSelected(null);
                setPage("editDirect");
              }}
            />
          )}

          {/* Direct edit from Detail page */}
          {page==="editDirect" && editItem && (
            <ItemForm
              initial={editItem}
              onSave={() => { reload(); nav("stock"); }}
              onCancel={() => { setPage("detail"); setSelected(editItem); setEditItem(null); }}
              toast={toast}
            />
          )}

          {page==="update" && (
            <UpdatePage
              items={items} loading={loading} error={error}
              reload={reload} toast={toast}
            />
          )}

        </main>
      </div>
      <ToastContainer/>
    </>
  );
}
