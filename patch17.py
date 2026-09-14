# -*- coding: utf-8 -*-
p='/home/user/dafter/index.html'
s=open(p,encoding='utf-8').read()
def rep(o,n):
    global s
    assert o in s,'ANCHOR: '+o[:70]
    s=s.replace(o,n,1)
old_start=s.index('function statsCards(){')
old_end=s.index('}',s.index("+'</div></div>'}",old_start))+1
new_fn="""function statsCards(){const p=isP();const o1="stripDebt()",o2="stripPay()";
const dAll=DD().invoices.reduce((x,i)=>x+i.amount,0),pAll=DD().payments.reduce((x,i)=>x+i.amount,0);
return '<div class="stats pad" id="stats1"><div class="stat red" role="button" tabindex="0" onkeydown="if(event.key===\\'Enter\\')this.click()" style="cursor:pointer" onclick="'+o1+'"><div class="t">'+ic('receipt',15)+(p?t('expense'):t('newDebt'))+'</div><div class="v">'+money(dAll)+'</div></div><div class="stat green" role="button" tabindex="0" onkeydown="if(event.key===\\'Enter\\')this.click()" style="cursor:pointer" onclick="'+o2+'"><div class="t">'+ic('banknote',15)+(p?t('deposit'):t('pay'))+'</div><div class="v">'+money(pAll)+'</div></div></div>'}"""
s=s[:old_start]+new_fn+s[old_end:]
rep("function stripDebt(){ui.tf={kind:'debt',period:'all'};refreshHome();renderTxSheet()}",
    "function stripDebt(){ui.tf={kind:'debt',period:'all'};refreshHome();renderTxSheet()}\nfunction stripPay(){ui.tf={kind:'pay',period:'all'};refreshHome();renderTxSheet()}")
open(p,'w',encoding='utf-8').write(s)
print('PATCH17 OK')
