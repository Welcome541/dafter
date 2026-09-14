# -*- coding: utf-8 -*-
p='index.html'
s=open(p,encoding='utf-8').read()
orig=s
def rep(old,new,n=1):
    global s
    assert old in s,'ANCHOR NOT FOUND: '+old[:80]
    s=s.replace(old,new,n)

# STR ar
rep("quota:'امتلأت مساحة التخزين — صدِّر نسخة احتياطية الآن',",
    "quota:'امتلأت مساحة التخزين — صدِّر نسخة احتياطية الآن',todayDebt:'دين اليوم',expToday:'مصروف اليوم',depToday:'أودعت اليوم',emptyHome:'لا عمليات بعد — اضغط مطولًا على «دين» وتكلّم، أو سجّل يدويًا',")
# STR en
rep("quota:'Storage full — export a backup now',",
    "quota:'Storage full — export a backup now',todayDebt:'Debt today',expToday:'Spent today',depToday:'Deposited today',emptyHome:'No operations yet — long-press Debt and speak, or add manually',")

# statsCards: counter strip = today-only numbers (no balance concept on home)
rep("""function statsCards(){const p=isP();const o1="setTfK('debt')",o2=p?"setTfK('pay')":"setTfP('today')";
return '<div class="stats pad" id="stats1"><div class="stat red" style="cursor:pointer" onclick="'+o1+'"><div class="t">'+ic('coins',17)+t('owed')+'</div><div class="v">'+money(p?todayExp():openTotal())+'</div></div><div class="stat green" style="cursor:pointer" onclick="'+o2+'"><div class="t">'+ic('banknote',17)+t('collToday')+'</div><div class="v">'+money(collToday())+'</div></div></div>'}""",
"""function statsCards(){const p=isP();const o1="setTfK('debt')",o2=p?"setTfK('pay')":"setTfP('today')";
return '<div class="stats pad" id="stats1"><div class="stat red" style="cursor:pointer" onclick="'+o1+'"><div class="t">'+ic('receipt',15)+(p?t('expToday'):t('todayDebt'))+'</div><div class="v">'+money(todayExp())+'</div></div><div class="stat green" style="cursor:pointer" onclick="'+o2+'"><div class="t">'+ic('banknote',15)+(p?t('depToday'):t('collToday'))+'</div><div class="v">'+money(collToday())+'</div></div></div>'}""")

# feedHtml: day-grouped feed + friendly first-run empty state
rep("""function feedHtml(){const L=filteredTx();return L.length?L.map(txRow).join(''):'<div class="muted" style="text-align:center;padding:28px 0">'+t('noRes')+'</div>'}""",
"""function dayLabel(ts){const d=new Date(ts),n0=new Date();const a=new Date(d);a.setHours(0,0,0,0);const b=new Date(n0);b.setHours(0,0,0,0);const diff=Math.round((b-a)/864e5);
 if(diff<=0)return t('today');if(diff===1)return t('yest');
 return d.toLocaleDateString(db.lang==='ar'?'ar':'en-GB',{weekday:'long'})+' · '+d.getDate()+'/'+(d.getMonth()+1)}
function feedHtml(){const L=filteredTx();
 if(!L.length){const any=DD().invoices.length+DD().payments.length;return '<div class="muted" style="text-align:center;padding:28px 16px">'+(any?t('noRes'):ic('mic',26)+'<div style="margin-top:10px;font-weight:700;line-height:1.7">'+t('emptyHome')+'</div>')+'</div>'}
 let out='',last='';L.forEach(x=>{const dl=dayLabel(x.ts);if(dl!==last){out+='<div class="lb" style="margin:12px 4px 6px">'+dl+'</div>';last=dl}out+=txRow(x)});return out}""")

assert s!=orig
open(p,'w',encoding='utf-8').write(s)
print('PATCH6 OK, size',len(s))
