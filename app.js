'use strict';
const D={
 out:{n:'向外',t:'人生版图',s:'财富 健康 关系 意义',c:'#9a7b4f',m:['财富','健康','关系','意义']},
 in:{n:'向内',t:'自我画像',s:'情绪 欲望 比较 选择',c:'#6f7f78',m:['我的一个特征','我发现自己','我正在理解','我不愿面对']},
 up:{n:'向上',t:'价值与方向',s:'价值 理想 信念',c:'#6b6f8a',m:['价值观','理想','世界观','长期方向','人生原则']},
 down:{n:'向下',t:'时间与生命',s:'时间 经历 生命',c:'#8a5f55',m:['人生事件','重要的人','人生阶段']}};
const TYPES=['','人生转折','重要决定','重要的人','相遇','离别','成功','失败','第一次','旅行','工作','学习','搬家','感情','家庭','创作','意外','珍藏的时刻'];
const PH={'我的一个特征':'例如：我很在意别人怎么看我。','我发现自己':'例如：我发现自己在竞争环境中容易产生比较心理。','我正在理解':'例如：我以前认为成功是拥有更多，现在开始觉得自由更重要。','我不愿面对':'例如：我其实害怕自己很多年后仍没有真正属于自己的事业。','人生原则':'例如：不为短期利益牺牲长期自由。'};
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0'),today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
let R=[],M={name:'',birth:''},S={mod:'',tab:'tl',pick:0,q:'',fav:false,dir:'',k:''},db,imgs=[];
/* ---------- IndexedDB ---------- */
const open=()=>new Promise((ok,no)=>{const r=indexedDB.open('lifemap',1);r.onupgradeneeded=()=>{r.result.createObjectStore('records',{keyPath:'id'});r.result.createObjectStore('meta',{keyPath:'k'})};r.onsuccess=()=>{db=r.result;ok()};r.onerror=()=>no(r.error)});
const tx=(s,m,f)=>new Promise((ok,no)=>{const t=db.transaction(s,m);const q=f(t.objectStore(s));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)});
const load=async()=>{R=await tx('records','readonly',o=>o.getAll())};
const put=r=>tx('records','readwrite',o=>o.put(r)),del=id=>tx('records','readwrite',o=>o.delete(id));
const setMeta=()=>tx('meta','readwrite',o=>o.put({k:'m',v:M}));
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2200)};
const greet=()=>{const h=new Date().getHours();
 if(h<5)return '夜深了，适合和自己待一会儿';
 if(h<9)return '早上好，今天想留下点什么';
 if(h<12)return '上午好，看看自己正在怎样生活';
 if(h<14)return '中午了，歇一歇吧';
 if(h<18)return '午后安，继续走自己的路';
 if(h<22)return '晚上好，适合回望的一天';
 return '夜深了，写两句再睡吧'};
const byDate=(a,b)=>b.date.localeCompare(a.date)||(b.updated||0)-(a.updated||0);
/* ---------- 视图 ---------- */
const card=r=>`<article class="card" data-id="${r.id}" style="--c:${D[r.dir].c}"><div class="meta">${esc(r.date)}　${esc(D[r.dir].n)}${r.module?'　'+esc(r.module):''}${r.fav?'　★':''}</div><h3>${esc(r.title||'（无题）')}</h3><p>${esc((r.content||'').slice(0,120))}</p>${r.images&&r.images[0]?`<img src="${r.images[0]}" alt="">`:''}<div class="tags">${(r.tags||[]).map(t=>'<i>#'+esc(t)+'</i>').join('')}</div></article>`;
const list=a=>a.length?a.map(card).join(''):'<p class="empty">这里还很安静。想写的时候再写。</p>';
const dirA=k=>`<a class="dir ${k}" style="--c:${D[k].c}" href="#/d/${k}"><b>${{up:'↑',in:'←',out:'→',down:'↓'}[k]} ${D[k].n}</b><span>${D[k].t}</span><small>${D[k].s}</small></a>`;
const home=()=>{const rec=R.slice().sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,3);
 return `<header><h1>人生坐标</h1><small>${new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</small><p class="greet">${greet()}</p></header>
 <div class="map">${dirA('up')}${dirA('in')}<a class="me" href="#/data">${esc(M.name||'我')}</a>${dirA('out')}${dirA('down')}</div>
 <p class="quote">不是告诉我应该怎样生活，<br>而是帮助我看见，我正在怎样生活。</p>${rec.length?'<h5>最近写下的</h5>'+rec.map(card).join(''):''}`};
