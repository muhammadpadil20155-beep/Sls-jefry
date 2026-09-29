const U=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,T=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
async function r(cmd){const x=await fetch(U,{method:"POST",headers:{Authorization:"Bearer "+T},body:JSON.stringify(cmd)});return (await x.json()).result}
const norm=w=>String(w||"").replace(/\D/g,"").replace(/^0/,"62");
async function send(target,message){if(!process.env.FONNTE_TOKEN||!target)return;try{await fetch("https://api.fonnte.com/send",{method:"POST",headers:{"Content-Type":"application/json",Authorization:process.env.FONNTE_TOKEN},body:JSON.stringify({target,message})})}catch(e){}}
async function getState(){let s=await r(["GET","sls:state"]);s=s?JSON.parse(s):{teams:[],users:[],jadwal:[],stat:[],news:[],cfg:{}};
 const q=(await r(["LRANGE","sls:q",0,-1]))||[];
 if(q.length){for(const i of q){const d=JSON.parse(i);if(d.team&&!s.teams.some(t=>t.name.toLowerCase()==d.team.name.toLowerCase()))s.teams.push(d.team);if(!s.users.some(u=>u.wa==d.me.wa))s.users.push(d.me)}
  await r(["SET","sls:state",JSON.stringify(s)]);await r(["LTRIM","sls:q",q.length,-1])}
 return s}
const setState=s=>r(["SET","sls:state",JSON.stringify(s)]);
const card=(t,b)=>"━━━━━━━━━━━━━━━\n*"+t+"*\n━━━━━━━━━━━━━━━\n"+b+"\n\n_SLS • Sea League Series Divisi 2_";
async function sendImg(target,message,url){if(!process.env.FONNTE_TOKEN||!target)return;
 try{if(url){const x=await fetch("https://api.fonnte.com/send",{method:"POST",headers:{"Content-Type":"application/json",Authorization:process.env.FONNTE_TOKEN},body:JSON.stringify({target,message,url})});const j=await x.json();if(j&&j.status)return}}catch(e){}
 return send(target,message)}
const H={};
const isOwner=req=>!!process.env.OWNER_CODE&&req.headers["x-owner-code"]===process.env.OWNER_CODE;
H.state=async(req,res)=>{
 try{
  const s=await getState();
  if(req.method=="POST"){
   if(!isOwner(req))return res.status(401).json({error:"unauthorized"});
   const n=req.body;if(!n||!Array.isArray(n.teams)||!Array.isArray(n.users))return res.status(400).json({error:"bad"});
   for(const t of n.teams){if(!t.ok)continue;const o=s.teams.find(x=>x.name==t.name);
    if(o&&!o.ok)for(const u of n.users.filter(u=>u.team==t.name))await send(u.wa,card("TIM DISETUJUI ✅","Halo *"+u.user+"*,\nTim *"+t.name+"* resmi terdaftar di SLS Divisi 2.\nSelamat bergabung dan semoga sukses! 🔥\n\nKetik *.menu* untuk info turnamen."))}
   await setState(n);return res.json({ok:true});
  }
  if(isOwner(req))return res.json(s);
  const c=Object.assign({},s.cfg);delete c.code;
  res.json(Object.assign({},s,{cfg:c,users:s.users.map(u=>({user:u.user,team:u.team,ok:u.ok}))}));
 }catch(e){res.status(500).json({error:String(e)})}};
H.register=async(req,res)=>{
 if(req.method!="POST")return res.status(405).end();
 try{
  const {me,team}=req.body||{};
  if(!me||!me.user||!me.team)return res.status(400).json({error:"bad"});
  me.wa=norm(me.wa);if(me.wa.length<9)return res.status(400).json({error:"wa"});
  const s=await getState();
  if(s.cfg&&s.cfg.closed)return res.status(403).json({error:"closed"});
  if(s.users.some(u=>u.wa==me.wa))return res.status(409).json({error:"dup"});if(s.users.some(u=>String(u.user).toLowerCase()==String(me.user).toLowerCase()))return res.status(409).json({error:"user"});if(!me.pwh||String(me.pwh).length!=64)return res.status(400).json({error:"pw"});
  await r(["RPUSH","sls:q",JSON.stringify({me,team:team||null})]);
  await send(me.wa,card("PENDAFTARAN DITERIMA 📝","Halo *"+me.user+"*!\n🛡 Tim: *"+me.team+"*\n📌 Status: "+(team?"menunggu persetujuan admin":"terdaftar")+"\n\nKetik *.menu* untuk info turnamen."));
  await send(process.env.ADMIN_WA,card("PENDAFTAR BARU 🔔","👤 Username: *"+me.user+"*\n🛡 Tim: "+me.team+(team?" _(baru)_":"")+"\n📱 WA: "+me.wa+"\n💬 Discord: "+(me.dc||"-")));
  res.json({ok:true});
 }catch(e){res.status(500).json({error:String(e)})}};
H.login=async(req,res)=>{
 try{const {user,pwh}=req.body||{},s=await getState();
  const u=s.users.find(x=>String(x.user).toLowerCase()==String(user||"").toLowerCase()&&x.pwh&&x.pwh===pwh);
  if(!u)return res.status(404).json({});
  res.json(Object.assign({},u,{ok:u.ok||s.teams.some(t=>t.name==u.team&&t.ok)}));
 }catch(e){res.status(500).json({})}};
