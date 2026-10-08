/* More tools: code, text, YouTube, stream */
const pad=n=>String(n).padStart(2,'0');
const crand=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const bar=(html)=>`<div class="row">${html}</div>`;

add('json','dev','{ }','JSON Formatter & Validator','Format, minify, sort keys and validate JSON.',el=>{
 el.innerHTML=page('JSON Formatter & Validator','Paste JSON, then format, minify or sort keys. Errors tell you what failed.',`<div class="panel"><textarea id="in" rows="16" spellcheck="false" placeholder='{"hello":"world"}'></textarea>
 ${bar('<select id="i" style="width:auto"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="t">Tab</option></select><button class="pri" id="f">Format</button><button id="m">Minify</button><button id="s">Sort keys</button><button id="cp">Copy</button><button id="d">Download</button><button id="rs">Reset</button>')}<div id="e" style="margin-top:8px"></div></div>`);
 const ind=()=>$('#i').value==='t'?'\t':+$('#i').value;
 const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
 const run=fn=>{try{const v=JSON.parse($('#in').value);$('#in').value=fn(v);$('#e').innerHTML='<span class="ok">✓ Valid JSON</span>'}catch(x){$('#e').innerHTML='<span class="err">Invalid JSON: '+esc(x.message)+'</span>'}};
 $('#f').onclick=()=>run(v=>JSON.stringify(v,null,ind()));$('#m').onclick=()=>run(v=>JSON.stringify(v));$('#s').onclick=()=>run(v=>JSON.stringify(sort(v),null,ind()));
 $('#cp').onclick=e=>copy($('#in').value,e.target);$('#d').onclick=()=>dl('data.json',$('#in').value,'application/json');$('#rs').onclick=()=>rerun(el)});

add('encode','dev','⇄','Base64 / URL / HTML Encoder','Encode and decode Base64, URL and HTML entities.',el=>{
 el.innerHTML=page('Base64 / URL / HTML Encoder','Unicode-safe encoding and decoding.',`<div class="two"><div class="panel"><label>Mode</label><select id="m"><option value="b64">Base64</option><option value="url">URL component</option><option value="html">HTML entities</option></select><label>Input</label><textarea id="in" rows="8"></textarea>
 ${bar('<button class="pri" id="e">Encode</button><button id="d">Decode</button><button id="sw">Swap</button><button id="rs">Reset</button>')}</div><div class="panel"><label>Output</label><textarea id="o" rows="10" readonly></textarea>${bar('<button id="cp">Copy</button>')}<div id="er" class="err"></div></div></div>`);
 const F={b64:[s=>{let b='';new TextEncoder().encode(s).forEach(c=>b+=String.fromCharCode(c));return btoa(b)},s=>new TextDecoder().decode(Uint8Array.from(atob(s.trim()),c=>c.charCodeAt(0)))],
  url:[encodeURIComponent,decodeURIComponent],html:[esc,s=>{const t=document.createElement('textarea');t.innerHTML=s;return t.value}]};
 const go=i=>{try{$('#o').value=F[$('#m').value][i]($('#in').value);$('#er').textContent=''}catch(x){$('#o').value='';$('#er').textContent='Could not '+(i?'decode':'encode')+': input is not valid for this mode.'}};
 $('#e').onclick=()=>go(0);$('#d').onclick=()=>go(1);$('#sw').onclick=()=>{$('#in').value=$('#o').value;$('#o').value=''};$('#cp').onclick=e=>copy($('#o').value,e.target);$('#rs').onclick=()=>rerun(el)});

add('regex','dev','.*','Regex Tester','Test regular expressions with live match highlighting.',el=>{
 el.innerHTML=page('Regex Tester','Matches highlight as you type. The g flag is always applied.',`<div class="two"><div class="panel"><label>Pattern</label><input id="p" placeholder="(\\w+)@(\\w+\\.com)" spellcheck="false"><label>Flags</label><input id="f" value="gi" spellcheck="false"><label>Test text</label><textarea id="t" rows="8">Contact: hello@voqcl.com, support@example.com</textarea>${bar('<button id="rs">Reset</button>')}</div>
 <div class="panel"><div id="c" style="margin-bottom:8px"></div><div id="r" class="tools-out"></div><h4>Groups</h4><div id="g" class="tools-out" style="color:var(--mu)"></div></div></div>`);
 const up=()=>{const t=$('#t').value,src=$('#p').value;let fl=$('#f').value.replace(/[^dgimsuy]/g,'');if(!fl.includes('g'))fl+='g';
  if(!src){$('#r').innerHTML=esc(t);$('#c').textContent='Enter a pattern.';$('#g').textContent='';return}
  try{const re=new RegExp(src,fl);let last=0,h='',n=0,gl=[];for(const m of t.matchAll(re)){if(n>=500)break;h+=esc(t.slice(last,m.index))+'<mark>'+esc(m[0])+'</mark>';last=m.index+m[0].length;if(n<20)gl.push(`#${n+1} "${m[0]}"`+(m.length>1?'  groups: '+m.slice(1).map(x=>JSON.stringify(x??null)).join(', '):''));n++}
   $('#r').innerHTML=h+esc(t.slice(last));$('#c').innerHTML=`<span class="${n?'ok':''}">${n} match${n===1?'':'es'}</span>`;$('#g').textContent=gl.join('\n')}
  catch(x){$('#r').innerHTML=esc(t);$('#c').innerHTML='<span class="err">'+esc(x.message)+'</span>';$('#g').textContent=''}};
 $$('input,textarea',el).forEach(i=>i.oninput=up);$('#rs').onclick=()=>rerun(el);up()});

