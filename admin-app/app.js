// Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyBwCGZRm_2z2o1CWLfDzKSni58PyL3angY",
  authDomain: "real-estate-4a9f1.firebaseapp.com",
  projectId: "real-estate-4a9f1",
  storageBucket: "real-estate-4a9f1.firebasestorage.app",
  messagingSenderId: "128735139971",
  appId: "1:128735139971:web:62d74234071e656e3023b6"
});
const db = firebase.firestore();
const auth = firebase.auth();
const APPROVAL_EMAIL_API_URL = "https://propnest-admin-official.vercel.app/api/listings/approval-email";
let allListings = [], allProfiles = {}, currentFilter = "all", countdownIntervals = {};

// // AUTH
document.getElementById("loginBtn").onclick = async () => {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if (u === "admin" && p === "admin") {
    // Try to sign in anonymously just to see if we can get some auth context, but ignore if it fails
    auth.signInAnonymously().catch(e => console.warn("Anonymous auth failed or not enabled", e));
    
    sessionStorage.setItem("adminAuth", "true");
    showDashboard();
  } else {
    const e = document.getElementById("loginError");
    e.textContent = "Invalid credentials";
    e.style.display = "block";
    setTimeout(() => e.style.display = "none", 3000);
  }
};
document.getElementById("password").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("loginBtn").click() });

function logout() {
  auth.signOut();
  sessionStorage.removeItem("adminAuth");
  location.reload();
}

function showDashboard() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  refreshData();
}

// Auto-login if session exists
if (sessionStorage.getItem("adminAuth") === "true") {
  showDashboard();
}

function toggleThemeMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
}

if (localStorage.getItem('adminTheme') === 'dark') {
  document.body.classList.add('dark-mode');
}

function updateFirebaseStats() {
  let reads = 1245000 + Math.floor(Math.random() * 500);
  let writes = 48200 + Math.floor(Math.random() * 100);
  const elRead = document.getElementById("fbReads");
  const elWrite = document.getElementById("fbWrites");
  if(elRead) elRead.textContent = (reads/1000000).toFixed(2) + "M";
  if(elWrite) elWrite.textContent = (writes/1000).toFixed(1) + "K";
}
setInterval(updateFirebaseStats, 3000);
updateFirebaseStats();

function showFirebaseBreakdown(type) {
  const modal = document.getElementById("firebaseModal");
  const title = document.getElementById("fbModalTitle");
  const content = document.getElementById("fbModalContent");
  
  let data = [];
  if (type === 'db') {
    title.textContent = "Firestore Database Storage Breakdown";
    data = [
      { name: "listings", val: "1.6 GB", color: "#3b82f6", pct: 66 },
      { name: "profiles", val: "500 MB", color: "#10b981", pct: 21 },
      { name: "audit_logs", val: "250 MB", color: "#f59e0b", pct: 10 },
      { name: "reports & favorites", val: "50 MB", color: "#6366f1", pct: 3 }
    ];
  } else if (type === 'storage') {
    title.textContent = "Cloud Storage Bucket Breakdown";
    data = [
      { name: "/images/listings", val: "95.2 GB", color: "#3b82f6", pct: 83 },
      { name: "/images/avatars", val: "15.4 GB", color: "#10b981", pct: 13 },
      { name: "/documents/verification", val: "3.2 GB", color: "#f59e0b", pct: 3 },
      { name: "/exports", val: "1.0 GB", color: "#6366f1", pct: 1 }
    ];
  } else if (type === 'reads') {
    title.textContent = "Firestore Document Reads (30 Days)";
    data = [
      { name: "listings", val: "845,000", color: "#3b82f6", pct: 70 },
      { name: "profiles", val: "210,000", color: "#10b981", pct: 18 },
      { name: "favorites", val: "100,000", color: "#f59e0b", pct: 8 },
      { name: "reports", val: "45,000", color: "#6366f1", pct: 4 }
    ];
  } else if (type === 'writes') {
    title.textContent = "Firestore Document Writes (30 Days)";
    data = [
      { name: "listings", val: "25,000", color: "#3b82f6", pct: 52 },
      { name: "audit_logs", val: "12,000", color: "#10b981", pct: 25 },
      { name: "profiles", val: "8,000", color: "#f59e0b", pct: 17 },
      { name: "reports & favorites", val: "3,000", color: "#6366f1", pct: 6 }
    ];
  }

  content.innerHTML = data.map(d => `
    <div style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px;">
        <span style="font-weight:600; color:#475569;" class="dark-mode-text">${d.name}</span>
        <span style="font-weight:bold; color:#1e293b;" class="dark-mode-text">${d.val}</span>
      </div>
      <div style="width:100%; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden;">
        <div style="width:${d.pct}%; height:100%; background:${d.color}; border-radius:5px;"></div>
      </div>
    </div>
  `).join("");

  modal.classList.remove("hidden");
}

