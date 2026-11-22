/* wrapped.js — DuitKu Wrapped: jadwal rilis, slide SVG, penampil cerita bermusik, ekspor gambar dan video bermusik. */
(function(){
const H=window.__INTEL_H,{NA,F,pc,pcs,sgn,sgp,nf,dd,dsh,addD,diffD,mEnd,sumA,grp,ent,avg,wd,WDN,mkCtx}=H;
const E=esc;
const TYPES=[['week','Mingguan'],['month','Bulanan'],['six','6 Bulan'],['year','Tahunan']];
const STRICT={month:1,six:1}; /* jenis yang hanya terbuka pada hari terakhir periode */
const WK='duitku_wrapped_seen';
const WS={type:'month',sel:0,i:0,hide:false,busy:'',slides:[],story:false,cur:null,sc:null,day:''};
const MON=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const lastDay=(y,m)=>y+'-'+pad(m)+'-'+pad(new Date(y,m,0).getDate());
const fmtShort=d=>new Date(d+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'});

function rangeOf(type,anchor){
  if(type==='week'){const to=anchor,from=addD(to,-6);return{type,id:to,from,to,label:'Minggu '+fmtShort(from)+' – '+fmtShort(to)+' '+to.slice(0,4),pf:addD(from,-7),pt:addD(from,-1),rel:'Minggu'}}
  if(type==='month'){const m=anchor,y=+m.slice(0,4),mo=+m.slice(5);const pm=shiftYm(m,-1);return{type,id:m,from:m+'-01',to:lastDay(y,mo),label:MON[mo-1]+' '+y,pf:pm+'-01',pt:lastDay(+pm.slice(0,4),+pm.slice(5)),rel:'hari terakhir bulan'}}
  if(type==='six'){const m=anchor,y=+m.slice(0,4),mo=+m.slice(5),s=shiftYm(m,-5),p1=shiftYm(m,-11),p2=shiftYm(m,-6);return{type,id:m,from:s+'-01',to:lastDay(y,mo),label:MON[+s.slice(5)-1].slice(0,3)+' '+s.slice(0,4)+' – '+MON[mo-1].slice(0,3)+' '+y,pf:p1+'-01',pt:lastDay(+p2.slice(0,4),+p2.slice(5)),rel:'hari terakhir bulan'}}
  const y=+anchor;return{type,id:String(y),from:y+'-01-01',to:y+'-12-31',label:'Tahun '+y,pf:(y-1)+'-01-01',pt:(y-1)+'-12-31',rel:'31 Desember'}}
function candidates(type,t0){
  const r=[];
  if(type==='week'){const dow=new Date(t0+'T00:00').getDay(),end=addD(t0,dow===0?0:7-dow);for(let i=0;i<14;i++)r.push(rangeOf('week',addD(end,-7*i)))}
  else if(type==='year'){const y=+t0.slice(0,4);for(let i=0;i<6;i++)r.push(rangeOf('year',y-i))}
  else{const m=t0.slice(0,7);for(let i=0;i<14;i++)r.push(rangeOf(type,shiftYm(m,-i)))}
  return r}
function hasTx(rg){return D.tx.some(t=>cur(t)===P.currency&&t.date>=rg.from&&t.date<=rg.to)}
/* ---------- perhitungan data ---------- */
function calc(rg){
  const c=mkCtx(null,{key:'w',from:rg.from,to:rg.to,pf:rg.pf,pt:rg.pt,label:rg.label,days:diffD(rg.from,rg.to)+1});
  const man=c.tx.filter(t=>!t.rid),actDays=new Set(man.map(t=>t.date)),days=c.days,top=ent(c.byCat),byDay=ent(c.byDay),W=Array(7).fill(0);c.out.forEach(t=>W[wd(t.date)]+=t.amount);
  const contribs=D.goals.flatMap(g=>g.contribs.filter(k=>k.date>=rg.from&&k.date<=rg.to).map(k=>({...k,g:g.name}))),done=D.goals.filter(g=>collected(g)>=g.target&&g.contribs.length&&g.contribs.map(k=>k.date).sort().pop()>=rg.from&&g.contribs.map(k=>k.date).sort().pop()<=rg.to);
  const settled=D.debts.filter(d=>paid(d)>=d.amount&&d.payments.length&&d.payments.map(p=>p.date).sort().pop()>=rg.from&&d.payments.map(p=>p.date).sort().pop()<=rg.to);
  let streak=0,run=0;for(let d=rg.from;d<=rg.to&&d<=today();d=addD(d,1)){if(actDays.has(d)){run++;streak=Math.max(streak,run)}else run=0}
  const noSpend=(()=>{let n=0;for(let d=rg.from;d<=rg.to&&d<=today();d=addD(d,1))if(!c.byDay[d])n++;return n})();
  return{rg,c,man,actDays,days,top,byDay,W,contribs,saved:sumA(contribs),done,settled,streak,noSpend,endBal:c.wallets.length?c.liquidAt(rg.to):null,rate:pc(c.I-c.O,c.I)}}

/* ---------- SVG slide ---------- */
const wrapT=(s,n)=>{const w=String(s).split(' '),L=[];let cu='';w.forEach(t=>{if((cu+' '+t).trim().length>n&&cu){L.push(cu);cu=t}else cu=(cu+' '+t).trim()});if(cu)L.push(cu);return L};
const T=(x,y,s,sz,w,f,an,d)=>`<g class="wa" style="--d:${d||0}s"><text x="${x}" y="${y}" font-size="${sz}" font-weight="${w||600}" fill="${f||'#fff'}" text-anchor="${an||'start'}">${E(s)}</text></g>`;
const PA=(x,y,s,sz,n,lh,f,d,w)=>wrapT(s,n).map((l,i)=>T(x,y+i*lh,l,sz,w||500,f||'rgba(255,255,255,.92)','start',(d||0)+i*.07)).join('');
const FIT=(s,w,sz)=>Math.max(34,Math.min(sz,Math.floor(w/(Math.max(1,String(s).length)*.57))));
const NUM=(x,y,s,w,sz,f,an,d)=>T(x,y,s,FIT(s,w,sz),800,f||'#fff',an,d);
const CARD=(x,y,w,h,o,d)=>`<g class="wa" style="--d:${d||0}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="52" fill="#fff" fill-opacity="${o||.16}" stroke="#fff" stroke-opacity=".3" stroke-width="2"/></g>`;
const CHIP=(x,y,s,d)=>{const w=s.length*21+68;return `<g class="wa" style="--d:${d||0}s"><rect x="${x}" y="${y}" width="${w}" height="64" rx="32" fill="#fff" fill-opacity=".2"/><text x="${x+34}" y="${y+43}" font-size="27" font-weight="700" letter-spacing="3" fill="#fff">${E(s.toUpperCase())}</text></g>`};
const HEAD=(chip,title,sub)=>CHIP(80,170,chip)+T(80,340,title,FIT(title,920,92),800,'#fff','start',.05)+(sub?PA(80,414,sub,38,38,52,'rgba(255,255,255,.86)',.1,500):'');
const DOTS=(x,y,w,h)=>{let o='';for(let i=0;i<w;i+=48)for(let j=0;j<h;j+=48)o+=`<circle cx="${x+i}" cy="${y+j}" r="2.4"/>`;return `<g fill="#fff" opacity=".14">${o}</g>`};
const CIR=(x,y,r,o)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
const markInner=()=>{try{return logoMark().replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}catch(e){return ''}};
const LOGO=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none">${markInner()}</g>`;
const BG=sl=>`<defs><linearGradient id="wbg__ID__" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sl.pal[0]}"/><stop offset="1" stop-color="${sl.pal[1]}"/></linearGradient><radialGradient id="wgl__ID__" cx=".85" cy=".08" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#wbg__ID__)"/><rect width="1080" height="1920" fill="url(#wgl__ID__)"/>${CIR(980,200,330,.06)}${CIR(70,1560,300,.07)}${DOTS(60,1020,960,520)}`;
const FOOT=(i,n)=>`<g><rect x="80" y="1746" width="920" height="2" fill="#fff" opacity=".22"/>${LOGO(80,1776,1.05)}<text x="162" y="1830" font-size="36" font-weight="800" fill="#fff" opacity=".95">DuitKu Wrapped</text><text x="1000" y="1830" font-size="30" font-weight="600" fill="#fff" opacity=".75" text-anchor="end">${i+1} / ${n}</text></g>`;
const FONT="system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
function frame(sl,i,n,layer){
  const head=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920" role="img" aria-label="${E(sl.title)}" font-family="${FONT}">`;
  return head+(layer==='fg'?'':BG(sl))+sl.inner+FOOT(i,n)+'</svg>'}
const ARR=(x,y,up,c)=>`<g transform="translate(${x} ${y})"><circle r="38" fill="#fff"/><path d="${up?'M0 18V-16M-14-2L0-16 14-2':'M0-18V16M-14 2L0 16 14 2'}" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
function slides(d,hide){
  const M=v=>hide?'Rp •••':F(v),name=hide?'Kamu':(P.name||'Kamu').split(' ')[0],c=d.c,rg=d.rg,S=[];
  const hasPrev=rg.pf&&c.ptx.length>0,half=rg.type==='week'?'minggu':rg.type==='month'?'bulan':rg.type==='six'?'6 bulan':'tahun';
  const W9='rgba(255,255,255,.9)',W7='rgba(255,255,255,.72)';
  S.push({id:'cover',title:'Sampul',pal:['#1b1464','#7c3aed'],inner:CIR(540,640,330,.07)+CIR(540,640,230,.07)+`<g class="wa" style="--d:0s">${LOGO(380,480,5)}</g>`+T(540,1010,'Wrapped',190,800,'#fff','middle',.1)+CHIP(540-(rg.label.length*21+68)/2,1090,rg.label,.2)+PA(150,1290,'Kilas balik keuangan '+name+' selama '+half+' ini.',46,30,64,W9,.3).replace(/text-anchor="start"/g,'text-anchor="start"')+T(150,1480,'Geser untuk melihat ceritanya',34,600,W7,'start',.5)});
  if(c.I>0||c.O>0){const r=c.I>0?Math.min(1,c.O/c.I):1;S.push({id:'cash',title:'Arus kas',pal:['#0b6b5e','#2dd4a3'],inner:HEAD('Arus kas','Uang masuk & keluar')+
    CARD(80,520,920,300,.16,.1)+ARR(160,610,true,'#0b6b5e')+T(230,625,'Pemasukan',42,700,W9,'start',.12)+NUM(120,760,M(c.I),840,108,'#fff','start',.16)+
    CARD(80,860,920,300,.16,.25)+ARR(160,950,false,'#c0262d')+T(230,965,'Pengeluaran',42,700,W9,'start',.27)+NUM(120,1100,M(c.O),840,108,'#fff','start',.31)+
    `<g class="wa" style="--d:.45s"><rect x="80" y="1210" width="920" height="120" rx="60" fill="${c.net>=0?'#fff':'#fff'}" fill-opacity=".95"/><text x="540" y="1286" font-size="${FIT((c.net>=0?'Surplus ':'Defisit ')+M(Math.abs(c.net)),800,52)}" font-weight="800" text-anchor="middle" fill="${c.net>=0?'#0b6b5e':'#c0262d'}">${E((c.net>=0?'Surplus ':'Defisit ')+M(Math.abs(c.net)))}</text></g>`+
    (c.I>0?`<g class="wa" style="--d:.55s"><rect x="80" y="1420" width="920" height="30" rx="15" fill="#fff" fill-opacity=".25"/><rect x="80" y="1420" width="${Math.max(30,920*r)}" height="30" rx="15" fill="#fff"/></g>`+T(80,1510,'Rasio pengeluaran '+pcs(pc(c.O,c.I))+' dari pemasukan',40,600,W9,'start',.6):'')})}
  if(c.out.length){const tp=d.top.slice(0,5),COL=['#fff','#ffe08a','#bff0ff','#ffc2e2','#d7c4ff'],R=165,CC=2*Math.PI*R;let acc=0;
    const arcs=tp.map(([k,v],i)=>{const len=v/c.O*CC,o=`<circle cx="540" cy="770" r="${R}" fill="none" stroke="${COL[i]}" stroke-width="64" stroke-dasharray="${Math.max(0,len-5)} ${CC}" stroke-dashoffset="${-acc}" transform="rotate(-90 540 770)"/>`;acc+=len;return o}).join('');
    S.push({id:'cat',title:'Kategori terbesar',pal:['#6d28d9','#ec4899'],inner:HEAD('Kategori','Pengeluaran terbesar')+CARD(80,500,920,540,.14,.1)+`<g class="wa" style="--d:.2s"><circle cx="540" cy="770" r="${R}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="64"/>${arcs}</g>`+T(540,770,pcs(pc(tp[0][1],c.O)),58,800,'#fff','middle',.3)+T(540,820,tp[0][0].length>14?tp[0][0].slice(0,13)+'…':tp[0][0],30,600,W9,'middle',.32)+
    CARD(80,1070,920,Math.min(660,56+tp.length*104),.14,.2)+tp.map(([k,v],i)=>`<g class="wa" style="--d:${.3+i*.08}s"><circle cx="132" cy="${1146+i*104}" r="16" fill="${COL[i]}"/><text x="168" y="${1158+i*104}" font-size="42" font-weight="700" fill="#fff">${E(k.length>15?k.slice(0,14)+'…':k)}</text><text x="1030" y="${1158+i*104}" font-size="42" font-weight="800" fill="#fff" text-anchor="end" dx="-70">${pcs(pc(v,c.O))}</text></g>`).join('')+(hide?'':T(80,1790,'',1)) })}
  if(c.out.length>=3){const bd=d.byDay[0],wi=d.W.indexOf(Math.max(...d.W)),mx=Math.max(...d.W)||1;S.push({id:'busy',title:'Hari paling aktif',pal:['#1d4ed8','#22b8e8'],inner:HEAD('Hari paling boros',WDN[wd(bd[0])])+T(80,440,new Date(bd[0]+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),44,600,W9,'start',.1)+
    CARD(80,520,920,200,.16,.15)+T(130,610,'Pengeluaran hari itu',34,600,W7,'start',.2)+(hide?T(130,684,'Disembunyikan',60,800,'#fff','start',.25):NUM(130,690,F(bd[1]),820,76,'#fff','start',.25))+
    CARD(80,780,920,700,.14,.3)+d.W.map((v,i)=>{const h=Math.max(14,v/mx*470),x=124+i*124;return `<g class="wa" style="--d:${.4+i*.06}s"><rect x="${x}" y="${1330-h}" width="86" height="${h}" rx="26" fill="#fff" fill-opacity="${i===wi?1:.42}"/><text x="${x+43}" y="1400" font-size="30" font-weight="700" fill="#fff" fill-opacity="${i===wi?1:.8}" text-anchor="middle">${WDN[i].slice(0,3)}</text></g>`}).join('')+PA(80,1560,'Secara keseluruhan, hari '+WDN[wi]+' adalah hari dengan pengeluaran terbesar.',40,34,56,W9,.8,500)})}
  if(hasPrev){const dO=c.pO>0?H.dlt(c.O,c.pO).p:null,dI=c.pI>0?H.dlt(c.I,c.pI).p:null,pr=pc(c.pI-c.pO,c.pI),cr=d.rate;S.push({id:'cmp',title:'Dibanding periode lalu',pal:['#b45309','#f59e0b'],inner:HEAD('Perbandingan','Dibanding '+half+' lalu')+
    CARD(80,500,920,420,.16,.1)+T(130,590,'Pengeluaran',42,700,W9,'start',.15)+T(130,780,dO==null?'–':sgp(dO),FIT(dO==null?'–':sgp(dO),760,170),800,'#fff','start',.2)+ARR(910,640,dO!=null&&dO>0,dO!=null&&dO>0?'#c0262d':'#0b6b5e')+T(130,860,dO==null?'Belum ada pembanding':dO<=0?'Lebih hemat dari periode lalu':'Lebih besar dari periode lalu',38,600,W9,'start',.25)+
    CARD(80,960,920,380,.16,.3)+T(130,1050,'Pemasukan',42,700,W9,'start',.35)+T(130,1230,dI==null?'–':sgp(dI),FIT(dI==null?'–':sgp(dI),760,150),800,'#fff','start',.4)+ARR(910,1100,dI!=null&&dI>=0,'#0b6b5e')+
    (cr!=null&&pr!=null?PA(80,1450,'Rasio tabungan '+pcs(cr)+' (sebelumnya '+pcs(pr)+')',42,32,58,'#fff',.55,700):'')})}
  if(d.saved>0||d.done.length||d.settled.length){const L=[];if(d.saved>0)L.push([M(d.saved),'ditabung dalam '+d.contribs.length+' kontribusi']);if(d.done.length)L.push([d.done.length+' target','tercapai: '+(hide?'(disembunyikan)':d.done.map(g=>g.name).join(', '))]);if(d.settled.length)L.push([d.settled.length+' utang/piutang','lunas']);S.push({id:'save',title:'Tabungan',pal:['#047857','#84cc16'],inner:HEAD('Tabungan','Tabungan & target')+L.slice(0,3).map((x,i)=>CARD(80,500+i*340,920,300,.16,.1+i*.15)+NUM(130,650+i*340,x[0],820,100,'#fff','start',.15+i*.15)+PA(130,730+i*340,x[1],38,36,50,W9,.2+i*.15,600)).join('')})}
  const hab=[];if(d.actDays.size/Math.max(1,diffD(d.rg.from,d.rg.to<today()?d.rg.to:today())+1)>=0.7&&d.actDays.size>=3)hab.push('Rajin mencatat: transaksi tercatat di '+d.actDays.size+' hari.');if(c.I>0&&pc(c.O,c.I)<=80)hab.push('Pengeluaran terkendali: rasio '+pcs(pc(c.O,c.I))+' dari pemasukan.');if(d.saved>0)hab.push('Konsisten menyisihkan tabungan.');if(hasPrev&&c.pO>0&&c.O<=c.pO*0.95)hab.push('Pengeluaran turun dibanding periode lalu.');if(d.noSpend>=3)hab.push(d.noSpend+' hari tanpa pengeluaran.');
  if(hab.length)S.push({id:'habit',title:'Kebiasaan positif',pal:['#4338ca','#8b5cf6'],inner:HEAD('Kebiasaan','Kebiasaan positif','Terbukti dari datamu')+hab.slice(0,4).map((h,i)=>CARD(80,540+i*250,920,214,.16,.12+i*.1)+`<g class="wa" style="--d:${.15+i*.1}s"><circle cx="164" cy="${647+i*250}" r="34" fill="#fff"/><path d="M148 ${647+i*250}l11 12 22-24" stroke="#4338ca" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`+PA(236,640+i*250,h,40,26,52,'#fff',.15+i*.1,600)).join('')});
  if(c.I>0||c.O>0){const st=c.net<0?['Defisit','#dc2626','#fb7185']:(d.rate!=null&&d.rate<15?['Waspada','#d97706','#fbbf24']:['Sehat','#047857','#34d399']),pctv=d.rate==null?0:Math.max(0,Math.min(100,d.rate)),R=215,CC=2*Math.PI*R;S.push({id:'status',title:'Kondisi keuangan',pal:[st[1],st[2]],inner:HEAD('Kondisi','Kondisi keuanganmu')+CARD(80,500,920,800,.14,.1)+`<g class="wa" style="--d:.2s"><circle cx="540" cy="790" r="${R}" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="40"/><circle cx="540" cy="790" r="${R}" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="${pctv>=96?'butt':'round'}" stroke-dasharray="${Math.max(2,CC*pctv/100)} ${CC}" transform="rotate(-90 540 790)"/></g>`+T(540,815,d.rate!=null?pcs(d.rate):st[0],120,800,'#fff','middle',.3)+T(540,880,d.rate!=null?'rasio tabungan':'kondisi',34,600,W9,'middle',.35)+CHIP(540-(st[0].length*21+68)/2,1048,st[0],.4)+PA(130,1180,c.net<0?'Pengeluaran melebihi pemasukan pada periode ini.':d.rate!=null&&d.rate<15?'Surplus ada, tetapi ruang menabung masih tipis.':'Arus kas positif dengan ruang untuk menabung.',38,38,52,'#fff',.4,600)+
    (d.endBal!=null?CARD(80,1340,920,230,.16,.5)+T(130,1420,'Saldo dompet aktif di akhir periode',34,600,W7,'start',.55)+NUM(130,1520,M(d.endBal),820,88,'#fff','start',.6):'')})}
  if(d.man.length){const A_=[[d.man.length,'transaksi tercatat'],[d.actDays.size,'hari ada catatan']];if(d.streak>=3)A_.push([d.streak,'hari beruntun mencatat']);if(d.done.length)A_.push([d.done.length,'target tercapai']);if(d.settled.length)A_.push([d.settled.length,'utang/piutang lunas']);S.push({id:'ach',title:'Pencapaian',pal:['#be123c','#fb7185'],inner:HEAD('Pencapaian','Pencapaianmu')+A_.slice(0,4).map((a,i)=>{const x=80+(i%2)*470,y=520+Math.floor(i/2)*400;return CARD(x,y,450,370,.16,.1+i*.1)+T(x+40,y+190,String(a[0]),FIT(String(a[0]),370,140),800,'#fff','start',.15+i*.1)+PA(x+40,y+260,a[1],36,16,46,W9,.2+i*.1,600)}).join('')})}
  const rec=[];if(c.net<0&&d.top.length)rec.push('Tekan pengeluaran di kategori '+d.top[0][0]+' pada '+half+' berikutnya.');else if(d.top.length&&pc(d.top[0][1],c.O)>=40)rec.push('Pasang anggaran untuk '+d.top[0][0]+' karena porsinya besar.');if(c.net>0&&!d.saved)rec.push('Sisihkan sebagian surplus ke target tabungan.');if(!D.budgets.length)rec.push('Buat anggaran agar belanja lebih terarah.');if(!rec.length)rec.push('Pertahankan kebiasaan mencatat dan menabung.');
  if(c.tx.length)S.push({id:'reco',title:'Rekomendasi',pal:['#0f172a','#3b4a67'],inner:HEAD('Rekomendasi','Untuk '+half+' depan')+rec.slice(0,3).map((r,i)=>CARD(80,520+i*330,920,290,.12,.1+i*.12)+`<g class="wa" style="--d:${.12+i*.12}s"><circle cx="168" cy="${665+i*330}" r="40" fill="#f5b301"/><text x="168" y="${679+i*330}" font-size="44" font-weight="800" fill="#1d1500" text-anchor="middle">${i+1}</text></g>`+PA(240,650+i*330,r,42,24,58,'#fff',.15+i*.12,700)).join('')+PA(80,1640,'Rekomendasi dihitung dari datamu; bukan nasihat keuangan profesional.',30,50,42,'rgba(255,255,255,.6)',.6)});
  S.push({id:'outro',title:'Penutup',pal:['#1b1464','#7c3aed'],inner:CIR(540,700,330,.07)+CIR(540,700,230,.07)+`<g class="wa" style="--d:0s">${LOGO(380,520,5)}</g>`+T(540,1110,'Terima kasih,',64,700,W9,'middle',.15)+T(540,1260,name+'!',FIT(name+'!',880,170),800,'#fff','middle',.25)+PA(130,1400,'Terus catat, terus bertumbuh. Sampai jumpa di Wrapped berikutnya.',42,32,60,W9,.4)});
  return S.map((s,i)=>({...s,svg:frame(s,i,S.length),fg:frame(s,i,S.length,'fg')}))}