add('hash','dev','#!','Hash Generator','SHA-1, SHA-256, SHA-384 and SHA-512 hashes.',el=>{
 el.innerHTML=page('Hash Generator','Hashes are computed in your browser.',`<div class="panel"><label>Text</label><textarea id="in" rows="5"></textarea><div id="o"></div>${bar('<button id="rs">Reset</button>')}</div>`);
 const up=async()=>{if(!(window.crypto&&crypto.subtle)){$('#o').innerHTML='<p class="err">Hashing needs a secure context (https or localhost).</p>';return}
  const d=new TextEncoder().encode($('#in').value),out=[];for(const a of['SHA-1','SHA-256','SHA-384','SHA-512']){const h=[...new Uint8Array(await crypto.subtle.digest(a,d))].map(b=>pad(b.toString(16)).slice(-2)).join('');out.push(`<label>${a}</label><div class="row" style="margin:0"><code style="flex:1">${h}</code><button data-c="${h}">Copy</button></div>`)}
  if($('#o')){$('#o').innerHTML=out.join('');$$('#o [data-c]').forEach(b=>b.onclick=()=>copy(b.dataset.c,b))}};
 $('#in').oninput=up;$('#rs').onclick=()=>rerun(el);up()});

add('gen','dev','🔑','Password & UUID Generator','Secure random passwords and UUIDs.',el=>{
 el.innerHTML=page('Password & UUID Generator','Uses your browser’s cryptographic random generator.',`<div class="two"><div class="panel"><label>Length <span id="lv">20</span></label><input id="l" type="range" min="6" max="64" value="20">
 <label><input type="checkbox" id="u" checked style="width:auto"> Uppercase</label><label><input type="checkbox" id="w" checked style="width:auto"> Lowercase</label><label><input type="checkbox" id="n" checked style="width:auto"> Numbers</label><label><input type="checkbox" id="s" checked style="width:auto"> Symbols</label>
 ${bar('<button class="pri" id="g">Generate</button><button id="rs">Reset</button>')}</div><div class="panel"><label>Password</label><div class="row" style="margin:0"><code id="pw" style="flex:1"></code><button id="cp">Copy</button></div><label>UUIDs</label><div id="ids"></div></div></div>`);
 const gen=()=>{$('#lv').textContent=$('#l').value;let cs='';if($('#u').checked)cs+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if($('#w').checked)cs+='abcdefghijklmnopqrstuvwxyz';if($('#n').checked)cs+='0123456789';if($('#s').checked)cs+='!@#$%^&*()-_=+[]{};:,.?';
  if(!cs){$('#pw').innerHTML='<span class="err">Select at least one option.</span>';}else{let p='';for(let i=0;i<+$('#l').value;i++)p+=cs[crand(cs.length)];$('#pw').textContent=p}
  const uid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>(c==='x'?crand(16):8+crand(4)).toString(16));
  $('#ids').innerHTML=Array.from({length:4},()=>{const v=uid();return`<div class="row" style="margin:4px 0"><code style="flex:1">${v}</code><button data-c="${v}">Copy</button></div>`}).join('');$$('#ids [data-c]').forEach(b=>b.onclick=()=>copy(b.dataset.c,b))};
 $('#g').onclick=gen;$$('input',el).forEach(i=>i.oninput=gen);$('#cp').onclick=e=>copy($('#pw').textContent,e.target);$('#rs').onclick=()=>rerun(el);gen()});

add('textt','text','Aa','Text Tools','Counter, case converter, slugify, sort, dedupe and more.',el=>{
 el.innerHTML=page('Text Tools','Paste text, see stats, and transform it in place.',`<div class="panel"><textarea id="in" rows="12" placeholder="Type or paste text…"></textarea><div id="st" style="color:var(--mu);margin-top:8px"></div>
 ${bar('<button data-t="up">UPPER</button><button data-t="low">lower</button><button data-t="title">Title Case</button><button data-t="sent">Sentence case</button><button data-t="slug">slug-case</button><button data-t="rev">Reverse</button><button data-t="sort">Sort lines</button><button data-t="dedupe">Remove duplicates</button><button data-t="trim">Trim lines</button><button data-t="empty">Remove empty lines</button>')}
 <div class="row"><input id="fi" placeholder="Find" style="flex:1"><input id="re" placeholder="Replace with" style="flex:1"><button id="rp">Replace all</button></div>${bar('<button id="cp">Copy</button><button id="d">Download .txt</button><button id="rs">Reset</button>')}</div>`);
 const X={up:s=>s.toUpperCase(),low:s=>s.toLowerCase(),title:s=>s.toLowerCase().replace(/(^|[\s\-_])\S/g,m=>m.toUpperCase()),sent:s=>s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g,(_,a,b)=>a+b.toUpperCase()),
  slug:s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''),rev:s=>[...s].reverse().join(''),sort:s=>s.split('\n').sort((a,b)=>a.localeCompare(b)).join('\n'),
  dedupe:s=>[...new Set(s.split('\n'))].join('\n'),trim:s=>s.split('\n').map(l=>l.trim()).join('\n'),empty:s=>s.split('\n').filter(l=>l.trim()).join('\n')};
 const st=()=>{const s=$('#in').value,w=(s.trim().match(/\S+/g)||[]).length;$('#st').textContent=`${s.length} characters · ${s.replace(/\s/g,'').length} without spaces · ${w} words · ${s?s.split('\n').length:0} lines · ~${Math.max(w?1:0,Math.round(w/200))} min read`};
 $('#in').oninput=st;$$('[data-t]',el).forEach(b=>b.onclick=()=>{$('#in').value=X[b.dataset.t]($('#in').value);st()});
 $('#rp').onclick=()=>{const f=$('#fi').value;if(f){$('#in').value=$('#in').value.split(f).join($('#re').value);st()}};
 $('#cp').onclick=e=>copy($('#in').value,e.target);$('#d').onclick=()=>dl('text.txt',$('#in').value,'text/plain');$('#rs').onclick=()=>rerun(el);st()});

