(function(){
'use strict';

var RW=52,RH=46,WS=52,GAP=2;
var TOWER_COLOR={A:'#1a4a8a',B:'#0d5c40'};
var TOWER_BG={A:'#eef4fd',B:'#edf8f4'};
var tipEl=document.getElementById('tip');

var SS={
  vacant:{bg:'var(--vacant)',b:'var(--vacant-b)',t:'var(--vacant-t)',lbl:'Vacant'},
  single:{bg:'var(--single)',b:'var(--single-b)',t:'var(--single-t)',lbl:'Partial Occupied'},
  double:{bg:'var(--double)',b:'var(--double-b)',t:'var(--double-t)',lbl:'Fully Occupied'}
};

function seededRand(seed){
  var s=seed;
  return function(){s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/4294967296;};
}
function getRoomStatus(rand){
  var r=rand();
  if(r<0.30)return'vacant';
  if(r<0.65)return'single';
  return'double';
}
function buildStatuses(floor,tower){
  var rand=seededRand((tower==='A'?1:7)*(floor+1)*31337);
  var map={};
  for(var i=1;i<=20;i++) map[i]=getRoomStatus(rand);
  return map;
}

/* Room label: floor*100 + n, e.g. Floor1,n7 => A107 */
function roomLabel(tower,floor,n){
  var base=floor*100+n;
  var p=base<10?'00'+base:base<100?'0'+base:String(base);
  return tower+p;
}

function div(style,cls){
  var d=document.createElement('div');
  if(cls) d.className=cls;
  if(style) d.style.cssText=style;
  return d;
}
function rowEl(extra){return div('display:flex;flex-direction:row;gap:'+GAP+'px;align-items:stretch;'+(extra||''));}
function colEl(extra){return div('display:flex;flex-direction:column;gap:'+GAP+'px;'+(extra||''));}
function spacerEl(){return div('width:'+RW+'px;height:'+RH+'px;flex-shrink:0;');}

function mkWash(sub){
  var d=div('width:'+WS+'px;height:'+RH+'px;','wash');
  d.innerHTML='<span>WR</span>'
    +'<svg width="10" height="12" viewBox="0 0 10 12" fill="none">'
    +'<circle cx="5" cy="3" r="2.2" fill="#3a6898"/>'
    +'<rect x="1.5" y="6" width="7" height="5" rx="1.5" fill="#3a6898"/>'
    +'</svg>'
    +'<span style="font-size:5.5px;opacity:.75">('+sub+')</span>';
  return d;
}

function mkRoom(tower,floor,n,statuses){
  var status=statuses[n],st=SS[status],label=roomLabel(tower,floor,n);
  var d=div('width:'+RW+'px;height:'+RH+'px;background:'+st.bg+';border-color:'+st.b+';color:'+st.t+';','room');
  d.textContent=label;
  d.onmouseenter=function(){
    tipEl.innerHTML='<strong>Room '+label+'</strong> &nbsp;&middot;&nbsp; '+st.lbl
      +' &nbsp;&middot;&nbsp; Tower&nbsp;<strong>'+tower+'</strong>'
      +' &nbsp;&middot;&nbsp; Floor&nbsp;<strong>'+floor+'</strong>';
  };
  d.onmouseleave=function(){tipEl.textContent='Hover over any room to see details';};
  return d;
}

function mkCourtyard(){
  var cW=5*RW+4*GAP,cH=5*RH+4*GAP;
  var d=div('width:'+cW+'px;height:'+cH+'px;','courtyard');
  var t=div('');t.className='ct-title';t.textContent='COURTYARD';
  var s=div('');s.className='ct-sub';s.textContent='(Open to sky)';
  d.appendChild(t);d.appendChild(s);
  return d;
}

function mkTowerGrid(floor,tower,statuses){
  var wrap=div('display:inline-flex;flex-direction:column;gap:'+GAP+'px;');
  function room(n){return mkRoom(tower,floor,n,statuses);}

  var r0=rowEl();
  r0.appendChild(mkWash('TL'));
  [1,2,3,4,5].forEach(function(n){r0.appendChild(room(n));});
  r0.appendChild(spacerEl());
  wrap.appendChild(r0);

  var mid=rowEl();
  var lc=colEl();
  [11,12,13,14,15].forEach(function(n){lc.appendChild(room(n));});
  mid.appendChild(lc);
  mid.appendChild(mkCourtyard());
  var rc=colEl();
  [6,7,8,9,10].forEach(function(n){rc.appendChild(room(n));});
  mid.appendChild(rc);
  wrap.appendChild(mid);

  var r6=rowEl();
  r6.appendChild(spacerEl());
  [16,17,18,19,20].forEach(function(n){r6.appendChild(room(n));});
  r6.appendChild(mkWash('BR'));
  wrap.appendChild(r6);

  return wrap;
}

function mkSideLbl(tower,side){
  var wrap=div('','tower-side-lbl '+side);
  var lbl=div('background:'+TOWER_COLOR[tower]+';transform:'+(side==='left'?'rotate(180deg)':'rotate(0deg)')+';','wing-lbl');
  lbl.textContent='TOWER '+tower;
  wrap.appendChild(lbl);
  return wrap;
}

function mkTowerBlock(floor,tower){
  var block=div('','tower-block');

  var hdr=div('display:flex;align-items:center;gap:8px;padding:5px 8px 3px;background:'+TOWER_BG[tower]+';border-bottom:0.5px solid var(--court-b);'+(tower==='B'?'border-top:1px solid var(--court-b);':''));
  var hdrLabel=div('background:'+TOWER_COLOR[tower]+';','section-hdr');
  hdrLabel.textContent='TOWER '+tower;
  var hdrNote=div('font-size:9px;color:var(--muted);');
  hdrNote.textContent='Rooms '+roomLabel(tower,floor,1)+' \u2013 '+roomLabel(tower,floor,20)+' \u00B7 2 washrooms (perimeter layout)';
  hdr.appendChild(hdrLabel);hdr.appendChild(hdrNote);
  block.appendChild(hdr);

  var statuses=buildStatuses(floor,tower);
  var body=div('','tower-body');
  var inner=div('background:'+TOWER_BG[tower]+';','tower-inner');
  inner.appendChild(mkTowerGrid(floor,tower,statuses));
  body.appendChild(mkSideLbl(tower,'left'));
  body.appendChild(inner);
  body.appendChild(mkSideLbl(tower,'right'));
  block.appendChild(body);
  return block;
}

function mkConnector(){
  var strip=div('','connector-strip');
  var door=div('','connector-door');door.textContent='COMMON DOOR / WASHROOM';
  var note=div('','connector-note');note.textContent='Connector between Tower A & Tower B';
  strip.appendChild(door);strip.appendChild(note);
  return strip;
}

function mkFooter(floor){
  var footer=div('','footer');
  var stats=div('','stats-box');
  stats.innerHTML='<strong>Floor '+floor+' \u2014 Twin Tower Complex</strong><br>'
    +'Tower A: '+roomLabel('A',floor,1)+' \u2013 '+roomLabel('A',floor,20)
    +' &nbsp;&middot;&nbsp; Tower B: '+roomLabel('B',floor,1)+' \u2013 '+roomLabel('B',floor,20)+'<br>'
    +'20 rooms per tower &nbsp;&middot;&nbsp; Perimeter courtyard layout';
  var note=div('','note-box');
  note.innerHTML='<strong>NOTE:</strong><br>'
    +'Perimeter layout \u2014 rooms along outer edges<br>'
    +'Courtyard in centre (open to sky)<br>'
    +'Washrooms: top-left &amp; bottom-right corners<br>'
    +'Both towers fully active on all 8 floors (0\u20137)';
  footer.appendChild(stats);footer.appendChild(note);
  return footer;
}

function build(floor){
  var bp=document.getElementById('bp');
  bp.innerHTML='';
  document.getElementById('floorSub').textContent=
    'Floor '+floor+(floor===0?' (Ground Floor)':'')+' \u2014 Both towers active';
  bp.appendChild(mkTowerBlock(floor,'A'));
  bp.appendChild(mkConnector());
  bp.appendChild(mkTowerBlock(floor,'B'));
  bp.appendChild(mkFooter(floor));
}

/* Floor selector */
var selEl=document.getElementById('floorSel');
['Floor 0 (GF)','Floor 1','Floor 2','Floor 3','Floor 4','Floor 5','Floor 6','Floor 7'].forEach(function(lbl,i){
  var btn=document.createElement('button');
  btn.className='fbtn'+(i===0?' active':'');
  btn.textContent=lbl;
  btn.onclick=function(){
    document.querySelectorAll('.fbtn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    build(i);
  };
  selEl.appendChild(btn);
});

build(0);
}());