/* ---------- jadwal ---------- */
const nowDay=()=>(window.__DUITKU_TEST&&window.__wrapToday)||today();
const seenGet=()=>{try{return JSON.parse(localStorage.getItem(WK))||{}}catch(e){return{}}};
const markSeen=rg=>{if(!STRICT[rg.type])return;const o=seenGet();o[rg.type]=o[rg.type]||{};if(!o[rg.type][rg.id]){o[rg.type][rg.id]=Date.now();try{localStorage.setItem(WK,JSON.stringify(o))}catch(e){}}};
/* Bulanan dan 6 bulan: HANYA terbuka pada hari terakhir periodenya (00.00–23.59, waktu perangkat). Yang sudah dibuka masuk Arsip.
   Mingguan (hari Minggu) dan Tahunan (31 Desember) tetap: terbuka pada hari terakhir dan tetap bisa dibuka sesudahnya. */
function schedule(type){
  const t0=nowDay(),c=candidates(type,t0);
  if(!STRICT[type]){const cu=c[0],locked=t0<cu.to?cu:null,list=c.filter(x=>t0>=x.to&&hasTx(x));return{t0,strict:false,locked,live:null,liveAny:null,list}}
  const liveAny=c.find(x=>x.to===t0)||null,live=liveAny&&hasTx(liveAny)?liveAny:null,seen=seenGet()[type]||{};
  const next=c[0].to>t0?c[0]:rangeOf(type,shiftYm(c[0].id,1));
  const list=c.filter(x=>((live&&x===live)||seen[x.id])&&hasTx(x));
  return{t0,strict:true,locked:next,live,liveAny,list}}
