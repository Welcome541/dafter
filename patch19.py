# -*- coding: utf-8 -*-
p='/home/user/dafter/index.html'
s=open(p,encoding='utf-8').read()
def rep(o,n,c=1):
    global s
    assert s.count(o)>=c,'ANCHOR: '+o[:70]
    s=s.replace(o,n,c)
# 1) remove eye option from home + customers headers
rep("+accChip()+privBtn()+'</div>';","+accChip()+'</div>';",2)
# 2) long-press hardening: pointercancel (fired by mobile long-press hijack) must NOT kill the pending voice start
rep('onpointerleave="btnCancelRec()" onpointercancel="btnCancelRec()" oncontextmenu="return false">','onpointerleave="btnCancelRec()" oncontextmenu="return false">',2)
rep('onpointerleave="btnCancelRec()" onpointercancel="btnCancelRec()">\'+ic(\'mic\',18)','onpointerleave="btnCancelRec()" oncontextmenu="return false">\'+ic(\'mic\',18)')
open(p,'w',encoding='utf-8').write(s)
print('PATCH19 OK')
