# -*- coding: utf-8 -*-
p='/home/user/dafter/index.html'
s=open(p,encoding='utf-8').read()
def rep(o,n):
    global s
    assert o in s,'ANCHOR: '+o[:70]
    s=s.replace(o,n,1)
# replace standalone تحديد button with ⋮ menu right under the filter button
rep("""<span class="sp"></span><button class="hbtn" style="min-width:0;height:34px;padding:0 12px;font-size:12.5px;font-weight:700" onclick="selStart()" aria-label="'+t('sel')+'">'+ic('checkc',15)+t('sel')+'</button></div>')""",
    """<span class="sp"></span><button class="hbtn" style="min-width:38px;height:38px" onclick="openHomeMenu()" aria-label="'+t('menu')+'">'+ic('dots',18)+'</button></div>')""")
# the menu itself: everything the user needs on home, in one place
rep("window.selStart=()=>{ui.sel={on:true,ids:[]};render()};",
    """window.selStart=()=>{ui.sel={on:true,ids:[]};render()};
function openHomeMenu(){openSheet('<h3>'+t('menu')+'</h3>'
 +'<button class="srow" onclick="closeSheet();selStart()"><span class="sic2" style="background:var(--navy-bg);color:var(--navy)">'+ic('checkc',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('sel')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="closeSheet();openImport()"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('up',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('importT')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="closeSheet();exportAll()"><span class="sic2" style="background:var(--navy-bg);color:var(--navy)">'+ic('excel',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('exportAll')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="closeSheet();openQrSend()"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('share',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('qrSend')+'</span></span>'+ic('fwd',17)+'</button>')}""")
open(p,'w',encoding='utf-8').write(s)
print('PATCH16 OK')
