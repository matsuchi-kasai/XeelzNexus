const $=id=>document.getElementById(id);
const USERS="xeelz_nexus_users", SESSION="xeelz_nexus_session";
const SOURCE_URLS={xeelz:"#",github:"#",vercel:"#"};

const users=()=>JSON.parse(localStorage.getItem(USERS)||"[]");
const saveUsers=u=>localStorage.setItem(USERS,JSON.stringify(u));
const current=()=>localStorage.getItem(SESSION)||"";
const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const limitKey=()=>`xeelz_nexus_local_${current()}_${day()}`;

function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove("show"),2400)}
function show(id){
  ["login","home","profile","premium"].forEach(x=>$(x).classList.toggle("hidden",x!==id));
  $("bottomNav").classList.toggle("hidden",id==="login");
  document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="home")updateLimit();
}
function enter(email){
  localStorage.setItem(SESSION,email);
  $("userEmail").textContent=email;$("profileEmail").textContent=email;
  const ch=(email[0]||"X").toUpperCase();$("avatar").textContent=ch;$("profileAvatar").textContent=ch;
  $("amEmail").value=email;show("home");
}
function updateLimit(){
  const used=Number(localStorage.getItem(limitKey())||0),left=Math.max(0,5-used);
  $("limitText").textContent=`${left} / 5`;
  $("limitBar").style.width=`${(left/5)*100}%`;
}
function setBusy(btn,busy,text){
  btn.disabled=busy;
  if(busy){btn.dataset.old=btn.innerHTML;btn.innerHTML=text||"PROCESSING..."}else if(btn.dataset.old){btn.innerHTML=btn.dataset.old}
}

// Website statistics: one persistent visitor ID per browser + 60s heartbeat.
const VISITOR_ID_KEY="xeelz_nexus_visitor_id";
function visitorId(){
  let id=localStorage.getItem(VISITOR_ID_KEY);
  if(!id){
    id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(VISITOR_ID_KEY,id);
  }
  return id;
}
async function refreshStats(action="heartbeat"){
  try{
    const r=await fetch(`/api/stats?action=${encodeURIComponent(action)}&visitorId=${encodeURIComponent(visitorId())}`,{cache:"no-store"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);
    if($('activeUsers'))$('activeUsers').textContent=Number(d.activeUsers||0).toLocaleString("id-ID");
    if($('totalVisits'))$('totalVisits').textContent=Number(d.totalVisits||0).toLocaleString("id-ID");
  }catch(e){
    // Keep the UI at 0 if the shared counter is not configured yet.
    if($('activeUsers') && !$('activeUsers').textContent)$('activeUsers').textContent="0";
    if($('totalVisits') && !$('totalVisits').textContent)$('totalVisits').textContent="0";
  }
}
refreshStats("visit");
setInterval(()=>refreshStats("heartbeat"),20000);

document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");
  $("loginForm").classList.toggle("hidden",t.dataset.tab!=="loginForm");
  $("registerForm").classList.toggle("hidden",t.dataset.tab!=="registerForm");
});
document.querySelectorAll(".eye").forEach(b=>b.onclick=()=>{const i=$(b.dataset.eye);i.type=i.type==="password"?"text":"password"});

$("registerForm").onsubmit=e=>{
  e.preventDefault();
  const email=$("regEmail").value.trim().toLowerCase(),p=$("regPass").value;
  if(p!==$("regPass2").value)return toast("Password tidak sama");
  let u=users();
  if(u.some(x=>x.email===email))return toast("Email sudah terdaftar");
  u.push({email,password:p});saveUsers(u);enter(email);toast("Register berhasil");
};
$("loginForm").onsubmit=e=>{
  e.preventDefault();
  const email=$("loginEmail").value.trim().toLowerCase(),p=$("loginPass").value;
  if(!users().some(x=>x.email===email&&x.password===p))return toast("Email atau password salah");
  enter(email);toast("Login berhasil");
};
function logout(){localStorage.removeItem(SESSION);show("login");toast("Logout berhasil")}
$("logout2").onclick=logout;
$("brand").onclick=()=>current()?show("home"):show("login");
$("linksBtn").onclick=()=>$("linksPanel").classList.toggle("hidden");
$("closePanel").onclick=()=>$("linksPanel").classList.add("hidden");
$("profileBtn").onclick=$("profileBtn2").onclick=()=>show("profile");
$("premiumBtn").onclick=$("premiumBtn2").onclick=()=>{ $("amEmail").value=current(); show("premium") };
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>show("home"));
document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>show(b.dataset.nav));

