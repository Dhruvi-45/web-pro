(function(){
  'use strict';

  var P = {
    vacant:  { bg:'#d4e9b0', border:'#5a8a2a', text:'#2e5010', lbl:'Vacant' },
    partial: { bg:'#f5d08a', border:'#c08a10', text:'#5a3a05', lbl:'Partial occupied' },
    full:    { bg:'#f0b080', border:'#c05a20', text:'#4a1a05', lbl:'Fully occupied' }
  };

  function seed(n){ return ['vacant','partial','full'][((n*7+13)%3+3)%3]; }

  function fmt(n){ return n < 10 ? '00'+n : n < 100 ? '0'+n : String(n); }

  var rooms = {};
  var i;
  for(i=1;i<=12;i++)  rooms[i]={wing:'Wing A',side:'North',type:i%3===0?'Two-sitter':'One-sitter',status:seed(i),floor:0};
  for(i=13;i<=21;i++) rooms[i]={wing:'Wing A',side:'South',type:i%2===0?'Two-sitter':'One-sitter',status:seed(i),floor:0};
  for(i=22;i<=32;i++) rooms[i]={wing:'Wing B',side:'North',type:i%3===0?'Two-sitter':'One-sitter',status:seed(i),floor:0};
  for(i=33;i<=42;i++) rooms[i]={wing:'Wing B',side:'South',type:i%2===0?'Two-sitter':'One-sitter',status:seed(i),floor:0};

  var LAYOUTS = [
    { north:[1,2,3,4,5,6,'S',7,8,9,10,11,12],      south:[13,14,15,16,17,18,19,20,21] },
    { north:[22,23,24,25,26,27,'S',28,29,30,31,32], south:[33,34,35,36,37,38,39,40,41,42] }
  ];

  var tipEl = document.getElementById('tip');

  function mkStair(){
    var d=document.createElement('div');
    d.className='stair-cell';
    d.title='Staircase';
    d.textContent='\u25B2';
    return d;
  }

  function mkRoom(num){
    var meta=rooms[num];
    var pal=meta?P[meta.status]:P.vacant;
    var d=document.createElement('div');
    d.className='room';
    d.style.background=pal.bg;
    d.style.borderColor=pal.border;
    d.style.color=pal.text;
    d.textContent=fmt(num);
    if(meta){
      d.addEventListener('mouseenter',function(){
        var st=P[meta.status];
        tipEl.innerHTML='<strong>Room '+fmt(num)+'</strong><span class="dot">&middot;</span>'+st.lbl
          +'<span class="dot">&middot;</span>'+meta.type
          +'<span class="dot">&middot;</span>'+meta.wing+' / '+meta.side+' block'
          +'<span class="dot">&middot;</span>Floor '+meta.floor;
      });
      d.addEventListener('mouseleave',function(){
        tipEl.innerHTML='<span style="color:#9a9080">Hover over any room to see details</span>';
      });
    }
    return d;
  }

  function mkRow(items){
    var row=document.createElement('div');
    row.className='room-row';
    items.forEach(function(item){ row.appendChild(item==='S'?mkStair():mkRoom(item)); });
    return row;
  }

  function mkWing(cfg){
    var wing=document.createElement('div');
    wing.className='wing';
    wing.appendChild(mkRow(cfg.north));
    var corr=document.createElement('div');
    corr.className='corridor';
    var s=document.createElement('span');
    s.textContent='\u2014 corridor \u2014';
    corr.appendChild(s);
    wing.appendChild(corr);
    wing.appendChild(mkRow(cfg.south));
    return wing;
  }

  function buildLegend(){
    var c=document.getElementById('legend');
    [
      {bg:'#d4e9b0',bc:'#5a8a2a',label:'Vacant'},
      {bg:'#f5d08a',bc:'#c08a10',label:'Partial occupied'},
      {bg:'#f0b080',bc:'#c05a20',label:'Fully occupied'},
      {bg:'#a0bcd8',bc:'#3a6898',label:'Staircase'},
      {bg:'repeating-linear-gradient(90deg,#e8e4d8 0,#e8e4d8 8px,#dedad1 8px,#dedad1 9px)',bc:'#bcbaa8',label:'Corridor'}
    ].forEach(function(item){
      var w=document.createElement('div');
      w.className='legend-item';
      var sw=document.createElement('div');
      sw.className='legend-swatch';
      sw.style.background=item.bg;
      sw.style.borderColor=item.bc;
      var sp=document.createElement('span');
      sp.textContent=item.label;
      w.appendChild(sw);w.appendChild(sp);
      c.appendChild(w);
    });
  }

  function buildFooter(){
    var vals=Object.keys(rooms).map(function(k){return rooms[k];});
    var v=0,p=0,f=0;
    vals.forEach(function(r){
      if(r.status==='vacant')v++;
      else if(r.status==='partial')p++;
      else f++;
    });
    var c=document.getElementById('footerNote');
    var stats=document.createElement('div');
    stats.className='stats-box';
    stats.innerHTML='<strong>Ground floor summary</strong><br>'
      +'Room range: 001&ndash;042 &nbsp;&middot;&nbsp; Total rooms: '+vals.length+'<br>'
      +'Vacant: '+v+' &nbsp;&middot;&nbsp; Partial occ.: '+p+' &nbsp;&middot;&nbsp; Fully occ.: '+f;
    var note=document.createElement('div');
    note.className='note-box';
    note.innerHTML='<strong>Layout notes</strong><br>'
      +'Rooms 001&ndash;021 &nbsp;&middot;&nbsp; Rooms 022&ndash;042<br>'
      +'Each section: North row + Corridor + South row<br>'
      +'&#9650; = staircase / utility cell (not a room)';
    c.appendChild(stats);c.appendChild(note);
  }

  buildLegend();
  var wingsEl=document.getElementById('wings');
  LAYOUTS.forEach(function(cfg){ wingsEl.appendChild(mkWing(cfg)); });
  buildFooter();
}());