add('lorem','text','¶','Lorem Ipsum Generator','Placeholder text for layouts and mockups.',el=>{
 el.innerHTML=page('Lorem Ipsum Generator','Generate placeholder paragraphs.',`<div class="two"><div class="panel"><label>Paragraphs</label><input id="n" type="number" min="1" max="30" value="3"><label>Sentences per paragraph</label><input id="s" type="number" min="1" max="12" value="4">${bar('<button class="pri" id="g">Generate</button><button id="cp">Copy</button><button id="rs">Reset</button>')}</div><div class="panel"><div id="o" class="tools-out"></div></div></div>`);
 const W='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur'.split(' ');
 const sent=()=>{const n=6+crand(9);let s=Array.from({length:n},()=>W[crand(W.length)]).join(' ');return s[0].toUpperCase()+s.slice(1)+'.'};
 const gen=()=>{const n=Math.min(30,Math.max(1,+$('#n').value||1)),k=Math.min(12,Math.max(1,+$('#s').value||1));$('#o').textContent=Array.from({length:n},(_,i)=>(i?'':'Lorem ipsum dolor sit amet. ')+Array.from({length:k},sent).join(' ')).join('\n\n')};
 $('#g').onclick=gen;$('#cp').onclick=e=>copy($('#o').textContent,e.target);$('#rs').onclick=()=>rerun(el);gen()});

add('css','creator','◧','CSS Gradient & Shadow Generator','Visual generator for gradients, shadows and rounded corners.',el=>{
 el.innerHTML=page('CSS Gradient & Shadow Generator','Tweak the controls and copy the CSS.',`<div class="two"><div class="panel"><label>Gradient type</label><select id="ty"><option value="linear">Linear</option><option value="radial">Radial</option></select><label>Colour 1</label><input id="c1" type="color" value="#ffffff"><label>Colour 2</label><input id="c2" type="color" value="#2a2a2d">
 <label>Angle <span id="av">135</span>°</label><input id="a" type="range" min="0" max="360" value="135"><label>Shadow X / Y / Blur / Spread</label><div class="row" style="margin:0"><input id="x" type="number" value="0"><input id="y" type="number" value="12"><input id="b" type="number" value="30"><input id="sp" type="number" value="0"></div>
 <label>Shadow colour</label><input id="sc" type="color" value="#000000"><label>Shadow opacity</label><input id="so" type="range" min="0" max="100" value="50"><label>Radius (px)</label><input id="r" type="range" min="0" max="120" value="18"></div>
 <div><div class="panel checker" style="padding:40px"><div id="pv" style="height:200px;max-width:100%"></div></div><div class="panel" style="margin-top:10px"><code id="o" class="tools-out" style="display:block;background:#000"></code>${bar('<button class="pri" id="cp">Copy CSS</button><button id="rs">Reset</button>')}</div></div></div>`);
 const rgba=(h,a)=>`rgba(${[1,3,5].map(i=>parseInt(h.substr(i,2),16)).join(', ')}, ${a})`;
 const up=()=>{$('#av').textContent=$('#a').value;const bg=$('#ty').value==='linear'?`linear-gradient(${$('#a').value}deg, ${$('#c1').value}, ${$('#c2').value})`:`radial-gradient(circle, ${$('#c1').value}, ${$('#c2').value})`,
  sh=`${+$('#x').value||0}px ${+$('#y').value||0}px ${Math.max(0,+$('#b').value||0)}px ${+$('#sp').value||0}px ${rgba($('#sc').value,$('#so').value/100)}`,css=`background: ${bg};\nbox-shadow: ${sh};\nborder-radius: ${$('#r').value}px;`;
  $('#o').textContent=css;$('#pv').style.cssText=css};
 $$('input,select',el).forEach(i=>i.oninput=up);$('#cp').onclick=e=>copy($('#o').textContent,e.target);$('#rs').onclick=()=>rerun(el);up()});

add('minify','dev','⌗','Code Minifier & Beautifier','Minify CSS, HTML and JavaScript (basic) and beautify CSS.',el=>{
 el.innerHTML=page('Code Minifier & Beautifier','Basic whitespace and comment stripping. Always test minified code before shipping.',`<div class="panel"><label>Language</label><select id="l" style="max-width:200px"><option value="css">CSS</option><option value="html">HTML</option><option value="js">JavaScript (basic)</option></select><label>Code</label><textarea id="in" rows="14" spellcheck="false"></textarea>
 ${bar('<button class="pri" id="m">Minify</button><button id="b">Beautify (CSS)</button><button id="cp">Copy</button><button id="rs">Reset</button>')}<div id="i" style="color:var(--mu);margin-top:8px"></div></div>`);
 const M={css:s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{}:;,>])\s*/g,'$1').replace(/;}/g,'}').trim(),
  html:s=>s.replace(/<!--(?!\[if)[\s\S]*?-->/g,'').replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim(),
  js:s=>s.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('//')).join('\n')};
 $('#m').onclick=()=>{const a=$('#in').value,b=M[$('#l').value](a);$('#in').value=b;$('#i').textContent=`${a.length} → ${b.length} characters (${a.length?Math.round((1-b.length/a.length)*100):0}% smaller)`};
 $('#b').onclick=()=>{if($('#l').value!=='css'){$('#i').innerHTML='<span class="err">Beautify supports CSS only.</span>';return}$('#in').value=M.css($('#in').value).replace(/\{/g,' {\n  ').replace(/;(?!\})/g,';\n  ').replace(/;?\}/g,';\n}\n').replace(/\s+;\n/g,';\n').replace(/\n  \n/g,'\n');$('#i').textContent=''};
 $('#cp').onclick=e=>copy($('#in').value,e.target);$('#rs').onclick=()=>rerun(el)});

