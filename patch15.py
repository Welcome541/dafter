# -*- coding: utf-8 -*-
p='/home/user/dafter/index.html'
s=open(p,encoding='utf-8').read()
def rep(o,n):
    global s
    assert o in s,'ANCHOR: '+o[:70]
    s=s.replace(o,n,1)
# STR
rep("back:'رجوع',menu:'خيارات',hideAmt:'إخفاء المبالغ أو إظهارها',",
    "back:'رجوع',menu:'خيارات',hideAmt:'إخفاء المبالغ أو إظهارها',totalDebt:'إجمالي الديون',noToday:'لا عمليات اليوم بعد.',showAll:'عرض كل الأيام',")
rep("back:'Back',menu:'Options',hideAmt:'Toggle amount privacy',",
    "back:'Back',menu:'Options',hideAmt:'Toggle amount privacy',totalDebt:'Total debts',noToday:'No operations today yet.',showAll:'Show all days',")
# red card = total debts (no today scoping); tap shows ALL debts
rep('const o1="setTfK(\'debt\')"','const o1="stripDebt()"')
rep("(p?t('expToday'):t('todayDebt'))","(p?t('expToday'):t('totalDebt'))")
rep("<div class=\"v\">'+money(todayExp())+'</div></div><div class=\"stat green\"","<div class=\"v\">'+money(p?todayExp():openTotal())+'</div></div><div class=\"stat green\"")
rep("function setTfK(k){ui.tf.kind=k;refreshHome();renderTxSheet()}",
    "function setTfK(k){ui.tf.kind=k;refreshHome();renderTxSheet()}\nfunction stripDebt(){ui.tf={kind:'debt',period:'all'};refreshHome();renderTxSheet()}")
# default home view = current full day only
rep("tf:{kind:'all',period:'all'}","tf:{kind:'all',period:'today'}")
# filter dot: today is the default, not a "custom" filter
rep("((ui.tf.kind!=='all'||ui.tf.period!=='all')?'<span class=\"dot\" style=\"background:var(--red)\"></span>':'')",
    "((ui.tf.kind!=='all'||(ui.tf.period!=='all'&&ui.tf.period!=='today'))?'<span class=\"dot\" style=\"background:var(--red)\"></span>':'')")
# friendly "no operations today" hint with show-all
rep("if(!L.length){const any=DD().invoices.length+DD().payments.length;return '<div class=\"muted\" style=\"text-align:center;padding:28px 16px\">'+(any?t('noRes'):ic('mic',26)+'<div style=\"margin-top:10px;font-weight:700;line-height:1.7\">'+t('emptyHome')+'</div>')+'</div>'}",
    "if(!L.length){const any=DD().invoices.length+DD().payments.length;\n if(any&&ui.tf.period==='today')return '<div class=\"muted\" style=\"text-align:center;padding:24px 16px\">'+t('noToday')+'<div style=\"margin-top:10px\"><button class=\"btn btn-line\" style=\"width:auto;padding:10px 18px;font-size:13.5px\" onclick=\"setTfP(\\'all\\')\">'+t('showAll')+'</button></div></div>';\n return '<div class=\"muted\" style=\"text-align:center;padding:28px 16px\">'+(any?t('noRes'):ic('mic',26)+'<div style=\"margin-top:10px;font-weight:700;line-height:1.7\">'+t('emptyHome')+'</div>')+'</div>'}")
open(p,'w',encoding='utf-8').write(s)
print('PATCH15 OK')