function setSource(id,url){
  const el=$(id);el.href=url;
  if(!url||url==="#")el.onclick=e=>{e.preventDefault();toast("URL source belum diisi di public/app.js")};
}
setSource("sourceXeelz",SOURCE_URLS.xeelz);setSource("sourceGithub",SOURCE_URLS.github);setSource("sourceVercel",SOURCE_URLS.vercel);

const slides=$("slides"),dots=[...document.querySelectorAll(".dot")];
slides.addEventListener("scroll",()=>{const i=Math.min(1,Math.round(slides.scrollLeft/slides.clientWidth));dots.forEach((d,n)=>d.classList.toggle("active",n===i))});

let verifiedToken="",verifiedEmail="";
async function api(path,body){
  const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||d.message||d.detail||`HTTP ${r.status}`);
  return d;
}

$("sendLink").onclick=async()=>{
  const email=$("amEmail").value.trim();
  if(!email)return $("linkResult").textContent="Masukkan email Alight Motion.";
  $("linkResult").textContent="Mengirim magic link...";
  setBusy($("sendLink"),true,"SENDING...");
  try{
    const d=await api("/api/send-magic-link",{email});
    const data=d.data||d;
    $("linkResult").textContent=`✓ Magic link berhasil dikirim ke ${data.email||email}. Cek email lalu tempel link verifikasi di langkah 02.`;
    toast("Magic link terkirim");
  }catch(e){$("linkResult").textContent="✕ "+e.message}
  finally{setBusy($("sendLink"),false)}
};

$("verify").onclick=async()=>{
  const email=$("amEmail").value.trim(),rawLink=$("rawLink").value.trim();
  if(!email||!rawLink)return $("verifyResult").textContent="Email dan raw link wajib diisi.";
  $("verifyResult").textContent="Memverifikasi akun...";
  setBusy($("verify"),true,"VERIFYING...");
  try{
    const d=await api("/api/verify-account",{email,rawLink});
    verifiedToken=d.idToken||d.data?.idToken||"";
    verifiedEmail=d.profile?.email||d.data?.profile?.email||email;
    if(!verifiedToken)throw new Error("idToken tidak ditemukan pada response provider.");
    $("verifyResult").textContent=`✓ Akun terverifikasi: ${verifiedEmail}. Sekarang tekan APPLY PREMIUM.`;
    $("apply").disabled=false;toast("Verify berhasil");
  }catch(e){verifiedToken="";$("apply").disabled=true;$("verifyResult").textContent="✕ "+e.message}
  finally{setBusy($("verify"),false)}
};

$("apply").onclick=async()=>{
  if(!verifiedToken)return $("applyResult").textContent="Verify account dulu.";
  const localUsed=Number(localStorage.getItem(limitKey())||0);
  if(localUsed>=5)return $("applyResult").textContent="Limit lokal 5 kali hari ini sudah habis.";
  $("applyResult").textContent="Mengaktifkan premium...";
  setBusy($("apply"),true,"APPLYING...");
  try{
    const d=await api("/api/apply-premium",{idToken:verifiedToken,email:verifiedEmail||$("amEmail").value.trim()});
    localStorage.setItem(limitKey(),String(localUsed+1));updateLimit();
    const order=d.orderId||d.data?.orderId||"-";
    $("applyResult").textContent=`✓ PREMIUM BERHASIL. Order ID: ${order}`;
    toast("Premium berhasil diproses");
  }catch(e){$("applyResult").textContent="✕ "+e.message}
  finally{setBusy($("apply"),false)}
};

setInterval(updateLimit,30000);
if(current())enter(current());else show("login");