if(window.__DUITKU_TEST)window.__wrap={schedule,setToday:d=>{window.__wrapToday=d},WS:null};
const leftTxt=ms=>{const m=Math.max(0,Math.floor(ms/6e4)),d=Math.floor(m/1440),h=Math.floor(m%1440/60),mi=m%60;return d>0?d+' hari'+(h?' '+h+' jam':''):h>0?h+' jam '+mi+' menit':mi+' menit'};
const msToEnd=()=>{const e=new Date();e.setHours(23,59,59,999);return e-new Date()};
const longDate=dt=>new Date(dt+'T00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

/* ---------- ikon ---------- */
const WI={close:'<path d="M6 6l12 12M18 6L6 18"/>',play:'<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',pause:'<rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  music:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',mute:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/><path d="M3 3l18 18"/>',
  share:'<path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',down:'<path d="M12 3v12M8 11l4 4 4-4M5 20h14"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',replay:'<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.2h4.2"/>',chevl:'<path d="M15 5l-7 7 7 7"/>',chevr:'<path d="M9 5l7 7-7 7"/>',film:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M3 15h18M8 4v16M16 4v16"/>',img:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>'};
const wi=(k,s)=>`<svg viewBox="0 0 24 24" width="${s||22}" height="${s||22}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${WI[k]}</svg>`;

/* ---------- ekspor ---------- */
const fix=(svg,p)=>svg.replace(/__ID__/g,p||'x');
const img=svg=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('gagal memuat slide'));im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
const png=c=>new Promise((r,j)=>c.toBlob(b=>b?r(b):j(new Error('gagal membuat gambar')),'image/png'));
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const fname=ext=>'duitku-wrapped-'+slug(WS.cur?WS.cur.label:'periode')+(WS.hide?'-tersembunyi':'')+'.'+ext;
async function slideBlob(i){const im=await img(fix(WS.slides[i].svg,'x')),c=document.createElement('canvas');c.width=1080;c.height=1920;c.getContext('2d').drawImage(im,0,0,1080,1920);return png(c)}
async function exportOne(){dl(await slideBlob(WS.i),fname('png').replace('.png','-'+(WS.i+1)+'.png'))}
async function exportAll(){const n=WS.slides.length,cols=Math.min(4,n),rows=Math.ceil(n/cols),w=432,h=768,g=24,c=document.createElement('canvas');c.width=cols*w+(cols+1)*g;c.height=rows*h+(rows+1)*g;const x=c.getContext('2d');x.fillStyle='#111827';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<n;i++){const im=await img(fix(WS.slides[i].svg,'x'));x.drawImage(im,g+(i%cols)*(w+g),g+Math.floor(i/cols)*(h+g),w,h)}dl(await png(c),fname('png').replace('.png','-semua.png'))}
const vidType=()=>{if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream)return null;return['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm','video/mp4'].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}})||null};
/* ---------- video: 3 gaya animasi + 3 musik, direkam di perangkat, ada pratinjau sebelum diunduh ---------- */
const VSTYLES=[['aurora','Aurora','Gradasi lembut dengan bokeh melayang',['#7c3aed','#22d3ee']],['neon','Neon','Gelap, cincin berdenyut, konfeti warna',['#0a0720','#ec4899']],['cinema','Sinematik','Letterbox, cahaya hangat, butiran film',['#3b2a1a','#f59e0b']]];
const VMUSIC=[['wrapped','Ceria','Pop dance · 118 BPM'],['wlofi','Santai','Lo-fi lembut · 84 BPM'],['wcine','Megah','Sinematik · 96 BPM']];
const TB={wrapped:118,wlofi:84,wcine:96};
try{const o=JSON.parse(localStorage.getItem('duitku_wrapped_vopts')||'{}');if(VSTYLES.some(x=>x[0]===o.vs))WS.vs=o.vs;if(TB[o.vm])WS.vm=o.vm}catch(e){}
WS.vs=WS.vs||'aurora';WS.vm=WS.vm||'wrapped';
const saveV=()=>{try{localStorage.setItem('duitku_wrapped_vopts',JSON.stringify({vs:WS.vs,vm:WS.vm}))}catch(e){}};
const beat=()=>60/TB[WS.vm],BPS={wrapped:8,wlofi:6,wcine:8},slideSec=()=>BPS[WS.vm]*beat();
const clamp01=v=>Math.max(0,Math.min(1,v)),easeO=p=>1-Math.pow(1-clamp01(p),3),mixv=(a,b,k)=>a+(b-a)*k;
const easeBack=p=>{p=clamp01(p);const c=1.70158,k=c+1;return 1+k*Math.pow(p-1,3)+c*Math.pow(p-1,2)};
function hexA(h,a){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function rnd(seed){let s=seed*9301+49297;return()=>{s=(s*9301+49297)%233280;return s/233280}}
const PARTS=(()=>{const r=rnd(7);return Array.from({length:44},()=>({x:r(),o:r(),sp:.04+r()*.08,r:8+r()*38,a:.06+r()*.14,rot:r()*6.28,w:10+r()*16,c:r()}))})();
function videoAudio(track){try{if(!window.DKAudio||!DKAudio.musicStream)return null;DKAudio.unlock();const m=DKAudio.musicStream(track);return m&&m.stream.getAudioTracks().length?m:null}catch(e){return null}}
/* lapisan depan slide: terungkap dari atas ke bawah (wipe) */
function layer(oc,img,W,Hh,p,mode){
  const o=oc.getContext('2d');o.globalCompositeOperation='source-over';o.clearRect(0,0,W,Hh);o.drawImage(img,0,0,W,Hh);
  if(mode==='wipe'&&p<1){o.globalCompositeOperation='destination-in';const e=mixv(-.1,1.12,easeO(p))*Hh,g=o.createLinearGradient(0,e-300,0,e);g.addColorStop(0,'#000');g.addColorStop(1,'rgba(0,0,0,0)');o.fillStyle=g;o.fillRect(0,0,W,Hh)}
  o.globalCompositeOperation='source-over';return oc}
const VID={
  aurora:{fade:.55,
    bg(x,W,Hh,pal,t,pulse,al){x.globalAlpha=al;const g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);x.fillStyle=g;x.fillRect(0,0,W,Hh);
      [[.2,.25,.9,'#ffffff',.28],[.85,.55,.8,'#ffe08a',.18],[.35,.9,.9,'#a5f3fc',.2]].forEach((b,k)=>{const cx=W*(b[0]+.12*Math.sin(t*.5+k*2)),cy=Hh*(b[1]+.1*Math.cos(t*.4+k)),r=W*b[2],gr=x.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,hexA(b[3],b[4]));gr.addColorStop(1,hexA(b[3],0));x.fillStyle=gr;x.fillRect(0,0,W,Hh)});
      PARTS.forEach(p=>{const y=Hh+60-((t*p.sp+p.o)%1)*(Hh+120),px=p.x*W+Math.sin(t*.6+p.o*9)*24;const rr=p.r*(1+.12*pulse)*1.7,pg=x.createRadialGradient(px,y,0,px,y,rr);pg.addColorStop(0,'rgba(255,255,255,'+(p.a*.55)+')');pg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=pg;x.fillRect(px-rr,y-rr,rr*2,rr*2)});x.globalAlpha=1},
    fg(x,oc,W,Hh,lt,per,pulse){const p=lt/1.1,fl=Math.sin(lt*1.6)*5,zoom=1+.012*Math.min(1,lt/per)+.004*pulse;x.save();x.translate(W/2,Hh/2+fl);x.scale(zoom,zoom);x.drawImage(oc,-W/2,-Hh/2);x.restore()},wipe:'wipe'},
  neon:{fade:.28,
    bg(x,W,Hh,pal,t,pulse,al,BE){x.globalAlpha=al;x.fillStyle='#0a0720';x.fillRect(0,0,W,Hh);
      let gr=x.createRadialGradient(W/2,Hh*.42,0,W/2,Hh*.42,W*1.1);gr.addColorStop(0,hexA(pal[1],.5+.22*pulse));gr.addColorStop(1,hexA(pal[1],0));x.fillStyle=gr;x.fillRect(0,0,W,Hh);
      gr=x.createRadialGradient(W*.1,Hh*.95,0,W*.1,Hh*.95,W*.9);gr.addColorStop(0,hexA(pal[0],.55));gr.addColorStop(1,hexA(pal[0],0));x.fillStyle=gr;x.fillRect(0,0,W,Hh);
      for(let k=0;k<3;k++){const ph=((t/BE)/2+k/3)%1;x.beginPath();x.arc(W/2,Hh*.42,ph*W*1.0,0,6.283);x.strokeStyle=hexA(pal[1],(1-ph)*.55);x.lineWidth=3+4*(1-ph);x.stroke()}
      x.strokeStyle='rgba(255,255,255,.06)';x.lineWidth=2;for(let y=-60+((t*60)%60);y<Hh;y+=60){x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke()}
      PARTS.slice(0,34).forEach((p,i)=>{const y=-30+((t*p.sp*3+p.o)%1)*(Hh+60),px=p.x*W+Math.sin(t+p.o*8)*30;x.save();x.translate(px,y);x.rotate(p.rot+t*(1+p.c*2));x.fillStyle=[hexA(pal[1],.9),'rgba(255,255,255,.85)','#ffd60a',hexA(pal[0],.9)][i%4];x.fillRect(-p.w/4,-p.w/2,p.w/2,p.w);x.restore()});x.globalAlpha=1},
    fg(x,oc,W,Hh,lt,per,pulse){const s=mixv(.9,1,easeBack(lt/.7)),a=clamp01(lt/.25);x.save();x.globalAlpha=a;x.translate(W/2,Hh/2);x.scale(s*(1+.008*pulse),s*(1+.008*pulse));x.drawImage(oc,-W/2,-Hh/2);x.restore()},wipe:'wipe'},
  cinema:{fade:.7,
    bg(x,W,Hh,pal,t,pulse,al){x.globalAlpha=al;const g=x.createLinearGradient(0,0,W*.4,Hh);g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);x.fillStyle=g;x.fillRect(0,0,W,Hh);x.fillStyle='rgba(8,6,18,.42)';x.fillRect(0,0,W,Hh);
      x.globalCompositeOperation='screen';const cx=W*(.1+.8*((t*.05)%1)),gr=x.createRadialGradient(cx,Hh*.3,0,cx,Hh*.3,W*.9);gr.addColorStop(0,'rgba(255,170,90,.32)');gr.addColorStop(1,'rgba(255,170,90,0)');x.fillStyle=gr;x.fillRect(0,0,W,Hh);x.globalCompositeOperation='source-over';
      const vg=x.createRadialGradient(W/2,Hh/2,W*.35,W/2,Hh/2,Hh*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=vg;x.fillRect(0,0,W,Hh);x.globalAlpha=1},
    fg(x,oc,W,Hh,lt,per,pulse){const a=easeO(lt/.9),z=.955+.045*easeO(Math.min(1,lt/Math.min(per,2.2)));x.save();x.globalAlpha=a;x.translate(W/2,Hh/2+(1-a)*26);x.scale(z,z);x.drawImage(oc,-W/2,-Hh/2);x.restore()},wipe:null,
    post(x,W,Hh,t,tot){const r=rnd(Math.floor(t*24)+3);x.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<90;i++)x.fillRect(r()*W,r()*Hh,2,2)}}};