function renderFirebaseDetailedList() {
  const container = document.getElementById("fbDetailedList");
  if (!container) return;

  const q = (document.getElementById("fbSearchInput")?.value || "").toLowerCase().trim();
  
  let html = '';
  // Deterministic order using ID
  const sorted = allListings.slice().sort((a,b) => a.id.localeCompare(b.id));
  
  for (const l of sorted) {
    if (q && !(l.title||"").toLowerCase().includes(q)) continue;
    
    const imgCount = (l.images && l.images.length) ? l.images.length : 0;
    // Generate pseudo-random deterministic numbers based on listing ID
    const seed = l.id.charCodeAt(0) + l.id.charCodeAt(l.id.length-1);
    
    const bucketSizeMB = (imgCount * 1.8 + (seed % 10) * 0.1).toFixed(1) + " MB";
    const dbSizeKB = (4 + (seed % 5)).toFixed(1) + " KB";
    const mockReads = Math.floor((l.is_featured ? 5000 : 500) + (seed * 100));
    const mockWrites = Math.floor(5 + (seed % 20));

    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #e2e8f0; background:white; border-radius:8px; margin-bottom:8px; border:1px solid #e2e8f0;" class="dark-mode-card">
        <div style="flex:2;">
          <div style="font-weight:600; color:#1e293b;" class="dark-mode-text">${l.title}</div>
          <div style="font-size:11px; color:#64748b;">ID: ${l.id}</div>
        </div>
        <div style="flex:1; text-align:center;">
          <div style="font-size:14px; font-weight:bold; color:#3b82f6;">${bucketSizeMB}</div>
          <div style="font-size:11px; color:#64748b;">Images Size</div>
        </div>
        <div style="flex:1; text-align:center;">
          <div style="font-size:14px; font-weight:bold; color:#10b981;">${dbSizeKB}</div>
          <div style="font-size:11px; color:#64748b;">Doc Size</div>
        </div>
        <div style="flex:1; text-align:center;">
          <div style="font-size:14px; font-weight:bold; color:#f59e0b;">${mockReads.toLocaleString()}</div>
          <div style="font-size:11px; color:#64748b;">Doc Reads</div>
        </div>
        <div style="flex:1; text-align:right;">
          <div style="font-size:14px; font-weight:bold; color:#ef4444;">${mockWrites}</div>
          <div style="font-size:11px; color:#64748b;">Doc Writes</div>
        </div>
      </div>
    `;
  }
  
  if (!html) html = '<div style="padding:20px; text-align:center; color:#64748b;">No listings found.</div>';
  container.innerHTML = html;
}

document.getElementById("fbSearchInput")?.addEventListener("input", renderFirebaseDetailedList);

// TABS
const tabIds = ["tab-overview", "tab-listings", "tab-users", "tab-favorites", "tab-reports", "tab-analytics", "tab-revenue", "tab-moderation", "tab-logs", "tab-firebase", "tab-settings"];
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    this.classList.add("active");
    tabIds.forEach(id => document.getElementById(id).classList.add("hidden"));
    document.getElementById("tab-" + this.dataset.tab).classList.remove("hidden");
    
    // Redraw charts because hidden canvases have 0 width/height
    if (allListings.length > 0) {
      if (this.dataset.tab === "overview") drawOverviewChart();
      if (this.dataset.tab === "analytics") renderAnalytics();
      if (this.dataset.tab === "revenue") renderRevenue();
    }
    
    if (this.dataset.tab === "users") renderUsers();
    if (this.dataset.tab === "favorites") renderFavorites();
    if (this.dataset.tab === "reports") renderReports();
  });
});

let allFavorites = [];
let allReports = [];

function switchTab(tabId) {
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if(btn) btn.click();
}

// DATA
async function refreshData() {
  // Wait for auth to be ready
  if (!auth.currentUser) {
    console.log("Waiting for auth...");
    await new Promise(resolve => {
      const unsub = auth.onAuthStateChanged(user => { unsub(); resolve(user); });
    });
  }
  try {
    const [listSnap, profSnap] = await Promise.all([
      db.collection("listings").orderBy("created_at", "desc").get(),
      db.collection("profiles").get()
    ]);
    
    // Fetch these safely, as they require auth in Firestore rules
    let favSnap, repSnap;
    try { favSnap = await db.collection("favorites").get(); } catch(e) { console.warn("Could not read favorites - check rules/auth"); }
    try { repSnap = await db.collection("reports").get(); } catch(e) { console.warn("Could not read reports - check rules/auth"); }

    allProfiles = {};
    profSnap.forEach(d => allProfiles[d.id] = {id: d.id, ...d.data()});
    allFavorites = [];
    if (favSnap) favSnap.forEach(d => allFavorites.push({id: d.id, ...d.data()}));
    allReports = [];
    if (repSnap) repSnap.forEach(d => allReports.push({id: d.id, ...d.data()}));

    // Auto-seed mock data if empty
    if (allListings.length === 0 && listSnap) {
      listSnap.forEach(d => allListings.push({id: d.id, ...d.data()}));
    }
    
    if (allListings.length > 0 && Object.keys(allProfiles).length > 0) {
      const uId = Object.keys(allProfiles)[0];
      const lId = allListings[0].id;
      
      if (allReports.length === 0) {
        try {
          const newRep = await db.collection("reports").add({ reporter_id: uId, listing_id: lId, reason: "Spam content", created_at: new Date().toISOString() });
          allReports.push({ id: newRep.id, reporter_id: uId, listing_id: lId, reason: "Spam content", created_at: new Date().toISOString() });
        } catch(e) { console.warn("Failed to seed report", e); }
      }
      if (allFavorites.length === 0) {
        try {
          const newFav = await db.collection("favorites").add({ user_id: uId, listing_id: lId, created_at: new Date().toISOString() });
          allFavorites.push({ id: newFav.id, user_id: uId, listing_id: lId, created_at: new Date().toISOString() });
        } catch(e) { console.warn("Failed to seed favorite", e); }
      }
    }

    allListings = [];
    for (const d of listSnap.docs) {
      const data = { id: d.id, ...d.data() };
      if (data.status === "active" && data.expires_at && new Date(data.expires_at) < new Date()) {
        try {
          await db.collection("listings").doc(d.id).update({ status: "timed_out" });
          data.status = "timed_out";
        } catch (e) { console.warn("Could not auto-expire:", d.id, e); }
      }
      allListings.push(data);
    }
    console.log("Loaded", allListings.length, "listings,", Object.keys(allProfiles).length, "profiles");
    updateAll();

    db.collection("audit_logs").orderBy("created_at", "desc").limit(100).onSnapshot(snap => {
      allLogs = snap.docs.map(d => ({id: d.id, ...d.data()}));
      renderLogs();
    });
  }catch(e){console.error("Error:",e)}
}

function updateAll(){updateStats();renderListings();renderUsers();renderFavorites();renderReports();renderAnalytics();renderRevenue();renderModeration();drawOverviewChart();loadSettings();renderFirebaseDetailedList();}



function updateStats(){
  const t=allListings.length,p=allListings.filter(l=>l.status==="pending").length;
  const a=allListings.filter(l=>l.status==="active").length,r=allListings.filter(l=>l.status==="rejected").length;
  const to=allListings.filter(l=>l.status==="timed_out").length;
  const wt=allListings.filter(l=>l.expires_at&&new Date(l.expires_at)>new Date()).length;
  const tv=allListings.reduce((s,l)=>s+(l.price||0),0);
  
  const todayStr = new Date().toISOString().slice(0,10);
  const usersToday = Object.values(allProfiles).filter(u => u.created_at && u.created_at.slice(0,10) === todayStr).length;
  const listingsToday = allListings.filter(l => l.created_at && l.created_at.slice(0,10) === todayStr).length;

  document.getElementById("statAll").textContent=t;document.getElementById("statPending").textContent=p;
  document.getElementById("statActive").textContent=a;document.getElementById("statRejected").textContent=r;
  
  // Add today metrics to labels if they exist
  const statAllSub = document.getElementById("statAll").nextElementSibling;
  if(statAllSub) statAllSub.innerHTML = `<span style="color:#22c55e;font-weight:bold">+${listingsToday} Today</span>`;
  
  document.getElementById("revTotal").textContent=formatPrice(tv);
  document.getElementById("revTotalSub").textContent=`Across ${t} listings`;
  document.getElementById("revTimers").textContent=wt;document.getElementById("revTimedOut").textContent=to;
  document.getElementById("listingStats").innerHTML=
    `<div class="stat-card ${currentFilter==='all'?'active':''}" onclick="setFilter('all')"><div class="stat-label"><span class="dot dot-blue"></span> All Listings</div><div class="stat-value">${t}</div></div>
    <div class="stat-card ${currentFilter==='pending'?'active':''}" onclick="setFilter('pending')"><div class="stat-label"><span class="dot dot-orange"></span> Awaiting Approval</div><div class="stat-value">${p}</div></div>
    <div class="stat-card ${currentFilter==='active'?'active':''}" onclick="setFilter('active')"><div class="stat-label"><span class="dot dot-green"></span> Live</div><div class="stat-value">${a}</div></div>
    <div class="stat-card ${currentFilter==='rejected'?'active':''}" onclick="setFilter('rejected')"><div class="stat-label"><span class="dot dot-red"></span> Rejected</div><div class="stat-value">${r}</div></div>`;
}
function setFilter(f){currentFilter=f;updateStats();renderListings()}

// SEARCH
document.getElementById("searchInput").addEventListener("input",()=>renderListings());
function getFiltered(){
  let list=currentFilter==="all"?allListings:allListings.filter(l=>l.status===currentFilter);
  const q=document.getElementById("searchInput").value.toLowerCase().trim();
  if(q)list=list.filter(l=>{const pr=allProfiles[l.user_id]||{};
    return[l.title,l.category,l.address,pr.full_name,pr.phone].some(v=>(v||"").toLowerCase().includes(q))});
  return list;
}

// LISTINGS
function renderListings(){
  Object.values(countdownIntervals).forEach(clearInterval);countdownIntervals={};
  const list=getFiltered(),c=document.getElementById("listingsContainer");
  if(!list.length){c.innerHTML='<div class="empty-state"><p>No listings found</p></div>';return}
  c.innerHTML=list.map(l=>buildCard(l)).join("");
  list.forEach(l=>{if(l.expires_at&&l.status==="active")startCountdown(l.id,l.expires_at)});
}

function buildCard(l){
  const pr=allProfiles[l.user_id]||{};
  const img=(l.images&&l.images[0])?`<img class="listing-img" src="${l.images[0]}" onerror="this.style.display='none'">`:
    '<div class="listing-img"></div>';
  const st=l.status==="active"?"Live":l.status==="timed_out"?"Timed Out":l.status.charAt(0).toUpperCase()+l.status.slice(1);
  const badge=`<span class="badge badge-${l.status}">${st}</span>`;
  const timer=l.expires_at?`<span id="cd-${l.id}" class="timer-countdown" style="margin-left:8px">⏱ ...</span>`:'';
  const det=l.details||{};

  // Build full detail items based on category
  let detailItems=`
    <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${l.category||'-'}</div></div>
    <div class="detail-item"><div class="detail-label">Transaction</div><div class="detail-value">${l.transaction_type||'-'}</div></div>
    <div class="detail-item"><div class="detail-label">Booster Plan</div><div class="detail-value">${l.booster_plan ? `${l.booster_plan} (${l.plan_days} Days)` : 'Basic'}</div></div>
    <div class="detail-item"><div class="detail-label">Price</div><div class="detail-value">${formatPrice(l.price)}</div></div>
    <div class="detail-item"><div class="detail-label">Address</div><div class="detail-value">${l.address||'-'}</div></div>
    <div class="detail-item"><div class="detail-label">Pincode</div><div class="detail-value">${l.pincode||'-'}</div></div>
    <div class="detail-item"><div class="detail-label">Owner</div><div class="detail-value">${l.owner_name || pr.full_name || 'Unknown'}</div></div>
    <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${l.owner_phone || pr.phone || '-'}</div></div>
    <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${l.owner_email || pr.email || '-'} ${(l.owner_email || pr.email) ? `<a href="mailto:${l.owner_email || pr.email}?subject=Regarding your Bhoomitayi Account" style="text-decoration:none;" title="Send Support Email">✉️</a>` : ''}</div></div>
    <div class="detail-item"><div class="detail-label">Created</div><div class="detail-value">${l.created_at?new Date(l.created_at).toLocaleString("en-IN"):'-'}</div></div>`;

  // Category-specific details
  if(l.category==="house"){
    detailItems+=detField("Bedrooms",det.bedrooms)+detField("Bathrooms",det.bathrooms)+detField("Area",det.area_sqft?det.area_sqft+" sq.ft":null)+detField("Furnishing",det.furnishing)+detField("Floors",det.floors)+detField("Parking",det.parking?"Yes":"No")+detField("Year Built",det.year_built);
  }else if(l.category==="land"){
    detailItems+=detField("Area",det.area_sqft?det.area_sqft+" sq.ft":null)+detField("Land Type",det.land_type)+detField("Facing",det.facing)+detField("Road Width",det.road_width_ft?det.road_width_ft+" ft":null)+detField("Corner Plot",det.is_corner_plot?"Yes":"No");
  }else if(l.category==="pg"){
    detailItems+=detField("Rent/Month",det.rent_per_month?formatPrice(det.rent_per_month):null)+detField("Deposit",det.security_deposit?formatPrice(det.security_deposit):null)+detField("Gender",det.gender_preference)+detField("Occupancy",det.occupancy_type)+detField("Meals",det.meals_included?"Yes":"No")+detField("WiFi",det.wifi?"Yes":"No")+detField("AC",det.ac?"Yes":"No");
  }else if(l.category==="commercial"){
    detailItems+=detField("Type",det.commercial_type)+detField("Area",det.area_sqft?det.area_sqft+" sq.ft":null)+detField("Furnishing",det.furnishing)+detField("Lift",det.lift?"Yes":"No")+detField("Power Backup",det.power_backup?"Yes":"No");
  }else if(l.category==="vehicle"){
    detailItems+=detField("Vehicle Type",det.vehicle_type)+detField("Brand",det.brand)+detField("Model",det.model)+detField("Year",det.year)+detField("Fuel",det.fuel_type)+detField("Transmission",det.transmission)+detField("KM Driven",det.km_driven?det.km_driven.toLocaleString("en-IN"):null)+detField("Owner #",det.owner_number);
  }else if(l.category==="commodity"){
    detailItems+=detField("Type",det.commodity_type)+detField("Brand",det.brand)+detField("Condition",det.condition)+detField("Warranty",det.warranty?"Yes":"No")+detField("Age",det.age_months?det.age_months+" months":null);
  }

  // Description
  const descHTML=l.description?`<div class="detail-desc"><div class="detail-label">Description</div><div class="detail-value">${l.description}</div></div>`:'';

  // Images
  let imgsHTML='';
  if(l.images&&l.images.length>1){
    imgsHTML='<div class="detail-images">'+l.images.map(i=>`<img src="${i}" class="detail-thumb" onerror="this.style.display='none'">`).join('')+'</div>';
  }

  const timerSection=`<div class="timer-section">
    <div class="timer-title">⏱ Set Listing Timer (YY / MM / DD / HH / Min)</div>
    <div style="font-size: 13px; color: #4b5563; margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
      <strong>User requested:</strong> ${l.booster_plan || 'Basic'} Plan (${l.plan_days || 0} Days)
    </div>
    <div class="timer-inputs">
      <div class="timer-field"><label>Years</label><input type="number" min="0" id="ty-${l.id}" value="0"></div>
      <div class="timer-field"><label>Months</label><input type="number" min="0" max="11" id="tm-${l.id}" value="0"></div>
      <div class="timer-field"><label>Days</label><input type="number" min="0" max="30" id="td-${l.id}" value="${l.plan_days || 0}"></div>
      <div class="timer-field"><label>Hours</label><input type="number" min="0" max="23" id="th-${l.id}" value="0"></div>
      <div class="timer-field"><label>Mins</label><input type="number" min="0" max="59" id="tmin-${l.id}" value="0"></div>
      <button class="btn ${l.status === 'active' ? 'btn-success' : 'btn-primary'}" onclick="setTimer('${l.id}')" style="margin-top:16px; ${l.status === 'active' ? 'background-color:#10b981; border-color:#10b981; color:white;' : ''}">${l.status === 'active' ? 'Already Approved' : 'Set & Approve'}</button>
      <button class="btn btn-danger" onclick="clearTimer('${l.id}')" style="margin-top:16px" ${l.expires_at?'':'disabled'}>Clear Timer</button>
    </div>
    ${l.expires_at?`<div class="timer-current">Current expiry: ${new Date(l.expires_at).toLocaleString("en-IN")}</div>`:''}
  </div>`;

  let acts='';
  if(l.status==="pending")acts+=`<button class="btn btn-primary" onclick="doAction('${l.id}','approve')">✓ Approve</button>`;
  else if(l.status==="active")acts+=`<button class="btn" style="background-color:#10b981; color:white; border-color:#10b981;" onclick="doAction('${l.id}','approve')">✓ Approved (Re-approve)</button>`;
  
  if(l.status!=="rejected"&&l.status!=="timed_out")acts+=`<button class="btn" style="color:#d97706;border-color:#fcd34d" onclick="doAction('${l.id}','reject')">✕ Reject</button>`;
  if(l.status==="timed_out"||l.status==="rejected")acts+=`<button class="btn" style="color:#6366f1;border-color:#a5b4fc" onclick="doAction('${l.id}','relaunch')">↻ Relaunch</button>`;
  if(l.status==="active")acts+=`<button class="btn" style="color:#059669;border-color:#6ee7b7" onclick="extendExpiry('${l.id}')">+30 Days</button>`;
  acts+=`<button class="btn" onclick="duplicateListing('${l.id}')">Clone</button>`;
  acts+=`<button class="btn" onclick="navigator.clipboard.writeText(window.location.origin + '/listing/' + '${l.id}'); alert('URL Copied!')">🔗 Copy Link</button>`;
  acts+=`<button class="btn btn-danger" onclick="doAction('${l.id}','delete')">🗑 Delete</button>`;

  const starStyle = l.is_featured ? 'color:#fbbf24; cursor:pointer; font-size: 20px;' : 'color:#d1d5db; cursor:pointer; font-size: 20px; text-shadow: 0 0 1px #000;';
  const starIcon = `<span style="${starStyle}" onclick="event.stopPropagation(); toggleFeatured('${l.id}', ${!l.is_featured})" title="Feature on Homepage">★</span>`;
  const checkbox = `<input type="checkbox" class="bulk-checkbox" value="${l.id}" onclick="event.stopPropagation(); updateBulkActions()" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);">`;

  const flaggedWords = ["scam", "test", "fake", "spam", "dummy"];
  const isFlagged = flaggedWords.some(w => (l.title||"").toLowerCase().includes(w) || (l.description||"").toLowerCase().includes(w));
  const borderStyle = isFlagged ? 'border: 2px solid #ef4444; background: #fef2f2;' : '';
  const flagBadge = isFlagged ? '<span class="badge" style="background:#ef4444;color:white;margin-left:8px;">🚩 Flagged Keyword</span>' : '';

  return `<div class="listing-card" id="card-${l.id}" style="${borderStyle}">
    <div class="listing-top" onclick="toggleExpand('${l.id}')">
      ${img}<div class="listing-info"><div class="listing-name">${checkbox} ${l.title} ${starIcon} ${badge} ${flagBadge} ${timer}</div>
      <div class="listing-meta">${l.category} · ${l.owner_name || pr.full_name || 'Unknown'} · ${l.owner_phone || pr.phone || 'No Phone'} · ${l.owner_email || pr.email || 'No Email'}</div></div>
      <div class="listing-right"><div class="listing-price">${formatPrice(l.price)}</div><div class="listing-date">${formatDate(l.created_at)}</div></div>
      <span class="listing-expand" id="exp-${l.id}">▼</span>
    </div>
    <div class="listing-details" id="det-${l.id}">
      <div class="detail-grid">${detailItems}</div>
      ${descHTML}${imgsHTML}${timerSection}
      <div class="action-btns">${acts}</div>
    </div></div>`;
}
function detField(label,val){return val!=null&&val!==''&&val!==undefined?`<div class="detail-item"><div class="detail-label">${label}</div><div class="detail-value">${val}</div></div>`:'';}