add('md','text','M↓','Markdown Previewer','Write Markdown and see a live preview.',el=>{
 el.innerHTML=page('Markdown Previewer','Supports headings, bold, italic, links, lists, code and code blocks. HTML is escaped for safety.',`<div class="two" style="grid-template-columns:1fr 1fr"><div class="panel"><textarea id="in" rows="16"># Stream rules\n\n- Be **kind**\n- No spam\n\nSee [VOQCL](https://example.com) and \`code\`.</textarea>${bar('<button id="cp">Copy Markdown</button><button id="rs">Reset</button>')}</div><div class="panel" id="pv"></div></div>`);
 const inl=s=>s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\*([^*]+)\*/g,'<i>$1</i>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener" style="text-decoration:underline">$1</a>');
 const md=src=>{const code=[];const s=esc(src).replace(/```[^\n]*\n?([\s\S]*?)```/g,(_,c)=>(code.push(c),'@@'+(code.length-1)+'@@'));let out='',list=false;const close=()=>{if(list){out+='</ul>';list=false}};
  for(const ln of s.split('\n')){let m;if(m=ln.match(/^(#{1,4})\s+(.*)/)){close();out+=`<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`}else if(m=ln.match(/^\s*[-*]\s+(.*)/)){if(!list){out+='<ul>';list=true}out+='<li>'+inl(m[1])+'</li>'}else if(m=ln.match(/^@@(\d+)@@$/)){close();out+='<pre style="background:#000;padding:10px;border-radius:8px;overflow:auto">'+code[m[1]]+'</pre>'}else if(!ln.trim())close();else{close();out+='<p>'+inl(ln)+'</p>'}}
  close();return out};
 const up=()=>$('#pv').innerHTML=md($('#in').value);$('#in').oninput=up;$('#cp').onclick=e=>copy($('#in').value,e.target);$('#rs').onclick=()=>rerun(el);up()});

const ytId=u=>{u=u.trim();let m=u.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);return m?m[1]:/^[\w-]{11}$/.test(u)?u:null};
add('ytthumb','yt','▶','YouTube Thumbnail Grabber','Get every thumbnail size for any YouTube video.',el=>{
 el.innerHTML=page('YouTube Thumbnail Grabber','Paste a YouTube link or video ID. Thumbnails load from YouTube, so an internet connection is required.',`<div class="panel"><div class="row" style="margin:0"><input id="u" placeholder="https://youtu.be/…" style="flex:1;min-width:200px"><button class="pri" id="g">Get thumbnails</button><button id="rs">Reset</button></div><div id="e" class="err" style="margin-top:8px"></div></div><div class="grid" id="o" style="margin-top:12px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))"></div>`);
 const go=()=>{const id=ytId($('#u').value);if(!id){$('#e').textContent='Could not find a valid video ID.';$('#o').innerHTML='';return}$('#e').textContent='';
  $('#o').innerHTML=[['maxresdefault','Max 1280×720'],['sddefault','SD 640×480'],['hqdefault','HQ 480×360'],['mqdefault','MQ 320×180']].map(([k,n])=>{const u=`https://img.youtube.com/vi/${id}/${k}.jpg`;return`<div class="panel"><b>${n}</b><div style="margin:8px 0;min-height:60px;background:#000;border-radius:8px;overflow:hidden"><img src="${u}" alt="" style="width:100%"></div><div class="st err"></div><div class="row" style="margin:0"><a class="btn" href="${u}" target="_blank" rel="noopener">Open</a><button data-c="${u}">Copy URL</button></div></div>`}).join('');
  $$('#o img').forEach(i=>i.onerror=()=>{i.style.display='none';i.parentNode.nextElementSibling.textContent='Not available (video may lack this size, or you are offline).'});$$('#o [data-c]').forEach(b=>b.onclick=()=>copy(b.dataset.c,b))};
 $('#g').onclick=go;$('#u').addEventListener('keydown',e=>{if(e.key==='Enter')go()});$('#rs').onclick=()=>rerun(el)});

add('ytchap','yt','⏱','YouTube Chapters & Time Links','Validate chapter lists and build timestamp links.',el=>{
 el.innerHTML=page('YouTube Chapters & Time Links','One chapter per line, e.g. “0:00 Intro”. YouTube needs a 0:00 start, 3+ chapters and 10s+ per chapter.',`<div class="two"><div class="panel"><label>Chapters</label><textarea id="in" rows="10">0:00 Intro\n1:30 Gameplay\n12:45 Wrap up</textarea><div id="v" style="margin-top:8px"></div>${bar('<button id="cp">Copy</button><button id="rs">Reset</button>')}</div>
 <div class="panel"><b>Timestamp link</b><label>Video URL or ID</label><input id="u" placeholder="https://youtu.be/…"><label>Time (e.g. 1:23 or 1:02:03)</label><input id="t" value="0:30"><div class="row"><code id="l" style="flex:1"></code><button id="cl">Copy</button></div><div id="le" class="err"></div></div></div>`);
 const sec=t=>t.split(':').reduce((a,b)=>a*60+ +b,0);
 const up=()=>{const L=$('#in').value.split('\n').filter(l=>l.trim()),iss=[];let prev=-1,n=0;
  L.forEach((l,i)=>{const m=l.match(/^\s*((?:\d+:)?\d{1,2}:\d{2})\s+(.+)$/);if(!m){iss.push(`Line ${i+1}: use “m:ss Title”.`);return}const s=sec(m[1]);if(!n&&s!==0)iss.push('First chapter must start at 0:00.');if(prev>=0&&s<=prev)iss.push(`Line ${i+1}: times must increase.`);else if(prev>=0&&s-prev<10)iss.push(`Line ${i+1}: chapter shorter than 10 seconds.`);prev=s;n++});
  if(n<3&&!iss.length)iss.push('Need at least 3 chapters.');$('#v').innerHTML=iss.length?iss.map(x=>`<div class="err">⚠ ${esc(x)}</div>`).join(''):'<span class="ok">✓ Chapters look valid</span>'};
 const lk=()=>{const id=ytId($('#u').value),t=$('#t').value.trim();if(!/^(\d+:)?\d{1,2}:\d{2}$|^\d+$/.test(t)){$('#l').textContent='';$('#le').textContent='Invalid time.';return}$('#le').textContent=id||!$('#u').value?'':'Invalid video URL.';$('#l').textContent=id?`https://youtu.be/${id}?t=${sec(t)}`:''};
 $('#in').oninput=up;$('#u').oninput=$('#t').oninput=lk;$('#cp').onclick=e=>copy($('#in').value,e.target);$('#cl').onclick=e=>copy($('#l').textContent,e.target);$('#rs').onclick=()=>rerun(el);up();lk()});

add('ytseo','yt','Σ','YouTube Title, Description & Tags Checker','Character limits and search preview for your video metadata.',el=>{
 el.innerHTML=page('YouTube Title, Description & Tags Checker','Limits: title 100, description 5000, tags 500 characters.',`<div class="two"><div class="panel"><label>Title <span id="tc"></span></label><input id="ti"><label>Description <span id="dc"></span></label><textarea id="de" rows="6"></textarea><label>Tags (comma separated) <span id="gc"></span></label><textarea id="tg" rows="3"></textarea>${bar('<button id="rs">Reset</button>')}</div>
 <div class="panel"><b>Search preview</b><div id="pv" style="margin-top:8px;font-size:16px"></div><div style="color:var(--mu);margin-top:8px">Titles over ~60 characters are often truncated in search results.</div></div></div>`);
 const c=(el,n,max)=>{el.innerHTML=`<span style="color:${n>max?'#ff8a8a':'#8e8e93'}">${n}/${max}</span>`};
 const up=()=>{const t=$('#ti').value,tg=$('#tg').value.split(',').map(x=>x.trim()).filter(Boolean);c($('#tc'),t.length,100);c($('#dc'),$('#de').value.length,5000);c($('#gc'),tg.join(',').length,500);$('#gc').innerHTML+=` · ${tg.length} tags`;$('#pv').textContent=t.length>60?t.slice(0,60)+'…':t||'Your title appears here'};
 $$('input,textarea',el).forEach(i=>i.oninput=up);$('#rs').onclick=()=>rerun(el);up()});

add('sched','obs','📅','Stream Schedule Generator','Weekly schedule as copyable text or a PNG graphic.',el=>{
 const D=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],on=[1,0,1,0,1,0,0];let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
 el.innerHTML=page('Stream Schedule Generator','Pick your days and times, then copy the text or download a graphic.',`<div class="two"><div class="panel"><label>Channel / title</label><input id="ch" value="My Stream Schedule"><label>Timezone label</label><input id="tz" value="${esc(tz)}">${D.map((d,i)=>`<div class="row"><label style="margin:0;width:100px"><input type="checkbox" data-d="${i}" ${on[i]?'checked':''} style="width:auto"> ${d.slice(0,3)}</label><input type="time" data-t="${i}" value="19:00" style="width:110px"><input data-n="${i}" placeholder="Title" value="Live" style="flex:1"></div>`).join('')}</div>
 <div><div class="panel"><div id="o" class="tools-out"></div><div class="row"><button id="cp">Copy text</button><button class="pri" id="d">Download PNG</button><button id="rs">Reset</button></div></div><div class="panel checker" style="margin-top:10px"><canvas id="cv"></canvas></div></div></div>`);
 const rows=()=>D.map((d,i)=>({d,i})).filter(x=>$(`[data-d="${x.i}"]`).checked).map(x=>({d:x.d,t:$(`[data-t="${x.i}"]`).value||'--:--',n:$(`[data-n="${x.i}"]`).value}));
 const up=()=>{const R=rows(),tl=$('#tz').value;$('#o').textContent=`📅 ${$('#ch').value}${tl?' ('+tl+')':''}\n`+(R.length?R.map(r=>`${r.d.slice(0,3)} — ${r.t}${r.n?' — '+r.n:''}`).join('\n'):'No days selected');
  const cv=$('#cv'),x=cv.getContext('2d');cv.width=1280;cv.height=Math.max(360,200+R.length*80);x.fillStyle='#0b0b0c';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#fff';x.font='700 54px system-ui,sans-serif';x.fillText($('#ch').value.slice(0,32),60,100);x.fillStyle='#8e8e93';x.font='24px system-ui,sans-serif';x.fillText(tl,60,140);
  R.forEach((r,i)=>{const y=190+i*80;x.fillStyle='#1c1c1e';x.beginPath();x.roundRect(60,y,1160,64,14);x.fill();x.fillStyle='#fff';x.font='700 30px system-ui,sans-serif';x.fillText(r.d,90,y+42);x.fillStyle='#bbb';x.font='28px system-ui,sans-serif';x.fillText(r.t,420,y+42);x.fillText(r.n.slice(0,36),600,y+42)})};
 $$('input',el).forEach(i=>i.oninput=i.onchange=up);$('#cp').onclick=e=>copy($('#o').textContent,e.target);$('#d').onclick=()=>$('#cv').toBlob(b=>dl('stream-schedule.png',b));$('#rs').onclick=()=>rerun(el);up()});

add('stopwatch','util','⏲','Stream Timer / Stopwatch','Count-up timer with laps and an OBS overlay export.',el=>{
 el.innerHTML=page('Stream Timer / Stopwatch','Track stream length or segments. Export a count-up overlay for OBS.',`<div class="two"><div class="panel"><div class="big" id="t">00:00:00.0</div>${bar('<button class="pri" id="s">Start</button><button id="l">Lap</button><button id="rs">Reset</button><button id="ex">Download OBS overlay</button>')}</div><div class="panel"><b>Laps</b><div id="ll" class="tools-out" style="color:var(--mu)">No laps yet.</div></div></div>${OBSNOTE}`);
 let el0=0,t0=0,run=false,laps=[];const fmt=ms=>{const s=Math.floor(ms/1000);return`${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}.${Math.floor(ms%1000/100)}`};const now=()=>el0+(run?performance.now()-t0:0);
 tm(()=>{if($('#t'))$('#t').textContent=fmt(now())},50);
 $('#s').onclick=()=>{if(run){el0=now();run=false;$('#s').textContent='Start'}else{t0=performance.now();run=true;$('#s').textContent='Pause'}};
 $('#l').onclick=()=>{if(!run&&!el0)return;laps.push(fmt(now()));$('#ll').textContent=laps.map((v,i)=>`#${i+1}  ${v}`).join('\n')};$('#rs').onclick=()=>rerun(el);
 $('#ex').onclick=()=>dl('voqcl-timer-overlay.html',overlayDoc('<div id="t" style="font:800 6vw system-ui;padding:20px"></div>',`const s=Date.now();setInterval(()=>{const x=Math.floor((Date.now()-s)/1e3),p=v=>String(v).padStart(2,'0');t.textContent=p(Math.floor(x/3600))+':'+p(Math.floor(x%3600/60))+':'+p(x%60)},250)`),'text/html')});

add('random','util','🎲','Randomizer','Coin flip, dice, number range and list picker.',el=>{
 el.innerHTML=page('Randomizer','Uses secure random numbers.',`<div class="two"><div class="panel"><div class="row" style="margin:0"><button id="co">Flip coin</button></div><label>Dice: count × sides</label><div class="row" style="margin:0"><input id="dn" type="number" min="1" max="20" value="2" style="width:80px"><input id="ds" type="number" min="2" max="1000" value="6" style="width:100px"><button id="dr">Roll</button></div>
 <label>Number range</label><div class="row" style="margin:0"><input id="mn" type="number" value="1"><input id="mx" type="number" value="100"><button id="nr">Generate</button></div><label>Pick from list (one per line)</label><textarea id="li" rows="5"></textarea>${bar('<button id="pk">Pick one</button><button id="rs">Reset</button>')}</div><div class="panel"><div class="big" id="r" style="font-size:40px">—</div><div id="e" class="err" style="text-align:center"></div></div></div>`);
 const out=(v,e='')=>{$('#r').textContent=v;$('#e').textContent=e};
 $('#co').onclick=()=>out(crand(2)?'Heads':'Tails');
 $('#dr').onclick=()=>{const n=Math.floor(+$('#dn').value),s=Math.floor(+$('#ds').value);if(!(n>=1&&n<=20&&s>=2&&s<=1000)){out('—','Dice: 1–20 dice, 2–1000 sides.');return}const r=Array.from({length:n},()=>1+crand(s));out(r.join(' + ')+(n>1?' = '+r.reduce((a,b)=>a+b):''))};
 $('#nr').onclick=()=>{const a=Math.floor(+$('#mn').value),b=Math.floor(+$('#mx').value);if(!(a<=b)||!isFinite(a+b)){out('—','Min must be ≤ max.');return}out(a+crand(b-a+1))};
 $('#pk').onclick=()=>{const l=$('#li').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!l.length){out('—','Add at least one line.');return}out(l[crand(l.length)])};$('#rs').onclick=()=>rerun(el)});

