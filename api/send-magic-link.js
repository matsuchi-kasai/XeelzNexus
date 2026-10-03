import {callAxzye,reply} from "../lib/axzye.js";
export default async function handler(req,res){
  if(req.method!=="POST") return reply(res,405,{error:"Method not allowed"});
  try{
    const {email}=req.body||{};
    if(!email) return reply(res,400,{error:"Parameter wajib belum lengkap"});
    const data=await callAxzye("/send-magic-link",{email});
    return reply(res,200,data);
  }catch(e){
    return reply(res,e.status||500,e.data||{error:e.message});
  }
}
