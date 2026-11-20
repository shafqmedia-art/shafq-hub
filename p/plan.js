(function(){
'use strict';
var API='https://ypsarmfjbkxgoepmibia.supabase.co/rest/v1/rpc/get_plan',KEY='sb_publishable_nH-QKU_Mwjkd1xvMQTOldg_irMRYWZY';
var root=document.getElementById('plan');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pad(n){return n<10?'0'+n:''+n}
function token(){
  var m=location.pathname.match(/^\/p\/([a-z0-9-]{6,64})\/?$/i);
  if(m)return m[1];
  var q=new URLSearchParams(location.search).get('t');
  return q&&/^[a-z0-9-]{6,64}$/i.test(q)?q:null;
}
var CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
var LOGO='/assets/logo-white.png';

function state(title,msg,loading){
  root.innerHTML='<div class="state"><img src="'+LOGO+'" alt="شفق ميديا" width="39" height="80">'+
    (loading?'<div class="bar"></div>':'<h1>'+esc(title)+'</h1><p>'+esc(msg)+'</p><a class="btn" href="/">موقع شفق ميديا</a>')+'</div>';
}

function render(d){
  var c=d.client||{},h='';
  document.title=(c.name||'خطة')+' · شفق ميديا';
  var secs=[['goals','الأهداف والجمهور'],['reels','خطة الريلز'],['posts','المنشورات والكاروسيلات'],['publish','النشر والتصوير']];
  h+='<header class="pbar"><div class="wrap"><a class="lg" href="/" aria-label="شفق ميديا"><img src="'+LOGO+'" alt="شفق ميديا" width="17" height="34"></a><nav class="toc">'+
    secs.map(function(s){return '<a href="#'+s[0]+'">'+esc(s[1])+'</a>'}).join('')+'</nav></div></header>';

  // hero
  h+='<section class="hero"><div class="wrap"><div><div class="kick rv">'+esc(d.kicker)+'</div><h1 class="rv">'+esc(c.name)+'</h1>'+
    (c.en?'<div class="en rv">'+esc(c.en)+'</div>':'')+'<div class="tt rv">'+esc(d.title)+'</div>'+
    '<div class="chips rv"><span class="chip l">'+esc(d.date)+'</span><span class="chip">'+esc(d.city)+'</span></div></div>'+
    (c.logo?'<img class="logo" src="'+esc(c.logo)+'" alt="'+esc(c.name)+'" width="220" height="220">':'')+'</div></section>';

  // 01 goals + audience
  var g=d.goals||{items:[]};
  h+=sh('goals',1,'الأهداف والجمهور','لمين عم نحكي، وشو بدنا نوصل');
  h+='<div class="sub rv"><small>أولاً</small>الأهداف التسويقية</div><div class="grid g4">'+
    g.items.map(function(it,i){return '<div class="cd rv'+(i===g.focus?' d':'')+'"><span class="no">'+pad(i+1)+'</span><h3>'+esc(it[0])+'</h3><p class="m">'+esc(it[1])+'</p></div>'}).join('')+
    (g.result?'<div class="cd l res rv">'+esc(g.result)+'</div>':'')+'</div>';
  if(d.audience){
    h+='<div class="sub rv">الجمهور المستهدف</div><div class="face"><div class="grid g2">'+
      d.audience.map(function(a,i){return '<div class="cd rv"'+(i===d.audience.length-1&&d.audience.length%2?' style="grid-column:1/-1"':'')+'><span class="no">'+pad(i+1)+'</span><h3>'+esc(a)+'</h3></div>'}).join('')+'</div>';
    if(d.face){var f=d.face;h+='<div class="fc rv"><span class="tg">'+esc(f.label)+'</span><b>'+esc(f.name)+'</b><div class="r">'+esc(f.role)+'</div><ul class="dots">'+f.points.map(function(p){return '<li>'+esc(p)+'</li>'}).join('')+'</ul></div>';}
    h+='</div>';
  }
  if(d.numbers){
    h+='<div class="sub rv"><small>محتوى شهر كامل</small>الخطة بأربعة أرقام</div><div class="grid g4">'+
      d.numbers.map(function(n,i){return '<div class="cd num rv'+(i===0?' l':'')+'"><div class="k">'+esc(n[1])+'</div><div class="v" data-n="'+(+n[0])+'">0</div><div class="m">'+esc(n[2])+'</div></div>'}).join('')+'</div>';
  }
  h+='</div></section>';

  // 02 reels (plan + scripts)
  h+=sh('reels',2,'خطة الريلز',d.reels_note||'');
  var byN={};(d.reels||[]).forEach(function(r){byN[r.n]=r});
  var groups=d.reel_groups||[['',(d.reels||[]).map(function(r){return r.n})]];
  groups.forEach(function(gr){
    var ns=gr[1];
    h+='<div class="sub rv"><small>الريلز '+pad(ns[0])+' – '+pad(ns[ns.length-1])+'</small>'+esc(gr[0])+'</div><div class="grid g3 rg">';
    ns.forEach(function(n){var r=byN[n];if(!r)return;
      var fr=/الكوبون/.test(r.tag);
      h+='<div class="cd reel rv'+(fr?' fr':'')+'" data-n="'+n+'"><div class="top"><span class="no">'+pad(n)+'</span><span class="tag">'+esc(r.tag)+'</span></div><h3>'+esc(r.title)+'</h3><ol class="steps">'+
        r.steps.map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol>'+
        (r.script?'<div class="sbtn"><button type="button" aria-expanded="false">سكريبت الريل'+CHEV+'</button></div>':'<div class="ready">'+(r.ready?'جاهز، بدون تصوير جديد':'')+'</div>')+'</div>';
    });
    h+='</div>';
  });
  h+='</div></section>';

  // 03 posts + carousels
  var P=d.posts||{items:[]},C=d.carousels||{items:[]};
  h+=sh('posts',3,'المنشورات والكاروسيلات',P.items.length+' منشورات ثابتة و'+C.items.length+' كاروسيلات');
  h+='<div class="sub rv"><small>'+esc(P.note)+'</small>المنشورات الثابتة</div><div class="grid g4">'+
    P.items.map(function(p,i){var k=i===0?' d':(i===P.items.length-1?' l':'');return '<div class="cd post rv'+k+'"><span class="no">'+pad(i+1)+'</span><h3>'+esc(p[0])+'</h3><p class="m">'+esc(p[1])+'</p></div>'}).join('')+'</div>';
  h+='<div class="sub rv"><small>'+esc(C.note)+'</small>الكاروسيلات</div><div class="grid g4">'+
    C.items.map(function(x,i){return '<div class="cd car rv'+(i===C.items.length-1?' l':'')+'"><span class="no">'+pad(i+1)+'</span><h3>'+esc(x.title)+(x.sub?'<br><span class="sub2">'+esc(x.sub)+'</span>':'')+'</h3><ol>'+
      x.slides.map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol></div>'}).join('')+'</div>';
  h+='</div></section>';

  // 04 publish + shoot
  var S=d.schedule,D=d.distribution,SH=d.shoot;
  h+=sh('publish',4,'النشر والتصوير','إيمتى منشر، وكيف منصوّر');
  if(S){h+='<div class="sub rv"><small>'+esc(S.note)+'</small>جدول النشر الشهري</div><div class="tbar rv"><span class="chip l">'+esc(S.days)+'</span><span class="chip">'+esc(S.time)+'</span></div>'+table(['الأسبوع'].concat(S.cols),S.rows,true)+(S.foot?'<p class="foot rv">'+esc(S.foot)+'</p>':'');}
  if(D){h+='<div class="sub rv"><small>'+esc(D.note)+'</small>توزيع المنشورات والكاروسيلات</div>'+table(['الأسبوع'].concat(D.cols),D.rows,false);}
  if(SH){h+='<div class="sub rv"><small>'+esc(SH.note)+'</small>خطة التصوير والإنتاج</div><div class="grid g3">'+
    SH.sessions.map(function(s){return '<div class="cd sess rv"><h5>'+esc(s[0])+'</h5><ul class="dots" style="border:0;padding-top:0">'+s[1].map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'}).join('')+
    '<div class="cd sess st rv"><h5>أسلوب التصوير</h5><ul class="dots" style="border:0;padding-top:0">'+SH.style.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div></div>';}
  h+='</div></section>';

  h+='<section class="thx">'+(c.logo?'<img class="rv" src="'+esc(c.logo)+'" alt="" width="120" height="120">':'')+'<h2 class="rv">شكراً لثقتكم</h2><p class="rv">كل يوم <mark>شفق</mark> جديد لعلامتك</p><a class="chip l rv" href="/">shafqmedia.com</a></section>';
  h+='<footer class="pfoot"><div class="wrap"><span>'+esc(c.name)+' × شفق ميديا</span><span>هذه الصفحة خاصة، لا تشاركها إلا مع فريقك.</span></div></footer>';

  root.innerHTML=h;
  wire(d,byN);
}
function sh(id,n,t,p){return '<section class="sec" id="'+id+'"><div class="wrap"><div class="sh rv"><span class="sn">'+pad(n)+'</span><div><h2>'+esc(t)+'</h2>'+(p?'<p>'+esc(p)+'</p>':'')+'</div></div>'}
function table(head,rows,alt){
  return '<div class="tw rv"><table><thead><tr>'+head.map(function(x){return '<th>'+esc(x)+'</th>'}).join('')+'</tr></thead><tbody>'+
    rows.map(function(r,i){return '<tr'+(alt&&i%2?' class="alt"':'')+'>'+r.map(function(x){return '<td>'+esc(x)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
}
function scriptHTML(r){
  var s=r.script;
  return '<div><div class="sc"><div class="lines">'+s.lines.map(function(l,i){return '<div class="ln"><i>'+(i+1)+'</i><div><small>'+esc(l.who)+'</small><q>'+esc(l.say)+'</q></div></div>'}).join('')+'</div>'+
    '<div class="side"><h4>الكابشن</h4>'+(s.caption||[]).map(function(x){return '<p>'+esc(x)+'</p>'}).join('')+
    (s.shots&&s.shots.length?'<ul class="dots"><h4>لقطات التصوير</h4>'+s.shots.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+'</div></div></div>';
}
function wire(d,byN){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // reveal + counters
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;
    e.target.classList.add('in');io.unobserve(e.target);
    var v=e.target.querySelector('.v[data-n]');if(v)count(v,reduce);
  })},{threshold:.12,rootMargin:'0px 0px -6% 0px'}):null;
  var rv=root.querySelectorAll('.rv');
  // stagger siblings in grids
  Array.prototype.forEach.call(root.querySelectorAll('.grid'),function(g){Array.prototype.forEach.call(g.children,function(ch,i){ch.style.transitionDelay=(Math.min(i,6)*70)+'ms'})});
  Array.prototype.forEach.call(rv,function(el){io?io.observe(el):(el.classList.add('in'))});
  if(!io)Array.prototype.forEach.call(root.querySelectorAll('.v[data-n]'),function(v){v.textContent=v.dataset.n});

  // script panels
  var panel=null,openCard=null;
  function close(cb){
    if(!panel){cb&&cb();return}
    var p=panel,c=openCard;panel=null;openCard=null;
    c.classList.remove('open');c.querySelector('button').setAttribute('aria-expanded','false');
    p.classList.remove('open');setTimeout(function(){p.remove();cb&&cb()},reduce?0:560);
  }
  root.addEventListener('click',function(e){
    var b=e.target.closest('.sbtn button');if(!b)return;
    var card=b.closest('.reel');
    if(card===openCard){close();return}
    close(function(){
      var grid=card.parentNode,cards=Array.prototype.filter.call(grid.children,function(x){return x.classList.contains('reel')});
      var cols=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      var i=cards.indexOf(card),end=Math.min(cards.length-1,Math.floor(i/cols)*cols+cols-1);
      var p=document.createElement('div');p.className='script';p.innerHTML=scriptHTML(byN[card.dataset.n]);
      cards[end].after(p);
      card.classList.add('open');b.setAttribute('aria-expanded','true');
      panel=p;openCard=card;
      requestAnimationFrame(function(){requestAnimationFrame(function(){p.classList.add('open')})});
      setTimeout(function(){var r=p.getBoundingClientRect();if(r.top>innerHeight*.75)p.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})},reduce?0:420);
    });
  });

  // active toc
  var links=root.querySelectorAll('.toc a'),map={};
  Array.prototype.forEach.call(links,function(a){map[a.getAttribute('href').slice(1)]=a});
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){
      Array.prototype.forEach.call(links,function(a){a.classList.remove('on')});
      var a=map[e.target.id];if(a){a.classList.add('on');a.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'})}
    }})},{rootMargin:'-45% 0px -50% 0px'});
    Array.prototype.forEach.call(root.querySelectorAll('.sec'),function(s){so.observe(s)});
  }
}
function count(el,reduce){
  var n=+el.dataset.n;if(reduce){el.textContent=n;return}
  var t0=null,dur=900;
  function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur);k=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;el.textContent=Math.round(n*k);if(k<1)requestAnimationFrame(step)}
  requestAnimationFrame(step);
}

// boot
if(window.__PLAN__){render(window.__PLAN__);return}
var t=token();
if(!t){state('الرابط غير صحيح','تأكد من الرابط اللي وصلك من شفق ميديا.');return}
state('','',true);
fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':KEY},body:JSON.stringify({p_token:t}),cache:'no-store',referrerPolicy:'no-referrer'})
  .then(function(r){if(!r.ok)throw r.status;return r.json()})
  .then(function(d){if(!d||!d.client)throw 404;render(d)})
  .catch(function(e){e===404?state('الخطة غير متاحة','الرابط انتهى أو غير صحيح. تواصل مع شفق ميديا لرابط جديد.'):state('ما قدرنا نفتح الخطة','تأكد من الإنترنت وجرّب مرة تانية.')});
})();