const timeline=a=>{if(!a.length)return list(a);const g={};
 a.slice().sort((x,y)=>x.date.localeCompare(y.date)).forEach(r=>(g[r.date.slice(0,4)]??=[]).push(r));
 return '<div class="tl">'+Object.entries(g).map(([y,rs])=>`<section><h4>${y}${M.birth&&y>=M.birth?`<small>${y-M.birth} 岁</small>`:''}</h4>${rs.map(r=>`<div class="card" data-id="${r.id}" style="--c:${D[r.dir].c}"><div class="meta">${esc(r.date.slice(5))}${r.place?'　'+esc(r.place):''}${r.type?'　'+esc(r.type):''}</div><h3>${esc(r.title||'（无题）')}</h3><p>${esc((r.content||'').slice(0,90))}</p></div>`).join('')}</section>`).join('')+'</div>'};
const dirView=k=>{const d=D[k];if(S.k!==k){S.k=k;S.mod=''}
 const rs=R.filter(r=>r.dir===k&&(!S.mod||r.module===S.mod)).sort(byDate);
 return `<p class="back"><a href="#/">← 返回人生版图</a></p><h2 style="color:${d.c}">${d.n}　${d.t}</h2>
 <div class="chips">${['',...d.m].map(m=>`<button data-mod="${m}" class="${S.mod===m?'on':''}">${m||'全部'}</button>`).join('')}</div>
 ${k==='down'?`<div class="chips"><button data-tab="tl" class="${S.tab==='tl'?'on':''}">人生时间轴</button><button data-tab="ls" class="${S.tab==='ls'?'on':''}">全部记录</button></div>`:''}
 <div>${k==='down'&&S.tab==='tl'?timeline(rs):list(rs)}</div><button class="add" data-act="new">写一条${d.n}的记录</button>`};
const res=()=>{const q=S.q.toLowerCase();return list(R.filter(r=>(!S.fav||r.fav)&&(!S.dir||r.dir===S.dir)&&(!q||[r.title,r.content,r.place,r.people,r.module,r.type,...(r.tags||[])].join(' ').toLowerCase().includes(q))).sort(byDate))};
const allView=()=>`<h2>全部记录</h2><input id="q" type="search" placeholder="搜索标题、内容、标签、人物、地点" value="${esc(S.q)}"><div class="chips"><button data-fav="1" class="${S.fav?'on':''}">★ 收藏</button>${Object.keys(D).map(k=>`<button data-dir="${k}" class="${S.dir===k?'on':''}">${D[k].n}</button>`).join('')}</div><div id="res">${res()}</div>`;
const lookView=()=>{const t=new Date(),now=Date.now(),dt=r=>new Date(r.date+'T00:00');
 const same=R.filter(r=>dt(r).getMonth()===t.getMonth()&&dt(r).getDate()===t.getDate()&&dt(r).getFullYear()<t.getFullYear());
 const pool=same.length?same:R.filter(r=>now-dt(r)>30*864e5);
 if(!pool.length)return '<h2>回望</h2><p class="empty">还没有足够久远的记录。<br>过一段时间，再来遇见过去的自己。</p>';
 const r=pool[S.pick%pool.length];S.cur=r.id;const days=(now-dt(r))/864e5;
 const ago=days>=365?Math.floor(days/365)+' 年前':Math.max(1,Math.round(days/30))+' 个月前';
 return `<h2>回望</h2><p class="note">${ago}${same.length?'的今天':''}，你写下：</p><article class="card" data-id="${r.id}" style="--c:${D[r.dir].c}"><div class="meta">${esc(r.date)}　${esc(D[r.dir].n)}${r.module?'　'+esc(r.module):''}</div><h3>${esc(r.title)}</h3><p>${esc(r.content)}</p>${(r.images||[]).map(s=>`<img src="${s}" alt="">`).join('')}</article>
 <div class="row" style="margin-top:16px"><button data-act="reflect" class="pri">写下现在的看法</button>${pool.length>1?'<button data-act="next">换一条</button>':''}</div>`};
const dataView=()=>`<h2>数据与设置</h2><label>名字<input id="nm" value="${esc(M.name)}" placeholder="显示在人生版图中央"></label><label>出生年份（可选，时间轴会显示年龄）<input id="bi" type="number" inputmode="numeric" value="${esc(M.birth)}" placeholder="例如 1996"></label>
 <p class="note">所有内容只保存在这台设备的这个浏览器里，没有上传到任何地方。更换设备、重新部署或清理浏览器数据前，请先备份。目前共 ${R.length} 条记录。</p>
 <h2 style="font-size:15px;margin-top:18px">备份</h2>
 <div class="row"><button data-act="copytxt" class="pri">复制纯文本备份</button><button data-act="exp">导出完整备份</button></div>
 <textarea id="bk" rows="6" placeholder="在此粘贴备份文本…"></textarea>
 <div class="row"><button data-act="imptxt">从文本导入</button><button data-act="imp">或选择备份文件</button></div><input id="file" type="file" accept=".json,application/json" hidden>
 <p class="note">备份文本可直接粘贴到备忘录保存。建议每月备份一次，换手机或清理数据前先备份。纯文本备份不含图片；要备份图片请用「导出完整备份」下载文件保存。</p>
 <div class="row" style="margin-top:28px"><button class="danger" data-act="wipe">清空所有数据</button></div>`;