add('unix','dev','⌚','Unix Timestamp Converter','Convert Unix time to dates and back.',el=>{
 el.innerHTML=page('Unix Timestamp Converter','Seconds or milliseconds are detected automatically.',`<div class="two"><div class="panel"><label>Unix timestamp</label><input id="u" placeholder="1700000000"><label>Or pick a date/time (local)</label><input id="d" type="datetime-local">${bar('<button id="n">Now</button><button id="rs">Reset</button>')}</div><div class="panel"><div id="o"></div></div></div>`);
 const show=ms=>{if(!isFinite(ms)||isNaN(new Date(ms).getTime())){$('#o').innerHTML='<span class="err">Invalid timestamp.</span>';return}const d=new Date(ms);const rows=[['Seconds',Math.floor(ms/1000)],['Milliseconds',ms],['ISO (UTC)',d.toISOString()],['Local',d.toString()]];
  $('#o').innerHTML=rows.map(([k,v])=>`<label>${k}</label><div class="row" style="margin:0"><code style="flex:1">${esc(v)}</code><button data-c="${esc(v)}">Copy</button></div>`).join('');$$('#o [data-c]').forEach(b=>b.onclick=()=>copy(b.dataset.c,b))};
 $('#u').oninput=()=>{const v=$('#u').value.trim();if(!v){$('#o').innerHTML='';return}const n=Number(v);show(Math.abs(n)>1e11?n:n*1e3)};$('#d').oninput=()=>{const t=new Date($('#d').value).getTime();if(!isNaN(t))show(t)};
 $('#n').onclick=()=>{$('#u').value=Math.floor(Date.now()/1e3);show(Date.now())};$('#rs').onclick=()=>rerun(el)});

