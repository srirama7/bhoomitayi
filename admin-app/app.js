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
let allListings = [], allProfiles = {}, currentFilter = "all", countdownIntervals = {};

// AUTH - Sign in with Firebase Auth so Firestore rules work
document.getElementById("loginBtn").onclick = async () => {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if (u === "admin" && p === "admin") {
    try {
      // Sign in with Firebase Auth using the admin account
      await auth.signInWithEmailAndPassword("admin@admin.com", "admin123");
      sessionStorage.setItem("adminAuth", "true");
      showDashboard();
    } catch (e) {
      console.error("Firebase Auth error:", e);
      const err = document.getElementById("loginError");
      err.textContent = "Auth failed: " + e.message;
      err.style.display = "block";
      setTimeout(() => err.style.display = "none", 5000);
    }
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

// Auto-login if session exists and Firebase auth state persists
auth.onAuthStateChanged(user => {
  if (user && sessionStorage.getItem("adminAuth") === "true") {
    showDashboard();
  }
});

// TABS
const tabIds = ["tab-overview", "tab-listings", "tab-analytics", "tab-revenue"];
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    this.classList.add("active");
    tabIds.forEach(id => document.getElementById(id).classList.add("hidden"));
    document.getElementById("tab-" + this.dataset.tab).classList.remove("hidden");
  });
});

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
    allProfiles = {};
    profSnap.forEach(d => allProfiles[d.id] = d.data());
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
  }catch(e){console.error("Error:",e)}
}

function updateAll(){updateStats();renderListings();renderAnalytics();renderRevenue();drawOverviewChart()}

function updateStats(){
  const t=allListings.length,p=allListings.filter(l=>l.status==="pending").length;
  const a=allListings.filter(l=>l.status==="active").length,r=allListings.filter(l=>l.status==="rejected").length;
  const to=allListings.filter(l=>l.status==="timed_out").length;
  const wt=allListings.filter(l=>l.expires_at&&new Date(l.expires_at)>new Date()).length;
  const tv=allListings.reduce((s,l)=>s+(l.price||0),0);
  document.getElementById("statAll").textContent=t;document.getElementById("statPending").textContent=p;
  document.getElementById("statActive").textContent=a;document.getElementById("statRejected").textContent=r;
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
    <div class="detail-item"><div class="detail-label">Price</div><div class="detail-value">${formatPrice(l.price)}</div></div>
    <div class="detail-item"><div class="detail-label">Address</div><div class="detail-value">${l.address||'-'}</div></div>
    <div class="detail-item"><div class="detail-label">Pincode</div><div class="detail-value">${l.pincode||'-'}</div></div>
    <div class="detail-item"><div class="detail-label">Owner</div><div class="detail-value">${pr.full_name||'Unknown'}</div></div>
    <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${pr.phone||'-'}</div></div>
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
    <div class="timer-inputs">
      <div class="timer-field"><label>Years</label><input type="number" min="0" id="ty-${l.id}" value="0"></div>
      <div class="timer-field"><label>Months</label><input type="number" min="0" max="11" id="tm-${l.id}" value="0"></div>
      <div class="timer-field"><label>Days</label><input type="number" min="0" max="30" id="td-${l.id}" value="0"></div>
      <div class="timer-field"><label>Hours</label><input type="number" min="0" max="23" id="th-${l.id}" value="0"></div>
      <div class="timer-field"><label>Mins</label><input type="number" min="0" max="59" id="tmin-${l.id}" value="0"></div>
      <button class="btn btn-primary" onclick="setTimer('${l.id}')" style="margin-top:16px">Save Timer</button>
      <button class="btn btn-danger" onclick="clearTimer('${l.id}')" style="margin-top:16px" ${l.expires_at?'':'disabled'}>Clear Timer</button>
    </div>
    ${l.expires_at?`<div class="timer-current">Current expiry: ${new Date(l.expires_at).toLocaleString("en-IN")}</div>`:''}
  </div>`;

  let acts='';
  if(l.status==="pending")acts+=`<button class="btn btn-primary" onclick="doAction('${l.id}','approve')">✓ Approve</button>`;
  if(l.status!=="rejected"&&l.status!=="timed_out")acts+=`<button class="btn" style="color:#d97706;border-color:#fcd34d" onclick="doAction('${l.id}','reject')">✕ Reject</button>`;
  if(l.status==="timed_out"||l.status==="rejected")acts+=`<button class="btn" style="color:#6366f1;border-color:#a5b4fc" onclick="doAction('${l.id}','relaunch')">↻ Relaunch</button>`;
  acts+=`<button class="btn btn-danger" onclick="doAction('${l.id}','delete')">🗑 Delete</button>`;

  return `<div class="listing-card" id="card-${l.id}">
    <div class="listing-top" onclick="toggleExpand('${l.id}')">
      ${img}<div class="listing-info"><div class="listing-name">${l.title} ${badge} ${timer}</div>
      <div class="listing-meta">${l.category} · ${pr.full_name||'Unknown'} · ${pr.phone||''}</div></div>
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
  const listing=allListings.find(l=>l.id===id);
  if(listing&&listing.expires_at&&det.classList.contains("show")){
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
async function doAction(id,action){
  const l=allListings.find(x=>x.id===id);
  const t={approve:"Approve Listing",reject:"Reject Listing",delete:"Delete Listing",relaunch:"Relaunch Listing"};
  const d={approve:`Approve "${l.title}"?`,reject:`Reject "${l.title}"?`,delete:`Permanently delete "${l.title}"?`,relaunch:`Relaunch "${l.title}"?`};
  document.getElementById("modalTitle").textContent=t[action];document.getElementById("modalDesc").textContent=d[action];
  document.getElementById("confirmModal").classList.remove("hidden");
  document.getElementById("modalConfirm").onclick=async()=>{closeModal();
    try{if(action==="delete")await db.collection("listings").doc(id).delete();
      else if(action==="relaunch")await db.collection("listings").doc(id).update({status:"active",expires_at:null,updated_at:new Date().toISOString()});
      else await db.collection("listings").doc(id).update({status:action==="approve"?"active":"rejected",updated_at:new Date().toISOString()});
      refreshData()}catch(e){alert("Error: "+e.message)}};
}
function closeModal(){document.getElementById("confirmModal").classList.add("hidden")}

// ─── BAR CHART DRAWING ───
const COLORS=["#ec4899","#8b5cf6","#22c55e","#ef4444","#3b82f6","#f59e0b","#06b6d4","#f97316"];
function drawBarChart(canvasId,labels,values,colors){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext("2d");
  const dpr=window.devicePixelRatio||1;
  canvas.width=canvas.offsetWidth*dpr;canvas.height=canvas.offsetHeight*dpr;
  ctx.scale(dpr,dpr);
  const W=canvas.offsetWidth,H=canvas.offsetHeight;
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
