export async function callAxzye(path, body){
  const key=process.env.AXZYE_API_KEY;
  if(!key) throw new Error("AXZYE_API_KEY belum diatur di Vercel Environment Variables.");
  const r=await fetch(`https://axzyedev.biz.id/api/v1${path}`,{
    method:"POST",
    headers:{"Content-Type":"application/json","X-API-Key":key},
    body:JSON.stringify(body)
  });
  const text=await r.text(); let data={};
  try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok){
    const e=new Error(data.error||data.message||data.detail||`Provider HTTP ${r.status}`);
    e.status=r.status;e.data=data;throw e;
  }
  return data;
}
export function reply(res,status,data){return res.status(status).json(data)}