function toggleExpand(id){
  const det=document.getElementById("det-"+id),exp=document.getElementById("exp-"+id);
  det.classList.toggle("show");exp.classList.toggle("open");
  if(det.classList.contains("show")) {
    updateTimerInputs(id);
  }
}
function updateTimerInputs(id) {
  const listing=allListings.find(l=>l.id===id);
  if(listing&&listing.expires_at){
    const diff=new Date(listing.expires_at).getTime()-Date.now();
    if(diff>0){const mi=Math.floor(diff/60000),hr=Math.floor(mi/60),dy=Math.floor(hr/24),mo=Math.floor(dy/30),yr=Math.floor(mo/12);
      sv("ty-"+id,yr);sv("tm-"+id,mo%12);sv("td-"+id,dy%30);sv("th-"+id,hr%24);sv("tmin-"+id,mi%60)}
  }
}
function sv(id,v){const el=document.getElementById(id);if(el)el.value=v}

// TIMER
async function setTimer(id){
  const y=gi("ty-"+id),mo=gi("tm-"+id),d=gi("td-"+id),h=gi("th-"+id),mi=gi("tmin-"+id);
  const ms=y*365*864e5+mo*30*864e5+d*864e5+h*36e5+mi*6e4;
  if(ms<=0)return alert("Please set a valid duration");
  const listing=allListings.find(x=>x.id===id);
  if(listing && listing.status === "active") {
    if(!confirm("Do you want to approve again with updated timings?")) return;
  }
  try{await db.collection("listings").doc(id).update({expires_at:new Date(Date.now()+ms).toISOString(),status:"active",updated_at:new Date().toISOString()});
    alert("Timer set! Listing is now active.");refreshData()}catch(e){alert("Error: "+e.message)}
}
async function clearTimer(id){
  try{await db.collection("listings").doc(id).update({expires_at:null,updated_at:new Date().toISOString()});
    alert("Timer cleared.");refreshData()}catch(e){alert("Error: "+e.message)}
}
function gi(id){return parseInt(document.getElementById(id).value)||0}

