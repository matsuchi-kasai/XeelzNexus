const ACTIVE_WINDOW_MS = 60 * 1000;
const VISITOR_TTL_SECONDS = 365 * 24 * 60 * 60;

function redisConfig(){
  return {url:process.env.UPSTASH_REDIS_REST_URL||"",token:process.env.UPSTASH_REDIS_REST_TOKEN||""};
}

async function redisPipeline(commands){
  const {url,token}=redisConfig();
  if(!url||!token) throw new Error("Shared statistics database belum dikonfigurasi. Tambahkan UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN di Vercel.");
  const r=await fetch(`${url}/pipeline`,{
    method:"POST",
    headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify(commands)
  });
  const text=await r.text();
  let data;
  try{data=JSON.parse(text)}catch{throw new Error(`Redis response tidak valid (HTTP ${r.status})`)}
  if(!r.ok) throw new Error(data?.error||`Redis HTTP ${r.status}`);
  return data;
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");
  if(req.method!=="GET") return res.status(405).json({error:"Method Not Allowed"});

  const u=new URL(req.url,"https://xeelz-nexus.local");
  const action=u.searchParams.get("action")||"heartbeat";
  const visitorId=(u.searchParams.get("visitorId")||"").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,100);
  if(!visitorId) return res.status(400).json({error:"visitorId wajib diisi"});
  if(!["visit","heartbeat"].includes(action)) return res.status(400).json({error:"action tidak valid"});

  const now=Date.now();
  const cutoff=now-ACTIVE_WINDOW_MS;
  const visitorKey=`xeelz:nexus:visitor:${visitorId}`;

  try{
    let newVisitor=false;
    if(action==="visit"){
      // SET NX returns OK only the first time this browser visitor ID is seen.
      const first=await redisPipeline([["SET",visitorKey,"1","NX","EX",String(VISITOR_TTL_SECONDS)]]);
      newVisitor=first?.[0]?.result==="OK";
      if(newVisitor) await redisPipeline([["INCR","xeelz:nexus:total_visits"]]);
    }

    const out=await redisPipeline([
      ["ZADD","xeelz:nexus:active",String(now),visitorId],
      ["ZREMRANGEBYSCORE","xeelz:nexus:active","-inf",String(cutoff)],
      ["ZCARD","xeelz:nexus:active"],
      ["GET","xeelz:nexus:total_visits"]
    ]);

    const active=Number(out?.[2]?.result||0);
    const total=Number(out?.[3]?.result||0);
    return res.status(200).json({
      success:true,
      activeUsers:Number.isFinite(active)?active:0,
      totalVisits:Number.isFinite(total)?total:0,
      newVisitor
    });
  }catch(e){
    return res.status(503).json({success:false,error:e.message||"Statistics service unavailable"});
  }
}
