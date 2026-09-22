import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const SUPABASE_URL = "https://qvakretcgbjvwvdlvrmo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFub24iLCJpYXQiOjE3NTQ5MDQ4NjUsImV4cCI6MjA3MDQ4MDg2NX0.rK2XiwQPaMzTVUnkcCOiiH66fcKrbLwbIfOz6PD17Ys";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const state = { session:null, role:null, section:"overview", users:[], campaigns:[], applications:[], categories:[], logs:[], userMap:new Map(), campaignMap:new Map(), applicationMap:new Map(), search:"" };
const $ = (s) => document.querySelector(s);
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const date = v => v ? new Date(v).toLocaleString() : "—";
const badge = (text, cls="") => `<span class="badge ${cls}">${esc(text)}</span>`;

function render(){ document.body.innerHTML = state.session ? appShell() : loginView(); bind(); }
function loginView(){ return `
<div class="auth-shell"><div class="auth-card">
  <div class="logo"><span class="logo-mark">UG</span><span>UGC HUB</span></div>
  <h1>Admin console</h1><p>Sign in with an authorized UGC Hub administrator or moderator account.</p>
  <form id="login">
    <div class="field"><label>Email</label><input id="email" type="email" autocomplete="username" required /></div>
    <div class="field"><label>Password</label><input id="password" type="password" autocomplete="current-password" required /></div>
    <button class="primary">Sign in</button>
    <div id="login-error" class="error hidden"></div>
  </form>
</div></div>`; }

function appShell(){
 const nav=[["overview","Overview"],["users","Users"],["campaigns","Campaigns"],["applications","Applications"]];
 if(state.role==="admin") nav.push(["logs","Moderation log"]);
 return `<div class="app">
  <aside class="sidebar">
    <div class="logo"><span class="logo-mark">UG</span><span>UGC HUB</span></div>
    <nav class="nav">${nav.map(([id,label])=>`<button class="${state.section===id?"active":""}" data-section="${id}">${label}</button>`).join("")}</nav>
    <div class="sidebar-footer"><div class="user-mini">${esc(state.session.user.email)} · ${esc(state.role)}</div><button id="logout" class="logout">Sign out</button></div>
  </aside>
  <main class="main"><header class="topbar"><h1>${nav.find(x=>x[0]===state.section)?.[1]||"Admin"}</h1><span class="role-badge">${esc(state.role)}</span></header><section class="content">${sectionView()}</section></main>
 </div>${state.modal?state.modal:""}${state.toast?`<div class="toast">${esc(state.toast)}</div>`:""}`; }

function sectionView(){
 if(state.section==="overview") return overview();
 if(state.section==="users") return usersView();
 if(state.section==="campaigns") return campaignsView();
 if(state.section==="applications") return applicationsView();
 return logsView();
}
function overview(){
 const blocked=state.users.filter(u=>u.is_blocked).length, removedC=state.campaigns.filter(c=>c.is_removed).length, removedA=state.applications.filter(a=>a.is_removed).length;
 return `<div class="stats">
 <div class="stat"><div class="label">Users</div><div class="value">${state.users.length}</div></div>
 <div class="stat"><div class="label">Blocked users</div><div class="value">${blocked}</div></div>
 <div class="stat"><div class="label">Campaigns</div><div class="value">${state.campaigns.length}</div></div>
 <div class="stat"><div class="label">Removed content</div><div class="value">${removedC+removedA}</div></div>
 </div>
 <div class="panel"><div class="panel-head"><h2>Moderation queue</h2></div><div class="detail-grid">
  <div class="detail"><div class="k">Removed campaigns</div><div class="v">${removedC}</div></div>
  <div class="detail"><div class="k">Removed applications</div><div class="v">${removedA}</div></div>
  <div class="detail"><div class="k">Blocked users</div><div class="v">${blocked}</div></div>
  <div class="detail"><div class="k">Role</div><div class="v">${esc(state.role)}</div></div>
 </div></div>`; }

function usersView(){
 const term=state.search.toLowerCase();
 const rows=state.users.filter(u=>[u.full_name,u.username,u.email,u.role].some(v=>String(v||"").toLowerCase().includes(term)));
 return `<div class="panel"><div class="panel-head"><h2>Users</h2><div class="toolbar"><input id="search" class="search" placeholder="Search users..." value="${esc(state.search)}" /></div></div>
 <div class="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Country</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>
 ${rows.map(u=>`<tr><td><strong>${esc(u.full_name||u.username||"Unnamed")}</strong><br><span class="muted">@${esc(u.username||"—")} · ${esc(u.email||"—")}</span></td><td>${badge(u.role||"—",u.role==="Brand"?"badge-blue":"badge-amber")}</td><td>${esc(u.country||"—")}</td><td>${date(u.created_at)}</td><td>${u.is_blocked?badge("Blocked","badge-red"):badge("Active","badge-green")}</td><td><div class="actions">${u.is_blocked?`<button class="btn btn-success" data-action="unblock-user" data-id="${u.id}">Unblock</button>`:`<button class="btn btn-danger" data-action="block-user" data-id="${u.id}">Block</button>`}<button class="btn" data-action="remove-avatar" data-id="${u.id}">Remove photo</button></div></td></tr>`).join("")||`<tr><td colspan="6"><div class="empty">No users found.</div></td></tr>`}
 </tbody></table></div></div>`; }

