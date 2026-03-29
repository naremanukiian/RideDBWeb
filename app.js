'use strict';
// ─── RideShareDB Dashboard — Role-Aware app.js ────────────────
// Four roles: passenger · driver · analyst · dba
// Each role sees a different tailored view of the database

// ─── UTILITIES ────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = (t,c,h='') => { const e=document.createElement(t); if(c) e.className=c; e.innerHTML=h; return e; };
const stars = n => n ? `<span class="stars-gold">${'★'.repeat(n)}</span><span class="stars-empty">${'★'.repeat(5-n)}</span>` : '<span class="muted">—</span>';
const badge = t => `<span class="badge ${t.toLowerCase()}">${t}</span>`;
const mono  = t => `<span class="mono">${t}</span>`;
const fare  = f => `<span class="fare">$${f.toFixed(2)}</span>`;
const uid2name   = id => { const u=DB.users[id-1]; return u?u.first+' '+u.last:'—'; };
const did2name   = id => { const d=DB.drivers[id-1]; return d?d.first+' '+d.last:'—'; };
const lid2name   = id => { const l=DB.locations[id-1]; return l?l.name:'—'; };
const lid2city   = id => { const l=DB.locations[id-1]; return l?l.city:'—'; };
const vid2model  = id => { const v=DB.vehicles[id-1]; return v?`${v.model} '${String(v.year).slice(2)}`:'—'; };
const rid2str    = id => `<span class="id">#${String(id).padStart(3,'0')}</span>`;
const promoTag   = id => { if(!id) return '<span class="muted">—</span>'; const p=DB.promos.find(x=>x.id===id); return p?`<span class="promo-tag">${p.code} −${p.discount}%</span>`:'—'; };
const nullOr     = (v,fn) => v==null?'<span class="muted">NULL</span>':fn(v);
const durStr     = d => d?`${d} min`:'<span class="muted">—</span>';

// ─── CURRENT STATE ────────────────────────────────────────────
let ROLE = null;
let DRIVER_ID = 1; // simulated "logged in" driver (James Cooper)
let USER_ID   = 1; // simulated "logged in" user  (Alice Johnson)

// ─── ROLE DEFINITIONS ─────────────────────────────────────────
const ROLES = {
  passenger: {
    label:'Passenger', icon:'👤', login:'ride_app',
    avatarText:'PA', color:'#06b6d4',
    nav:[
      { id:'my-rides',   label:'My Rides',      icon:rideIcon(),    count:null },
      { id:'book',       label:'Book a Ride',   icon:carIcon(),     count:null },
      { id:'payments',   label:'My Payments',   icon:payIcon(),     count:null },
      { id:'promos',     label:'Promo Codes',   icon:promoIcon(),   count:null },
    ],
    home:'my-rides',
  },
  driver: {
    label:'Driver', icon:'🚗', login:'ride_app',
    avatarText:'DR', color:'#10b981',
    nav:[
      { id:'my-trips',   label:'My Trips',       icon:rideIcon(),   count:null },
      { id:'earnings',   label:'Earnings',        icon:payIcon(),    count:null },
      { id:'my-ratings', label:'My Ratings',      icon:starIcon(),   count:null },
      { id:'my-vehicle', label:'My Vehicle',      icon:carIcon(),    count:null },
    ],
    home:'my-trips',
  },
  analyst: {
    label:'Analyst', icon:'📊', login:'ride_report',
    avatarText:'AN', color:'#f59e0b',
    nav:[
      { id:'overview',   label:'Overview',      icon:dashIcon(),    count:null },
      { id:'all-rides',  label:'All Rides',     icon:rideIcon(),    count:'42' },
      { id:'all-drivers',label:'All Drivers',   icon:personIcon(),  count:'42' },
      { id:'revenue',    label:'Revenue',       icon:payIcon(),     count:null },
      { id:'all-users',  label:'Users',         icon:usersIcon(),   count:'42' },
    ],
    home:'overview',
  },
  dba: {
    label:'DBA Admin', icon:'🛡', login:'ride_dba',
    avatarText:'DB', color:'#6366f1',
    nav:[
      { id:'dashboard',  label:'Dashboard',     icon:dashIcon(),    count:null },
      { id:'rides-all',  label:'Rides',         icon:rideIcon(),    count:'42' },
      { id:'drivers-all',label:'Drivers',       icon:personIcon(),  count:'42' },
      { id:'users-all',  label:'Users',         icon:usersIcon(),   count:'42' },
      { id:'payments-all',label:'Payments',     icon:payIcon(),     count:'42' },
      { label:null }, // divider
      { id:'schema',     label:'Schema',        icon:dbIcon(),      count:null },
      { id:'triggers',   label:'Triggers',      icon:boltIcon(),    count:'7'  },
      { id:'procedures', label:'Procedures',    icon:codeIcon(),    count:'8'  },
      { id:'dcl',        label:'Access Control',icon:lockIcon(),    count:null },
    ],
    home:'dashboard',
  },
};