function drawVidFrame(x,t,E_){
  const {W,Hh,n,per,total,BE,ims,oc,V}=E_;
  const i=Math.min(n-1,Math.floor(t/per)),lt=t-i*per,pulse=Math.exp(-((t/BE)%1)*6),pal=WS.slides[i].pal,fd=V.fade;
    x.globalAlpha=1;x.globalCompositeOperation='source-over';x.fillStyle='#000';x.fillRect(0,0,W,Hh);
    const inT=i>0&&lt<fd,k=inT?lt/fd:1;
    if(WS.vs==='cinema'&&inT){ /* lewat hitam */
      if(k<.5){V.bg(x,W,Hh,WS.slides[i-1].pal,t,pulse,1-k*2,BE);V.fg(x,layer(oc,ims[i-1],W,Hh,1,null),W,Hh,per-.01,per,pulse)}
      else{V.bg(x,W,Hh,pal,t,pulse,(k-.5)*2,BE)}
    }else{
      if(inT){V.bg(x,W,Hh,WS.slides[i-1].pal,t,pulse,1,BE);V.bg(x,W,Hh,pal,t,pulse,easeO(k),BE)}else V.bg(x,W,Hh,pal,t,pulse,1,BE);
      if(inT){x.save();x.globalAlpha=Math.max(0,1-lt/.2);V.fg(x,layer(oc,ims[i-1],W,Hh,1,null),W,Hh,per-.01,per,pulse);x.restore()}
    }
    if(!(WS.vs==='cinema'&&inT&&k<.5)){V.fg(x,layer(oc,ims[i],W,Hh,i===0?lt/1.2:Math.max(0,(lt-.2)/1.1),V.wipe),W,Hh,lt,per,pulse)}
    if(WS.vs==='neon'&&lt<.12&&i>0){x.globalAlpha=.3*(1-lt/.12);x.fillStyle='#fff';x.fillRect(0,0,W,Hh);x.globalAlpha=1}
    if(V.post)V.post(x,W,Hh,t,total);
    const fo=Math.max(0,t-(total-.9))/.9;if(fo>0){x.globalAlpha=fo;x.fillStyle='#000';x.fillRect(0,0,W,Hh);x.globalAlpha=1}
}
async function exportVideo(prog,ctl){
  const mt=vidType();if(!mt)throw new Error('browser tidak mendukung perekaman video');
  const BE=beat(),n=WS.slides.length,per=slideSec(),total=n*per+1.4,W=720,Hh=1280,V=VID[WS.vs],cv=ctl.canvas,x=cv.getContext('2d'),oc=document.createElement('canvas');
  cv.width=W;cv.height=Hh;oc.width=W;oc.height=Hh;
  const ims=[];for(let i=0;i<n;i++)ims.push(await img(fix(WS.slides[i].fg,'v'+i)));
  const env={W,Hh,n,per,total,BE,ims,oc,V};
  prog(0,'Menyiapkan…');let am=videoAudio(WS.vm);
  const st=cv.captureStream(30);if(am)st.addTrack(am.stream.getAudioTracks()[0]);
  const rec=new MediaRecorder(st,Object.assign({mimeType:mt,videoBitsPerSecond:5e6},am?{audioBitsPerSecond:160e3}:{})),chunks=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};const done=new Promise(r=>rec.onstop=r);
  const t0=performance.now();rec.start(250);let lastP=-1,aborted=false,fadedA=false;
  await new Promise(res=>{(function loop(){
    if(ctl.abort){aborted=true;res();return}
    const t=(performance.now()-t0)/1000;if(t>=total){res();return}
    drawVidFrame(x,t,env);
    if(am&&!fadedA&&t>total-1){fadedA=true;am.stop(1);am.stopped=true}
    const p=Math.round(t/total*100);if(p!==lastP){lastP=p;prog(p,'Merekam video…')}
    requestAnimationFrame(loop)})()});
  if(am&&!am.stopped)am.stop(aborted?.2:1);rec.stop();await done;st.getTracks().forEach(tk=>tk.stop());
  if(aborted)return null;
  const blob=new Blob(chunks,{type:mt.split(';')[0]});if(!blob.size)throw new Error('video kosong');
  return{blob,ext:mt.includes('mp4')?'mp4':'webm',sec:Math.round(total),audio:!!am}}