H.cron=async(req,res)=>{
 if(process.env.CRON_SECRET&&req.headers.authorization!=="Bearer "+process.env.CRON_SECRET)return res.status(401).end();
 const s=await getState(),d=n=>new Date(Date.now()+7*36e5+n*864e5).toISOString().slice(0,10),today=d(0),tom=d(1);let n=0;
 for(const j of s.jadwal||[]){if(j.tgl!=today&&j.tgl!=tom)continue;if(j.sa!==""&&j.sa!=null)continue;
  for(const u of s.users.filter(u=>u.team==j.a||u.team==j.b)){await send(u.wa,card("PENGINGAT MATCH ⏰","*"+j.a+"* vs *"+j.b+"*\n📅 "+(j.tgl==today?"HARI INI":"Besok")+"  🕒 "+j.jam+"\n\nSiapkan tim, jangan sampai telat! 🔥"));n++}}
 res.json({sent:n})};
const MENU="Halo! Ini bot resmi *SLS Divisi 2*. Pilih perintah:\n\n📋 *.info* — info turnamen\n🛡 *.tim* — daftar tim\n📅 *.jadwal* — jadwal permainan\n🏆 *.klasemen* — klasemen\n🔥 *.top* — pemain terbaik\n👤 *.status* — cek pendaftaranmu\n📝 *.daftar* — link pendaftaran";
function stand(s){const T={};s.teams.filter(t=>t.ok).forEach(t=>T[t.name]={n:t.name,m:0,p:0,w:0});
 (s.jadwal||[]).forEach(j=>{if(j.sa===""||j.sa==null||!T[j.a]||!T[j.b])return;const a=+j.sa,b=+j.sb;T[j.a].m++;T[j.b].m++;
  if(a>b){T[j.a].p+=3;T[j.a].w++}else if(b>a){T[j.b].p+=3;T[j.b].w++}else{T[j.a].p++;T[j.b].p++}});
 return Object.values(T).sort((x,y)=>y.p-x.p||y.w-x.w)}
const medal=i=>["🥇","🥈","🥉"][i]||(i+1)+".";
H.webhook=async(req,res)=>{
 try{
  const b=req.body||{},from=b.sender,m=String(b.message||"").trim().toLowerCase().replace(/^[.!\/]/,"");
  if(!from||b.member||!m)return res.status(200).end();
  const s=await getState(),c=s.cfg||{},ok=s.teams.filter(t=>t.ok),site=(process.env.SITE_URL||"").replace(/\/$/,"");let t;
  if(m=="info")t=card("INFO TURNAMEN 📋","🛡 Slot tim: *"+ok.length+"/"+(c.max||16)+"*\n🎮 Format: "+(c.format||"-")+"\n💰 Biaya: "+(c.biaya||"-")+"\n🏅 Hadiah: "+(c.hadiah||"-")+"\n🗓 Mulai: "+(c.mulai||"-")+"\n📌 Pendaftaran: *"+(c.closed?"ditutup":"dibuka")+"*");
  else if(m=="tim")t=card("TIM TERDAFTAR 🛡 ("+ok.length+")",ok.map((x,i)=>(i+1)+". *"+x.name+"*"+(x.tag?" ["+x.tag+"]":"")).join("\n")||"Belum ada tim.");
  else if(m=="jadwal")t=card("JADWAL PERMAINAN 📅",(s.jadwal||[]).slice().sort((a,b)=>(a.tgl+a.jam)<(b.tgl+b.jam)?-1:1).slice(0,15).map(j=>"🗓 "+j.tgl+"  🕒 "+j.jam+(j.rd?"  ("+j.rd+")":"")+"\n     *"+j.a+"* vs *"+j.b+"*"+(j.sa!==""&&j.sa!=null?"  ➜ "+j.sa+" : "+j.sb:"")).join("\n\n")||"Belum ada jadwal.");
  else if(m=="klasemen")t=card("KLASEMEN 🏆",stand(s).map((x,i)=>medal(i)+" *"+x.n+"* — "+x.p+" poin ("+x.m+" main)").join("\n")||"Belum ada data.");
  else if(m=="top")t=card("PEMAIN TERBAIK 🔥",(s.stat||[]).slice().sort((a,b)=>b.k-a.k).slice(0,5).map((x,i)=>medal(i)+" *"+x.n+"* ("+x.t+")\n     ☠ "+x.k+"  🤝 "+x.a+"  🎯 "+x.ac+"%  🎭 "+x.c).join("\n\n")||"Statistik belum diisi.");
  else if(m=="status"){const u=s.users.find(x=>x.wa==norm(from));t=card("STATUS PENDAFTARAN 👤",u?"Username: *"+u.user+"*\n🛡 Tim: "+u.team+"\n📌 Status: *"+((u.ok||ok.some(x=>x.name==u.team))?"Terdaftar ✅":"Menunggu persetujuan admin ⏳")+"*":"Nomor ini belum terdaftar.\nKetik *.daftar* untuk mendaftar.")}
  else if(m=="daftar")t=card("PENDAFTARAN 📝","Daftar lewat website:\n"+(site||"(isi SITE_URL di Vercel)"));
  else{await sendImg(from,card("SLS DIVISI 2 🎮",MENU),site?site+"/menu.png":"");return res.status(200).end()}
  await send(from,t);res.status(200).end();
 }catch(e){res.status(200).end()}};
module.exports=(req,res)=>{const k=String((req.query&&req.query.r)||"").replace(/[^a-z]/g,"");const h=H[k];if(!h)return res.status(404).json({error:"not found"});return h(req,res)};