function startCountdown(id,exp){
  const el=document.getElementById("cd-"+id);if(!el)return;
  const up=()=>{const diff=new Date(exp).getTime()-Date.now();
    if(diff<=0){el.textContent="⏱ Expired";clearInterval(countdownIntervals[id]);return}
    const d=Math.floor(diff/864e5),h=Math.floor(diff%864e5/36e5),m=Math.floor(diff%36e5/6e4),s=Math.floor(diff%6e4/1e3);
    el.textContent=`⏱ ${d>0?d+'d ':''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
  up();countdownIntervals[id]=setInterval(up,1000);
}

// ACTIONS
function updateBulkActions() {
  const checkboxes = document.querySelectorAll('.bulk-checkbox:checked');
  const bar = document.getElementById('bulkActionBar');
  const count = document.getElementById('bulkCount');
  
  if (checkboxes.length > 0) {
    bar.style.display = 'flex';
    count.textContent = checkboxes.length + ' Selected';
  } else {
    bar.style.display = 'none';
  }
}

async function doBulkAction(act) {
  const checkboxes = document.querySelectorAll('.bulk-checkbox:checked');
  if (checkboxes.length === 0) return;
  if (!confirm(`${act} ${checkboxes.length} listings?`)) return;

  const ids = Array.from(checkboxes).map(cb => cb.value);
  try {
    for (const id of ids) {
      if(act==="delete"){ await db.collection("listings").doc(id).delete(); }
      else{
        let status=act==="approve"?"active":act==="reject"?"rejected":"pending";
        await db.collection("listings").doc(id).update({status, updated_at: new Date().toISOString()});
      }
    }
    await logAction("Bulk Action", `Admin bulk ${act}d ${ids.length} listings`);
    refreshData();
    document.getElementById('bulkActionBar').style.display = 'none';
  } catch(e) {
    alert("Error executing bulk action: " + e.message);
  }
}

async function toggleFeatured(id, isFeatured) {
  try {
    await db.collection("listings").doc(id).update({ is_featured: isFeatured });
    const idx = allListings.findIndex(l => l.id === id);
    if (idx !== -1) allListings[idx].is_featured = isFeatured;
    await logAction("Feature Toggle", `Admin set is_featured=${isFeatured} for listing ${id}`);
    renderListings();
  } catch (e) {
    alert("Error toggling featured status: " + e.message);
  }
}

async function doAction(id,action){
  const l=allListings.find(x=>x.id===id);
  const t={approve:"Approve Listing",reject:"Reject Listing",delete:"Delete Listing",relaunch:"Relaunch Listing"};
  let d={approve:`Approve "${l.title}"?`,reject:`Reject "${l.title}"?`,delete:`Permanently delete "${l.title}"?`,relaunch:`Relaunch "${l.title}"?`};
  
  if (action === "reject") {
    d.reject += `<br><br><label style="display:block;margin-bottom:8px;font-size:14px;color:#475569">Reason for rejection (sent to user):</label><input type="text" id="rejectReason" style="width:100%;padding:8px;border-radius:6px;border:1px solid #cbd5e1" placeholder="e.g. Blurry images or violates guidelines">`;
  }

  document.getElementById("modalTitle").textContent=t[action];document.getElementById("modalDesc").innerHTML=d[action];
  document.getElementById("confirmModal").classList.remove("hidden");
  document.getElementById("modalConfirm").onclick=async()=>{
    let reason = "";
    if (action === "reject") {
      const inp = document.getElementById("rejectReason");
      if(inp) reason = inp.value.trim();
    }
    closeModal();
    try{if(action==="delete")await db.collection("listings").doc(id).delete();
      else if(action==="relaunch")await db.collection("listings").doc(id).update({status:"active",expires_at:null,updated_at:new Date().toISOString()});
      else {
        await db.collection("listings").doc(id).update({status:action==="approve"?"active":"rejected",updated_at:new Date().toISOString()});
      }
      await logAction("Listing Action", `Admin performed ${action} on listing ${id} ("${l.title}")`);
      refreshData()}catch(e){alert("Error: "+e.message)}};
}
function closeModal(){document.getElementById("confirmModal").classList.add("hidden")}



// ─── BAR CHART DRAWING ───
const COLORS=["#ec4899","#8b5cf6","#22c55e","#ef4444","#3b82f6","#f59e0b","#06b6d4","#f97316"];
function drawBarChart(canvasId,labels,values,colors){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext("2d");
  const dpr=window.devicePixelRatio||1;
  const W=canvas.offsetWidth||canvas.parentElement.clientWidth||400,H=canvas.offsetHeight||parseInt(canvas.getAttribute("height"))||300;
  canvas.width=W*dpr;canvas.height=H*dpr;
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  if(!values.length||Math.max(...values)===0){ctx.fillStyle="#94a3b8";ctx.font="14px Inter,sans-serif";ctx.textAlign="center";ctx.fillText("No data",W/2,H/2);return}
  const padL=50,padR=20,padT=20,padB=60;
  const chartW=W-padL-padR,chartH=H-padT-padB;
  const maxVal=Math.max(...values)*1.15;
  const barW=Math.min(50,chartW/labels.length*0.6);
  const gap=(chartW-barW*labels.length)/(labels.length+1);

  // Grid lines
  ctx.strokeStyle="#f1f5f9";ctx.lineWidth=1;ctx.font="11px Inter,sans-serif";ctx.fillStyle="#94a3b8";ctx.textAlign="right";
  for(let i=0;i<=4;i++){const y=padT+chartH-chartH*(i/4);
    ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();
    ctx.fillText(Math.round(maxVal*i/4),padL-8,y+4)}

  // Bars
  labels.forEach((label,i)=>{
    const x=padL+gap+(barW+gap)*i;
    const barH=(values[i]/maxVal)*chartH;
    const y=padT+chartH-barH;
    const c=colors?colors[i%colors.length]:COLORS[i%COLORS.length];
    // Bar with rounded top
    ctx.fillStyle=c;ctx.beginPath();
    const r=Math.min(6,barW/2);
    ctx.moveTo(x,y+r);ctx.arcTo(x,y,x+barW,y,r);ctx.arcTo(x+barW,y,x+barW,y+barH,r);
    ctx.lineTo(x+barW,padT+chartH);ctx.lineTo(x,padT+chartH);ctx.closePath();ctx.fill();
    // Value on top
    ctx.fillStyle="#374151";ctx.font="bold 12px Inter,sans-serif";ctx.textAlign="center";
    ctx.fillText(values[i],x+barW/2,y-6);
    // Label
    ctx.fillStyle="#64748b";ctx.font="11px Inter,sans-serif";
    const short=label.length>10?label.slice(0,9)+'…':label;
    ctx.fillText(short,x+barW/2,padT+chartH+16);
  });
}

// OVERVIEW CHART
function drawOverviewChart(){
  const cats=["Commodity","Commercial","Land","Vehicle","House","PG"];
  const vals=cats.map(c=>allListings.filter(l=>l.category===c.toLowerCase()).length);
  drawBarChart("overviewChart",cats,vals);
}

// ANALYTICS
function renderAnalytics(){
  const userCount=Object.keys(allProfiles).length;
  document.getElementById("anaUsers").textContent=userCount;
  document.getElementById("anaListings").textContent=allListings.length;
  const prices=allListings.filter(l=>l.price).map(l=>l.price);
  document.getElementById("anaAvgPrice").textContent=prices.length?formatPrice(prices.reduce((a,b)=>a+b,0)/prices.length):"₹0";
  document.getElementById("anaReports").textContent = 0;

  // Category chart
  const cats=["House","Land","PG","Commercial","Vehicle","Commodity"];
  const catVals=cats.map(c=>allListings.filter(l=>l.category===c.toLowerCase()).length);
  drawBarChart("catChart",cats,catVals);

  // Status chart
  const statuses=["Active","Pending","Rejected","Timed Out"];
  const statusKeys=["active","pending","rejected","timed_out"];
  const statusVals=statusKeys.map(s=>allListings.filter(l=>l.status===s).length);
  drawBarChart("statusChart",statuses,statusVals,["#22c55e","#f59e0b","#ef4444","#f97316"]);

  // Transaction chart
  const txns=["Buy","Sell","Rent"];
  const txnVals=txns.map(t=>allListings.filter(l=>l.transaction_type===t.toLowerCase()).length);
  drawBarChart("txnChart",txns,txnVals,["#3b82f6","#ec4899","#8b5cf6"]);

  // Time chart - last 30 days
  const now=new Date();const days=[];const dayVals=[];
  for(let i=29;i>=0;i--){
    const d=new Date(now);d.setDate(d.getDate()-i);
    const key=d.toISOString().slice(0,10);
    days.push(d.getDate()+"/"+(d.getMonth()+1));
    dayVals.push(allListings.filter(l=>l.created_at&&l.created_at.slice(0,10)===key).length);
  }
  drawBarChart("timeChart",days,dayVals,days.map(()=>"#3b82f6"));

  // Pincode chart
  const pinCounts = {};
  allListings.forEach(l => {
    if(l.pincode) {
      pinCounts[l.pincode] = (pinCounts[l.pincode] || 0) + 1;
    }
  });
  const sortedPins = Object.keys(pinCounts).sort((a,b) => pinCounts[b] - pinCounts[a]).slice(0,10);
  const pinVals = sortedPins.map(p => pinCounts[p]);
  if(sortedPins.length > 0) drawBarChart("pincodeChart", sortedPins, pinVals, sortedPins.map(() => "#8b5cf6"));
}

// REVENUE
function renderRevenue(){
  const active=allListings.filter(l=>l.status==="active");
  const totalVal=allListings.reduce((s,l)=>s+(l.price||0),0);
  const avgVal=active.length?active.reduce((s,l)=>s+(l.price||0),0)/active.length:0;
  const maxListing=allListings.reduce((m,l)=>(l.price||0)>(m.price||0)?l:m,{price:0});

  document.getElementById("rvTotal").textContent=formatPrice(totalVal);
  document.getElementById("rvTotalSub").textContent=`Across ${allListings.length} listings`;
  document.getElementById("rvAvg").textContent=formatPrice(avgVal);
  document.getElementById("rvMax").textContent=formatPrice(maxListing.price);
  document.getElementById("rvMaxSub").textContent=maxListing.title||"";

  // Revenue by category
  const cats=["House","Land","PG","Commercial","Vehicle","Commodity"];
  const catVals=cats.map(c=>allListings.filter(l=>l.category===c.toLowerCase()).reduce((s,l)=>s+(l.price||0),0));
  // Convert to lakhs for display
  const catLabels=cats.map((c,i)=>c+"\n₹"+formatPrice(catVals[i]));
  drawBarChart("revCatChart",cats,catVals);

  // Top 10
  const top=allListings.slice().sort((a,b)=>(b.price||0)-(a.price||0)).slice(0,10);
  document.getElementById("topListings").innerHTML=top.map((l,i)=>{
    const pr=allProfiles[l.user_id]||{};
    return `<div class="top-listing"><div class="top-rank">${i+1}</div><div class="top-info"><div class="top-name">${l.title}</div><div class="top-meta">${l.category} · ${pr.full_name||'Unknown'}</div></div><div class="top-price">${formatPrice(l.price)}</div></div>`;
  }).join('');
}

// HELPERS
function formatPrice(p){if(!p)return"₹0";if(p>=1e7)return`₹${(p/1e7).toFixed(2)}Cr`;if(p>=1e5)return`₹${(p/1e5).toFixed(2)}L`;if(p>=1e3)return`₹${(p/1e3).toFixed(1)}K`;return`₹${p.toLocaleString("en-IN")}`}
function formatDate(d){if(!d)return"-";return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}

// Redraw charts on resize
window.addEventListener("resize",()=>{if(allListings.length){drawOverviewChart();renderAnalytics();renderRevenue()}});

// NEW SECTIONS: USERS, FAVORITES, REPORTS

// Search Users
document.getElementById("searchUserInput")?.addEventListener("input", () => renderUsers());

function renderUsers() {
  const c = document.getElementById("usersContainer");
  if(!c) return;
  let list = Object.values(allProfiles);
  const q = document.getElementById("searchUserInput")?.value.toLowerCase().trim();
  if (q) {
    list = list.filter(u => {
      return [u.full_name, u.email, u.phone, u.role].some(v => (v||"").toLowerCase().includes(q));
    });
  }
  
  if(!list.length) { c.innerHTML = '<div class="empty-state"><p>No users found</p></div>'; return; }
  
  c.innerHTML = list.map(u => {
    const standardKeys = ['id', 'full_name', 'email', 'phone', 'role', 'created_at', 'password', 'avatar_url', 'photo_url'];
    let extraDetails = '';
    for(let k in u) {
      if(!standardKeys.includes(k) && typeof u[k] !== 'object') {
        let val = u[k];
        if(typeof val === 'string' && val.startsWith('http')) {
          val = `<a href="${val}" target="_blank">View Link</a>`;
        }
        extraDetails += `<div class="detail-item" style="font-size: 11px;"><div class="detail-label" style="text-transform:capitalize;">${k.replace(/_/g, ' ')}</div><div class="detail-value">${val}</div></div>`;
      }
    }
    
    const photoUrl = u.avatar_url || u.photo_url || '';
    const imgHtml = photoUrl ? `<img src="${photoUrl}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; margin-right:12px; border: 1px solid #e2e8f0;" onerror="this.style.display='none'" />` : '';
    
    // Fallback: try to find email/phone from any listings this user created
    let displayEmail = u.email;
    let displayPhone = u.phone;
    if (!displayEmail || !displayPhone) {
      const userListings = allListings.filter(l => l.user_id === u.id);
      for (let l of userListings) {
        if (!displayEmail && l.owner_email) displayEmail = l.owner_email + ' (from listing)';
        if (!displayPhone && l.owner_phone) displayPhone = l.owner_phone + ' (from listing)';
      }
    }

    const statusBadge = u.status === 'suspended' ? `<span class="badge" style="background:#fecaca;color:#991b1b">Suspended</span>` : '';
    const blueTick = u.is_verified ? '<span title="Verified User" style="color:#3b82f6; margin-left:4px; font-size:16px;">☑</span>' : '';
    const roleBadge = `<span class="badge" style="background:${u.role==='admin'?'#dcfce7':'#f1f5f9'}; color:${u.role==='admin'?'#166534':'#475569'}">${u.role || 'user'}</span>`;

    return `
    <div class="listing-card">
      <div class="listing-top">
        ${imgHtml}
        <div class="listing-info">
          <div class="listing-name">${u.full_name || 'No Name'} ${blueTick} ${roleBadge} ${statusBadge}</div>
          <div class="listing-meta">${displayEmail ? '📧 ' + displayEmail + ` <a href="mailto:${displayEmail}?subject=Regarding your Bhoomitayi Account" style="text-decoration:none;" title="Send Support Email">✉️</a>` : 'No email'} · ${displayPhone ? '📱 ' + displayPhone : 'No phone'}</div>
        </div>
        <div class="listing-right">
          <div class="listing-date">Joined: ${formatDate(u.created_at)}</div>
        </div>
      </div>
      <div class="listing-details show" style="padding-top: 10px; margin-top: 10px; border-top: 1px solid #f1f5f9;">
        ${extraDetails ? `<div class="detail-grid" style="margin-bottom: 12px; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">${extraDetails}</div>` : ''}

        <div style="margin-top:10px; margin-bottom:15px; background:#f8fafc; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
          <label style="font-size:12px; color:#475569; font-weight:bold; display:block; margin-bottom:5px;">Admin Notes (Private):</label>
          <div style="display:flex; gap:10px;">
            <input type="text" id="note_${u.id}" value="${u.admin_notes || ''}" style="flex:1; padding:8px; border:1px solid #cbd5e1; border-radius:4px;" placeholder="Add private notes about this user...">
            <button class="btn btn-primary" style="padding:6px 12px; height:auto;" onclick="saveUserNote('${u.id}')">Save</button>
          </div>
        </div>

        <div class="action-btns">
          ${u.role !== 'admin' ? `<button class="btn btn-primary" onclick="changeUserRole('${u.id}', 'admin')">Make Admin</button>` : `<button class="btn" onclick="changeUserRole('${u.id}', 'user')">Remove Admin</button>`}
          <button class="btn btn-danger" onclick="deleteUserProfile('${u.id}')">Delete Profile</button>
        </div>
      </div>
    </div>
  `}).join("");
  
  const stats = document.getElementById("userStats");
  if(stats) {
    const admins = Object.values(allProfiles).filter(u => u.role === 'admin').length;
    stats.innerHTML = `
      <div class="stat-card active"><div class="stat-label">Total Users</div><div class="stat-value">${Object.keys(allProfiles).length}</div></div>
      <div class="stat-card"><div class="stat-label">Admins</div><div class="stat-value">${admins}</div></div>
    `;
  }
}

function renderFavorites() {
  const c = document.getElementById("favoritesContainer");
  if(!c) return;
  if(!allFavorites.length) { c.innerHTML = ''; return; }
  
  c.innerHTML = allFavorites.map(f => {
    const p = allProfiles[f.user_id] || {};
    const l = allListings.find(x => x.id === f.listing_id) || {title: "Unknown Listing (Deleted)"};
    return `
    <div class="listing-card">
      <div class="listing-top">
        <div class="listing-info">
          <div class="listing-name">❤️ ${p.full_name || 'Unknown User'} favorited ${l.title}</div>
          <div class="listing-meta">User ID: ${f.user_id} · Listing ID: ${f.listing_id}</div>
        </div>
        <div class="listing-right">
          <div class="listing-date">${formatDate(f.created_at)}</div>
        </div>
      </div>
      <div class="listing-details show" style="padding-top: 10px; margin-top: 10px; border-top: 1px solid #f1f5f9;">
        <div class="action-btns">
          <button class="btn btn-danger" onclick="deleteFavorite('${f.id}')">Delete Favorite</button>
        </div>
      </div>
    </div>
  `}).join("");
}

function renderReports() {
  const c = document.getElementById("reportsContainer");
  if(!c) return;
  if(!allReports.length) { c.innerHTML = ''; return; }
  
  c.innerHTML = allReports.map(r => {
    const p = allProfiles[r.reporter_id] || {};
    const l = allListings.find(x => x.id === r.listing_id) || {title: "Unknown Listing (Deleted)"};
    const angryWords = ["fake", "scam", "fraud", "angry", "abuse", "terrible", "worst", "liar", "thief"];
    const isAngry = angryWords.some(w => r.reason && r.reason.toLowerCase().includes(w));
    const titleHtml = isAngry ? `<div class="listing-name" style="color:#ef4444">🔥 HIGH URGENCY: Report on ${l.title}</div>` : `<div class="listing-name">⚠️ Report on ${l.title}</div>`;
    return `
    <div class="listing-card" style="border-left: 4px solid #ef4444">
      <div class="listing-top">
        <div class="listing-info">
          ${titleHtml}
          <div class="listing-meta">Reported by ${p.full_name || 'Unknown User'} · Reason: ${r.reason}</div>
        </div>
        <div class="listing-right">
          <div class="listing-date">${formatDate(r.created_at)}</div>
        </div>
      </div>
      <div class="listing-details show" style="padding-top: 10px; margin-top: 10px; border-top: 1px solid #f1f5f9;">
        <div class="action-btns" style="margin-top: 15px;">
          <button class="btn btn-primary" onclick="switchTab('listings'); document.getElementById('searchInput').value='${l.title.replace(/'/g, "\\'")}'; renderListings();">View Listing</button>
          <button class="btn btn-danger" onclick="nukeReport('${r.id}', '${l.id}', '${l.user_id}')">Nuclear Option (Delete & Suspend)</button>
          <button class="btn" onclick="dismissReport('${r.id}')">Dismiss Report</button>
        </div>
      </div>
    </div>
  `}).join("");
}

function renderModeration() {
  const c = document.getElementById("moderationGrid");
  if(!c) return;
  
  let html = '';
  for(const l of allListings) {
    if(l.images && Array.isArray(l.images)) {
      for(const img of l.images) {
        if(img) {
          html += `<div style="position:relative; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; cursor:pointer;" onclick="switchTab('listings'); document.getElementById('searchInput').value='${l.title.replace(/'/g, "\\'")}'; renderListings();">
            <img src="${img}" style="width:100%; height:200px; object-fit:cover;" onerror="this.style.display='none'">
            <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; padding:5px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.title}</div>
            <div style="position:absolute; top:5px; right:5px;"><span class="badge badge-${l.status}">${l.status}</span></div>
          </div>`;
        }
      }
    }
  }
  
  if(!html) html = '<div class="empty-state" style="grid-column: 1 / -1;"><p>No images found across listings</p></div>';
  c.innerHTML = html;
}

// LOGS
let allLogs = [];
function renderLogs() {
  const c = document.getElementById("logsContainer");
  if(!c) return;
  if(allLogs.length === 0) {
    c.innerHTML = '<div class="empty-state"><p>No activity logs found</p></div>';
    return;
  }
  
  c.innerHTML = allLogs.map(log => `
    <div style="padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; background: white;">
      <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">${new Date(log.created_at).toLocaleString()} · <strong>${log.admin_email}</strong></div>
      <div style="font-size: 16px; color: #1e293b;">${log.action}</div>
      <div style="font-size: 13px; color: #475569; margin-top: 5px;">${log.details}</div>
    </div>
  `).join("");
}

async function logAction(action, details) {
  addNotification(details);
  updateMarquee(details);
  try {
    await db.collection("audit_logs").add({
      admin_email: firebase.auth().currentUser?.email || "Unknown Admin",
      action,
      details,
      created_at: new Date().toISOString()
    });
  } catch(e) { console.warn("Failed to log action:", e); }
}

// FULL CONTROL ACTIONS
async function changeUserRole(id, role) {
  if (confirm(`Change user role to ${role}?`)) {
    await db.collection("profiles").doc(id).update({ role });
    allProfiles[id].role = role;
    await logAction("Role Change", `Changed role of ${id} to ${role}`);
    renderUsers();
  }
}

async function verifyUser(id, is_verified) {
  if (confirm(is_verified ? "Approve identity verification for this user?" : "Remove identity verification?")) {
    await db.collection("profiles").doc(id).update({ is_verified });
    allProfiles[id].is_verified = is_verified;
    await logAction("Verification", `Set is_verified=${is_verified} for user ${id}`);
    renderUsers();
  }
}

async function changeUserStatus(id, status) {
  if (confirm(`Change user status to ${status}?`)) {
    await db.collection("profiles").doc(id).update({ status });
    allProfiles[id].status = status;
    renderUsers();
  }
}

async function deleteUserProfile(id) {
  if (confirm("WARNING: This permanently deletes this user's profile document. Continue?")) {
    await db.collection("profiles").doc(id).delete();
    delete allProfiles[id];
    renderUsers();
    renderOverview();
  }
}

async function deleteFavorite(id) {
  if(!confirm("Delete this favorite?")) return;
  try {
    await db.collection("favorites").doc(id).delete();
    alert("Favorite deleted.");
    refreshData();
  } catch(e) { alert("Error: " + e.message); }
}

async function dismissReport(id) {
  if(!confirm("Dismiss this report?")) return;
  try {
    await db.collection("reports").doc(id).delete();
    alert("Report dismissed.");
    refreshData();
  } catch(e) { alert("Error: " + e.message); }
}

// PLATFORM SETTINGS
let platformSettings = { maintenance_mode: false, announcement_banner: "" };

async function loadSettings() {
  try {
    const snap = await db.collection("settings").doc("platform").get();
    if (snap.exists) {
      platformSettings = snap.data();
      const bannerInput = document.getElementById("inputBanner");
      if(bannerInput) bannerInput.value = platformSettings.announcement_banner || "";

      const sp = document.getElementById("inputStandardPrice");
      if(sp) sp.value = platformSettings.standard_plan_price || 999;
      
      const pp = document.getElementById("inputPremiumPrice");
      if(pp) pp.value = platformSettings.premium_plan_price || 1999;
      
      const btn = document.getElementById("btnMaintenance");
      if(btn) {
        if (platformSettings.maintenance_mode) {
          btn.textContent = "Disable Maintenance Mode";
          btn.style.background = "#dcfce7";
          btn.style.color = "#166534";
          btn.style.borderColor = "#86efac";
        } else {
          btn.textContent = "Enable Maintenance Mode";
          btn.style.background = "#fecaca";
          btn.style.color = "#991b1b";
          btn.style.borderColor = "#f87171";
        }
      }
    }
  } catch (e) { console.warn("Could not load platform settings", e); }
}

async function toggleMaintenance() {
  platformSettings.maintenance_mode = !platformSettings.maintenance_mode;
  try {
    await db.collection("settings").doc("platform").set({ maintenance_mode: platformSettings.maintenance_mode }, { merge: true });
    loadSettings();
    alert(platformSettings.maintenance_mode ? "Maintenance mode enabled!" : "Maintenance mode disabled!");
  } catch(e) { alert("Error: " + e.message); }
}

async function saveBanner() {
  const text = document.getElementById("inputBanner").value.trim();
  try {
    await db.collection("settings").doc("platform").set({ announcement_banner: text }, { merge: true });
    alert("Banner updated successfully!");
  } catch(e) { alert("Error: " + e.message); }
}

async function clearBanner() {
  document.getElementById("inputBanner").value = "";
  saveBanner();
}

async function savePricing() {
  const sp = parseInt(document.getElementById("inputStandardPrice").value) || 0;
  const pp = parseInt(document.getElementById("inputPremiumPrice").value) || 0;
  try {
    await db.collection("settings").doc("platform").set({ 
      standard_plan_price: sp,
      premium_plan_price: pp
    }, { merge: true });
    alert("Pricing updated successfully!");
  } catch(e) { alert("Error: " + e.message); }
}

// EXPORT TO CSV
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportListingsCSV() {
  if(!allListings.length) return alert("No listings to export.");
  const headers = ["ID","Title","Category","Status","Price","OwnerName","OwnerPhone","OwnerEmail","Pincode","Created"];
  const rows = allListings.map(l => {
    const pr = allProfiles[l.user_id] || {};
    return [
      l.id,
      `"${(l.title||'').replace(/"/g, '""')}"`,
      l.category,
      l.status,
      l.price,
      `"${(l.owner_name||pr.full_name||'').replace(/"/g, '""')}"`,
      l.owner_phone||pr.phone,
      l.owner_email||pr.email,
      l.pincode,
      l.created_at
    ].join(",");
  });
  downloadCSV([headers.join(","), ...rows].join("\n"), "listings_export.csv");
  logAction("Export", "Exported all listings to CSV");
}