function campaignsView(){
 const term=state.search.toLowerCase();
 const rows=state.campaigns.filter(c=>[c.title,c.description,c.status].some(v=>String(v||"").toLowerCase().includes(term)));
 return `<div class="panel"><div class="panel-head"><h2>Campaigns</h2><div class="toolbar"><input id="search" class="search" placeholder="Search campaigns..." value="${esc(state.search)}" /></div></div>
 <div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Brand</th><th>Status</th><th>Due</th><th>Budget</th><th>Moderation</th><th>Actions</th></tr></thead><tbody>
 ${rows.map(c=>`<tr><td><strong>${esc(c.title)}</strong><br><span class="muted">${esc((c.description||"").slice(0,100))}</span></td><td>${esc(state.userMap.get(c.brand_id)?.full_name||"—")}</td><td>${badge(c.status||"—",c.status==="Open"?"badge-green":c.status==="Completed"?"badge-blue":"badge-amber")}</td><td>${esc(c.application_due_date||"—")}</td><td>${c.budget==null?"—":esc(c.budget)}</td><td>${c.is_removed?badge("Removed","badge-red"):badge("Visible","badge-green")}</td><td><div class="actions"><button class="btn btn-violet" data-action="view-campaign" data-id="${c.id}">View</button>${c.is_removed?`<button class="btn btn-success" data-action="restore-campaign" data-id="${c.id}">Restore</button>`:`<button class="btn btn-danger" data-action="remove-campaign" data-id="${c.id}">Remove</button>`}</div></td></tr>`).join("")||`<tr><td colspan="7"><div class="empty">No campaigns found.</div></td></tr>`}
 </tbody></table></div></div>`; }

function applicationsView(){
 const term=state.search.toLowerCase();
 const rows=state.applications.filter(a=>[a.message,a.status,state.userMap.get(a.ugc_id)?.username,state.campaignMap.get(a.campaign_id)?.title].some(v=>String(v||"").toLowerCase().includes(term)));
 return `<div class="panel"><div class="panel-head"><h2>Applications / messages</h2><div class="toolbar"><input id="search" class="search" placeholder="Search applications..." value="${esc(state.search)}" /></div></div>
 <div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Creator</th><th>Message</th><th>Status</th><th>Applied</th><th>Moderation</th><th>Actions</th></tr></thead><tbody>
 ${rows.map(a=>`<tr><td>${esc(state.campaignMap.get(a.campaign_id)?.title||"—")}</td><td>${esc(state.userMap.get(a.ugc_id)?.username||"—")}</td><td>${esc(a.message||"—")}</td><td>${badge(a.status||"—","badge-blue")}</td><td>${date(a.applied_at)}</td><td>${a.is_removed?badge("Removed","badge-red"):badge("Visible","badge-green")}</td><td>${a.is_removed?`<button class="btn btn-success" data-action="restore-application" data-id="${a.id}">Restore</button>`:`<button class="btn btn-danger" data-action="remove-application" data-id="${a.id}">Remove</button>`}</td></tr>`).join("")||`<tr><td colspan="7"><div class="empty">No applications found.</div></td></tr>`}
 </tbody></table></div></div>`; }

function logsView(){
 return `<div class="panel"><div class="panel-head"><h2>Moderation log</h2></div><div class="table-wrap"><table><thead><tr><th>Action</th><th>Target</th><th>Reason</th><th>Time</th></tr></thead><tbody>${state.logs.map(l=>`<tr><td>${badge(l.action,"badge-amber")}</td><td>${esc(l.target_user_id||l.target_campaign_id||l.target_application_id||"—")}</td><td>${esc(l.reason||"—")}</td><td>${date(l.created_at)}</td></tr>`).join("")||`<tr><td colspan="4"><div class="empty">No moderation actions yet.</div></td></tr>`}</tbody></table></div></div>`; }