/* ---------- penampil cerita layar penuh (musik, ketuk, geser, tahan untuk jeda) ---------- */
let storyEl=null,storyLayer=null,raf=0,lastTs=0,elapsed=0,userPaused=false,holding=false,offMusic=null;
const slideMs=()=>Math.max(5200,BPS[WS.vm]*1.5*beat()*1000);
const AU=()=>window.DKAudio||null;
function shellHtml(){
  return `<div class="wstory-bg"></div><div class="wstory-in" role="dialog" aria-modal="true" aria-label="DuitKu Wrapped ${E(WS.cur.label)}">
  <div class="wstory-bars" aria-hidden="true">${WS.slides.map(()=>'<i><b></b></i>').join('')}</div>
  <div class="wstory-top"><div class="wstory-id"><span class="wstory-logo" aria-hidden="true">${wi('spark',18)}</span><div><b>DuitKu Wrapped</b><small>${E(WS.cur.label)}</small></div></div>
    <div class="wstory-tools"><button type="button" class="wstory-btn" data-act="wmusic" id="wsmusic"></button><button type="button" class="wstory-btn" data-act="wspause" id="wspause"></button><button type="button" class="wstory-btn" data-act="wclose" aria-label="Tutup">${wi('close')}</button></div></div>
  <div class="wstory-stage" id="wsstage"><div class="wstory-slide" id="wsslide"></div></div>
  <button type="button" class="wstory-nav prev" data-act="wsprev" aria-label="Slide sebelumnya">${wi('chevl',26)}</button><button type="button" class="wstory-nav next" data-act="wsnext" aria-label="Slide berikutnya">${wi('chevr',26)}</button>
  <div class="wstory-foot"><span id="wscount" class="wstory-count" role="status"></span><div class="wstory-acts"><button type="button" class="wstory-pill" data-act="wsshare">${wi('share',18)}<span>Bagikan</span></button><button type="button" class="wstory-pill" id="wsreplay" data-act="wreplay" hidden>${wi('replay',18)}<span>Putar ulang</span></button></div></div></div>`}
function paintTools(){
  const m=document.getElementById('wsmusic'),p=document.getElementById('wspause'),s=AU()?AU().state():{music:false};
  if(m){m.innerHTML=wi(s.music?'music':'mute');m.setAttribute('aria-label',s.music?'Matikan musik':'Nyalakan musik');m.setAttribute('aria-pressed',String(!!s.music))}
  if(p){p.innerHTML=wi(userPaused?'play':'pause');p.setAttribute('aria-label',userPaused?'Lanjutkan':'Jeda')}}
