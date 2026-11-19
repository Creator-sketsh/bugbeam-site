/* ==========================================================================
   Bugbeam — app.js
   Sections, in order:
     1. Order form          — sends the order (Web3Forms → FormSubmit → mailto)
     2. Live test card       — the looping demo card in the hero
     3. Nav bar auto-hide    — hides the menu bar on scroll down
     4. Build animation      — the agents "drawing" the page as you scroll
     5. Intro tour           — auto-scroll build on first visit + replay
     6. Video playback       — plays the demo video only while it's on screen
   ========================================================================== */


/* 1. ORDER FORM ============================================================ */
// Clicking a pricing button pre-selects that plan in the form.
document.querySelectorAll('[data-plan]').forEach(b=>
 b.addEventListener('click',()=>{document.getElementById('plan').value=b.dataset.plan}));

document.getElementById('f').addEventListener('submit',async e=>{
 e.preventDefault();
 const site=document.getElementById('site').value.trim().replace(/^https?:\/\//,'').replace(/\/$/,''),
       plan=document.getElementById('plan').value,
       email=document.getElementById('cemail').value.trim(),
       m=document.getElementById('ordermsg'),
       btn=document.getElementById('sendbtn');
 if(!site||!email||document.getElementById('hp').value)return;          // hp = honeypot: a filled value means a bot

 // hCaptcha token (if the widget is present, a human check must be passed first).
 const cap=document.querySelector('[name="h-captcha-response"]'),capToken=cap?cap.value:'';
 if(cap&&!capToken){m.style.display='block';m.textContent='Please complete the "I’m human" check, then send again.';return}

 const subject=`Bugbeam order: ${site}`,
       esc=x=>x.replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])),
       body=`Website: https://${site}\nPlan: ${plan}\nEmail: ${email}`,
       mailtoHref=`mailto:support@bugbeam.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

 // POST to Web3Forms. Returns true only on a confirmed success. 12s cap for slow mobile networks.
 const post=async data=>{
  const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),12000);
  try{
   const r=await fetch('https://api.web3forms.com/submit',{signal:ac.signal,method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
   const j=await r.json().catch(()=>({}));
   return r.ok&&(j.success===true||String(j.success)==='true');
  }catch(err){return false}finally{clearTimeout(tm)}
 };

 btn.disabled=true;btn.textContent='Sending…';
 const payload={access_key:'67c5140f-3e60-44e0-ae5b-4054ee807eb8',subject,from_name:'Bugbeam website',email,replyto:email,botcheck:'','h-captcha-response':capToken,Website:'https://'+site,Plan:plan,Email:email,message:body};

 // Try Web3Forms, and retry once if a transient network blip drops it (the tablet case).
 let ok=false;
 for(let attempt=0;attempt<2&&!ok;attempt++){
  if(attempt)await new Promise(r=>setTimeout(r,800));
  ok=await post(payload);
 }

 if(window.hcaptcha)try{hcaptcha.reset()}catch(e){}   // tokens are single-use: get a fresh one for the next order
 m.style.display='block';
 if(ok){
  m.style.background='rgba(52,211,153,.1)';m.style.borderColor='rgba(52,211,153,.35)';
  m.innerHTML=`✓ Order received for <b>${esc(site)}</b>. Check <b>${esc(email)}</b> in a few minutes for the payment details (look in spam too).`;
  document.getElementById('f').reset();btn.textContent='Order sent ✓';btn.disabled=true;
 }else{
  // No auto-redirect (it does nothing on tablets and freezes the button). Offer a link the user taps.
  m.style.background='rgba(249,115,22,.1)';m.style.borderColor='rgba(249,115,22,.4)';
  m.innerHTML=`Couldn't send just now. <a href="${mailtoHref}" style="color:var(--cyan);font-weight:700">Tap here to email your order</a>, or write to <b>support@bugbeam.dev</b> with the subject <b>${esc(subject)}</b>. You can also tap Send again.`;
  btn.disabled=false;btn.textContent='Send my order →';
 }
});