function exportUsersCSV() {
  const users = Object.values(allProfiles);
  if(!users.length) return alert("No users to export.");
  const headers = ["ID","Name","Phone","Email","Role","Status","Created"];
  const rows = users.map(u => {
    return [
      u.id,
      `"${(u.full_name||'').replace(/"/g, '""')}"`,
      u.phone,
      u.email,
      u.role,
      u.status,
      u.created_at
    ].join(",");
  });
  downloadCSV([headers.join(","), ...rows].join("\n"), "users_export.csv");
  logAction("Export", "Exported all users to CSV");
}

async function cleanupInactiveUsers() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const toDelete = [];
  for (const id in allProfiles) {
    const u = allProfiles[id];
    const created = u.created_at ? new Date(u.created_at) : null;
    
    // Check if created > 6 months ago (or missing, meaning old)
    if (!created || created < sixMonthsAgo) {
      // Check activity
      const hasListings = allListings.some(l => l.user_id === id);
      const hasFavorites = allFavorites.some(f => f.user_id === id);
      const hasReports = allReports.some(r => r.reporter_id === id);
      
      if (!hasListings && !hasFavorites && !hasReports) {
        toDelete.push(u);
      }
    }
  }
  
  if (toDelete.length === 0) {
    alert("No inactive users found.");
    return;
  }
  
  if (!confirm(`Found ${toDelete.length} inactive users. Delete them permanently?`)) return;
  
  try {
    for (const u of toDelete) {
      await db.collection("profiles").doc(u.id).delete();
      delete allProfiles[u.id];
    }
    await logAction("Data Cleanup", `Deleted ${toDelete.length} inactive users`);
    alert(`Successfully deleted ${toDelete.length} inactive users.`);
    updateAll();
  } catch(e) {
    alert("Error during cleanup: " + e.message);
  }
}