function paintBars(){
  if(!storyEl)return;const bars=storyEl.querySelectorAll('.wstory-bars i b'),pr=Math.min(1,elapsed/slideMs());
  bars.forEach((b,i)=>{b.style.transform='scaleX('+(i<WS.i?1:i===WS.i?pr:0)+')'})}
function drawStory(){
  const el=document.getElementById('wsslide');if(!el)return;WS.i=Math.max(0,Math.min(WS.i,WS.slides.length-1));
  el.classList.remove('go');el.innerHTML=fix(WS.slides[WS.i].svg,'s');void el.offsetWidth;el.classList.add('go');
  const pal=WS.slides[WS.i].pal,bg=storyEl.querySelector('.wstory-bg');if(bg)bg.style.background='linear-gradient(160deg,'+pal[0]+','+pal[1]+')';
  const ct=document.getElementById('wscount');if(ct)ct.textContent=(WS.i+1)+' dari '+WS.slides.length+' · '+WS.slides[WS.i].title;
  const pv=storyEl.querySelector('.wstory-nav.prev'),nx=storyEl.querySelector('.wstory-nav.next');if(pv)pv.disabled=WS.i===0;if(nx)nx.disabled=WS.i===WS.slides.length-1;
  paintBars()}
function gotoSlide(i){
  if(!WS.story)return;
  if(i>=WS.slides.length){elapsed=slideMs();finishStory();return}
  if(i<0)i=0;const changed=i!==WS.i;WS.i=i;elapsed=0;storyEl.classList.remove('done');const rp=document.getElementById('wsreplay');if(rp)rp.hidden=true;
  drawStory();if(changed&&AU())AU().sfx('tick')}
function finishStory(){userPaused=true;paintTools();paintBars();const rp=document.getElementById('wsreplay');if(rp)rp.hidden=false;if(storyEl)storyEl.classList.add('done');if(AU())AU().sfx('success')}
function loop(ts){
  if(!WS.story)return;const dt=Math.min(100,ts-(lastTs||ts));lastTs=ts;
  if(!userPaused&&!holding&&!document.hidden){elapsed+=dt;paintBars();if(elapsed>=slideMs()){if(WS.i<WS.slides.length-1)gotoSlide(WS.i+1);else finishStory()}}
  raf=requestAnimationFrame(loop)}
function bindStage(){
  const st=document.getElementById('wsstage');if(!st)return;let down=null,holdT=0,held=false;
  st.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};held=false;clearTimeout(holdT);holdT=setTimeout(()=>{held=true;holding=true;storyEl.classList.add('hold')},300)});
  const end=e=>{clearTimeout(holdT);if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;
    if(held){held=false;holding=false;storyEl.classList.remove('hold');return}
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){gotoSlide(WS.i+(dx<0?1:-1));return}
    if(dy>110&&Math.abs(dy)>Math.abs(dx)){closeStory();return}
    const r=st.getBoundingClientRect();gotoSlide(WS.i+((e.clientX-r.left)/r.width<.35?-1:1))};
  st.addEventListener('pointerup',end);st.addEventListener('pointercancel',()=>{clearTimeout(holdT);down=null;if(held){held=false;holding=false;storyEl.classList.remove('hold')}})}
function openStory(i){
  if(!WS.slides.length||!WS.cur||WS.story)return;
  WS.i=Math.max(0,Math.min(i||0,WS.slides.length-1));WS.story=true;userPaused=false;holding=false;elapsed=0;lastTs=0;
  if(!storyEl){storyEl=document.createElement('div');storyEl.id='wstory';document.body.appendChild(storyEl)}
  storyEl.className='wstory';storyEl.hidden=false;storyEl.innerHTML=shellHtml();document.documentElement.classList.add('wstory-open');
  storyLayer=()=>{storyLayer=null;hideStory()};DKNav.pushLayer(storyLayer);
  const a=AU();if(a){a.unlock();a.play(WS.vm);a.sfx('whoosh');offMusic=a.onChange(paintTools)}
  paintTools();bindStage();drawStory();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
  const cl=storyEl.querySelector('[data-act="wclose"]');if(cl)cl.focus({preventScroll:true})}
function hideStory(){cancelAnimationFrame(raf);WS.story=false;holding=false;if(offMusic){offMusic();offMusic=null}
  if(storyEl){storyEl.hidden=true;storyEl.innerHTML=''}document.documentElement.classList.remove('wstory-open');if(AU())AU().stop(.7)}
function closeStory(){const l=storyLayer;hideStory();if(l){storyLayer=null;DKNav.release(l)}}

/* ---------- halaman ---------- */
function noticeHtml(sc){
  let h='';
  if(sc.live)h+=`<div class="wr-note live" role="status"><span class="wr-note-ic">${wi('spark',20)}</span><div><b>Wrapped ${E(sc.live.label)} terbuka hari ini</b><p>Tersedia sampai pukul 23.59 waktu perangkatmu, sisa <span data-wr-end>${leftTxt(msToEnd())}</span>. Setelah dibuka, Wrapped ini tersimpan di Arsip dan bisa diputar ulang kapan saja.</p></div></div>`;
  else if(sc.strict&&sc.liveAny)h+=`<div class="wr-note" role="status"><span class="wr-note-ic">${wi('lock',20)}</span><div><b>Belum ada Wrapped hari ini</b><p>Periode ${E(sc.liveAny.label)} berakhir hari ini, tetapi belum ada transaksi yang tercatat di dalamnya.</p></div></div>`;
  if(sc.locked){const l=sc.locked,dd_=diffD(sc.t0,l.to);
    h+=`<div class="wr-note lock"><span class="wr-note-ic">${wi('lock',20)}</span><div><b>Wrapped ${E(l.label)} masih terkunci</b><p>Terbuka ${E(longDate(l.to))}, pukul 00.00–23.59 waktu perangkatmu${sc.strict?'. Hanya pada hari itu saja yang bisa dibuka, jadi buka DuitKu di hari tersebut':''}.${dd_>0?' Sisa <span data-wr-lock>'+dd_+' hari</span>.':''}</p></div></div>`}
  return h}