/* 2. LIVE TEST CARD (hero, loops forever) ================================== */
const LV={
 sites:['your-launch.app','new-saas.io','shiplist.co'],
 bugs:[['h','Buy button dead on phone'],['m','Form accepts empty email'],['l','Image missing alt text'],['m','Menu covers the logo on tablet'],['l','Text too small on phone']],
 log:[['#A78BFA','Scout','found a new launch'],['#3B82F6','Bugbeam','testing 15 pages'],['#F472B6','Vision','checking phone layout'],['#3B82F6','Bugbeam','bug found: Buy button'],['#84CC16','Verifier','re-testing 5 bugs…'],['#84CC16','Verifier','1 false alarm removed'],['#FB7185','Gatekeeper','report approved ✓'],['#FBBF24','Sales','report sent to founder ✉']]
};
let lvRound=0;
function lvRun(){
 const site=LV.sites[lvRound++%LV.sites.length];
 document.getElementById('lvsite').textContent=site;
 const B=document.getElementById('lvbugs'),L=document.getElementById('lvlog'),
       S=document.getElementById('lvstate'),R=document.getElementById('lvring'),SC=document.getElementById('lvscore');
 B.innerHTML='';L.innerHTML='';R.style.setProperty('--v',0);SC.textContent='–';S.textContent='Testing on phone…';
 const at=(ms,f)=>setTimeout(f,ms);
 // scroll the log
 let li=0;const addLog=()=>{const x=LV.log[li++];if(!x)return;const d=document.createElement('div');d.innerHTML=`<b style="color:${x[0]}">${x[1]}</b> → ${x[2]}`;L.appendChild(d);if(L.children.length>4)L.removeChild(L.firstChild)};
 for(let i=0;i<LV.log.length;i++)at(400+i*900,addLog);
 // list bugs, then mark them real / false-alarm
 const picks=[0,1,2,4];
 picks.forEach((k,i)=>at(1600+i*700,()=>{
  const b=LV.bugs[k],d=document.createElement('div');d.className='bugrow';d.style.opacity=0;d.style.transform='translateY(8px)';
  d.innerHTML=`<span class="sev ${b[0]}">${{h:'High',m:'Medium',l:'Low'}[b[0]]}</span><span>${b[1]}</span><span class="st">found</span>`;
  B.appendChild(d);requestAnimationFrame(()=>{d.style.opacity=1;d.style.transform='none'});
 }));
 at(4500,()=>S.textContent='Verifier is checking…');
 picks.forEach((k,i)=>at(4700+i*450,()=>{const d=B.children[i];if(!d)return;if(i===3){d.classList.add('fa');d.querySelector('.st').textContent='false alarm'}else{d.classList.add('ok');d.querySelector('.st').textContent='✓ real'}}));
 at(6800,()=>{S.textContent='Report sent ✓';let v=0;const iv=setInterval(()=>{v+=2;if(v>=74){v=74;clearInterval(iv)}R.style.setProperty('--v',v);SC.textContent=v},18)});
 at(10500,lvRun);  // loop
}
lvRun();


/* 3. NAV BAR auto-hide ====================================================
   Hide the floating menu bar while scrolling down; bring it back when
   scrolling up or near the top. Runs on every device. */
(function(){
 const nav=document.querySelector('nav');if(!nav)return;
 let lastY=scrollY,ticking=false;
 function upd(){
  const y=Math.max(0,scrollY);
  if(y>lastY+4&&y>130)nav.classList.add('hide');          // scrolling down, past the top
  else if(y<lastY-4||y<=130)nav.classList.remove('hide');  // scrolling up, or near the top
  lastY=y;ticking=false;
 }
 addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(upd)}},{passive:true});
})();


/* 4. BUILD ANIMATION ======================================================
   The 11 agents draw every .bx box and type every [data-type] line as the
   page scrolls. Skipped entirely when the visitor prefers reduced motion. */
