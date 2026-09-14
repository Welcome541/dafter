# -*- coding: utf-8 -*-
p='/home/user/dafter/index.html'
s=open(p,encoding='utf-8').read()
def rep(o,n):
    global s
    assert o in s,'ANCHOR: '+o[:70]
    s=s.replace(o,n,1)
# STR
rep("totalDebt:'إجمالي الديون',noToday:'لا عمليات اليوم بعد.',showAll:'عرض كل الأيام',",
    "totalDebt:'إجمالي الديون',noToday:'لا عمليات اليوم بعد.',showAll:'عرض كل الأيام',allDays:'كل الأيام',")
rep("totalDebt:'Total debts',noToday:'No operations today yet.',showAll:'Show all days',",
    "totalDebt:'Total debts',noToday:'No operations today yet.',showAll:'Show all days',allDays:'All days',")
# search row: filter-sheet button replaced by the ⋮ menu (same visual slot)
rep("""'<button class="hbtn" style="height:46px;gap:7px;font-weight:700" onclick="openTxFilter()">'+ic('sliders',17)+t('filter')+((ui.tf.kind!=='all'||(ui.tf.period!=='all'&&ui.tf.period!=='today'))?'<span class="dot" style="background:var(--red)"></span>':'')+'</button></div>'""",
    """'<button class="hbtn" style="height:46px" onclick="openHomeMenu()" aria-label="'+t('menu')+'">'+ic('dots',18)+'</button></div>'""")
# lastOps row: ⋮ leaves (moved up), period seg arrives: اليوم / كل الأيام
rep("""<span class="sp"></span><button class="hbtn" style="min-width:38px;height:38px" onclick="openHomeMenu()" aria-label="'+t('menu')+'">'+ic('dots',18)+'</button></div>')""",
    """<span class="sp"></span><div class="seg" style="padding:3px" role="group" aria-label="'+t('period')+'">'+['today','all'].map(k=>'<button style="flex:none;padding:7px 13px;font-size:12px" class="'+(ui.tf.period===k?'on':'')+'" onclick="setTfP(\\''+k+'\\')">'+(k==='today'?t('today'):t('allDays'))+'</button>').join('')+'</div></div>')""")
# cards toggle kind with visible active ring
i=s.index('function statsCards(){')
j=s.index('function filteredCustomers')
new_fn="""function statsCards(){const p=isP();
const dAll=DD().invoices.reduce((x,i)=>x+i.amount,0),pAll=DD().payments.reduce((x,i)=>x+i.amount,0);
const rR=ui.tf.kind==='debt'?'box-shadow:0 0 0 2.5px var(--red);':'',rG=ui.tf.kind==='pay'?'box-shadow:0 0 0 2.5px var(--green);':'';
return '<div class="stats pad" id="stats1"><div class="stat red" role="button" tabindex="0" aria-pressed="'+(ui.tf.kind==='debt')+'" onkeydown="if(event.key===\\'Enter\\')this.click()" style="cursor:pointer;'+rR+'" onclick="toggleDebt()"><div class="t">'+ic('receipt',15)+(p?t('expense'):t('newDebt'))+'</div><div class="v">'+money(dAll)+'</div></div><div class="stat green" role="button" tabindex="0" aria-pressed="'+(ui.tf.kind==='pay')+'" onkeydown="if(event.key===\\'Enter\\')this.click()" style="cursor:pointer;'+rG+'" onclick="togglePay()"><div class="t">'+ic('banknote',15)+(p?t('deposit'):t('pay'))+'</div><div class="v">'+money(pAll)+'</div></div></div>'}
"""
s=s[:i]+new_fn+s[j:]
rep("function stripDebt(){ui.tf={kind:'debt',period:'all'};refreshHome();renderTxSheet()}\nfunction stripPay(){ui.tf={kind:'pay',period:'all'};refreshHome();renderTxSheet()}",
    "function toggleDebt(){if(ui.tf.kind==='debt'){ui.tf={kind:'all',period:'today'}}else{ui.tf={kind:'debt',period:'all'}}refreshHome()}\nfunction togglePay(){if(ui.tf.kind==='pay'){ui.tf={kind:'all',period:'today'}}else{ui.tf={kind:'pay',period:'all'}}refreshHome()}")
open(p,'w',encoding='utf-8').write(s)
print('PATCH18 OK')