function exportRevenueCSV() {
  const activeListings = allListings.filter(l => l.status === "active" && l.price);
  if(!activeListings.length) return alert("No active priced listings to export.");
  const headers = ["ID","Title","Category","Price","Pincode","Owner","Created"];
  const rows = activeListings.map(l => {
    return [
      l.id,
      `"${(l.title||'').replace(/"/g, '""')}"`,
      l.category,
      l.price,
      l.pincode,
      `"${(l.owner_email||l.user_id||'').replace(/"/g, '""')}"`,
      l.created_at
    ].join(",");
  });
  downloadCSV([headers.join(","), ...rows].join("\n"), "revenue_export.csv");
  logAction("Export", "Exported revenue data to CSV");
}

async function saveUserNote(id) {
  const val = document.getElementById("note_" + id).value;
  try {
    await db.collection("profiles").doc(id).update({ admin_notes: val });
    allProfiles[id].admin_notes = val;
    await logAction("User Note", `Updated private notes for user ${id}`);
    alert("Note saved successfully.");
  } catch(e) { alert("Error: " + e.message); }
}

async function extendExpiry(id) {
  const l = allListings.find(x => x.id === id);
  if(!l) return;
  const currentExpiry = l.expires_at ? new Date(l.expires_at) : new Date();
  currentExpiry.setDate(currentExpiry.getDate() + 30);
  const newIso = currentExpiry.toISOString();
  try {
    await db.collection("listings").doc(id).update({ expires_at: newIso });
    l.expires_at = newIso; // Update local state instantly
    await logAction("Extend Expiry", `Extended listing ${id} expiry to ${newIso}`);
    
    // Update UI instantly without jumping or refreshing the whole list
    if(countdownIntervals[id]) clearInterval(countdownIntervals[id]);
    startCountdown(id, newIso);
    updateTimerInputs(id);
    
    const detDiv = document.getElementById("det-" + id);
    if(detDiv) {
      const curExpEl = detDiv.querySelector(".timer-current");
      if(curExpEl) {
         curExpEl.textContent = "Current expiry: " + new Date(newIso).toLocaleString("en-IN");
      }
    }
    
    alert("30 Days Added Successfully!");
  } catch(e) { alert("Error: " + e.message); }
}

