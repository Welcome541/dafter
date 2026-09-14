/* strict spoken-number parser (shared snippet, embedded into index.html by patch21) */
function amtFromText(text){
  const nd=String(text).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴٥٦٨٩'.indexOf(c)));
  const m=nd.match(/\d+(?:[.,]\d+)?/);
  if(m)return {amt:parseFloat(m[0].replace(',','.')),start:m.index,end:m.index+m[0].length,raw:true};
  const w=words2num(nd);
  return w.amt>0?{amt:w.amt,start:w.start,end:w.end,raw:true}:{amt:0,start:0,end:0,raw:false};
}
const HU={'مئة':1,'مائة':1,'مية':1,'ماية':1,'مايه':1,'مئه':1};
const W1={'صفر':0,'واحد':1,'واحدة':1,'احد':1,'أحد':1,'اثنين':2,'اثنان':2,'اثنتان':2,'اتنين':2,'تنين':2,'ثلاثة':3,'ثلاث':3,'تلاتة':3,'تلات':3,'اربعة':4,'أربعة':4,'اربع':4,'أربع':4,'خمسة':5,'خمس':5,'خمست':5,'سته':6,'ستة':6,'ست':6,'سبعه':7,'سبعة':7,'سبع':7,'ثمانية':8,'ثمان':8,'تمانية':8,'ثمانيه':8,'تسعة':9,'تسع':9,'تسعه':9};
const W10={'عشرة':10,'عشر':10,'عشرت':10,'عشرون':20,'عشرين':20,'تلاتون':30,'ثلاثون':30,'ثلاثين':30,'تلاتين':30,'اربعون':40,'أربعون':40,'اربعين':40,'أربعين':40,'خمسون':50,'خمسين':50,'ستون':60,'ستين':60,'سبعون':70,'سبعين':70,'ثمانون':80,'ثمانين':80,'تمانون':80,'تمانيه':8,'تسعون':90,'تسعين':90};
const E1={'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19};
const E10={'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90};
function hunMul(t){ // returns u for "<u> مئة" combos like ثلاثمئة / خمسمية / تلاتمية
  const m=t.match(/^(واحد|واحدة|احد|أحد|اثنتين|اثنين|اثنان|اتنين|ثلاثة|ثلاث|تلاتة|تلات|اربعة|أربعة|اربع|أربع|خمسة|خمس|خمست|سته|ستة|ست|سبعه|سبعة|سبع|ثمانية|ثمان|تمانية|تسعة|تسع|تسعه)(مئة|مائة|مية|ماية|مايه|مئه)$/);
  if(!m)return 0;return W1[m[1]]||0}
function words2num(s){
  const toks=String(s).toLowerCase().split(/[^0-9a-zA-Z؀-ۿ]+/).filter(Boolean);
  let total=0,cur=0;const usedSet=new Set();
  for(let i=0;i<toks.length;i++){
    let t=toks[i].replace(/^و+/,'');let used=true;let extra=false;
    if(t==='و'||t==='and'){used=false}
    else if(HU[t]){cur=(cur||1)*100}
    else if(t==='مئتان'||t==='مائتان'||t==='ميتين'||t==='مايتين'){cur+=200}
    else if(hunMul(t)){cur+=hunMul(t)*100}
    else if(t==='الف'||t==='ألف'){total+=(cur||1)*1000;cur=0}
    else if(t==='الفين'||t==='ألفين'||t==='الفان'||t==='ألفان'){total+=2000;cur=0}
    else if(t==='الاف'||t==='آلاف'||t==='الآلاف'){total+=(cur||1)*1000;cur=0}
    else if(W10[t]!==undefined){cur+=W10[t]}
    else if(W1[t]!==undefined){
      const nx=toks[i+1];
      if(nx&&/^(عشر|عشرة|عشره)$/.test(nx.replace(/^و+/,''))){cur+=10+W1[t];i++;extra=true}
      else if(nx&&HU[nx.replace(/^و+/,'')]){cur+=W1[t]*100;i++;extra=true}
      else cur+=W1[t];
    }
    else if(E1[t]!==undefined){cur+=E1[t]}
    else if(E10[t]!==undefined){cur+=E10[t]}
    else if(t==='hundred'){cur=(cur||1)*100}
    else if(t==='thousand'){total+=(cur||1)*1000;cur=0}
    else used=false;
    if(used){usedSet.add(i);if(extra)usedSet.add(i-1)}
  }
  const usedIdx=[...usedSet].sort((a,b)=>a-b);
  if(!usedIdx.length)return {amt:0,start:0,end:0};
  let pos=0;const starts=[],ends=[];
  for(let i=0;i<toks.length;i++){const at=s.indexOf(toks[i],pos);starts.push(at);ends.push(at+toks[i].length);pos=at+toks[i].length}
  return {amt:total+cur,start:starts[usedIdx[0]],end:ends[usedIdx[usedIdx.length-1]]};
}
if(typeof module!=='undefined')module.exports={amtFromText,words2num};