function campaignModal(c){
 return `<div class="modal" id="modal"><div class="modal-card"><div class="modal-head"><h2>${esc(c.title)}</h2><button class="close" data-close>×</button></div><div class="detail-grid">
 <div class="detail"><div class="k">Brand</div><div class="v">${esc(state.userMap.get(c.brand_id)?.full_name||"—")}</div></div>
 <div class="detail"><div class="k">Category</div><div class="v">${esc(state.categories.find(x=>x.id===c.category_id)?.name||"—")}</div></div>
 <div class="detail"><div class="k">Status</div><div class="v">${esc(c.status||"—")}</div></div>
 <div class="detail"><div class="k">Budget</div><div class="v">${c.budget==null?"—":esc(c.budget)}</div></div>
 <div class="detail"><div class="k">Application due date</div><div class="v">${esc(c.application_due_date||"—")}</div></div>
 <div class="detail"><div class="k">Created</div><div class="v">${date(c.created_at)}</div></div>
 <div class="detail" style="grid-column:1/-1"><div class="k">Description</div><div class="v">${esc(c.description||"—")}</div></div>
 <div class="detail" style="grid-column:1/-1"><div class="k">Requirements</div><div class="v">${esc((c.requirements||[]).join(" · ")||"—")}</div></div>
 </div><div class="modal-actions"><button class="btn" data-close>Close</button>${c.is_removed?`<button class="btn btn-success" data-action="restore-campaign" data-id="${c.id}">Restore campaign</button>`:`<button class="btn btn-danger" data-action="remove-campaign" data-id="${c.id}">Remove campaign</button>`}</div></div></div>`; }

async function load(){
 const [users,campaigns,applications,categories] = await Promise.all([
  supabase.from("users").select("*").order("created_at",{ascending:false}),
  supabase.from("campaigns").select("*").order("created_at",{ascending:false}),
  supabase.from("campaign_applications").select("*").order("applied_at",{ascending:false}),
  supabase.from("categories").select("*").order("name")
 ]);
 for(const r of [users,campaigns,applications,categories]) if(r.error) throw r.error;
 state.users=users.data||[]; state.campaigns=campaigns.data||[]; state.applications=applications.data||[]; state.categories=categories.data||[];
 state.userMap=new Map(state.users.map(x=>[x.id,x])); state.campaignMap=new Map(state.campaigns.map(x=>[x.id,x])); state.applicationMap=new Map(state.applications.map(x=>[x.id,x]));
 if(state.role==="admin"){ const r=await supabase.from("moderation_actions").select("*").order("created_at",{ascending:false}).limit(200); if(!r.error) state.logs=r.data||[]; }
 render();
}

async function moderate(action,payload){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session) throw new Error("Your session has expired.");
 const reason=prompt("Reason (optional):") ?? "";
 const res=await fetch(SUPABASE_URL+"/functions/v1/admin-moderation",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({action,reason,...payload})});
 const body=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(body.error||"Moderation action failed");
 state.toast="Action completed";
 setTimeout(()=>{state.toast=null;},2200);
 await load();
}

function bind(){
 $("#login")?.addEventListener("submit",async e=>{e.preventDefault(); const err=$("#login-error"); err.classList.add("hidden"); const {error}=await supabase.auth.signInWithPassword({email:$("#email").value,password:$("#password").value}); if(error){err.textContent=error.message;err.classList.remove("hidden");}});
 $("#logout")?.addEventListener("click",async()=>{await supabase.auth.signOut();state.session=null;state.role=null;render();});
 document.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>{state.section=b.dataset.section;state.search="";render();}));
 $("#search")?.addEventListener("input",e=>{state.search=e.target.value; const y=window.scrollY; render(); window.scrollTo(0,y);});
 document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{state.modal=null;render();}));
 document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",async()=>{try{
   const a=b.dataset.action,id=b.dataset.id;
   if(a==="view-campaign"){state.modal=campaignModal(state.campaignMap.get(id));render();return;}
   if(a==="block-user"||a==="unblock-user") await moderate(a==="block-user"?"block_user":"unblock_user",{userId:id});
   if(a==="remove-avatar") await moderate("remove_profile_image",{userId:id});
   if(a==="remove-campaign"||a==="restore-campaign") { state.modal=null; await moderate(a,{campaignId:id}); }
   if(a==="remove-application"||a==="restore-application") await moderate(a,{applicationId:id});
 }catch(e){alert(e.message||String(e));}}));
}

async function boot(){
 const {data:{session}}=await supabase.auth.getSession();
 state.session=session;
 if(session){
   const {data:role,error}=await supabase.from("admin_roles").select("role").eq("user_id",session.user.id).maybeSingle();
   if(error||!role){await supabase.auth.signOut();state.session=null; alert("This account is not authorized for the UGC Hub admin console.");}
   else {state.role=role.role; await load();}
 }
 render();
}
supabase.auth.onAuthStateChange((_event,session)=>{state.session=session; if(!session){state.role=null;render();}});
boot();