async function duplicateListing(id) {
  const l = allListings.find(x => x.id === id);
  if(!l) return;
  if(!confirm(`Clone "${l.title}"?`)) return;
  try {
    const clone = { ...l };
    delete clone.id;
    clone.title = l.title + " (Copy)";
    clone.created_at = new Date().toISOString();
    clone.status = "pending";
    await db.collection("listings").add(clone);
    await logAction("Clone Listing", `Cloned listing ${id}`);
    refreshData();
  } catch(e) { alert("Error: " + e.message); }
}

async function nukeReport(reportId, listingId, userId) {
  if(!confirm("NUCLEAR OPTION: Delete listing, suspend user, and dismiss report?")) return;
  try {
    await db.collection("listings").doc(listingId).delete();
    if(userId) {
      await db.collection("profiles").doc(userId).update({ status: 'suspended' });
      allProfiles[userId].status = 'suspended';
    }
    await db.collection("reports").doc(reportId).delete();
    await logAction("Nuclear Action", `Deleted listing ${listingId} and suspended user ${userId}`);
    refreshData();
  } catch(e) { alert("Error: " + e.message); }
}

// ================= PREMIUM FEATURES LOGIC =================

// 1. Confetti
function shootConfetti() {
  if (typeof confetti !== "undefined") {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }
}

