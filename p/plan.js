(function(){
'use strict';
var API='https://ypsarmfjbkxgoepmibia.supabase.co/rest/v1/rpc/get_plan',KEY='sb_publishable_nH-QKU_Mwjkd1xvMQTOldg_irMRYWZY';
var root=document.getElementById('plan');
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pad(n){return n<10?'0'+n:''+n}
function each(list,fn){Array.prototype.forEach.call(list,fn)}
function token(){
  var m=location.pathname.match(/^\/p\/([a-z0-9-]{6,64})\/?$/i);
  if(m)return m[1];
  var q=new URLSearchParams(location.search).get('t');
  return q&&/^[a-z0-9-]{6,64}$/i.test(q)?q:null;
}
var CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
var LOGO='/assets/logo-white.png';
var DAYS=['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
var MONTHS=['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];

function state(title,msg,loading){
  root.innerHTML='<div class="state"><img src="'+LOGO+'" alt="شفق ميديا" width="39" height="80">'+
    (loading?'<div class="bar"></div>':'<h1>'+esc(title)+'</h1><p>'+esc(msg)+'</p><a class="btn" href="/">موقع شفق ميديا</a>')+'</div>';
}

/* ---------- pieces ---------- */
function card(n,title,text,cls){return '<div class="cd row'+(cls?' '+cls:'')+'">'+(n?'<span class="no">'+pad(n)+'</span>':'')+'<h3>'+esc(title)+'</h3>'+(text?'<p class="m">'+esc(text)+'</p>':'')+'</div>'}
function dots(list){return '<ul class="dots">'+list.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'}
function table(head,rows,alt){
  return '<div class="tw"><table><thead><tr>'+head.map(function(x){return '<th scope="col">'+esc(x)+'</th>'}).join('')+'</tr></thead><tbody>'+
    rows.map(function(r,i){return '<tr'+(alt&&i%2?' class="alt"':'')+'>'+r.map(function(x,j){return j?'<td>'+esc(x)+'</td>':'<th scope="row">'+esc(x)+'</th>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
}
function evKind(t){return /ريل/.test(t)?'reel':/كاروسيل/.test(t)?'car':'post'}
function ev(x){var t=String(x.title||''),p=/^الكوبون الفرنسي /.test(t);return '<div class="ev '+evKind(x.type)+'" title="'+esc(t)+'"><b>'+esc(p?t.replace(/^الكوبون الفرنسي /,''):t)+'</b><small>'+esc(x.type)+(p?' · الكوبون':'')+(x.t?' · '+esc(x.t):'')+'</small></div>'}
function calendarHTML(C){
  var y=+C.month.slice(0,4),m=+C.month.slice(5,7),first=new Date(Date.UTC(y,m-1,1)),days=new Date(Date.UTC(y,m,0)).getUTCDate();
  var lead=(first.getUTCDay()+1)%7,by={},extra=[],h='',wk={};
  (C.items||[]).forEach(function(x){if(x.d.slice(0,7)===C.month){(by[x.d]=by[x.d]||[]).push(x)}else extra.push(x)});
  h+='<div class="cal"><div class="cal-h">'+DAYS.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div><div class="cal-g">';
  var cells=Math.ceil((lead+days)/7)*7;
  for(var i=0;i<cells;i++){
    var dn=i-lead+1;
    if(dn<1||dn>days){h+='<div class="day out" aria-hidden="true"></div>';continue}
    var key=C.month+'-'+pad(dn),list=by[key]||[];
    h+='<div class="day'+(list.length?' has':'')+'"><span class="dn">'+dn+'</span>'+list.map(ev).join('')+'</div>';
    if(list.length){var w=Math.floor(i/7);(wk[w]=wk[w]||[]).push('<div class="ag-d"><div class="ag-h"><b>'+dn+'</b><span>'+DAYS[(lead+dn-1)%7]+'</span></div><div class="ag-l">'+list.map(ev).join('')+'</div></div>')}
  }
  var ws=Object.keys(wk);
  h+='</div></div><div class="agenda"><div class="seg wk" role="tablist" aria-label="الأسابيع">'+ws.map(function(w,i){return '<button type="button" role="tab" aria-selected="'+(i===0)+'" data-wk="'+w+'">الأسبوع '+(i+1)+'</button>'}).join('')+'</div>'+ws.map(function(w,i){return '<div class="wkp" data-wkp="'+w+'"'+(i?' hidden':'')+'>'+wk[w].join('')+'</div>'}).join('')+'</div>';
  h+='<div class="leg"><span><i class="reel"></i>ريل</span><span><i></i>بوست</span><span><i class="car"></i>كاروسيل</span></div>';
  if(extra.length)h+='<p class="foot">وبأول الشهر الجاي: '+extra.map(function(x){var dt=new Date(x.d+'T12:00:00');return esc(x.title)+' ('+esc(x.type)+'، '+dt.getDate()+' '+MONTHS[dt.getMonth()]+')'}).join('، ')+'</p>';
  return h;
}
function scriptHTML(r){
  var s=r.script;
  return '<div><div class="sc"><div class="lines">'+s.lines.map(function(l,i){return '<div class="ln"><i>'+(i+1)+'</i><div><small>'+esc(l.who)+'</small><q>'+esc(l.say)+'</q></div></div>'}).join('')+'</div>'+
    '<div class="side"><h4>الكابشن</h4>'+(s.caption||[]).map(function(x){return '<p>'+esc(x)+'</p>'}).join('')+
    (s.shots&&s.shots.length?'<h4 class="mt">لقطات التصوير</h4>'+dots(s.shots):'')+'</div></div></div>';
}

/* a panel = intro line + segmented sub-tabs + one visible sub-panel */
function panel(id,title,intro,subs){
  var h='<section class="panel" id="p-'+id+'" role="tabpanel" aria-labelledby="t-'+id+'" tabindex="-1" hidden><div class="wrap">';
  h+='<div class="ph"><h2>'+esc(title)+'</h2>'+(intro?'<p>'+esc(intro)+'</p>':'')+'</div>';
  if(subs.length>1)h+='<div class="seg" role="tablist" aria-label="'+esc(title)+'">'+subs.map(function(s,i){return '<button type="button" role="tab" id="s-'+id+'-'+i+'" aria-controls="sp-'+id+'-'+i+'" aria-selected="'+(i===0)+'" tabindex="'+(i?-1:0)+'" data-sub="'+id+'-'+i+'">'+esc(s[0])+(s[2]!=null?'<b>'+esc(s[2])+'</b>':'')+'</button>'}).join('')+'</div>';
  h+=subs.map(function(s,i){return '<div class="sp" id="sp-'+id+'-'+i+'" role="tabpanel"'+(subs.length>1?' aria-labelledby="s-'+id+'-'+i+'"':'')+(i?' hidden':'')+'>'+s[1]+'</div>'}).join('');
  return h+'</div></section>';
}

function render(d){
  var c=d.client||{},h='',P=d.posts||{items:[]},C=d.carousels||{items:[]},g=d.goals||{items:[]};
  document.title=(c.name||'خطة')+' · شفق ميديا';
  var byN={};(d.reels||[]).forEach(function(r){byN[r.n]=r});
  var groups=d.reel_groups||[['',(d.reels||[]).map(function(r){return r.n})]];
  var tabs=[['goals','الأهداف'],['reels','الريلز'],['posts','المنشورات'],['publish','النشر والتصوير']];
  if(d.calendar)tabs.push(['calendar','التقويم']);

  // top bar + compact hero + main tabs
  h+='<header class="pbar"><div class="wrap"><a class="lg" href="/" aria-label="شفق ميديا"><img src="'+LOGO+'" alt="" width="17" height="34"></a><span class="pb-t">'+esc(d.kicker||'خطة من شفق ميديا')+'</span></div></header>';
  h+='<section class="hero"><div class="wrap">'+(c.logo?'<img class="logo" src="'+esc(c.logo)+'" alt="'+esc(c.name)+'" width="88" height="88">':'')+
    '<div class="ht"><h1>'+esc(c.name)+'</h1><p>'+esc(d.title)+(c.en?' · <span dir="ltr">'+esc(c.en)+'</span>':'')+'</p></div>'+
    '<div class="chips"><span class="chip l">'+esc(d.date)+'</span><span class="chip">'+esc(d.city)+'</span>'+(/^https:\/\//.test(d.pdf||'')?'<a class="chip pdf" href="'+esc(d.pdf)+'" target="_blank" rel="noopener">ملف الخطة PDF</a>':'')+'</div></div></section>';
  h+='<nav class="tabs" aria-label="أقسام الخطة"><div class="wrap" role="tablist">'+tabs.map(function(t,i){return '<button type="button" role="tab" id="t-'+t[0]+'" aria-controls="p-'+t[0]+'" aria-selected="false" tabindex="-1" data-tab="'+t[0]+'"><span class="tn">'+pad(i+1)+'</span>'+esc(t[1])+'</button>'}).join('')+'</div></nav>';

  h+='<main>';
  // 01 goals
  var gs=[['الأهداف','<div class="grid g4">'+g.items.map(function(it,i){return card(i+1,it[0],it[1])}).join('')+(g.result?'<div class="cd res"><h3>'+esc(g.result)+'</h3></div>':'')+'</div>',g.items.length]];
  if(d.audience){var f=d.face;gs.push(['الجمهور','<div class="face"><div class="grid g2">'+d.audience.map(function(a,i){return card(i+1,a,'',i===d.audience.length-1&&d.audience.length%2?'full':'')}).join('')+'</div>'+
    (f?'<div class="cd fc"><span class="tg">'+esc(f.label)+'</span><b>'+esc(f.name)+'</b><p class="m">'+esc(f.role)+'</p>'+dots(f.points)+'</div>':'')+'</div>',d.audience.length]);}
  if(d.numbers)gs.push(['الأرقام','<div class="grid g4">'+d.numbers.map(function(n){return '<div class="cd num"><h3>'+esc(n[1])+'</h3><div class="v" data-n="'+(+n[0])+'">'+(+n[0])+'</div><p class="m">'+esc(n[2])+'</p></div>'}).join('')+'</div>']);
  h+=panel('goals','الأهداف والجمهور',d.intro||'لمين عم نحكي، وشو بدنا نوصل',gs);

  // 02 reels
  h+=panel('reels','خطة الريلز',d.reels_note||'',groups.map(function(gr){
    var ns=gr[1];
    return [pad(ns[0])+' – '+pad(ns[ns.length-1]),'<p class="sub">'+esc(gr[0])+'</p><div class="grid g3 rg">'+ns.map(function(n){var r=byN[n];if(!r)return '';
      return '<div class="cd reel'+(/الكوبون/.test(r.tag)?' fr':'')+'" data-n="'+n+'"><div class="top"><span class="no">'+pad(n)+'</span><span class="tag">'+esc(r.tag)+'</span></div><h3>'+esc(r.title)+'</h3><ol class="steps">'+
        r.steps.map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol>'+
        (r.script?'<div class="sbtn"><button type="button" aria-expanded="false">سكريبت الريل'+CHEV+'</button></div>':'<div class="ready">'+(r.ready?'جاهز، بدون تصوير جديد':'')+'</div>')+'</div>';
    }).join('')+'</div>'];
  }));

  // 03 posts
  h+=panel('posts','المنشورات والكاروسيلات',P.items.length+' منشورات ثابتة و'+C.items.length+' كاروسيلات',[
    ['المنشورات','<p class="sub">'+esc(P.note||'')+'</p><div class="grid g4">'+P.items.map(function(p,i){return card(i+1,p[0],p[1],'post')}).join('')+'</div>',P.items.length],
    ['الكاروسيلات','<p class="sub">'+esc(C.note||'')+'</p><div class="grid g4">'+C.items.map(function(x,i){return '<div class="cd car"><span class="no">'+pad(i+1)+'</span><h3>'+esc(x.title)+(x.sub?'<span class="sub2">'+esc(x.sub)+'</span>':'')+'</h3><ol>'+x.slides.map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol></div>'}).join('')+'</div>',C.items.length]
  ]);

  // 04 publish + shoot
  var S=d.schedule,D=d.distribution,SH=d.shoot,ps=[];
  if(S)ps.push(['جدول النشر','<div class="tbar"><span class="chip l">'+esc(S.days)+'</span><span class="chip">'+esc(S.time)+'</span></div>'+table(['الأسبوع'].concat(S.cols),S.rows,true)+(S.foot?'<p class="foot">'+esc(S.foot)+'</p>':'')]);
  if(D)ps.push(['التوزيع','<p class="sub">'+esc(D.note||'')+'</p>'+table(['الأسبوع'].concat(D.cols),D.rows,false)]);
  if(SH)ps.push(['التصوير','<p class="sub">'+esc(SH.note||'')+'</p><div class="grid g3">'+SH.sessions.map(function(s){return '<div class="cd sess"><h5>'+esc(s[0])+'</h5>'+dots(s[1])+'</div>'}).join('')+'<div class="cd sess st"><h5>أسلوب التصوير</h5>'+dots(SH.style)+'</div></div>']);
  h+=panel('publish','النشر والتصوير','إيمتى منشر، وكيف منصوّر',ps);

  // 05 calendar
  if(d.calendar){var Cl=d.calendar,mm=+Cl.month.slice(5,7);h+=panel('calendar',(Cl.title||'تقويم النشر')+' · '+MONTHS[mm-1]+' '+Cl.month.slice(0,4),Cl.note||'',[['',calendarHTML(Cl)]]);}
  h+='</main>';

  h+='<footer class="pfoot"><div class="wrap"><div class="thx">'+(c.logo?'<img src="'+esc(c.logo)+'" alt="" width="40" height="40">':'')+'<div><b>شكراً لثقتكم</b><span>كل يوم <mark>شفق</mark> جديد لعلامتك</span></div></div><div class="pf-r"><a href="/">shafqmedia.com</a><span>هذه الصفحة خاصة، لا تشاركها إلا مع فريقك.</span></div></div></footer>';

  root.innerHTML=h;
  wire(byN,tabs);
}

/* every text on one line: shrink the font until it fits; wrap only if it can't */
var FIT='.cd h3,.cd .m,.steps li,.car li,.dots li,.ev b,.ev small,.sub,.ph p';
function fitIn(scope){
  each(scope.querySelectorAll(FIT),function(el){
    if(el.closest('.script')||!el.offsetParent)return;
    el.classList.remove('fit');el.style.fontSize='';
    var base=parseFloat(getComputedStyle(el).fontSize),min=Math.max(10.5,base*.66),fs=base;
    el.classList.add('fit');
    while(el.scrollWidth>el.clientWidth+1&&fs>min){fs-=.5;el.style.fontSize=fs+'px'}
    if(el.scrollWidth>el.clientWidth+1){el.classList.remove('fit');el.style.fontSize=''}
  });
}
function count(el){
  var n=+el.dataset.n;if(REDUCE){el.textContent=n;return}
  var t0=null,dur=800;
  function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur);k=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;el.textContent=Math.round(n*k);if(k<1)requestAnimationFrame(step)}
  requestAnimationFrame(step);
}
function play(sp){
  // staggered entrance for whatever just became visible
  each(sp.querySelectorAll('.cd,.tw,.cal,.ag-d,.tbar,.sub'),function(el,i){el.classList.remove('in');el.style.animationDelay=REDUCE?'0ms':Math.min(i,8)*55+'ms';void el.offsetWidth;el.classList.add('in')});
  each(sp.querySelectorAll('.v[data-n]'),count);
  fitIn(sp);
}

function wire(byN,tabs){
  var tabBtns=root.querySelectorAll('[data-tab]'),nav=root.querySelector('.tabs');
  function visibleSub(p){return p.querySelector('.sp:not([hidden])')}
  function show(id,focus,scroll){
    if(!root.querySelector('#p-'+id))id=tabs[0][0];
    closeScript(true);
    each(tabBtns,function(b){var on=b.dataset.tab===id;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;b.classList.toggle('on',on);if(on){if(focus)b.focus();b.scrollIntoView({block:'nearest',inline:'center',behavior:REDUCE?'auto':'smooth'})}});
    each(root.querySelectorAll('.panel'),function(p){var on=p.id==='p-'+id;p.hidden=!on;if(on)play(visibleSub(p))});
    if(history.replaceState)history.replaceState(null,'','#'+id);
    if(scroll&&nav.getBoundingClientRect().top<0)window.scrollTo({top:nav.offsetTop-62,behavior:REDUCE?'auto':'smooth'});
  }
  function showSub(key,focus){
    var id=key.split('-')[0],p=root.querySelector('#p-'+id);
    closeScript(true);
    each(p.querySelectorAll('[data-sub]'),function(b){var on=b.dataset.sub===key;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on&&focus)b.focus()});
    each(p.querySelectorAll('.sp'),function(s){var on=s.id==='sp-'+key;s.hidden=!on;if(on)play(s)});
  }
  // keyboard: arrows move between tabs (RTL: left = next)
  function arrows(e,list,act){
    var i=Array.prototype.indexOf.call(list,e.target);if(i<0)return;
    var k=e.key,n=list.length,j=null;
    if(k==='ArrowLeft')j=(i+1)%n;else if(k==='ArrowRight')j=(i-1+n)%n;else if(k==='Home')j=0;else if(k==='End')j=n-1;
    if(j==null)return;e.preventDefault();act(list[j]);
  }
  root.addEventListener('keydown',function(e){
    if(e.target.matches('[data-tab]'))arrows(e,tabBtns,function(b){show(b.dataset.tab,true,false)});
    else if(e.target.matches('[data-sub]'))arrows(e,e.target.parentNode.querySelectorAll('[data-sub]'),function(b){showSub(b.dataset.sub,true)});
  });

  // reel scripts open under the card's row
  var panelEl=null,openCard=null;
  function closeScript(now,cb){
    if(!panelEl){cb&&cb();return}
    var p=panelEl,c=openCard;panelEl=null;openCard=null;
    c.classList.remove('open');c.querySelector('.sbtn button').setAttribute('aria-expanded','false');
    p.classList.remove('open');setTimeout(function(){p.remove();cb&&cb()},now||REDUCE?0:520);
  }
  root.addEventListener('click',function(e){
    var t=e.target.closest('[data-tab]');if(t){show(t.dataset.tab,false,true);return}
    var s=e.target.closest('[data-sub]');if(s){showSub(s.dataset.sub,false);return}
    var w=e.target.closest('[data-wk]');if(w){var ag=w.closest('.agenda');each(ag.querySelectorAll('[data-wk]'),function(x){x.setAttribute('aria-selected',x===w)});each(ag.querySelectorAll('.wkp'),function(x){var on=x.dataset.wkp===w.dataset.wk;x.hidden=!on;if(on)play(x)});return}
    var b=e.target.closest('.sbtn button');if(!b)return;
    var cardEl=b.closest('.reel');
    if(cardEl===openCard){closeScript();return}
    closeScript(false,function(){
      var grid=cardEl.parentNode,cards=Array.prototype.filter.call(grid.children,function(x){return x.classList.contains('reel')});
      var cols=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      var i=cards.indexOf(cardEl),end=Math.min(cards.length-1,Math.floor(i/cols)*cols+cols-1);
      var p=document.createElement('div');p.className='script';p.innerHTML=scriptHTML(byN[cardEl.dataset.n]);
      cards[end].after(p);
      cardEl.classList.add('open');b.setAttribute('aria-expanded','true');
      panelEl=p;openCard=cardEl;
      requestAnimationFrame(function(){requestAnimationFrame(function(){p.classList.add('open')})});
      setTimeout(function(){var r=p.getBoundingClientRect();if(r.top>innerHeight*.7)p.scrollIntoView({behavior:REDUCE?'auto':'smooth',block:'nearest'})},REDUCE?0:380);
    });
  });

  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){var p=root.querySelector('.panel:not([hidden]) .sp:not([hidden])');if(p)fitIn(p)},150)});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){var p=root.querySelector('.panel:not([hidden]) .sp:not([hidden])');if(p)fitIn(p)});
  show((location.hash||'').slice(1)||tabs[0][0],false,false);
}

// boot
var Q=new URLSearchParams(location.search);
if(Q.get('embed'))document.documentElement.classList.add('embed');
if(window.__PLAN__){render(window.__PLAN__);return}
if(Q.get('demo')){try{var dd=JSON.parse(localStorage.getItem('shafq.demo.plan')||'null');if(dd){render(dd);return}}catch(e){}}
var t=token();
if(!t){state('الرابط غير صحيح','تأكد من الرابط اللي وصلك من شفق ميديا.');return}
state('','',true);
fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':KEY},body:JSON.stringify({p_token:t}),cache:'no-store',referrerPolicy:'no-referrer'})
  .then(function(r){if(!r.ok)throw r.status;return r.json()})
  .then(function(d){if(!d||!d.client)throw 404;render(d)})
  .catch(function(e){e===404?state('الخطة غير متاحة','الرابط انتهى أو غير صحيح. تواصل مع شفق ميديا لرابط جديد.'):state('ما قدرنا نفتح الخطة','تأكد من الإنترنت وجرّب مرة تانية.')});
})();
