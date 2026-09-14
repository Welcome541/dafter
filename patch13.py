# -*- coding: utf-8 -*-
p='index.html'
s=open(p,encoding='utf-8').read()
orig=s
def rep(o,n):
    global s
    assert o in s,'ANCHOR: '+o[:70]
    s=s.replace(o,n,1)

# 1) icons decorative for SR
rep('<svg class="ic" ','<svg class="ic" aria-hidden="true" focusable="false" ')
# 2) remove long-press from tx rows (keep explicit selection via button)
rep("""+'\" onpointerdown=\"lpSel(event,\\''+x.key+'\\')\" onpointerup=\"lpEndSel()\" onpointerleave=\"lpEndSel()\" onpointercancel=\"lpEndSel()\" oncontextmenu=\"return false\"')+'>'""",
    """+'\" role=\"button\" tabindex=\"0\" onkeydown=\"if(event.key===\\'Enter\\')this.click()\"')+'>'""")
# 3) remove long-press from customer rows
rep(""" onpointerdown=\"lpQuick(event,\\''+c.id+'\\')\" onpointerup=\"lpEndQ()\" onpointerleave=\"lpEndQ()\" oncontextmenu=\"return false\">'+""",
    """ role=\"button\" tabindex=\"0\" onkeydown=\"if(event.key===\\'Enter\\')this.click()\">'+""")
# 4) delete lpSel/lpQuick blocks
rep("""let lpSelT=null;
window.lpSel=(e,key)=>{if(ui.sel&&ui.sel.on)return;lpSelT=setTimeout(()=>{lpSelT=null;try{if(sec.vib&&navigator.vibrate)navigator.vibrate(35)}catch(e2){}ui.sel={on:true,ids:[key]};render()},450)};
window.lpEndSel=()=>{clearTimeout(lpSelT)};
""","")
rep("""window.lpQuick=(e,id)=>{lpT=setTimeout(()=>{lpT=null;try{if(sec.vib&&navigator.vibrate)navigator.vibrate(30)}catch(err){}openQuick(id)},480)};
window.lpEndQ=()=>{clearTimeout(lpT)};
""","")
# 5) explicit selection entry
rep("window.selExit=()=>{ui.sel={on:false,ids:[]};render()};",
    "window.selExit=()=>{ui.sel={on:false,ids:[]};render()};\nwindow.selStart=()=>{ui.sel={on:true,ids:[]};render()};")
rep(""" :'<div class="pad" style="margin:12px 20px 8px;font-weight:800;font-size:16.5px">'+t('lastOps')+' <span class="chip" style="background:#efece6;color:var(--soft)"><span class="num">'+n+'</span></span></div>')""",
    """ :'<div class="pad" style="margin:12px 20px 8px;font-weight:800;font-size:16.5px;display:flex;align-items:center;gap:8px">'+t('lastOps')+' <span class="chip" style="background:#efece6;color:var(--soft)"><span class="num">'+n+'</span></span><span class="sp"></span><button class="hbtn" style="min-width:0;height:34px;padding:0 12px;font-size:12.5px;font-weight:700" onclick="selStart()" aria-label="'+t('sel')+'">'+ic('checkc',15)+t('sel')+'</button></div>')""")
# 6) live region + dialog semantics + focus management
rep('<div id="toast"></div>','<div id="toast" role="status" aria-live="polite"></div>')
rep('<div id="sheetWrap"><div class="bk" onclick="closeSheet()"></div><div id="sheet"></div></div>',
    '<div id="sheetWrap" role="dialog" aria-modal="true"><div class="bk" onclick="closeSheet()"></div><div id="sheet" tabindex="-1"></div></div>')
rep("function openSheet(html){document.getElementById('sheet').innerHTML='<div class=\"grab\"></div>'+html;document.getElementById('sheetWrap').classList.add('open')}",
    "function openSheet(html){document.getElementById('sheet').innerHTML='<div class=\"grab\"></div>'+html;document.getElementById('sheetWrap').classList.add('open');window.__prevFocus=document.activeElement;setTimeout(()=>{try{document.getElementById('sheet').focus()}catch(e){}},40)}")
rep("function closeSheet(){document.getElementById('sheetWrap').classList.remove('open')}",
    "function closeSheet(){document.getElementById('sheetWrap').classList.remove('open');try{if(window.__prevFocus&&window.__prevFocus.focus)window.__prevFocus.focus()}catch(e){}}")
# 7) STR keys
rep("emptyHome:'لا عمليات بعد — اضغط مطولًا على «دين» وتكلّم، أو سجّل يدويًا',",
    "emptyHome:'لا عمليات بعد — اضغط مطولًا على «دين» وتكلّم، أو سجّل يدويًا',back:'رجوع',menu:'خيارات',hideAmt:'إخفاء المبالغ أو إظهارها',")
rep("emptyHome:'No operations yet — long-press Debt and speak, or add manually',",
    "emptyHome:'No operations yet — long-press Debt and speak, or add manually',back:'Back',menu:'Options',hideAmt:'Toggle amount privacy',")
# 8) headerBar labels
rep("(backFn?'<button class=\"hbtn\" onclick=\"'+backFn+'\">'+ic('back',20)+'</button>':'<span style=\"width:10px\"></span>')",
    "(backFn?'<button class=\"hbtn\" aria-label=\"'+t('back')+'\" onclick=\"'+backFn+'\">'+ic('back',20)+'</button>':'<span style=\"width:10px\"></span>')")
rep("(menuFn?'<button class=\"hbtn\" onclick=\"'+menuFn+'\">'+ic('dots',20)+'</button>':",
    "(menuFn?'<button class=\"hbtn\" aria-label=\"'+t('menu')+'\" onclick=\"'+menuFn+'\">'+ic('dots',20)+'</button>':")
# 9) priv button label
rep('aria-label="privacy"','aria-label="\'+t(\'hideAmt\')+\'"')
# 10) CSS a11y
rep('</style>','button:focus-visible,.hbtn:focus-visible,.litem:focus-visible,.stat:focus-visible,#tabbar button:focus-visible{outline:2.5px solid var(--navy);outline-offset:2px}\n@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}\n</style>')
rep('--ink:#15263c; --muted:#8a919c;','--ink:#15263c; --muted:#6b7480;')
rep('--ink:#e9edf2;--muted:#8b96a2;','--ink:#e9edf2;--muted:#9aa5b1;')
# 11) stats cards keyboard accessible
rep('<div class="stat red" style="cursor:pointer" onclick="','<div class="stat red" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')this.click()" style="cursor:pointer" onclick="')
rep('<div class="stat green" style="cursor:pointer" onclick="','<div class="stat green" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')this.click()" style="cursor:pointer" onclick="')
# 12) main landmark
rep('<div id="app" style="flex:1;display:flex;flex-direction:column"></div>','<div id="app" role="main" style="flex:1;display:flex;flex-direction:column"></div>')

assert s!=orig
open(p,'w',encoding='utf-8').write(s)
print('PATCH13 OK',len(s))
