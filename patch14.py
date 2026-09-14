# -*- coding: utf-8 -*-
p='/home/user/dafter/index.html'
s=open(p,encoding='utf-8').read()
def rep(o,n):
    global s
    assert o in s,'ANCHOR: '+o[:70]
    s=s.replace(o,n,1)
rep('<button class="hbtn accchip" style="gap:8px" onclick="openAccSheet()">',
    "<button class=\"hbtn accchip\" aria-label=\"'+t('switchAcc')+'\" style=\"gap:8px\" onclick=\"openAccSheet()\">")
rep("<button class=\"hbtn\" style=\"min-width:34px;height:34px;border:none;box-shadow:none;background:transparent\" onclick=\"event.stopPropagation();openCustMenu(\\''+c.id+'\\')\">'+ic('dots',18)+'</button></div>';",
    "<button class=\"hbtn\" aria-label=\"'+t('menu')+'\" style=\"min-width:38px;height:38px;border:none;box-shadow:none;background:transparent\" onclick=\"event.stopPropagation();openCustMenu(\\''+c.id+'\\')\">'+ic('dots',18)+'</button></div>';")
rep("return '<div class=\"card litem\" onclick=\"go(\\'profile\\',{id:\\''+c.id+'\\'})\" role=\"button\" tabindex=\"0\" onkeydown=\"if(event.key===\\'Enter\\')this.click()\">'+",
    "return '<div class=\"card litem\" onclick=\"go(\\'profile\\',{id:\\''+c.id+'\\'})\">'+")
rep("const AVC=['#2563eb','#1e8e5a','#7c5cd6','#d64570','#b97f24','#0e7a8a','#a71949','#5b6470'];",
    "const AVC=['#1d4ed8','#0e6b47','#5b21b6','#9f1239','#8a5a12','#0f6472','#a71949','#4b5563'];")
rep('--ink:#15263c; --muted:#6b7480;','--ink:#15263c; --muted:#5f6873;')
open(p,'w',encoding='utf-8').write(s)
print('PATCH14 OK')