// ─── SVG ICONS ────────────────────────────────────────────────
function svgIcon(path,vb='0 0 24 24') {
  return `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
function dashIcon()  { return svgIcon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'); }
function rideIcon()  { return svgIcon('<path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5a2 2 0 01-2 2h-2"/><circle cx="9" cy="21" r="2"/><circle cx="19" cy="21" r="2"/><path d="M15 17H9"/>'); }
function carIcon()   { return svgIcon('<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'); }
function payIcon()   { return svgIcon('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'); }
function starIcon()  { return svgIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'); }
function personIcon(){ return svgIcon('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'); }
function usersIcon() { return svgIcon('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>'); }
function promoIcon() { return svgIcon('<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'); }
function dbIcon()    { return svgIcon('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'); }
function boltIcon()  { return svgIcon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'); }
function codeIcon()  { return svgIcon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'); }
function lockIcon()  { return svgIcon('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>'); }

// ─── ROLE SELECTOR ────────────────────────────────────────────
function selectRole(role) {
  ROLE = role;
  const def = ROLES[role];

  // set theme attribute
  $('app').setAttribute('data-role', role);

  // sidebar role pill
  $('sbRoleAvatar').textContent = def.avatarText;
  $('sbRoleAvatar').style.background = def.color;
  $('sbRoleName').textContent = def.label;
  $('sbRoleLogin').textContent = def.login;

  // topbar avatar
  $('tbAvatar').textContent = def.avatarText;
  $('tbAvatar').style.background = def.color;

  // build nav
  const nav = $('sbNav');
  nav.innerHTML = '';
  let groupAdded = false;
  def.nav.forEach(item => {
    if (!item.label) {
      nav.innerHTML += '<div class="sb-nav-label" style="margin-top:10px">Database</div>';
      return;
    }
    if (!groupAdded) {
      nav.innerHTML += `<div class="sb-nav-label">${role==='dba'?'Operations':'My Account'}</div>`;
      groupAdded = true;
    }
    const li = el('div','sb-nav-item');
    li.setAttribute('data-view', item.id);
    li.onclick = () => showView(item.id, li);
    li.innerHTML = item.icon + ` ${item.label}` + (item.count ? `<span class="sb-nav-count">${item.count}</span>` : '');
    nav.appendChild(li);
  });

  // build views
  buildViews(role);

  // show app, hide selector
  $('roleScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('app').classList.add('entering');
  setTimeout(()=>$('app').classList.remove('entering'), 500);

  // show home view
  const homeItem = nav.querySelector(`[data-view="${def.home}"]`);
  showView(def.home, homeItem);
}

function backToRoleScreen() {
  $('roleScreen').classList.remove('hidden');
  $('app').classList.add('hidden');
  $('pageContent').innerHTML = '';
  ROLE = null;
}

// ─── NAVIGATION ────────────────────────────────────────────────
const VIEW_TITLES = {
  'my-rides'    :['My Rides','Trip History'],
  'book'        :['Book a Ride','Available Drivers'],
  'payments'    :['My Payments','Transaction History'],
  'promos'      :['Promo Codes','Available Discounts'],
  'my-trips'    :['My Trips','Completed Rides'],
  'earnings'    :['Earnings','Revenue Breakdown'],
  'my-ratings'  :['My Ratings','Passenger Feedback'],
  'my-vehicle'  :['My Vehicle','Vehicle Details'],
  'overview'    :['Overview','Analytics Dashboard'],
  'all-rides'   :['All Rides','vw_ride_details'],
  'all-drivers' :['All Drivers','vw_driver_summary'],
  'revenue'     :['Revenue','vw_revenue_by_city'],
  'all-users'   :['All Users','users table'],
  'dashboard'   :['DBA Dashboard','Full System Overview'],
  'rides-all'   :['Rides','vw_ride_details — 42 records'],
  'drivers-all' :['Drivers','vw_driver_summary — 42 drivers'],
  'users-all'   :['Users','users table — 42 users'],
  'payments-all':['Payments','vw_payment_overview — 42 records'],
  'schema'      :['Schema','8 Tables — Physical Design'],
  'triggers'    :['Triggers','7 Business Rule Automations'],
  'procedures'  :['Procedures','8 Stored Procedures'],
  'dcl'         :['Access Control','DCL — 3 User Roles'],
};

function showView(id, navEl) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.sb-nav-item').forEach(n=>n.classList.remove('active'));
  const view = $('view-'+id);
  if (view) view.classList.add('active');
  if (navEl) navEl.classList.add('active');
  const [title, sub] = VIEW_TITLES[id] || [id,''];
  $('tbTitle').textContent = title;
  $('tbSub').textContent = sub;
  // close mobile sidebar
  $('sidebar').classList.remove('open');
  $('sbOverlay').classList.remove('show');
  $('hamburger').classList.remove('open');
}

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('sbOverlay').classList.toggle('show');
  $('hamburger').classList.toggle('open');
}

function handleSearch(val) {
  const q = val.trim().toLowerCase();
  document.querySelectorAll('.view.active tbody tr').forEach(row => {
    row.style.display = (!q || row.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
}

// ─── BUILD ALL VIEWS FOR ROLE ──────────────────────────────────
function buildViews(role) {
  const pc = $('pageContent');
  pc.innerHTML = '';
  if (role === 'passenger') buildPassengerViews(pc);
  if (role === 'driver')    buildDriverViews(pc);
  if (role === 'analyst')   buildAnalystViews(pc);
  if (role === 'dba')       buildDBAViews(pc);
}

// ═══════════════════════════════════════════════════════════════
// PASSENGER VIEWS
// ═══════════════════════════════════════════════════════════════
function buildPassengerViews(pc) {
  const u = DB.users[USER_ID-1];
  const myRides = DB.rides.filter(r => r.uid === USER_ID);
  const myPayments = DB.payments.filter(p => {
    const r = DB.rides[p.rid-1];
    return r && r.uid === USER_ID;
  });

  // ── MY RIDES ────────────────────────────────────────────────
  const vr = view('my-rides');
  vr.innerHTML = `
    ${welcomeCard('👤', u.first+' '+u.last, `Welcome back! You have ${myRides.length} ride${myRides.length!==1?'s':''} in your history.`)}
    <div class="kpi-row">
      <div class="kpi"><div class="kpi-icon" style="background:var(--green-bg)">✅</div><div><div class="kpi-val" style="color:var(--green)">${myRides.filter(r=>r.status==='Completed').length}</div><div class="kpi-label">Completed</div></div></div>
      <div class="kpi"><div class="kpi-icon" style="background:var(--yellow-bg)">⏳</div><div><div class="kpi-val" style="color:var(--yellow)">${myRides.filter(r=>r.status==='Pending').length}</div><div class="kpi-label">Pending</div></div></div>
      <div class="kpi"><div class="kpi-icon" style="background:var(--green-bg)">💵</div><div><div class="kpi-val" style="color:var(--green)">$${myRides.reduce((s,r)=>s+r.fare,0).toFixed(2)}</div><div class="kpi-label">Total Spent</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">My Trip History</div><div class="card-meta">${myRides.length} rides</div></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Ride</th><th>Driver</th><th>From</th><th>To</th><th>Date</th><th>Duration</th><th>Fare</th><th>Promo</th><th>Status</th></tr></thead>
          <tbody>${myRides.map(r=>`<tr>
            <td>${rid2str(r.id)}</td>
            <td>${did2name(r.did)}</td>
            <td style="font-size:11px">${lid2name(r.slid)}</td>
            <td style="font-size:11px">${lid2name(r.elid)}</td>
            <td style="font-size:11px;color:var(--t2)">${r.start.slice(0,10)}</td>
            <td>${durStr(r.dur)}</td>
            <td>${r.fare>0?fare(r.fare):'<span class="muted">—</span>'}</td>
            <td>${promoTag(r.promo)}</td>
            <td>${badge(r.status)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="tbl-footer">Showing your rides only · Sorted by date · RideDuration auto-set by trg_calc_duration (BR-5)</div>
    </div>`;
  pc.appendChild(vr);

  // ── BOOK ────────────────────────────────────────────────────
  const vb = view('book');
  const available = DB.drivers.filter(d=>d.status==='Available');
  vb.innerHTML = `
    <div class="view-header">
      <div class="view-title">Book a Ride</div>
      <div class="view-desc">Choose from <strong>${available.length} available drivers</strong> right now. As passenger you can book a ride — but only one active Pending ride at a time (<code>trg_no_concurrent_rides</code> BR-1).</div>
    </div>
    <div class="restrict-note">⚠ Your account is ride_app · You can SELECT, INSERT, UPDATE — but not DELETE</div>
    <div class="card">
      <div class="card-header"><div class="card-title">Available Drivers — sp_available_drivers</div><div class="card-meta">${available.length} online now</div></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Driver</th><th>Vehicle</th><th>Capacity</th><th>Rating</th><th>Status</th></tr></thead>
          <tbody>${available.map(d=>{
            const v=DB.vehicles.find(v=>v.did===d.id);
            return `<tr>
              <td><strong>${d.first} ${d.last}</strong><div style="font-size:10px;color:var(--t3)">${d.lic}</div></td>
              <td style="font-size:11px">${v?v.model:'—'}</td>
              <td style="font-size:11px">${v?v.cap+' seats':'—'}</td>
              <td>${stars(Math.round(d.rating))} <span style="font-size:10px;color:var(--t3)">${d.rating}</span></td>
              <td>${badge(d.status)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
  pc.appendChild(vb);

  // ── PAYMENTS ─────────────────────────────────────────────────
  const vp = view('payments');
  vp.innerHTML = `
    <div class="view-header">
      <div class="view-title">My Payments</div>
      <div class="view-desc">Your personal payment history from <code>vw_payment_overview</code>. Cancelled rides cannot be paid — enforced by <strong>trg_validate_payment_ride</strong> (BR-3).</div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Payment History</div><div class="card-meta">${myPayments.length} transactions</div></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Payment</th><th>Ride</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>${myPayments.map(p=>`<tr>
            <td>${rid2str(p.pid)}</td>
            <td>${rid2str(p.rid)}</td>
            <td>${fare(p.amount)}</td>
            <td>${badge(p.method)}</td>
            <td style="font-size:11px;color:var(--t2)">${p.date}</td>
            <td>${badge(p.status)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  pc.appendChild(vp);

  // ── PROMOS ───────────────────────────────────────────────────
  const today = new Date();
  const activePromos = DB.promos.filter(p=>new Date(p.expiry)>today);
  const vpr = view('promos');
  vpr.innerHTML = `
    <div class="view-header">
      <div class="view-title">Promo Codes</div>
      <div class="view-desc">Active discount codes from <code>vw_active_promos</code> — only non-expired codes. Discount applies to your next ride fare via <code>sp_apply_promo</code>.</div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Active Promo Codes — vw_active_promos</div><div class="card-meta">${activePromos.length} available</div></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Code</th><th>Discount</th><th>Expires</th></tr></thead>
          <tbody>${activePromos.map(p=>`<tr>
            <td><span class="promo-tag">${p.code}</span></td>
            <td><strong style="color:var(--green)">−${p.discount}%</strong></td>
            <td style="font-size:11px;color:var(--t2)">${p.expiry}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  pc.appendChild(vpr);
}

// ═══════════════════════════════════════════════════════════════
// DRIVER VIEWS
// ═══════════════════════════════════════════════════════════════
function buildDriverViews(pc) {
  const d = DB.drivers[DRIVER_ID-1];
  const v = DB.vehicles.find(x=>x.did===DRIVER_ID);
  const myRides = DB.rides.filter(r=>r.did===DRIVER_ID && r.status==='Completed');
  const myRatings = DB.ratings.filter(r=>{ const ride=DB.rides[r.rid-1]; return ride&&ride.did===DRIVER_ID; });
  const earnings = myRides.reduce((s,r)=>s+r.fare,0);

  // ── MY TRIPS ─────────────────────────────────────────────────
  const vt = view('my-trips');
  vt.innerHTML = `
    ${welcomeCard('🚗', d.first+' '+d.last, `Driver ID ${d.id} · ${d.lic} · Status: ${d.status}. Your status is auto-managed by triggers BR-6 and BR-7.`)}
    <div class="kpi-row">
      <div class="kpi"><div class="kpi-icon" style="background:var(--green-bg)">🏁</div><div><div class="kpi-val" style="color:var(--green)">${myRides.length}</div><div class="kpi-label">Completed Rides</div></div></div>
      <div class="kpi"><div class="kpi-icon" style="background:var(--green-bg)">💰</div><div><div class="kpi-val" style="color:var(--green)">$${earnings.toFixed(2)}</div><div class="kpi-label">Total Earnings</div></div></div>
      <div class="kpi"><div class="kpi-icon" style="background:var(--yellow-bg)">⭐</div><div><div class="kpi-val" style="color:var(--yellow)">${d.rating}</div><div class="kpi-label">My Rating</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">My Completed Trips</div><div class="card-meta">${myRides.length} rides · sp_driver_earnings</div></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Ride</th><th>Passenger</th><th>From</th><th>To</th><th>Date</th><th>Duration</th><th>Fare</th><th>Status</th></tr></thead>
          <tbody>${myRides.map(r=>`<tr>
            <td>${rid2str(r.id)}</td>
            <td>${uid2name(r.uid)}</td>
            <td style="font-size:11px">${lid2name(r.slid)}</td>
            <td style="font-size:11px">${lid2name(r.elid)}</td>
            <td style="font-size:11px;color:var(--t2)">${r.start.slice(0,10)}</td>
            <td>${durStr(r.dur)}</td>
            <td>${fare(r.fare)}</td>
            <td>${badge(r.status)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  pc.appendChild(vt);

  // ── EARNINGS ─────────────────────────────────────────────────
  const ve = view('earnings');
  const monthly = {};
  myRides.forEach(r=>{ const m=r.start.slice(0,7); monthly[m]=(monthly[m]||0)+r.fare; });
  ve.innerHTML = `
    <div class="view-header">
      <div class="view-title">My Earnings</div>
      <div class="view-desc">Revenue breakdown from <code>sp_driver_earnings</code>. Only completed rides count toward earnings.</div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Earnings by Month</div><div class="card-meta">2024</div></div>
        <div class="card-body">
          <div class="bar-chart">${Object.entries(monthly).sort().map(([m,v])=>{
            const max=Math.max(...Object.values(monthly));
            return `<div class="bar-row"><div class="bar-label">${m}</div><div class="bar-track"><div class="bar-fill" style="width:${(v/max*100).toFixed(0)}%;background:var(--green)"></div></div><div class="bar-val">$${v.toFixed(2)}</div></div>`;
          }).join('')}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Summary</div><div class="card-meta">All time</div></div>
        <div class="card-body">
          ${kpiMini([
            {icon:'💰',label:'Total Earned',val:'$'+earnings.toFixed(2),c:'green'},
            {icon:'🏁',label:'Rides Done',val:myRides.length,c:'blue'},
            {icon:'📊',label:'Avg per Ride',val:'$'+(earnings/Math.max(myRides.length,1)).toFixed(2),c:'yellow'},
          ])}
        </div>
      </div>
    </div>`;
  pc.appendChild(ve);

  // ── MY RATINGS ───────────────────────────────────────────────
  const vrr = view('my-ratings');
  vrr.innerHTML = `
    <div class="view-header">
      <div class="view-title">My Ratings</div>
      <div class="view-desc">Passenger feedback from the <code>ratings</code> table. Your average rating is auto-recalculated after each new rating by <strong>trg_update_driver_rating</strong> (BR-4).</div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Rating History</div><div class="card-meta">${myRatings.length} ratings · Current avg: ${d.rating}</div></div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Ride</th><th>You got ★</th><th>You gave ★</th><th>Comment</th></tr></thead>
          <tbody>${myRatings.map(r=>`<tr>
            <td>${rid2str(r.rid)}</td>
            <td>${stars(r.dr)}</td>
            <td>${r.ur?stars(r.ur):'<span class="muted">NULL</span>'}</td>
            <td style="font-size:11px;color:var(--t2)">${r.comment||'<span class="muted">—</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="tbl-footer">UNIQUE(RideID) — one rating per ride · DriverRating NOT NULL</div>
    </div>`;
  pc.appendChild(vrr);

  // ── MY VEHICLE ───────────────────────────────────────────────
  const vv = view('my-vehicle');
  vv.innerHTML = `
    <div class="view-header">
      <div class="view-title">My Vehicle</div>
      <div class="view-desc">Your registered vehicle from the <code>vehicles</code> table. Every driver has exactly one vehicle. The FK to <code>drivers</code> uses <code>ON DELETE CASCADE</code>.</div>
    </div>
    <div class="card">
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
          ${v?[
            ['Vehicle ID', v.did],['Plate Number', v.plate],
            ['Model', v.model],['Year', v.year],
            ['Capacity', v.cap+' passengers'],['Driver ID', d.id],
          ].map(([k,val])=>`<div><div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${k}</div><div style="font-size:16px;font-weight:700;color:var(--t1)">${val}</div></div>`).join(''):'No vehicle found'}
        </div>
      </div>
    </div>`;
  pc.appendChild(vv);
}

// ═══════════════════════════════════════════════════════════════
// ANALYST VIEWS
// ═══════════════════════════════════════════════════════════════
function buildAnalystViews(pc) {
  const s = DB.stats;

  // ── OVERVIEW ─────────────────────────────────────────────────
  const vo = view('overview');
  const cityMax = Math.max(...Object.values(s.cities));
  const cityColors = {'New York':'#6366f1','Chicago':'#06b6d4','Los Angeles':'#10b981','San Francisco':'#f59e0b'};
  vo.innerHTML = `
    <div class="view-header">
      <div class="view-title">Analytics Overview</div>
      <div class="view-desc">Read-only view of all RideSharingDB data. You are logged in as <code>ride_report</code> — SELECT only, no writes.</div>
    </div>
    <div class="restrict-note">📊 ride_report role · SELECT only · No INSERT, UPDATE or DELETE access</div>
    <div class="stats-grid">
      ${statCard('Total Revenue','$'+s.total_rev.toFixed(2),'From 40 completed rides','#10b981','#10b981','💰')}
      ${statCard('Total Rides','42','40 completed · 1 pending · 1 cancelled','#6366f1','#6366f1','🚕')}
      ${statCard('Drivers','42',`${s.dstat.Available} available · ${s.dstat.Busy} busy`,'#f59e0b','#f59e0b','🚗')}
      ${statCard('Avg Fare','$'+s.avg_fare,'Avg duration '+s.avg_dur+' min','#06b6d4','#06b6d4','📊')}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Revenue by City</div><div class="card-meta">vw_revenue_by_city</div></div>
        <div class="card-body">
          <div class="bar-chart">${Object.entries(s.cities).sort((a,b)=>b[1]-a[1]).map(([city,rev])=>`
            <div class="bar-row">
              <div class="bar-label">${city}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(rev/cityMax*100).toFixed(1)}%;background:${cityColors[city]||'#6366f1'}"></div></div>
              <div class="bar-val">$${rev.toFixed(2)}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Payment Methods</div><div class="card-meta">42 transactions</div></div>
        <div class="card-body">
          <div class="bar-chart">${Object.entries(s.methods).sort((a,b)=>b[1]-a[1]).map(([m,c])=>`
            <div class="bar-row">
              <div class="bar-label">${m}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(c/15*100).toFixed(0)}%;background:var(--accent)"></div></div>
              <div class="bar-val">${c} txn</div>
            </div>`).join('')}
          </div>
          <div class="chart-divider"></div>
          <div class="bar-chart">${[['Paid',40,'#10b981'],['Pending',1,'#f59e0b'],['Failed',1,'#ef4444']].map(([st,c,col])=>`
            <div class="bar-row">
              <div class="bar-label">${st}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(c/42*100).toFixed(0)}%;background:${col}"></div></div>
              <div class="bar-val">${c}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  pc.appendChild(vo);

  // ── ALL RIDES ────────────────────────────────────────────────
  const vrd = view('all-rides');
  vrd.innerHTML = `
    <div class="view-header">
      <div class="view-title">All Rides</div>
      <div class="view-desc">Full dataset from <code>vw_ride_details</code> — JOINs users, drivers, vehicles, locations (×2), and promocodes.</div>
    </div>
    ${ridesTable(DB.rides)}`;
  pc.appendChild(vrd);

  // ── ALL DRIVERS ──────────────────────────────────────────────
  const vd = view('all-drivers');
  vd.innerHTML = `
    <div class="view-header">
      <div class="view-title">Driver Summary</div>
      <div class="view-desc">All 42 drivers from <code>vw_driver_summary</code>. Rating auto-maintained by <strong>trg_update_driver_rating</strong> (BR-4).</div>
    </div>
    ${driversTable(DB.drivers)}`;
  pc.appendChild(vd);

  // ── REVENUE ──────────────────────────────────────────────────
  const vrv = view('revenue');
  const cityData = Object.entries(s.cities).sort((a,b)=>b[1]-a[1]);
  vrv.innerHTML = `
    <div class="view-header">
      <div class="view-title">Revenue Analytics</div>
      <div class="view-desc">City and driver revenue from <code>vw_revenue_by_city</code> and <code>vw_driver_summary</code>.</div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Revenue by City</div><div class="card-meta">vw_revenue_by_city</div></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>City</th><th>Rides</th><th>Total Revenue</th><th>Avg Fare</th></tr></thead>
            <tbody>${cityData.map(([city,rev])=>{
              const cityRides=DB.rides.filter(r=>r.status==='Completed'&&DB.locations[r.slid-1]?.city===city);
              return `<tr>
                <td><strong>${city}</strong></td>
                <td>${cityRides.length}</td>
                <td>${fare(rev)}</td>
                <td>${fare(rev/Math.max(cityRides.length,1))}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Top 5 Earning Drivers</div><div class="card-meta">Q1 2024</div></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>#</th><th>Driver</th><th>Rating</th><th>Rides</th><th>Earned</th></tr></thead>
            <tbody>${s.top5.map((d,i)=>`<tr>
              <td style="font-weight:800;color:${i===0?'var(--accent)':'var(--t3)'}">${String(i+1).padStart(2,'0')}</td>
              <td><strong>${d.name}</strong></td>
              <td>${stars(Math.round(d.rating))} <span style="font-size:10px;color:var(--t3)">${d.rating}</span></td>
              <td>${d.rides}</td>
              <td>${fare(d.earn)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  pc.appendChild(vrv);

  // ── ALL USERS ────────────────────────────────────────────────
  const vu = view('all-users');
  vu.innerHTML = `
    <div class="view-header">
      <div class="view-title">Users</div>
      <div class="view-desc">All 42 registered passengers from the <code>users</code> table. You can view all data but cannot modify it.</div>
    </div>
    ${usersTable(DB.users)}`;
  pc.appendChild(vu);
}

// ═══════════════════════════════════════════════════════════════
// DBA VIEWS
// ═══════════════════════════════════════════════════════════════
function buildDBAViews(pc) {
  const s = DB.stats;

  // ── DASHBOARD ────────────────────────────────────────────────
  const vd = view('dashboard');
  const cityMax = Math.max(...Object.values(s.cities));
  const cityColors=['#6366f1','#06b6d4','#10b981','#f59e0b'];
  vd.innerHTML = `
    <div class="view-header">
      <div class="view-title">DBA Dashboard</div>
      <div class="view-desc">Full system overview. You are <code>ride_dba</code> with <code>db_owner</code> access — complete control over all objects and data.</div>
    </div>
    <div class="stats-grid">
      ${statCard('Total Revenue','$'+s.total_rev.toFixed(2),'40 completed rides · Jan–Feb 2024','#10b981','#10b981','💰')}
      ${statCard('Total Rides','42','40 completed · 1 pending · 1 cancelled','#6366f1','#6366f1','🚕')}
      ${statCard('Active Drivers','42',`${s.dstat.Available} available · ${s.dstat.Busy} busy · ${s.dstat.Offline} offline`,'#f59e0b','#f59e0b','🚗')}
      ${statCard('Avg Fare','$'+s.avg_fare,'Avg duration '+s.avg_dur+' min · 4 cities','#06b6d4','#06b6d4','📊')}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Revenue by City</div><div class="card-meta">vw_revenue_by_city · 4 cities</div></div>
        <div class="card-body"><div class="bar-chart">${Object.entries(s.cities).sort((a,b)=>b[1]-a[1]).map(([c,r],i)=>`
          <div class="bar-row"><div class="bar-label">${c}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(r/cityMax*100).toFixed(1)}%;background:${cityColors[i]}"></div></div>
          <div class="bar-val">$${r.toFixed(2)}</div></div>`).join('')}
        </div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Top 5 Drivers</div><div class="card-meta">by earnings · Q1 2024</div></div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>#</th><th>Name</th><th>Rating</th><th>Rides</th><th>Earned</th></tr></thead>
          <tbody>${s.top5.map((d,i)=>`<tr>
            <td style="font-weight:800;color:${i===0?'var(--accent)':'var(--t3)'}">${String(i+1).padStart(2,'0')}</td>
            <td><strong>${d.name}</strong><div style="font-size:10px;color:var(--t3)">${d.lic}</div></td>
            <td>${stars(Math.round(d.rating))} <small style="color:var(--t3)">${d.rating}</small></td>
            <td>${d.rides}</td><td>${fare(d.earn)}</td>
          </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Payment Breakdown</div><div class="card-meta">42 transactions</div></div>
        <div class="card-body"><div class="bar-chart">${Object.entries(s.methods).sort((a,b)=>b[1]-a[1]).map(([m,c])=>`
          <div class="bar-row"><div class="bar-label">${m}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(c/15*100).toFixed(0)}%;background:var(--accent)"></div></div>
          <div class="bar-val">${c} txn</div></div>`).join('')}
          <div class="chart-divider"></div>
          ${[['Paid',40,'#10b981'],['Pending',1,'#f59e0b'],['Failed',1,'#ef4444']].map(([st,c,col])=>`
          <div class="bar-row"><div class="bar-label">${st}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(c/42*100).toFixed(0)}%;background:${col}"></div></div>
          <div class="bar-val">${c}</div></div>`).join('')}
        </div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Driver Status</div><div class="card-meta">triggers BR-6 &amp; BR-7</div></div>
        <div class="card-body"><div class="bar-chart">${[['Available',s.dstat.Available,'#10b981'],['Busy',s.dstat.Busy,'#f59e0b'],['Offline',s.dstat.Offline,'#6b7280']].map(([st,c,col])=>`
          <div class="bar-row"><div class="bar-label">${st}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(c/42*100).toFixed(0)}%;background:${col}"></div></div>
          <div class="bar-val">${c} drivers</div></div>`).join('')}
        </div></div>
      </div>
    </div>`;
  pc.appendChild(vd);

  // ── RIDES ALL ────────────────────────────────────────────────
  const vra = view('rides-all');
  vra.innerHTML = `<div class="view-header"><div class="view-title">All Rides</div><div class="view-desc">Complete dataset from <code>vw_ride_details</code>. As DBA you have full access including INSERT, UPDATE (but never deleting completed rides — BR-2).</div></div>${ridesTable(DB.rides)}`;
  pc.appendChild(vra);

  // ── DRIVERS ALL ──────────────────────────────────────────────
  const vda2 = view('drivers-all');
  vda2.innerHTML = `<div class="view-header"><div class="view-title">All Drivers</div><div class="view-desc">Full driver roster from <code>vw_driver_summary</code>.</div></div>${driversTable(DB.drivers)}`;
  pc.appendChild(vda2);

  // ── USERS ALL ────────────────────────────────────────────────
  const vua = view('users-all');
  vua.innerHTML = `<div class="view-header"><div class="view-title">All Users</div><div class="view-desc">All 42 registered passengers from the <code>users</code> table.</div></div>${usersTable(DB.users)}`;
  pc.appendChild(vua);

  // ── PAYMENTS ALL ─────────────────────────────────────────────
  const vpa = view('payments-all');
  vpa.innerHTML = `
    <div class="view-header"><div class="view-title">All Payments</div><div class="view-desc">Full payment ledger from <code>vw_payment_overview</code>. <strong>trg_validate_payment_ride</strong> (BR-3) blocks payments on cancelled rides.</div></div>
    <div class="card">
      <div class="card-header"><div class="card-title">Payment Ledger — vw_payment_overview</div><div class="card-meta">42 records</div></div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Pay ID</th><th>Ride</th><th>Passenger</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${DB.payments.map(p=>{
          const ride=DB.rides[p.rid-1];
          return `<tr>
            <td>${rid2str(p.pid)}</td>
            <td>${rid2str(p.rid)}</td>
            <td>${ride?uid2name(ride.uid):'—'}</td>
            <td>${fare(p.amount)}</td>
            <td>${badge(p.method)}</td>
            <td style="font-size:11px;color:var(--t2)">${p.date}</td>
            <td>${badge(p.status)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      <div class="tbl-footer">trg_validate_payment_ride (BR-3) · INSTEAD OF INSERT blocks payment on cancelled rides</div>
    </div>`;
  pc.appendChild(vpa);

  // ── SCHEMA ───────────────────────────────────────────────────
  const vs = view('schema');
  vs.innerHTML = `
    <div class="view-header">
      <div class="view-title">Database Schema</div>
      <div class="view-desc">8 tables · 10 foreign keys · 12 CHECK constraints · 6 UNIQUE constraints · 8 DEFAULT values · Full 3NF normalisation · 15 non-clustered indexes</div>
    </div>
    <div class="schema-grid" id="schemaGrid"></div>`;
  pc.appendChild(vs);
  buildSchema();

  // ── TRIGGERS ─────────────────────────────────────────────────
  const vtg = view('triggers');
  vtg.innerHTML = `
    <div class="view-header">
      <div class="view-title">Triggers</div>
      <div class="view-desc">7 triggers enforce business rules at the SQL Server engine level — independent of application code.</div>
    </div>
    <div class="grid-2" id="triggersGrid"></div>`;
  pc.appendChild(vtg);
  buildTriggers();

  // ── PROCEDURES ───────────────────────────────────────────────
  const vpro = view('procedures');
  vpro.innerHTML = `
    <div class="view-header">
      <div class="view-title">Stored Procedures</div>
      <div class="view-desc">8 parameterised procedures. Each uses <code>SET NOCOUNT ON</code> and proper T-SQL error handling.</div>
    </div>
    <div class="proc-grid" id="procGrid"></div>`;
  pc.appendChild(vpro);
  buildProcedures();

  // ── DCL ──────────────────────────────────────────────────────
  const vdcl = view('dcl');
  vdcl.innerHTML = `
    <div class="view-header">
      <div class="view-title">Access Control (DCL)</div>
      <div class="view-desc">3 roles created with <code>CREATE LOGIN</code>, <code>CREATE USER</code>, <code>GRANT</code>, <code>DENY</code>, and <code>ALTER ROLE</code>. Principle of least privilege.</div>
    </div>
    <div class="dcl-grid" id="dclGrid"></div>
    <div class="card" style="margin-top:14px">
      <div class="card-header"><div class="card-title">Verification Query</div><div class="card-meta">Run in SSMS 22</div></div>
      <div class="card-body">
        <div class="code-block"><span class="kw">SELECT</span>
    dp.name           <span class="kw">AS</span> LoginName,
    p.permission_name <span class="kw">AS</span> Permission,
    p.state_desc      <span class="kw">AS</span> State
<span class="kw">FROM</span>   sys.database_permissions p
<span class="kw">JOIN</span>   sys.database_principals  dp
    <span class="kw">ON</span> p.grantee_principal_id = dp.principal_id
<span class="kw">WHERE</span>  dp.name <span class="kw">IN</span> (<span class="str">'ride_app'</span>, <span class="str">'ride_report'</span>, <span class="str">'ride_dba'</span>)
<span class="kw">ORDER</span> <span class="kw">BY</span> dp.name, p.permission_name;</div>
      </div>
    </div>`;
  pc.appendChild(vdcl);
  buildDCL();
}

// ─── SHARED TABLE BUILDERS ─────────────────────────────────────
function ridesTable(rides) {
  return `<div class="card">
    <div class="card-header"><div class="card-title">All Rides — vw_ride_details</div><div class="card-meta">${rides.length} records</div></div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>ID</th><th>Passenger</th><th>Driver</th><th>From</th><th>To</th><th>City</th><th>Date</th><th>Dur</th><th>Fare</th><th>Promo</th><th>Status</th></tr></thead>
      <tbody>${rides.map(r=>`<tr>
        <td>${rid2str(r.id)}</td>
        <td style="white-space:nowrap">${uid2name(r.uid)}</td>
        <td style="white-space:nowrap">${did2name(r.did)}</td>
        <td style="font-size:11px">${lid2name(r.slid)}</td>
        <td style="font-size:11px">${lid2name(r.elid)}</td>
        <td style="font-size:11px;color:var(--t2)">${lid2city(r.slid)}</td>
        <td style="font-size:11px;color:var(--t2)">${r.start.slice(0,10)}</td>
        <td>${durStr(r.dur)}</td>
        <td>${r.fare>0?fare(r.fare):'<span class="muted">—</span>'}</td>
        <td>${promoTag(r.promo)}</td>
        <td>${badge(r.status)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <div class="tbl-footer">RideDuration auto-set by trg_calc_duration (BR-5) · PromoID nullable FK</div>
  </div>`;
}

function driversTable(drivers) {
  return `<div class="card">
    <div class="card-header"><div class="card-title">Driver Roster — vw_driver_summary</div><div class="card-meta">${drivers.length} drivers</div></div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>ID</th><th>Name</th><th>Licence</th><th>Vehicle</th><th>Rating</th><th>Status</th></tr></thead>
      <tbody>${drivers.map(d=>{
        const v=DB.vehicles.find(x=>x.did===d.id);
        return `<tr>
          <td class="id">${d.id}</td>
          <td><strong>${d.first} ${d.last}</strong></td>
          <td>${mono(d.lic)}</td>
          <td style="font-size:11px">${v?v.model+' \''+String(v.year).slice(2):'—'}</td>
          <td>${stars(Math.round(d.rating))} <span style="font-size:10px;color:var(--t3)">${d.rating}</span></td>
          <td>${badge(d.status)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div class="tbl-footer">Rating auto-recalculated by trg_update_driver_rating (BR-4) · Status by BR-6 &amp; BR-7</div>
  </div>`;
}

function usersTable(users) {
  return `<div class="card">
    <div class="card-header"><div class="card-title">User Registry — users table</div><div class="card-meta">${users.length} users</div></div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead>
      <tbody>${users.map(u=>`<tr>
        <td class="id">${u.id}</td>
        <td><strong>${u.first} ${u.last}</strong></td>
        <td style="font-size:11px;color:var(--t2)">${u.email}</td>
        <td style="font-size:11px">${u.phone||'<span class="muted">NULL</span>'}</td>
        <td style="font-size:11px;color:var(--t2)">${u.reg}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <div class="tbl-footer">Email UNIQUE + CHECK(LIKE '%@%.%') · Phone nullable · RegistrationDate DEFAULT GETDATE()</div>
  </div>`;
}

// ─── SCHEMA ────────────────────────────────────────────────────
function buildSchema() {
  const tables=[
    {name:'users',rows:42,cols:[{n:'UserID',t:'pk'},{n:'FirstName',v:'varchar(50)'},{n:'LastName',v:'varchar(50)'},{n:'Email',v:'UQ · CHK'},{n:'Phone',v:'nullable'},{n:'RegistrationDate',v:'DEFAULT NOW'}]},
    {name:'drivers',rows:42,cols:[{n:'DriverID',t:'pk'},{n:'FirstName',v:'varchar(50)'},{n:'LicenseNumber',v:'UNIQUE'},{n:'Rating',v:'0–5 DEFAULT 5.0'},{n:'Status',v:'enum CHK'}]},
    {name:'vehicles',rows:42,cols:[{n:'VehicleID',t:'pk'},{n:'DriverID',t:'fk',v:'FK→drivers CASCADE'},{n:'PlateNumber',v:'UNIQUE'},{n:'Model',v:'varchar(50)'},{n:'Year',v:'1990–2030'},{n:'Capacity',v:'1–20 CHK'}]},
    {name:'rides',rows:42,cols:[{n:'RideID',t:'pk'},{n:'UserID',t:'fk',v:'FK→users CASCADE'},{n:'DriverID',t:'fk',v:'FK→drivers'},{n:'VehicleID',t:'fk',v:'FK→vehicles'},{n:'StartLocationID',t:'fk',v:'FK→locations'},{n:'EndLocationID',t:'fk',v:'FK→locations'},{n:'Fare',v:'≥0 CHK'},{n:'Status',v:'enum CHK'},{n:'RideDuration',v:'derived·trigger'},{n:'PromoID',v:'FK NULL'}]},
    {name:'payments',rows:42,cols:[{n:'PaymentID',t:'pk'},{n:'RideID',t:'fk',v:'FK→rides CASCADE'},{n:'Amount',v:'≥0 CHK'},{n:'Method',v:'Cash/Card/Online'},{n:'PaymentDate',v:'DEFAULT NOW'},{n:'Status',v:'Paid/Pending/Failed'}]},
    {name:'ratings',rows:40,cols:[{n:'RatingID',t:'pk'},{n:'RideID',t:'fk',v:'FK+UQ→rides'},{n:'DriverRating',v:'1–5 NOT NULL'},{n:'UserRating',v:'1–5 nullable'},{n:'Comment',v:'varchar(500) NULL'}]},
    {name:'locations',rows:42,cols:[{n:'LocationID',t:'pk'},{n:'Name',v:'varchar(100)'},{n:'City',v:'varchar(50)'}]},
    {name:'promocodes',rows:42,cols:[{n:'PromoID',t:'pk'},{n:'Code',v:'UNIQUE'},{n:'Discount',v:'0–100% CHK'},{n:'ExpiryDate',v:'datetime'}]},
  ];
  $('schemaGrid').innerHTML=tables.map(t=>`
    <div class="schema-card">
      <div class="schema-card-header"><span class="schema-tname">${t.name}</span><span class="schema-rows">${t.rows} rows</span></div>
      <div class="schema-cols">${t.cols.map(c=>`
        <div class="schema-col">
          <span class="col-name">${c.n}</span>
          ${c.t==='pk'?'<span class="col-pk">PK</span>':c.t==='fk'?`<span class="col-fk">${c.v}</span>`:`<span class="col-type">${c.v||''}</span>`}
        </div>`).join('')}
      </div>
    </div>`).join('');
}

// ─── TRIGGERS ──────────────────────────────────────────────────
function buildTriggers() {
  const after=[
    {name:'trg_calc_duration',       icon:'⏱',br:'BR-5',table:'rides',   cls:'ti-after',   brCls:'br-after',   desc:'Auto-sets RideDuration = DATEDIFF(MINUTE, StartTime, EndTime) when EndTime is written. Keeps derived column accurate.'},
    {name:'trg_update_driver_rating',icon:'⭐',br:'BR-4',table:'ratings', cls:'ti-after',   brCls:'br-after',   desc:'Recalculates driver.Rating = ROUND(AVG(DriverRating),2) across all rides after every new rating INSERT.'},
    {name:'trg_driver_busy_on_ride', icon:'🚗',br:'BR-6',table:'rides',   cls:'ti-after',   brCls:'br-after',   desc:'Sets driver.Status = "Busy" automatically when a new Pending ride is inserted.'},
    {name:'trg_driver_available_on_complete',icon:'✅',br:'BR-7',table:'rides',cls:'ti-after',brCls:'br-after',desc:'Resets driver.Status = "Available" when a ride transitions Pending → Completed or Cancelled.'},
    {name:'trg_prevent_delete_completed',icon:'🛡',br:'BR-2',table:'rides',cls:'ti-danger', brCls:'br-after',   desc:'RAISERROR + ROLLBACK TRANSACTION if any Completed ride appears in the deleted set. Protects audit trail.'},
  ];
  const instead=[
    {name:'trg_no_concurrent_rides',   icon:'🚫',br:'BR-1',table:'rides',   cls:'ti-instead', brCls:'br-instead', desc:'Blocks INSERT entirely if the user already has a Pending ride. Fires before storage engine — RAISERROR + RETURN.'},
    {name:'trg_validate_payment_ride', icon:'💳',br:'BR-3',table:'payments',cls:'ti-instead', brCls:'br-instead', desc:'Blocks payment INSERT if the associated ride.Status = "Cancelled". Prevents financial records on void rides.'},
  ];
  function trigItem(t){return `<div class="trigger-item">
    <div class="trigger-icon ${t.cls}">${t.icon}</div>
    <div style="flex:1">
      <div class="trigger-name">${t.name}</div>
      <div class="trigger-on">ON ${t.table}</div>
      <div class="trigger-desc">${t.desc}</div>
    </div>
    <span class="trigger-br ${t.brCls}">${t.br}</span>
  </div>`;}
  $('triggersGrid').innerHTML=`
    <div>
      <div class="trigger-group-label tgl-after">AFTER Triggers (5)</div>
      <div class="trigger-list">${after.map(trigItem).join('')}</div>
    </div>
    <div>
      <div class="trigger-group-label tgl-instead">INSTEAD OF Triggers (2)</div>
      <div class="trigger-list">${instead.map(trigItem).join('')}</div>
      <div class="why-box"><strong>Why INSTEAD OF?</strong><br>
      AFTER triggers fire after the row is already written — they cannot prevent the INSERT. INSTEAD OF fires before the storage engine writes anything, allowing clean rejection via RAISERROR + RETURN with zero side effects.</div>
    </div>`;
}

// ─── PROCEDURES ────────────────────────────────────────────────
function buildProcedures() {
  const procs=[
    {name:'sp_get_user_rides',     desc:'Returns all rides for a given user via vw_ride_details — all IDs already resolved to names, no manual JOINs.',params:[{l:'@UserID INT'}]},
    {name:'sp_available_drivers',  desc:'Returns available drivers with vehicle details. Optionally filtered by city — ready for real-time dispatch.',params:[{l:'@City VARCHAR(50) = NULL'}]},
    {name:'sp_complete_ride',      desc:'Marks a ride Completed with EndTime and Fare. Fires trg_calc_duration (BR-5) and trg_driver_available (BR-7).',params:[{l:'@RideID INT'},{l:'@EndTime DATETIME'},{l:'@Fare FLOAT'}]},
    {name:'sp_apply_promo',        desc:'Validates promo expiry, computes discounted fare = Fare × (1 − Discount/100), updates ride.Fare and PromoID atomically.',params:[{l:'@RideID INT'},{l:'@PromoID INT'},{l:'@NewFare FLOAT',o:true}]},
    {name:'sp_monthly_revenue',    desc:'Returns TotalRides, TotalRevenue, AvgFare, MinFare, MaxFare for any given year + month.',params:[{l:'@Year INT'},{l:'@Month INT'}]},
    {name:'sp_driver_earnings',    desc:'Total completed rides and earnings for a specific driver within a start/end date range.',params:[{l:'@DriverID INT'},{l:'@StartDate DATE'},{l:'@EndDate DATE'}]},
    {name:'sp_register_user',      desc:'Inserts a new user and returns the auto-generated IDENTITY UserID via SCOPE_IDENTITY() — safe for concurrent inserts.',params:[{l:'@First VARCHAR'},{l:'@Last VARCHAR'},{l:'@Email VARCHAR'},{l:'@Phone VARCHAR'}]},
    {name:'sp_cancel_ride',        desc:'Cancels a Pending ride (Status → Cancelled), triggering trg_driver_available (BR-7). Returns @@ROWCOUNT — 0 if not found.',params:[{l:'@RideID INT'},{l:'RowsUpdated',o:true}]},
  ];
  $('procGrid').innerHTML=procs.map(p=>`
    <div class="proc-card">
      <div class="proc-name">${p.name}</div>
      <div class="proc-desc">${p.desc}</div>
      <div class="proc-params">${p.params.map(pm=>`<span class="proc-param${pm.o?' out':''}">${pm.o?'⟵ ':''}${pm.l}</span>`).join('')}</div>
    </div>`).join('');
}

// ─── DCL ───────────────────────────────────────────────────────
function buildDCL() {
  const roles=[
    {cls:'app',   login:'ride_app',    role:'Application User', pw:'App@Secure123!',  color:'#6366f1',
     perms:[{y:1,l:'SELECT — read all data'},{y:1,l:'INSERT — add records'},{y:1,l:'UPDATE — modify records'},{y:0,l:'DELETE — explicitly DENIED'}],
     purpose:'Backend API layer. Cannot delete records — prevents accidental mass deletions or SQL injection damage.'},
    {cls:'report',login:'ride_report', role:'Read-Only Analyst', pw:'Report@Secure123!',color:'#06b6d4',
     perms:[{y:1,l:'SELECT — full read access'},{y:0,l:'INSERT — not granted'},{y:0,l:'UPDATE — not granted'},{y:0,l:'DELETE — not granted'}],
     purpose:'BI dashboards, analytics tools, data exports. Cannot modify anything — true read-only isolation.'},
    {cls:'dba',   login:'ride_dba',    role:'DBA / db_owner', pw:'DBA@Secure123!',   color:'#10b981',
     perms:[{y:1,l:'SELECT — full read'},{y:1,l:'INSERT — full write'},{y:1,l:'UPDATE — full modify'},{y:1,l:'DELETE — full delete'}],
     purpose:'db_owner — full database control. Schema changes, maintenance, index rebuilds, and deployment scripts.'},
  ];
  $('dclGrid').innerHTML=roles.map(r=>`
    <div class="dcl-card ${r.cls}">
      <div class="dcl-card-accent" style="background:${r.color}"></div>
      <div class="dcl-login" style="color:${r.color}">${r.login}</div>
      <div class="dcl-role-label">${r.role}</div>
      <div class="dcl-pw">${r.pw}</div>
      <div class="dcl-perms">${r.perms.map(p=>`
        <div class="dcl-perm">
          <span class="dcl-perm-icon">${p.y?'✅':'❌'}</span>
          <span class="dcl-perm-label">${p.l}</span>
        </div>`).join('')}
      </div>
      <div class="dcl-purpose">${r.purpose}</div>
    </div>`).join('');
}

// ─── COMPONENT HELPERS ─────────────────────────────────────────
function view(id) {
  const d = document.createElement('div');
  d.className = 'view';
  d.id = 'view-'+id;
  return d;
}
function welcomeCard(icon, name, sub) {
  return `<div class="welcome-card">
    <div class="welcome-card-bg">${icon}</div>
    <div class="welcome-tag">Welcome back</div>
    <div class="welcome-name">${name}</div>
    <div class="welcome-sub">${sub}</div>
  </div>`;
}
function statCard(label, value, sub, valColor, barColor, icon) {
  return `<div class="stat-card">
    <div class="stat-card-top" style="background:${barColor}"></div>
    <div class="stat-card-shine"></div>
    <div class="sc-label">${label}</div>
    <div class="sc-value" style="color:${valColor}">${value}</div>
    <div class="sc-sub">${sub}</div>
    <div class="sc-icon">${icon}</div>
  </div>`;
}
function kpiMini(items) {
  return items.map(({icon,label,val,c})=>`
    <div class="kpi" style="margin-bottom:10px">
      <div class="kpi-icon" style="background:var(--${c}-bg)">${icon}</div>
      <div><div class="kpi-val" style="color:var(--${c})">${val}</div><div class="kpi-label">${label}</div></div>
    </div>`).join('');
}

// ─── INIT & ANIMATE BARS ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Animate bars whenever a view becomes active
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.target.classList.contains('active') && m.target.classList.contains('view')) {
        setTimeout(() => {
          m.target.querySelectorAll('.bar-fill').forEach(b => {
            const w = b.style.width;
            b.style.width = '0';
            requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = w; }));
          });
        }, 50);
      }
    });
  });
  document.querySelectorAll('.view').forEach(v => observer.observe(v, {attributes:true, attributeFilter:['class']}));
});
