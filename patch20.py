# PATCH20 (applied): move voice-engine selector, TTS speak, printing, bluetooth,
# branding card and recording sound to "future options"; recording stays (auto engine).
s=open('index.html',encoding='utf-8').read()
# 1 default speak off (dormant feature, no UI)
s=s.replace("dark:false,speak:true,btName:''","dark:false,speak:false,btName:''",1)
# 2 feedback(): cut sound block, keep vibration
i=s.index('if(!sec.sound)return;')
j=s.index('o.start();o.stop(AC.currentTime+0.2);}catch(e){}')+len('o.start();o.stop(AC.currentTime+0.2);}catch(e){}')-1
s=s[:i]+s[j:]
# 3 startRec: single auto engine
old=""" const eng=sec.veng||'demo';
 if(eng==='web'&&tryWebASR(kind))return;
 if(eng==='vosk'){if(window.voskEngine&&window.voskEngine.ready){window.voskEngine.start(kind,custId);return}toastMsg(t('voskNo'))}
"""
s=s.replace(old," if(tryWebASR(kind))return;\n",1)
# 4 settings sound card: keep vibration row only
i=s.index("kv('var(--red-bg)','var(--red)','mic',t('recordSound')")
j=s.index("sec0(t('security')")
mid="kv('var(--navy-bg)','var(--navy)','zap',t('vibOnRecord'),'<div class=\"sw '+(sec.vib?'on':'')+'\" onclick=\"sec.vib=!sec.vib;saveSec();render()\"></div>')+\n '</div>')+\n  "
s=s[:i]+mid+s[j:]
# 5 settings: cut BT row
i=s.index("'<div class=\"sep\"></div>'+\n  kv('var(--navy-bg)','var(--navy)','printer',t('btPrint')")
j=s.index("+'</button>')+",i)+len("+'</button>')+")
s=s[:i]+s[j:]
# 6 settings: cut branding/about card line
i=s.index("'<div class=\"card\" style=\"padding:18px 16px;text-align:center;margin-top:16px")
i0=s.rfind('+',0,i)
jc=s.index("+'</div></div>'",i)+len("+'</div></div>'")
j=s.index('\n',jc)
s=s[:i0]+s[j:]
# 7 invoice: cut BT print button line
i=s.index('onclick="printBT(btStatement('); i0=s.rfind('\n',0,i)+1; j=s.index('\n',i)
s=s[:i0]+s[j+1:]
# 8 export sheet: cut PDF row
i=s.index('closeSheet();exportPDF('); i0=s.rfind('\n',0,i)+1; j=s.index('\n',i)
s=s[:i0]+s[j+1:]
open('index.html','w',encoding='utf-8').write(s)
print('PATCH20 applied',len(s))
