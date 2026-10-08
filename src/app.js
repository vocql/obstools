const CATS={obs:'OBS Overlays',util:'Stream Utilities',creator:'Creator Tools',yt:'YouTube Tools',dev:'Code & Dev Tools',text:'Text Tools'};
const card=t=>`<a class="card" href="#/tool/${t.id}"><div class="ic">${t.ic}</div><div><b>${t.name}</b><small>${t.desc}</small></div><span class="ar">→</span></a>`;
const recents=()=>LS.g('recent',[]).map(id=>T.find(t=>t.id===id)).filter(Boolean);
function render(){runClean();document.body.classList.remove('bare','ov','home');const app=$('#app'),h=(location.hash||'#/').slice(1),[,r,a,b]=h.split('/');window.scrollTo(0,0);document.title='VOQCL TOOLS';
 $$('#nav a').forEach(x=>x.classList.toggle('on',x.getAttribute('href')==='#'+h||(h==='/tools'&&x.getAttribute('href')==='#/tools')));
 if(r==='live'&&/^\w{3,25}$/.test(a||'')){document.body.classList.add('bare');if(b==='overlay')document.body.classList.add('ov');document.title=a+' · followers';app.innerHTML='<div id="lvb" style="min-height:100vh;display:grid;place-items:center;padding:20px"></div>';liveView($('#lvb'),a.toLowerCase(),b==='overlay');return}
 if(r==='tool'){const t=T.find(x=>x.id===a);if(!t){app.innerHTML=page('Tool not found','That tool does not exist.','<a class="btn pri" href="#/tools">Browse tools</a>');return}
  LS.s('recent',[t.id,...LS.g('recent',[]).filter(x=>x!==t.id)].slice(0,6));app.innerHTML='<div id="tp"><p class="d">Loading…</p></div>';$('#tp').dataset.tool=t.id;document.title=t.name+' · VOQCL TOOLS';
  try{t.fn($('#tp'));app.insertAdjacentHTML('afterbegin',`<p><a href="#/tools" style="color:var(--mu)">← All tools</a></p>`)}catch(e){console.error(e);app.innerHTML=page('Something went wrong','This tool failed to load.',`<p class="err">${esc(e.message)}</p><a class="btn" href="#/tools">Back</a>`)}return}
 if(r==='c'&&CATS[a]){app.innerHTML=page(CATS[a],'Tools in this category.',`<div class="grid">${T.filter(t=>t.cat===a).map(card).join('')}</div>`);return}
 if(r==='tools'){let q='',c='';const draw=()=>{const L=T.filter(t=>(!c||t.cat===c)&&(t.name+t.desc).toLowerCase().includes(q.toLowerCase()));$('#gl').innerHTML=L.length?L.map(card).join(''):'<p class="d">No tools match your search.</p>'};
  app.innerHTML=page('Tools','Everything runs in your browser — no uploads, no accounts.',`<input id="q" placeholder="Search tools…  (press /)" autocomplete="off" style="max-width:420px"><div class="row" id="ch"><span class="chip on" data-c="">All</span>${Object.entries(CATS).map(([k,v])=>`<span class="chip" data-c="${k}">${v}</span>`).join('')}</div><h2 style="margin-top:20px">Results</h2><div class="grid" id="gl"></div>`);
  $('#q').oninput=e=>{q=e.target.value;draw()};$('#ch').onclick=e=>{const s=e.target.closest('.chip');if(!s)return;c=s.dataset.c;$$('.chip').forEach(x=>x.classList.toggle('on',x===s));draw()};draw();return}
 const svg=p=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
 const IC={grid:svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  chat:svg('<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>'),
  smile:svg('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>'),
  user:svg('<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M19 8v6M16 11h6"/>'),
  target:svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
  cam:svg('<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>'),
  img:svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m21 15-5-5L5 21"/>'),
  chev:svg('<path d="m9 6 6 6-6 6"/>')};
 const row=([id,ic,n,d])=>`<a class="h-row" href="#/tool/${id}"><span class="h-ic">${IC[ic]}</span><span class="h-tx"><b>${n}</b><small>${d}</small></span><span class="h-ch">${IC.chev}</span></a>`;
 const OBS=[['chatis','chat','ChatIS','Your Twitch chat as an OBS source, with 7TV emotes.'],['emote','smile','Emote overlay','Emotes that float up your screen in bursts.'],['followlive','user','Follower tracker','A live follower count with a gain and loss chart.'],['cs2','target','CS2 stats bar','Premier rating, W-L and K/D for your stream.']];
 const UTL=[['mask','cam','Mask generator','Round, squircle or star shapes for your webcam.'],['bgr','img','Background remover','Cut out a background. Runs in your browser.']];
 document.body.classList.add('home');
 app.innerHTML=`<div class="h-top"><span class="h-logo">V</span><span class="h-name"><b>VOQCL</b><span>tools</span></span></div>
 <p class="h-sub">Stream tools that run from this site. Free to use.</p>
 <a class="h-feat" href="#/tool/multiview"><span class="h-ic">${IC.grid}</span><span class="h-tx"><b>Multiview</b><small>Watch several streams side by side, with chat.</small></span><span class="btn pri h-btn">Open multiview</span></a>
 <div class="h-cols"><div><div class="h-sec">OBS Overlays</div><div class="h-list">${OBS.map(row).join('')}</div></div>
 <div><div class="h-sec">Utilities</div><div class="h-list">${UTL.map(row).join('')}</div></div></div>
 <p class="h-more"><a href="#/tools">Browse all ${T.length} tools →</a></p>`}
addEventListener('hashchange',render);render();
addEventListener('keydown',e=>{const t=e.target,typing=!!(t.matches&&t.matches('input,textarea,select,[contenteditable]'));
 if((e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey)){e.preventDefault();if($('#q'))$('#q').focus();else{location.hash='#/tools';setTimeout(()=>$('#q')&&$('#q').focus(),60)}}
 else if(e.key==='Escape'&&typing)t.blur()});