R.wrap=function(){
  const sc=schedule(WS.type);WS.sc=sc;WS.day=sc.t0;
  if(sc.live)markSeen(sc.live);
  WS.sel=Math.min(WS.sel,Math.max(0,sc.list.length-1));WS.cur=sc.list[WS.sel]||null;
  const tn=TYPES.find(t=>t[0]===WS.type)[1].toLowerCase();
  const seg=`<div class="dk-seg wr-seg" role="tablist" aria-label="Periode Wrapped">${TYPES.map(([k,l])=>`<button type="button" role="tab" aria-selected="${WS.type===k}" class="${WS.type===k?'on':''}" data-act="wtype" data-t="${k}">${l}</button>`).join('')}</div>`;
  const hd=`<header class="hd"><div><h1>DuitKu Wrapped</h1><p class="muted">Kilas balik keuanganmu sebagai cerita bermusik. Dihitung di perangkatmu.</p></div></header>`;
  const note=noticeHtml(sc);
  if(!WS.cur){WS.slides=[];return hd+seg+note+`<div class="wr-empty"><span class="wr-empty-ic">${wi('spark',30)}</span><h3>Belum ada Wrapped ${E(tn)}</h3><p class="muted">${sc.strict?'Wrapped '+E(tn)+' hanya terbuka pada hari terakhir periodenya, pukul 00.00–23.59. Buka DuitKu pada hari itu untuk menontonnya; setelah itu tersimpan di Arsip.':'Wrapped muncul untuk periode yang sudah selesai dan punya transaksi. Catat transaksi secara rutin, lalu kembali saat periodenya berakhir.'}</p><button type="button" class="btn" data-act="addtx">Catat transaksi</button></div>`}
  const d=calc(WS.cur);WS.slides=slides(d,WS.hide);WS.i=Math.min(WS.i,WS.slides.length-1);
  const uri=i=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fix(WS.slides[i].svg,'t'+i)),vt=vidType(),isLive=!!(sc.live&&sc.live.id===WS.cur.id);
  const badge=isLive?'<span class="wr-badge live">Tayang hari ini</span>':sc.strict?'<span class="wr-badge">Arsip</span>':'';
  return hd+seg+note+`<section class="wr-hero"><button type="button" class="wr-cover" data-act="wopen" data-i="0" aria-label="Putar DuitKu Wrapped ${E(WS.cur.label)}"><img src="${uri(0)}" alt="" width="540" height="960"><span class="wr-play">${wi('play',30)}</span></button>
  <div class="wr-info">${badge}<h2>${E(WS.cur.label)}</h2><p class="muted">${WS.slides.length} slide dengan animasi dan musik. Tombol putar menampilkan pratinjau memakai gaya dan musik yang kamu pilih di bawah.</p>
  <div class="wr-cta"><button type="button" class="btn" data-act="wopen" data-i="0">${wi('play',18)}<span>Putar pratinjau</span></button></div>
  ${sc.list.length>1?`<label class="wr-field"><span>${sc.strict?'Arsip periode':'Periode'}</span><select id="wsel" class="ip-sel">${sc.list.map((x,i)=>`<option value="${i}"${i===WS.sel?' selected':''}>${E(x.label)}</option>`).join('')}</select></label>`:''}
  <label class="dk-switch wr-hide"><input type="checkbox" id="whide"${WS.hide?' checked':''}><i aria-hidden="true"></i><span>Sembunyikan nominal dan namaku<small>Aman untuk dibagikan</small></span></label></div></section>
  <h3 class="wr-h">Semua slide</h3><div class="wr-thumbs">${WS.slides.map((s,i)=>`<button type="button" class="wr-thumb" data-act="wopen" data-i="${i}" aria-label="Slide ${i+1}: ${E(s.title)}"><img src="${uri(i)}" alt="" loading="lazy"><span>${i+1}</span></button>`).join('')}</div>
  <section class="wr-vid card"><h3>Gaya &amp; musik video</h3><p class="muted sm">Pilih gaya dan musik, tonton pratinjaunya, lalu unduh sebagai video.</p>
  <div class="wr-vlab">Gaya animasi</div><div class="wr-vstyles" role="radiogroup" aria-label="Gaya video">${VSTYLES.map(v=>`<button type="button" role="radio" aria-checked="${WS.vs===v[0]}" class="wr-vs${WS.vs===v[0]?' on':''}" data-act="wvs" data-v="${v[0]}"><i class="wr-vs-t" style="background:linear-gradient(150deg,${v[3][0]},${v[3][1]})"><b></b><b></b><b></b></i><span>${v[1]}</span><small>${v[2]}</small></button>`).join('')}</div>
  <div class="wr-vlab">Musik</div><div class="wr-vmusic" role="radiogroup" aria-label="Musik video">${VMUSIC.map(v=>`<button type="button" role="radio" aria-checked="${WS.vm===v[0]}" class="wr-vm${WS.vm===v[0]?' on':''}" data-act="wvm" data-v="${v[0]}"><span class="wr-vm-ic">${wi('music',18)}</span><span><b>${v[1]}</b><small>${v[2]}</small></span></button>`).join('')}</div>
  ${vt?`<div class="wr-makes"><button type="button" class="btn ghost" data-act="wopen" data-i="0">${wi('play',18)}<span>Pratinjau</span></button><button type="button" class="btn wr-make" data-act="wvid">${wi('film',18)}<span>Rekam &amp; unduh video</span></button></div>`:'<p class="muted sm">Perekaman video belum didukung browser ini; gunakan ekspor gambar.</p>'}
  <p class="muted sm" id="wmsg" role="status">Video direkam langsung di perangkatmu (sekitar ${Math.round(WS.slides.length*slideSec()+1.4)} detik), lengkap dengan musik. Biarkan layar tetap terbuka selama merekam. Nominal dan namamu disembunyikan bila opsi di atas dicentang.</p></section>
  <section class="wr-exp"><h3>Simpan gambar</h3><div class="wr-exp-b"><button type="button" class="btn ghost" data-act="wpng">${wi('img',18)}<span>Slide ini (PNG)</span></button><button type="button" class="btn ghost" data-act="wall">${wi('down',18)}<span>Semua slide (1 gambar)</span></button></div>
  <p class="muted sm">Jadwal rilis (waktu perangkat): Mingguan = hari Minggu · Bulanan dan 6 bulan = hanya pada hari terakhir bulan, 00.00–23.59 · Tahunan = 31 Desember.</p></section>`};
const msg=t=>{const m=document.getElementById('wmsg');if(m)m.textContent=t};
const busy=async(label,fn)=>{if(WS.busy)return;WS.busy=label;try{await fn()}catch(e){console.error(e);msg('Ekspor gagal: '+e.message)}WS.busy=''};

/* ---------- posisi gulir tetap saat ganti periode / opsi ---------- */
let sampT=0;
function keepPos(fn){const sg=document.querySelector('.wr-seg'),top=sg?sg.getBoundingClientRect().top:null,y=window.scrollY,m=document.getElementById('main'),my=m?m.scrollTop:0;fn();
  const fix_=()=>{const s2=document.querySelector('.wr-seg');if(top!=null&&s2){const d=s2.getBoundingClientRect().top-top;if(Math.abs(d)>1)window.scrollBy(0,d)}else window.scrollTo(0,y);if(m)m.scrollTop=my};fix_();requestAnimationFrame(fix_)}

/* ---------- pratinjau langsung (gaya + musik terpilih, sama persis dengan video) ---------- */
const PV={on:false,raf:0,t0:0,off:0,paused:false,env:null,layer:null,ims:null,key:''};
async function pvPrep(){
  const W=720,Hh=1280,n=WS.slides.length,per=slideSec(),oc=document.createElement('canvas');oc.width=W;oc.height=Hh;
  if(!PV.ims||PV.key!==WS.cur.label+'|'+n){PV.ims=[];for(let i=0;i<n;i++)PV.ims.push(await img(fix(WS.slides[i].fg,'p'+i)));PV.key=WS.cur.label+'|'+n}
  PV.env={W,Hh,n,per,total:n*per+1.4,BE:beat(),ims:PV.ims,oc,V:VID[WS.vs]}}
function pvChips(){
  const c=(arr,cur,act)=>arr.map(v=>`<button type="button" role="radio" aria-checked="${cur===v[0]}" class="pvchip${cur===v[0]?' on':''}" data-act="${act}" data-v="${v[0]}">${E(v[1])}</button>`).join('');
  return `<div class="pv-row" role="radiogroup" aria-label="Gaya"><em>Gaya</em>${c(VSTYLES,WS.vs,'pvs')}</div><div class="pv-row" role="radiogroup" aria-label="Musik"><em>Musik</em>${c(VMUSIC,WS.vm,'pvm')}</div>`}
function pvFrame(){
  if(!PV.on)return;const cv=document.getElementById('pvcv');if(!cv||!PV.env){return}
  const e=PV.env;let t=PV.paused?PV.off:PV.off+(performance.now()-PV.t0)/1000;
  if(t>=e.total){PV.off=0;PV.t0=performance.now();t=0;const a=AU();if(a){a.unlock();a.play(WS.vm)}}
  drawVidFrame(cv.getContext('2d'),t,e);
  const b=document.getElementById('pvbar');if(b)b.style.width=Math.min(100,t/e.total*100)+'%';
  const i=Math.min(e.n-1,Math.floor(t/e.per)),ct=document.getElementById('pvct');if(ct)ct.textContent=(i+1)+' / '+e.n+' · '+WS.slides[i].title;
  PV.raf=requestAnimationFrame(pvFrame)}
async function pvRestart(at){
  cancelAnimationFrame(PV.raf);await pvPrep();if(!PV.on)return;PV.off=at||0;PV.t0=performance.now();PV.paused=false;
  const pb=document.getElementById('pvpause');if(pb)pb.innerHTML=wi('pause',20);
  const cv=document.getElementById('pvcv');if(cv){cv.width=720;cv.height=1280}
  PV.raf=requestAnimationFrame(pvFrame)}
async function openPreview(i){
  if(!WS.slides.length||!WS.cur||PV.on||document.getElementById('wvidm'))return;PV.on=true;
  const el=document.createElement('div');el.id='wpv';el.className='wvidm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Pratinjau Wrapped');
  el.innerHTML=`<div class="wvidm-in"><div class="wvidm-top"><div><b>Pratinjau Wrapped</b><small>${E(WS.cur.label)}</small></div><button type="button" class="wstory-btn" data-act="pvclose" aria-label="Tutup">${wi('close')}</button></div>
  <div class="wvidm-stage"><canvas id="pvcv" width="720" height="1280"></canvas></div>
  <div class="wvidm-prog"><i><b id="pvbar"></b></i><span id="pvct"></span></div>
  <div class="pv-opts" id="pvopts">${pvChips()}</div>
  <div class="wvidm-acts"><button type="button" class="wstory-btn" id="pvpause" data-act="pvpause" aria-label="Jeda atau lanjut">${wi('pause',20)}</button><button type="button" class="wstory-pill pri" data-act="pvdl">${wi('film',18)}<span>Unduh video</span></button><button type="button" class="wstory-pill" data-act="pvclose"><span>Tutup</span></button></div></div>`;
  document.body.appendChild(el);document.documentElement.classList.add('wstory-open');
  PV.layer=()=>{PV.layer=null;closePreview()};try{DKNav.pushLayer(PV.layer)}catch(e){}
  const a=AU();if(a){a.unlock();a.play(WS.vm);a.sfx&&a.sfx('whoosh')}
  await pvRestart((i||0)*slideSec())}