function render(){const h=location.hash.replace(/^#\/?/,''),[a,b]=h.split('/');
 const s='#/'+(a==='d'?'':a||'');document.querySelectorAll('nav a').forEach(x=>x.classList.toggle('on',x.getAttribute('href')===s));
 $('#main').innerHTML=a==='d'&&D[b]?dirView(b):a==='all'?allView():a==='look'?lookView():a==='data'?dataView():home()}
/* ---------- 编辑器 ---------- */
const shrink=f=>new Promise(ok=>{const fr=new FileReader();fr.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,1000/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.8))};i.src=fr.result};fr.readAsDataURL(f)});
function edit(p={}){
 const old=R.find(x=>x.id===p.id),m=$('#modal');
 const r=old?structuredClone(old):{title:'',content:'',date:today(),dir:'in',module:'',type:'',tags:[],images:[],place:'',people:'',fav:false,history:[],...p};
 imgs=[...(r.images||[])];
 m.innerHTML=`<div class="sheet"><div class="row"><select id="dir">${Object.entries(D).map(([k,d])=>`<option value="${k}">${d.n}　${d.t}</option>`).join('')}</select><select id="mod"></select></div>
 <input id="t" placeholder="标题" value="${esc(r.title)}"><textarea id="c" rows="8" placeholder="${PH[r.module]||'写下此刻想留下的……'}">${esc(r.content)}</textarea>
 <div class="row"><input id="d" type="date" value="${esc(r.date)}"><select id="ty">${TYPES.map(x=>`<option value="${x}" ${x===r.type?'selected':''}>${x||'事件类型（可不选）'}</option>`).join('')}</select></div>
 <input id="tg" placeholder="标签（空格或逗号分隔）" value="${esc((r.tags||[]).join(' '))}">
 <div class="row"><input id="pl" placeholder="地点" value="${esc(r.place)}"><input id="pp" placeholder="相关人物" value="${esc(r.people)}"></div>
 <div id="im" class="imgs"></div><input id="fi" type="file" accept="image/*" multiple>
 <label class="chk"><input id="fv" type="checkbox" ${r.fav?'checked':''}>收藏</label>
 ${(r.history||[]).length?`<details><summary>历史版本（${r.history.length}）</summary>${r.history.map(h=>`<div class="hist"><small>${new Date(h.at||0).toLocaleString('zh-CN')}</small><div><b>${esc(h.title)}</b></div><p>${esc(h.content)}</p></div>`).join('')}</details>`:''}
 <div class="row" style="margin-top:16px"><button id="sv" class="pri">保存</button><button id="cn">取消</button>${old?'<button id="rm" class="danger">删除</button>':''}</div></div>`;
 m.classList.add('on');document.body.style.overflow='hidden';
 const close=()=>{m.classList.remove('on');m.innerHTML='';document.body.style.overflow=''};
 m.onclick=e=>{if(e.target===m)close()};
 $('#dir').value=r.dir;
 const fm=()=>{$('#mod').innerHTML='<option value="">所属模块（可不选）</option>'+D[$('#dir').value].m.map(x=>`<option>${x}</option>`).join('')};fm();$('#mod').value=r.module||'';$('#dir').onchange=fm;
 const ri=()=>{$('#im').innerHTML=imgs.map((s,i)=>`<span><img src="${s}" alt=""><b data-x="${i}">×</b></span>`).join('')};ri();
 $('#im').onclick=e=>{const i=e.target.dataset.x;if(i!==undefined){imgs.splice(i,1);ri()}};
 $('#fi').onchange=async e=>{for(const f of e.target.files)imgs.push(await shrink(f));e.target.value='';ri()};
 $('#cn').onclick=close;
 if(old)$('#rm').onclick=async()=>{if(confirm('确定删除这条记录？')){await del(old.id);await load();close();render()}};
 $('#sv').onclick=async()=>{
  const v=id=>$('#'+id).value.trim();
  const n={...r,title:v('t'),content:$('#c').value,date:$('#d').value||today(),dir:$('#dir').value,module:$('#mod').value,type:$('#ty').value,tags:v('tg').split(/[,，\s#]+/).filter(Boolean),place:v('pl'),people:v('pp'),images:imgs,fav:$('#fv').checked,updated:Date.now()};
  if(!n.title&&!n.content.trim())return toast('写点什么再保存吧');
  if(old){if(old.content!==n.content||old.title!==n.title)n.history=[{title:old.title,content:old.content,at:old.updated||old.created},...(old.history||[])]}
  else{n.id=uid();n.created=Date.now();n.history=[]}
  await put(n);await load();close();render();toast('已保存')};
}
/* ---------- 导入导出 ---------- */
const bkpHead=()=>({app:'life-coords',name:'人生坐标',version:2,exportedAt:new Date().toISOString()});
const act={
 new(){const m=location.hash.match(/#\/d\/(\w+)/),k=m&&D[m[1]]?m[1]:null;edit(k?{dir:k,module:S.mod}:{})},
 next(){S.pick++;render()},
 reflect(){const r=R.find(x=>x.id===S.cur);if(r)edit({dir:r.dir,module:r.module,title:'回望：'+r.title,tags:r.tags})},
 exp(){const b=new Blob([JSON.stringify({...bkpHead(),data:{meta:M,records:R}})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`人生坐标-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('已导出完整备份（含图片）')},
 copytxt(){const s=JSON.stringify({...bkpHead(),data:{meta:M,note:'纯文本备份不含图片',records:R.map(r=>({...r,images:[],_imageCount:(r.images||[]).length}))}});
  const t=$('#bk');t.value=s;t.select();try{t.setSelectionRange(0,s.length)}catch(e){}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(()=>toast('已复制，去备忘录粘贴保存'),()=>toast('已填入文本框，长按全选复制'));else toast('已填入文本框，长按全选复制')},
 imptxt(){importText(($('#bk').value||'').trim())},
 imp(){$('#file').click()},
 async wipe(){if(confirm('将清空本机所有记录，且无法恢复。已经导出备份了吗？确定清空？')){await tx('records','readwrite',o=>o.clear());await load();render();toast('已清空')}}};
async function imp(f){try{importText(await f.text())}catch{toast('文件读取失败')}}
async function importText(str){
 let j;try{j=JSON.parse(str)}catch{return toast('文本无法识别：请粘贴完整的备份文本')}
 const recs=j.records||(j.data&&j.data.records);
 if(!Array.isArray(recs))return toast('这不是有效的备份：缺少记录列表');
 const ap=j.app||'';
 if(ap&&ap!=='life-coords'&&ap!=='life-map')return toast('这不是人生坐标的备份');
 if(!confirm(`将合并导入 ${recs.length} 条记录：文字以备份为准，本地已有图片保留。继续？`))return;
 const cur=new Map(R.map(r=>[r.id,r]));let n=0;
 for(const r of recs){
  if(!r||!r.id||!D[r.dir])continue;
  const o=cur.get(r.id);
  if(o&&(r.updated||0)<=(o.updated||0))continue;
  const imgs=(r.images&&r.images.length)?r.images:((o&&(o.images||[]).length)?o.images:[]);
  const c={...r};delete c._imageCount;
  await put({title:'',content:'',date:today(),tags:[],images:[],history:[],...c,images:imgs});n++;
 }
 const meta=j.meta||(j.data&&j.data.meta);
 if(meta&&!M.name){M={...M,...meta};await setMeta()}
 await load();render();toast(`已恢复 ${n} 条记录`);
}
/* ---------- 事件 ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('[data-id],[data-mod],[data-tab],[data-fav],[data-dir],[data-act]');if(!t)return;const d=t.dataset;
 if(d.id)return edit({id:d.id});if('mod' in d){S.mod=d.mod;return render()}if(d.tab){S.tab=d.tab;return render()}
 if(d.fav){S.fav=!S.fav;return render()}if(d.dir){S.dir=S.dir===d.dir?'':d.dir;return render()}if(d.act)return act[d.act]()});
document.addEventListener('input',e=>{const i=e.target.id;
 if(i==='q'){S.q=e.target.value;$('#res').innerHTML=res()}
 else if(i==='nm'){M.name=e.target.value.trim();setMeta()}else if(i==='bi'){M.birth=e.target.value;setMeta()}});
document.addEventListener('change',e=>{if(e.target.id==='file'&&e.target.files[0])imp(e.target.files[0])});
addEventListener('hashchange',()=>{render();scrollTo(0,0)});
(async()=>{await open();await load();const m=await tx('meta','readonly',o=>o.get('m'));if(m)M={...M,...m.v};
 navigator.storage?.persist?.();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});render()})();