const AG=[["Bugbeam","#3B82F6"],["Scout","#A78BFA"],["Vision","#F472B6"],["Verifier","#84CC16"],["Gatekeeper","#FB7185"],["Sales","#FBBF24"],["Inbox","#38BDF8"],["Payments","#34D399"],["Full Test","#2DD4BF"],["Monitor","#22D3EE"],["Coach","#F87171"]];
document.getElementById('hudav').innerHTML=AG.map(a=>`<i style="background:${a[1]}"></i>`).join('');

let tourOn=false;  // true while the intro auto-tour is running (declared here so frame() can read it)
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// The agent-building animation runs on every device — phones and tablets included — the same way:
// the page auto-tours and the agents draw it in. Only "reduce motion" opts out.
if(reduceMotion){
 const hud=document.getElementById('hud');if(hud)hud.remove();   // reduced motion → no animation, no HUD
}else{
 document.documentElement.classList.add('js');
 const clamp=x=>Math.min(1,Math.max(0,x)),
       ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;

 // Split a line into per-character spans so it can be "typed" out.
 function split(el){
  const txt=el.textContent,short=txt.length<70;
  el.textContent='';
  const w=document.createElement('span');el.appendChild(w);
  const parts=short?[...txt]:txt.split(/(\s+)/),out=[];
  parts.forEach(p=>{
   if(/^\s+$/.test(p)){w.appendChild(document.createTextNode(p));return}
   const s=document.createElement('span');s.className='ch';s.textContent=p;w.appendChild(s);out.push(s);
  });
  const caret=document.createElement('span');caret.className='caret';caret.style.display='none';w.appendChild(caret);
  return{chars:out,caret};
 }

 // Build the list of "steps" (one per box / standalone line).
 const steps=[];
 document.querySelectorAll('.bx,[data-type]').forEach(el=>{
  if(el.matches('[data-type]')&&el.parentElement.closest('.bx'))return;   // typed lines inside a box belong to that box
  const st={el,box:el.classList.contains('bx'),e:-1};
  const leaves=st.box?[...el.querySelectorAll('[data-type]')]:[el];
  st.typed=leaves.map(l=>Object.assign({el:l,n:-1},split(l)));
  if(st.box){const g=document.createElement('div');g.className='ghost';g.innerHTML='<b></b>';document.getElementById('ghosts').appendChild(g);st.ghost=g}
  steps.push(st);
 });
 steps.forEach((s,i)=>{s.ag=[(i*3)%11,(i*3+1)%11,(i*3+2)%11];s.chars=s.typed.reduce((n,t)=>n+t.chars.length,0)});

 // Measure where every box sits (re-run only when the layout really changes).
 function measure(){
  const sy=scrollY;
  steps.forEach(s=>{
   const r=s.el.getBoundingClientRect();s.top=r.top+sy;s.left=r.left;s.w=r.width;s.h=r.height;
   s.typed.forEach(t=>{const q=t.el.getBoundingClientRect();t.top=q.top+sy;t.left=q.left;t.w=q.width;t.h=q.height});
   if(s.ghost){const G=s.ghost;G.style.left=s.left+scrollX+'px';G.style.top=s.top+'px';G.style.width=s.w+'px';G.style.height=s.h+'px';G.firstChild.textContent=`${Math.round(s.w)} × ${Math.round(s.h)}`}
  });
  dirty=true;
 }
 let dirty=true,mt=null,lastBadge=0,nextStart=0,building=true;
 const remeasure=()=>{clearTimeout(mt);mt=setTimeout(measure,150)};
 measure();
 addEventListener('resize',remeasure);
 addEventListener('load',measure);
 if(document.fonts)document.fonts.ready.then(measure);
 if(window.ResizeObserver)new ResizeObserver(remeasure).observe(document.body);
 // While building, every scroll re-runs the frame; once built, scrolling is left alone (smooth).
 addEventListener('scroll',()=>{if(building)dirty=true},{passive:true});

 // The agent cursors.
 const crewEl=document.getElementById('crew');
 const crew=AG.map(a=>{
  const d=document.createElement('div');d.className='cur';d.style.setProperty('--c',a[1]);
  d.innerHTML=`<svg viewBox="0 0 16 18"><path d="M1 1l13 7-6 1.5L5 16z" fill="${a[1]}" stroke="#04060D" stroke-width="1.2"/></svg><span class="lab" style="background:${a[1]}">${a[0]}</span><span class="tool"></span>`;
  crewEl.appendChild(d);
  return{el:d,name:a[0],color:a[1],tool:d.querySelector('.tool'),x:-200,y:-200,tx:0,ty:0,on:false,was:false,tl:'',last:''};
 });
 // Point agent i at (x,y) with tool emoji tl.
 function use(i,x,y,tl){const c=crew[i];if(!c||c.on)return;if(!c.was){c.x=x+(Math.random()-.5)*120;c.y=y+60}c.on=true;c.tx=x;c.ty=y;c.tl=tl}

 const hud=document.getElementById('hudtxt'),hbar=document.getElementById('hudbar');
 let lastPct=-1,t0=performance.now();

 function frame(now){
  const vh=innerHeight,sy=scrollY;
  const anyActive=steps.some(s=>(s.e>0&&s.e<1)||(s.t0>0&&s.e<1));
  // Nothing to do this frame? idle cheaply.
  if(!dirty&&!anyActive&&!crew.some(c=>c.was)&&steps.every(s=>s.t0!=null||s.top-sy>=vh*.92)){
   crew.forEach(c=>{if(c.was){c.el.style.opacity=0;c.was=false}});requestAnimationFrame(frame);return;
  }
  dirty=false;crew.forEach(c=>{c.on=false});
  let done=0;const cap=innerWidth<700?6:10,slow=innerWidth<700?.8:1;
  let active=steps.filter(s=>s.t0>0&&s.e<1).length;
  const busy=new Set(steps.filter(s=>s.t0>0&&s.e<1).map(s=>s.agent));

  for(const s of steps){
   const top=s.top-sy;let e;
   if(s.t0==null){
    const onNow=top<vh*.96&&top+s.h>0;              // visible (or just entering)
    const mustStart=top<vh*.8&&top+s.h>vh*.04;      // clearly on screen: it MUST get a builder
    if(top+s.h<=-vh*.12){s.t0=-1;e=1}               // scrolled well past before anyone reached it: just show it
    else if(onNow&&(mustStart||(active<cap&&now>=nextStart))){
     const free=crew.map((c,i)=>i).filter(i=>!busy.has(i));
     free.sort((a,b)=>(crew[b].freed||0)-(crew[a].freed||0));   // whoever just finished takes the next job
     s.agent=free[0]??s.ag[Math.floor(Math.random()*3)];busy.add(s.agent);
     s.t0=now;active++;nextStart=now+26;
     s.dur=(s.box?900+Math.random()*420:Math.min(1150,Math.max(420,s.chars*14))*(.85+Math.random()*.3))*slow;e=0;
    }else e=0;
   }
   else if(s.t0<0)e=1;
   else e=clamp((now-s.t0)/s.dur);
   if(e>=1)done++;
   if(s.t0>0&&e>=1&&s.e<1)crew[s.agent].freed=now;
   if(e===s.e)continue;
   const prev=s.e;s.e=e;
   const me=s.agent??s.ag[0],onScreen=top<vh&&top+s.h>0;let working=false;

   if(s.box){
    const o=clamp(e/.28),g=ease(clamp((e-.22)/.3)),p=clamp((e-.5)/.2);
    if(e>=1){
     if(prev<1){
      s.el.classList.add('done');s.el.style.removeProperty('--g');s.el.style.removeProperty('--p');
      if(prev>0&&onScreen&&now-lastBadge>300){                 // "✓ built by …" badge
       lastBadge=now;s.el.classList.remove('flash');void s.el.offsetWidth;s.el.classList.add('flash');
       const who=crew[me],b=document.createElement('div');b.className='built';b.textContent='✓ built by '+who.name;b.style.background=who.color;
       b.style.left=Math.max(8,Math.min(innerWidth-170,s.left+s.w-150))+'px';b.style.top=(s.top-14)+'px';
       document.getElementById('ghosts').appendChild(b);setTimeout(()=>b.remove(),1900);
      }
     }
    }else{
     s.el.classList.remove('done');s.el.style.setProperty('--g',g.toFixed(3));s.el.style.setProperty('--p',p.toFixed(3));
    }
    const G=s.ghost;
    if(e>0&&e<.75){G.style.display='block';G.style.clipPath=`inset(0 ${(1-o)*100}% ${(1-o)*100}% 0)`;G.style.opacity=1-clamp((e-.55)/.2)}
    else if(G.style.display!=='none')G.style.display='none';
    if(e>0&&e<1&&onScreen){
     if(e<.52){const cx=e<.22?s.left+s.w*o:s.left+s.w*Math.max(o,g),cy=e<.22?top:top+s.h*g;use(me,cx,cy,'✏️');working=true}
     else if(e<.62||!s.typed.length){const k=s.typed.length?p:clamp((e-.5)/.5);use(me,s.left+s.w*k,top+s.h*.5,'🖌️');working=true}
    }
   }

   // Type each line's characters.
   const tStart=s.box?.6:0,tLen=1-tStart,L=s.typed.length;
   s.typed.forEach((tl,j)=>{
    const a=tStart+(tLen*.85)*(j/L),k=e>=1?1:clamp((e-a)/((tLen*.85)/L+.04)),N=tl.chars.length,n=Math.round(k*N);
    if(n!==tl.n){
     const lo=Math.min(n,Math.max(tl.n,0)),hi=Math.max(n,Math.max(tl.n,0));
     for(let q=lo;q<hi;q++)tl.chars[q].classList.toggle('on',q<n);
     if(tl.n<0)for(let q=n;q<N;q++)tl.chars[q].classList.remove('on');
     if(n>0&&n<N){tl.chars[n-1].after(tl.caret);tl.caret.style.display=''}else tl.caret.style.display='none';
     tl.n=n;
    }
    if(!working&&k>0&&N&&e<1){const tt=tl.top-sy;if(tt<vh&&tt>-40){const lines=Math.max(1,Math.round(tl.h/28)),pos=Math.min(.999,k)*lines,line=Math.min(lines-1,Math.floor(pos));
     s.lastPos=[tl.left+tl.w*(pos-line)+4,tt+tl.h*(line+1)/lines-2];use(me,s.lastPos[0],s.lastPos[1],'⌨️');working=true}}
   });
   if(!working&&e>0&&e<1&&onScreen&&s.lastPos)use(me,s.lastPos[0],s.lastPos[1],'⌨️');   // between two lines: stay on the text
  }

  // Move / show / hide the cursors.
  crew.forEach(c=>{
   if(c.on){
    const sp=.22;c.x+=(c.tx-c.x)*sp;c.y+=(c.ty-c.y)*sp;c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
    if(c.tl!==c.last){c.tool.textContent=c.tl;c.last=c.tl}
    if(!c.was){c.el.style.opacity=1;c.was=true}
    dirty=true;
   }else if(c.was){c.el.style.opacity=0;c.was=false}
  });

  // Progress HUD + replay button.
  const pct=Math.round(done/steps.length*100);
  const tmsg=hud.dataset.tour||'',rb=document.getElementById('replay');
  if(rb){const show=pct>=100&&!tourOn;if(rb.hidden===show)rb.hidden=!show}
  if(pct!==lastPct||tmsg!==hud._t){hbar.style.width=pct+'%';hud.textContent=tmsg?`${tmsg} · ${pct}%`:pct<100?`11 agents · building this page · ${pct}%`:'✓ page built · 0 bugs found';lastPct=pct;hud._t=tmsg}

  // Page fully built: stop reacting to scroll so scrolling stays native-smooth.
  if(building&&done>=steps.length&&!anyActive){building=false;dirty=false;crew.forEach(c=>{c.el.style.opacity=0;c.was=false})}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);


 /* 5. INTRO TOUR ========================================================== */
 const replayBtn=document.getElementById('replay');

 // Reset every box back to "not built" so the tour can replay.
 function resetBuild(){
  steps.forEach(s=>{
   s.t0=null;s.e=-1;
   if(s.box){s.el.classList.remove('done','flash');s.el.style.setProperty('--g',0);s.el.style.setProperty('--p',0)}
   s.typed.forEach(tl=>{tl.chars.forEach(c=>c.classList.remove('on'));tl.caret.style.display='none';tl.n=-1});
   s.agent=undefined;s.lastPos=null;
  });
  document.querySelectorAll('.built').forEach(b=>b.remove());
  building=true;t0=performance.now();nextStart=0;lastPct=-1;dirty=true;
 }

 // Auto-scroll down the page (agents build what's on screen), then back to top.
 function runTour(delay){
  tourOn=true;replayBtn.hidden=true;
  const skip=document.createElement('button');skip.id='tourskip';skip.type='button';skip.textContent='Skip intro ✕';document.body.appendChild(skip);
  let stopped=false,raf=0;
  const hudSay=t=>{const h=document.getElementById('hudtxt');if(h)h.dataset.tour=t};
  const evs=['wheel','touchstart','keydown','mousedown'];
  const onUser=e=>{if(e.target===skip||e.target===replayBtn)return;stop()};
  function stop(){
   if(stopped)return;stopped=true;tourOn=false;cancelAnimationFrame(raf);skip.remove();hudSay('');dirty=true;
   try{localStorage.setItem('bbTour','1')}catch(e){}
   evs.forEach(ev=>removeEventListener(ev,onUser,true));
  }
  evs.forEach(ev=>addEventListener(ev,onUser,{capture:true,passive:true}));
  skip.addEventListener('click',()=>{stop();scrollTo({top:0,behavior:'smooth'})});

  const go=y=>scrollTo({top:y,behavior:'instant'});
  setTimeout(()=>{
   if(stopped)return;
   skip.classList.add('on');hudSay('Watch our agents build this page · tap anywhere to stop');
   const max=()=>document.documentElement.scrollHeight-innerHeight;
   const speed=Math.max(300,Math.min(680,max()/22));
   let y=scrollY,v=0,last=performance.now(),phase='down',hold=0,back0=0,from=0;
   function step(t){
    if(stopped)return;
    const dt=Math.min(.05,(t-last)/1000);last=t;
    if(phase==='down'){
     const vh2=innerHeight,wait=steps.some(s=>s.e<1&&s.t0!==-1&&s.top-y<vh2*.62&&s.top+s.h-y>vh2*.02);
     v+=((wait?0:speed)-v)*Math.min(1,dt*3);if(v>1){y=Math.min(max(),y+v*dt);go(y)}   // scroll, then pause while the agents build what's on screen
     if(y>=max()-1){phase='hold';hold=t}
    }else if(phase==='hold'){
     if(t-hold>900){phase='up';back0=t;from=scrollY}
    }else{
     const k=Math.min(1,(t-back0)/1500),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;go(from*(1-e));if(k>=1){stop();return}
    }
    raf=requestAnimationFrame(step);
   }
   raf=requestAnimationFrame(step);
  },delay);
 }
 replayBtn.addEventListener('click',()=>{if(tourOn)return;scrollTo({top:0,behavior:'instant'});resetBuild();runTour(900)});

 // Run the auto-scroll tour once per visitor (on every device), unless they arrive deep-linked
 // or already scrolled down.
 (function(){
  let seen=false;try{seen=localStorage.getItem('bbTour')==='1'}catch(e){}
  if(!seen&&!location.hash&&scrollY<=50)runTour(900);
 })();
}


/* 6. VIDEO PLAYBACK ======================================================= */
// Play the demo video only while it's on screen; show a Play button if autoplay is blocked.
const vid=document.querySelector('.phone video'),vbtn=document.querySelector('.vplay');
if(vid){
 vid.muted=true;
 const tryPlay=()=>vid.play().then(()=>{vbtn.hidden=true}).catch(()=>{vbtn.hidden=false});
 vbtn.addEventListener('click',()=>{vid.muted=true;tryPlay()});
 vid.addEventListener('click',()=>{if(vid.paused)tryPlay()});
 if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)tryPlay();else vid.pause()}),{threshold:.2}).observe(vid);
 else tryPlay();
}