/* ---------- ChatIS overlay + live follower tracker ---------- */
add('chatis','obs','💬','ChatIS Chat Overlay','Twitch chat for OBS with 7TV, BTTV & FFZ emotes. Pick options, copy the URL.',el=>{
 const D={channel:'',size:'2',font:'2',stroke:'0',shadow:'2',animate:false,bots:false,fade:false,fadeS:30};let S={...D,...LS.g('chatis',{})};
 const opt=(n,a)=>a.map(([v,l])=>`<option value="${v}" ${String(S[n])===String(v)?'selected':''}>${l}</option>`).join('');
 const sw=(k,l)=>`<label class="sw"><span>${l}</span><input type="checkbox" data-k="${k}" ${S[k]?'checked':''}></label>`;
 el.innerHTML=page('ChatIS Chat Overlay','Twitch chat for OBS, powered by ChatIS (7TV, BTTV and FFZ emotes). Pick options, copy the URL, add it as a Browser Source.',`
 <div class="panel"><label>Twitch channel</label><input id="ch" placeholder="e.g. voqcl" value="${esc(S.channel)}" autocomplete="off" spellcheck="false"><div id="ce" class="err" style="margin-top:6px"></div></div>
 <div class="panel" style="margin-top:10px"><div class="two" style="grid-template-columns:1fr 1fr">
 <div><b class="sec">Text & style</b><label>Size</label><select data-k="size">${opt('size',[[1,'Small'],[2,'Medium'],[3,'Large']])}</select><label>Font</label><select data-k="font">${opt('font',Array.from({length:12},(_,i)=>[i+1,'Font '+(i+1)]))}</select>
 <label>Stroke</label><select data-k="stroke">${opt('stroke',[[0,'Off'],[1,'Thin'],[2,'Thick']])}</select><label>Shadow</label><select data-k="shadow">${opt('shadow',[[0,'Off'],[1,'Small'],[2,'Medium'],[3,'Large']])}</select></div>
 <div><b class="sec">Behavior</b>${sw('animate','Animate new messages')}${sw('bots','Show bots & commands')}${sw('fade','Fade old messages')}<label>Fade after (seconds)</label><input data-k="fadeS" type="number" min="1" max="3600" value="${S.fadeS}"></div></div>
 <div class="row"><button id="rs">Reset options</button></div></div>
 <div class="panel" style="margin-top:10px"><b class="sec">Overlay URL</b><div class="row" style="margin-top:6px"><code id="u" style="flex:1;min-width:200px;padding:10px">Enter a channel above</code><button class="pri" id="cp">Copy URL</button><a class="btn" id="op" target="_blank" rel="noopener">Open</a></div>
 <div class="note">In OBS: Sources → Browser → paste the URL → set width <b>400</b>, height <b>600</b> (or your layout) → OK. Leave Custom CSS empty. The chat connects from OBS straight to Twitch, so it works without this site being open. ChatIS is a free third-party service by IS2511.</div></div>
 <div class="panel" style="margin-top:10px"><div class="row" style="margin:0"><b class="sec" style="margin-right:auto">Preview</b><button id="bg">Light background</button><button id="rl">Reload</button></div>
 <div id="pw" class="checker" style="margin-top:10px;height:380px;position:relative"><iframe id="pv" style="width:100%;height:100%;border:0;background:transparent" title="Chat preview"></iframe><div id="ph" style="position:absolute;inset:0;display:grid;place-items:center;color:var(--mu);text-align:center;padding:20px;pointer-events:none"></div></div>
 <div style="color:var(--mu);font-size:12px;margin-top:8px">Quiet channels show nothing until someone types. If the preview stays blank, the channel may be offline or your network blocks the embed; the URL still works in OBS.</div></div>`);
 const url=()=>{const c=S.channel.trim().toLowerCase();if(!/^\w{3,25}$/.test(c))return'';let u='https://chatis.is2511.com/v2/?channel='+c;if(S.animate)u+='&animate=true';if(S.bots)u+='&bots=true';if(S.fade)u+='&fade='+Math.min(3600,Math.max(1,Math.floor(+S.fadeS)||30));u+='&size='+S.size+'&font='+S.font;if(String(S.stroke)!=='0')u+='&stroke='+S.stroke;if(String(S.shadow)!=='0')u+='&shadow='+S.shadow;return u};
 let tmo;CLEAN.push(()=>clearTimeout(tmo));const load=()=>{const u=url(),f=$('#pv'),ph=$('#ph');if(!f||!ph)return;if(!u){f.removeAttribute('src');ph.textContent='Enter a Twitch channel to preview chat.';return}ph.textContent='Loading preview…';f.onload=()=>ph.textContent='';f.src=u};
 const up=()=>{LS.s('chatis',S);const u=url(),c=S.channel.trim();$('#ce').textContent=c&&!u?'Channel names use 3–25 letters, numbers or underscores.':'';$('#u').textContent=u||'Enter a channel above';$('#op').href=u||'#';$('#op').style.opacity=u?1:.4;$('#cp').disabled=!u;clearTimeout(tmo);tmo=setTimeout(load,600)};
 $('#ch').oninput=e=>{S.channel=e.target.value;up()};
 $$('[data-k]',el).forEach(i=>i.oninput=i.onchange=()=>{S[i.dataset.k]=i.type==='checkbox'?i.checked:i.value;up()});
 $('#cp').onclick=e=>{if(url())copy(url(),e.target)};$('#op').onclick=e=>{if(!url())e.preventDefault()};$('#rl').onclick=()=>{clearTimeout(tmo);load()};
 $('#bg').onclick=e=>{const l=$('#pw').dataset.l!=='1';$('#pw').dataset.l=l?'1':'';$('#pw').style.background=l?'#e8e8e8':'';e.target.textContent=l?'Dark background':'Light background'};
 $('#rs').onclick=()=>{LS.s('chatis',{...D,channel:S.channel});rerun(el)};up()});

