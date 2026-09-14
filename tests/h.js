// shared harness for dafter tests
const fs=require('fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
function boot(opts={}){
 const store=opts.store||{};
 const vc=new VirtualConsole();
 vc.on('jsdomError',e=>{if(!/scrollTo/.test(e.message))console.log('JSDOM-ERR:',e.message)});
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){
   try{Object.defineProperty(w.navigator,'language',{value:opts.lang||'ar-SA',configurable:true})}catch(e){}
   if(opts.darkMq){try{Object.defineProperty(w,'matchMedia',{value:q=>({matches:/dark/.test(q),addEventListener(){},addListener(){}}),configurable:true})}catch(e){}}
   w.localStorage={getItem:k=>(k in store)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
   w.scrollTo=()=>{}; w.confirm=()=>true; w.prompt=()=>(opts.prompt||'x');
   if(opts.tts){w.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};w.speechSynthesis={said:[],speak(u){this.said.push(u.text)},getVoices:()=>[],cancel(){}}}
   w.AudioContext=function(){return{createOscillator:()=>({connect:()=>{},start:()=>{},stop:()=>{},frequency:{value:0}}),createGain:()=>({connect:()=>{},gain:{value:0}}),destination:{},currentTime:0,state:'running',close:()=>Promise.resolve()}};
   w.SpeechRecognition=undefined;
  }});
 return dom.window;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function mk(okFn){let pass=0,fail=0;
 const ok=(c,m)=>{c?(pass++):(fail++,console.log('  FAIL:',m));console.log((c?'  ok ':'  ✗ ')+m)};
 const done=()=>{console.log('\nRESULT: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0)};
 return {ok,done,stats:()=>({pass,fail})};
}
module.exports={boot,wait,mk,html};