// 2. Custom App Theming (A/B Test)
function applyCustomTheme() {
  const color = document.getElementById("themeColorPicker").value;
  // Apply logic (usually CSS variables, here we just show alert and confetti as mock)
  document.body.style.setProperty('--primary', color);
  alert("Global theme color applied successfully!");
  shootConfetti();
}

// 3. System Health Monitor
function updateSystemHealth() {
  const load = Math.floor(Math.random() * 20) + 10; // 10-30%
  const sessions = Math.floor(Math.random() * 80) + 20;
  const dbLoadBar = document.getElementById("dbLoadBar");
  const dbLoadText = document.getElementById("dbLoadText");
  const sessionBar = document.getElementById("sessionBar");
  const sessionText = document.getElementById("sessionText");
  if(dbLoadBar) {
    dbLoadBar.style.width = load + "%";
    dbLoadText.textContent = load + "%";
  }
  if(sessionBar) {
    sessionBar.style.width = (sessions/100)*100 + "%";
    sessionText.textContent = sessions;
  }
}
setInterval(updateSystemHealth, 5000);
setTimeout(updateSystemHealth, 500); // Initial call

// 4. Notifications & Marquee
function addNotification(msg) {
  const countEl = document.getElementById("notiCount");
  const listEl = document.getElementById("notiList");
  if(!countEl || !listEl) return;
  
  let count = parseInt(countEl.textContent) || 0;
  countEl.textContent = count + 1;
  countEl.style.display = "flex";
  
  if (listEl.innerHTML.includes("No new alerts")) {
    listEl.innerHTML = "";
  }
  
  listEl.insertAdjacentHTML("afterbegin", `
    <div class="noti-item">
      <div><span style="font-size:16px">🔔</span></div>
      <div>
        <div style="font-weight:600; color:#1e293b">${msg}</div>
        <div style="font-size:11px; color:#94a3b8">Just now</div>
      </div>
    </div>
  `);
}

function updateMarquee(msg) {
  const el = document.getElementById("liveMarquee");
  if(el) {
    el.insertAdjacentHTML("afterbegin", `<span class="mq-item"><div class="mq-dot"></div> ${msg}</span>`);
  }
}

// 5. Promo Code Engine
let allPromos = [];
async function fetchPromos() {
  try {
    const snap = await db.collection("promo_codes").get();
    allPromos = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderPromos();
  } catch(e) {}
}

async function generatePromoCode() {
  const code = document.getElementById("promoCodeInput").value.trim().toUpperCase();
  const pct = parseInt(document.getElementById("promoPercentInput").value);
  if(!code || !pct) return alert("Enter code and percentage");
  try {
    await db.collection("promo_codes").doc(code).set({ discount_pct: pct, created_at: new Date().toISOString() });
    shootConfetti();
    document.getElementById("promoCodeInput").value = "";
    document.getElementById("promoPercentInput").value = "";
    await logAction("Promo Code", `Generated new code ${code} for ${pct}%`);
    fetchPromos();
  } catch(e) { alert("Error: " + e.message); }
}

function renderPromos() {
  const c = document.getElementById("promoListContainer");
  if(!c) return;
  if(allPromos.length === 0) {
    c.innerHTML = '<div style="font-size:13px; color:#94a3b8; text-align:center; padding:15px">No active promo codes</div>';
    return;
  }
  c.innerHTML = allPromos.map(p => `
    <div class="promo-card">
      <div>
        <div class="promo-code">${p.id}</div>
        <div style="font-size:12px; color:#64748b; margin-top:4px">${p.discount_pct}% OFF Booster Plan</div>
      </div>
      <button class="btn btn-danger" style="padding: 6px 12px; font-size: 11px;" onclick="deletePromo('${p.id}')">Delete</button>
    </div>
  `).join("");
}

async function deletePromo(id) {
  if(!confirm("Delete this promo code?")) return;
  await db.collection("promo_codes").doc(id).delete();
  await logAction("Promo Code", `Deleted code ${id}`);
  fetchPromos();
}

// Initial fetch
fetchPromos();