const DEC='https://decapi.me/twitch/';
const decTxt=async p=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);try{const r=await fetch(DEC+p,{signal:c.signal});if(!r.ok)throw new Error('Service returned '+r.status);return(await r.text()).trim()}finally{clearTimeout(t)}};
function liveView(box,ch,overlay){
 const key='live.'+ch;let hist=LS.g(key,[]).filter(p=>Date.now()-p[0]<16*36e5),av='',cur=null,err='';
 box.innerHTML=`<div class="lv"><div class="avw"><img class="av" alt="" hidden><div class="av ph">${esc(ch[0].toUpperCase())}</div></div><div class="nm">${esc(ch)}</div><div class="cnt">…</div><div class="lb">Followers</div><div class="err lerr"></div><div class="chart" ${overlay?'hidden':''}></div></div>`;
 const q=s=>$(s,box),img=q('img.av');img.onerror=()=>{img.hidden=true;q('.ph').hidden=false};img.onload=()=>{img.hidden=false;q('.ph').hidden=true};
 const chart=()=>{if(hist.length<2){return`<div style="color:var(--mu);text-align:center;font-size:12px">Collecting history… (updates every 15s)</div>`}
  const W=700,H=150,v=hist.map(p=>p[1]),mn=Math.min(...v),mx=Math.max(...v),lo=mn===mx?mn-1:mn,hi=mn===mx?mx+1:mx,t0=hist[0][0],t1=hist[hist.length-1][0],xs=t=>(t-t0)/Math.max(1,t1-t0)*W,ys=n=>H-(n-lo)/(hi-lo)*(H-12)-6;
  const pts=hist.map(p=>xs(p[0]).toFixed(1)+','+ys(p[1]).toFixed(1)).join(' '),gain=v[v.length-1]-v[0],hrs=Math.max(0,(t1-t0)/36e5),span=hrs<1?Math.max(1,Math.round(hrs*60))+'m':hrs.toFixed(1)+'h',f=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  return`<div class="row" style="justify-content:space-between;margin:0 0 6px;font-size:12px;color:var(--mu)"><span><b style="color:#fff">${gain>0?'+':gain<0?'−':'±'}${Math.abs(gain)}</b> followers gained</span><span>last ${span}</span></div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:150px;display:block"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><polygon points="0,${H} ${pts} ${W},${H}" fill="url(#g)"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="row" style="justify-content:space-between;margin:4px 0 0;font-size:11px;color:var(--mu)"><span>${f(t0)}</span><span>${f(t1)}</span></div>`};
 const paint=()=>{if(!box.isConnected||!q('.cnt'))return;q('.cnt').textContent=cur==null?(err?'—':'…'):cur.toLocaleString();q('.lerr').textContent=err?err+' · retrying…':'';if(!overlay)q('.chart').innerHTML=chart()};
 const poll=async()=>{try{if(!av){try{const a=await decTxt('avatar/'+ch);if(/^https?:\/\//.test(a)){av=a;img.src=a}}catch(e){}}
  const t=await decTxt('followcount/'+ch);if(!/^\d+$/.test(t))throw new Error(/not found|no user|invalid/i.test(t)?'Channel not found':(t.slice(0,60)||'Unexpected response'));
  cur=+t;err='';hist.push([Date.now(),cur]);hist=hist.slice(-1500);LS.s(key,hist)}catch(e){err=e.name==='AbortError'?'Request timed out':e.message==='Failed to fetch'?'Could not reach the follower service':e.message}paint()};
 paint();poll();tm(poll,15000)}

add('followlive','obs','♥','Live Follower Tracker','Live Twitch follower count with history chart and a transparent OBS overlay.',el=>{
 el.innerHTML=page('Live Follower Tracker','Enter any Twitch channel to see its follower count update live, with a history chart.',`<div class="panel"><div class="row" style="margin:0"><input id="c" placeholder="Twitch channel, e.g. voqcl" style="flex:1;min-width:200px" autocomplete="off" spellcheck="false"><button class="pri" id="go">Track</button></div><div id="e" class="err" style="margin-top:6px"></div></div>
 <div class="panel" id="lv" style="margin-top:10px;background:#000;display:none"></div>
 <div class="panel" id="ob" style="margin-top:10px;display:none"><b class="sec">OBS overlay</b><div class="row" style="margin-top:6px"><code id="ou" style="flex:1;min-width:200px;padding:10px"></code><button class="pri" id="co">Copy URL</button><a class="btn" id="oo" target="_blank" rel="noopener">Open</a></div>
 <div class="note">Add as an OBS Browser Source (e.g. 600×300). The background is transparent and shows just the avatar, name and count. The URL points at <i>this site</i>, so it must be hosted (or served locally, e.g. http://localhost:8000). Follower data comes from the free third-party DecAPI service, refreshed every 15 seconds.</div></div>`);
 const go=()=>{const c=$('#c').value.trim().replace(/^@/,'').toLowerCase();if(!/^\w{3,25}$/.test(c)){$('#e').textContent='Enter a valid Twitch channel name (3–25 letters, numbers or underscores).';return}$('#e').textContent='';LS.s('live.last',c);runClean();$('#lv').style.display='block';liveView($('#lv'),c,false);
  const u=location.href.split('#')[0]+'#/live/'+c+'/overlay';$('#ob').style.display='block';$('#ou').textContent=u;$('#oo').href=u;$('#co').onclick=e=>copy(u,e.target)};
 $('#go').onclick=go;$('#c').addEventListener('keydown',e=>{if(e.key==='Enter')go()});const last=LS.g('live.last','');if(last){$('#c').value=last;go()}});