function closePreview(){
  if(!PV.on)return;PV.on=false;cancelAnimationFrame(PV.raf);const el=document.getElementById('wpv');if(el)el.remove();
  document.documentElement.classList.remove('wstory-open');if(AU())AU().stop(.6);if(PV.layer){const l=PV.layer;PV.layer=null;try{DKNav.release(l)}catch(e){}}}
function pvUpdateOpts(){const o=document.getElementById('pvopts');if(o)o.innerHTML=pvChips()}
/* ---------- jendela perekaman + pratinjau ---------- */
const VP={blob:null,ext:'webm',url:'',ctl:null};
function closeVid(){const el=document.getElementById('wvidm');if(VP.ctl)VP.ctl.abort=true;if(VP.url){try{URL.revokeObjectURL(VP.url)}catch(e){}VP.url=''}VP.blob=null;if(el)el.remove();document.documentElement.classList.remove('wstory-open');if(VP.layer){const l=VP.layer;VP.layer=null;try{DKNav.release(l)}catch(e){}}}
async function makeVideo(){
  if(WS.busy||!WS.slides.length||document.getElementById('wvidm'))return;WS.busy='vid';
  const st=VSTYLES.find(v=>v[0]===WS.vs),mu=VMUSIC.find(v=>v[0]===WS.vm);
  const el=document.createElement('div');el.id='wvidm';el.className='wvidm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Pratinjau video Wrapped');
  el.innerHTML=`<div class="wvidm-in"><div class="wvidm-top"><div><b>Video Wrapped</b><small>${E(st[1])} · ${E(mu[1])}</small></div><button type="button" class="wstory-btn" data-act="wvclose" aria-label="Tutup">${wi('close')}</button></div><div class="wvidm-stage" id="wvstage"><canvas id="wvcv" width="720" height="1280"></canvas></div><div class="wvidm-prog"><i><b id="wvbar"></b></i><span id="wvtxt">Menyiapkan…</span></div><div class="wvidm-acts" id="wvacts"><button type="button" class="wstory-pill" data-act="wvclose">Batal</button></div></div>`;
  document.body.appendChild(el);document.documentElement.classList.add('wstory-open');
  VP.layer=()=>{VP.layer=null;closeVid()};try{DKNav.pushLayer(VP.layer)}catch(e){}
  const ctl={abort:false,canvas:document.getElementById('wvcv')};VP.ctl=ctl;
  const bar=document.getElementById('wvbar'),tx=document.getElementById('wvtxt');
  try{
    const r=await exportVideo((p,t)=>{if(bar)bar.style.width=p+'%';if(tx)tx.textContent=t+' '+p+'%'},ctl);
    if(!r||ctl.abort||!document.getElementById('wvidm')){WS.busy='';return}
    VP.blob=r.blob;VP.ext=r.ext;VP.url=URL.createObjectURL(r.blob);
    document.getElementById('wvstage').innerHTML=`<video id="wvv" src="${VP.url}" controls playsinline loop></video>`;
    tx.textContent='Selesai · '+r.sec+' detik'+(r.audio?' · dengan musik':' · tanpa musik (audio tidak tersedia)');bar.style.width='100%';
    document.getElementById('wvacts').innerHTML=`<button type="button" class="wstory-pill pri" data-act="wvdl">${wi('down',18)}<span>Unduh video</span></button><button type="button" class="wstory-pill" data-act="wvagain">${wi('replay',18)}<span>Rekam ulang</span></button><button type="button" class="wstory-pill" data-act="wvclose"><span>Tutup</span></button>`;
    const v=document.getElementById('wvv');if(v){const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{})}
  }catch(e){console.error(e);if(tx)tx.textContent='Gagal: '+e.message;const ac=document.getElementById('wvacts');if(ac)ac.innerHTML='<button type="button" class="wstory-pill" data-act="wvclose">Tutup</button>'}
  WS.busy=''}
Object.assign(A,{
  wtype:b=>{WS.type=b.dataset.t;WS.sel=0;WS.i=0;keepPos(render)},
  wopen:b=>openPreview(+b.dataset.i||0),pvclose:()=>closePreview(),pvpause:()=>{if(PV.paused){PV.t0=performance.now();PV.paused=false;const a=AU();if(a)a.play(WS.vm);PV.raf=requestAnimationFrame(pvFrame)}else{PV.off+=(performance.now()-PV.t0)/1000;PV.paused=true;cancelAnimationFrame(PV.raf);const a=AU();if(a)a.stop(.3)}const b=document.getElementById('pvpause');if(b)b.innerHTML=wi(PV.paused?'play':'pause',20)},pvs:b=>{WS.vs=b.dataset.v;saveV();pvUpdateOpts();const t=PV.paused?PV.off:PV.off+(performance.now()-PV.t0)/1000;pvRestart(t)},pvm:b=>{WS.vm=b.dataset.v;saveV();pvUpdateOpts();const a=AU();if(a){a.unlock();a.play(WS.vm)}pvRestart(0)},pvdl:()=>{closePreview();setTimeout(makeVideo,60)},wclose:()=>closeStory(),
  wsprev:()=>gotoSlide(WS.i-1),wsnext:()=>gotoSlide(WS.i+1),wreplay:()=>{userPaused=false;holding=false;gotoSlide(0);paintTools();const a=AU();if(a)a.play(WS.vm)},
  wspause:()=>{if(storyEl&&storyEl.classList.contains('done')){A.wreplay();return}userPaused=!userPaused;paintTools()},
  wmusic:()=>{const a=AU();if(a)a.setMusic(!a.state().music)},
  wsshare:async()=>{try{const b=await slideBlob(WS.i),f=new File([b],fname('png').replace('.png','-'+(WS.i+1)+'.png'),{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'DuitKu Wrapped',text:'DuitKu Wrapped '+WS.cur.label});return}
    dl(b,f.name);toast('Gambar slide diunduh')}catch(e){if(e&&e.name==='AbortError')return;toast('Gagal membagikan: '+e.message,'err')}},
  wpng:()=>busy('png',async()=>{await exportOne();msg('Gambar slide '+(WS.i+1)+' diunduh.')}),
  wall:()=>busy('all',async()=>{await exportAll();msg('Gambar semua slide diunduh.')}),
  wvs:b=>{WS.vs=b.dataset.v;saveV();keepPos(render)},wvm:b=>{WS.vm=b.dataset.v;saveV();keepPos(render);const a=AU();if(a){a.unlock();a.play(WS.vm);clearTimeout(sampT);sampT=setTimeout(()=>{if(!WS.story)a.stop(.6)},4500)}},
  wvid:()=>makeVideo(),wvdl:()=>{if(VP.blob)dl(VP.blob,fname(VP.ext))},wvclose:()=>closeVid(),wvagain:()=>{closeVid();setTimeout(makeVideo,60)}
});
document.addEventListener('change',e=>{const t=e.target;if(page!=='wrap'||!t)return;if(t.id==='wsel'){WS.sel=+t.value;WS.i=0;keepPos(render)}else if(t.id==='whide'){WS.hide=t.checked;keepPos(render)}});
document.addEventListener('keydown',e=>{
  if(!WS.story)return;const k=e.key,n=WS.slides.length;if(k==='Tab')return;
  if(k==='Escape'){e.preventDefault();closeStory()}else if(k==='ArrowRight'||k==='PageDown'){e.preventDefault();gotoSlide(Math.min(WS.i+1,n))}else if(k==='ArrowLeft'||k==='PageUp'){e.preventDefault();gotoSlide(WS.i-1)}
  else if(k===' '||k==='k'||k==='K'){e.preventDefault();if(!(e.target.closest&&e.target.closest('button')))A.wspause()}else if(k==='m'||k==='M'){A.wmusic()}
  e.stopPropagation()},true);
/* hari berganti / hitung mundur: perbarui halaman Wrapped yang sedang terbuka tanpa mengganggu penampil cerita */
setInterval(()=>{if(page!=='wrap'||WS.story||WS.busy)return;if(nowDay()!==WS.day){render();return}
  const e=document.querySelector('[data-wr-end]');if(e)e.textContent=leftTxt(msToEnd())},30000);
const _r=render;render=function(){const r=_r.apply(this,arguments);if(window.__wrap)window.__wrap.WS=WS;return r};
if(window.__DUITKU_TEST){window.__wrapState=WS;window.__wrap.WS=WS}
})();
