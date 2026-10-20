import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// One geometry source produces both editable SVG and native Lottie shape layers.
const out = fileURLToPath(new URL('../public/brand-motion/', import.meta.url));
fs.mkdirSync(out, { recursive: true });
const palette = { violet: '#8064a2', green: '#9abb54', red: '#bd4d50', earth: '#935d33' };
const shape = (name, d, color, motion = 'still', stroke = false) => ({ name, d, color, motion, stroke });
const circle = (x, y, r) => `M ${x+r} ${y} C ${x+r} ${y+r*.5523} ${x+r*.5523} ${y+r} ${x} ${y+r} C ${x-r*.5523} ${y+r} ${x-r} ${y+r*.5523} ${x-r} ${y} C ${x-r} ${y-r*.5523} ${x-r*.5523} ${y-r} ${x} ${y-r} C ${x+r*.5523} ${y-r} ${x+r} ${y-r*.5523} ${x+r} ${y} Z`;
const heart = 'M 64 93 C 54 85 25 66 25 47 C 25 27 49 22 64 40 C 79 22 103 27 103 47 C 103 66 74 85 64 93 Z';
const assets = [
  { name: 'community-orbit', title: 'Community orbit', use: 'Page or section loading', layers: [
    shape('violet-foundation', 'M 35 76 L 49 57 L 79 57 L 93 76 L 79 97 L 49 97 Z', 'violet', 'breathe'),
    shape('person-left-head', circle(51, 31, 7), 'earth'),
    shape('person-right-head', circle(77, 31, 7), 'earth'),
    shape('people-connected', 'M 35 61 C 39 45 43 42 51 42 C 57 42 61 46 64 49 C 67 46 71 42 77 42 C 85 42 89 45 93 61 L 85 55 L 82 79 L 75 79 L 73 57 L 64 58 L 55 57 L 53 79 L 46 79 L 43 55 Z', 'earth'),
    shape('red-orbit', 'M 25 90 C 7 71 19 41 43 38', 'red', 'draw', true),
    shape('green-orbit', 'M 28 94 C 48 109 95 103 105 81 C 110 69 99 61 91 58', 'green', 'draw', true),
  ] },
  { name: 'care-heart', title: 'Care heart', use: 'Donation processing or care', layers: [
    shape('heart', heart, 'red', 'breathe'),
    shape('support-left', 'M 16 84 C 30 105 47 112 64 111', 'violet', 'still', true),
    shape('support-right', 'M 64 111 C 81 112 98 105 112 84', 'green', 'still', true),
  ] },
  { name: 'growing-together', title: 'Growing together', use: 'Program loading or progress', layers: [
    shape('ground', 'M 31 104 L 97 104', 'violet', 'still', true),
    shape('stem', 'M 64 100 C 64 81 64 61 64 42', 'earth', 'draw', true),
    shape('left-leaf', 'M 62 78 C 37 79 24 63 26 43 C 48 43 63 55 62 78 Z', 'green', 'breathe'),
    shape('right-leaf', 'M 66 62 C 65 40 81 24 104 24 C 105 47 91 61 66 62 Z', 'green', 'breathe'),
  ] },
  { name: 'learning-pages', title: 'Learning pages', use: 'Course or document loading', layers: [
    shape('left-page', 'M 64 96 C 50 86 34 83 18 86 L 18 31 C 34 28 50 31 64 41 Z', 'violet', 'breathe'),
    shape('right-page', 'M 64 96 C 78 86 94 83 110 86 L 110 31 C 94 28 78 31 64 41 Z', 'green', 'breathe'),
    shape('spine', 'M 64 43 L 64 94', 'earth', 'still', true),
    shape('bookmark', 'M 86 29 L 96 28 L 96 62 L 91 57 L 86 62 Z', 'red'),
  ] },
  { name: 'community-dots', title: 'Community dots', use: 'Compact inline loading', layers: [
    shape('dot-violet', circle(32, 64, 9), 'violet', 'bounce'),
    shape('dot-earth', circle(64, 64, 9), 'earth', 'bounce'),
    shape('dot-green', circle(96, 64, 9), 'green', 'bounce'),
  ] },
  { name: 'success-embrace', title: 'Success embrace', use: 'Form or donation confirmation; play once', once: true, layers: [
    shape('left-embrace', 'M 49 103 C 24 96 14 68 24 43', 'violet', 'draw', true),
    shape('right-embrace', 'M 79 103 C 104 96 114 68 104 43', 'green', 'draw', true),
    shape('check', 'M 41 64 L 57 80 L 87 48', 'earth', 'draw', true),
    shape('care-dot', circle(64, 27, 6), 'red', 'breathe'),
  ] },
];

function bezier(d) {
  const tokens = d.match(/[MCLZ]|-?\d+(?:\.\d+)?/g);
  const v = [], i = [], o = []; let closed = false;
  const point = () => [Number(tokens.shift()), Number(tokens.shift())];
  while (tokens.length) {
    const cmd = tokens.shift();
    if (cmd === 'M' || cmd === 'L') { v.push(point()); i.push([0,0]); o.push([0,0]); }
    else if (cmd === 'C') {
      const a = point(), b = point(), p = point(), prev = v.at(-1);
      o[o.length-1] = a.map((n,k) => n-prev[k]);
      v.push(p); i.push(b.map((n,k) => n-p[k])); o.push([0,0]);
    } else if (cmd === 'Z') closed = true;
    else throw new Error(`Unsupported command ${cmd}`);
  }
  if (closed && v.length > 1 && v.at(-1).every((n,k) => n === v[0][k])) {
    i[0] = i.pop(); v.pop(); o.pop();
  }
  return { v, i, o, c: closed };
}
const fixed = k => ({ a: 0, k });
const animated = entries => ({ a: 1, k: entries.map(([t,s],idx) => ({ t, s, ...(idx < entries.length-1 ? { o: { x: [0.33], y: [0] }, i: { x: [0.67], y: [1] } } : {}) })) });
const rgb = hex => hex.match(/[a-f\d]{2}/gi).map(x => parseInt(x,16)/255);
for (const asset of assets) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none" role="img" aria-labelledby="title"><title id="title">${asset.title}</title>${asset.layers.map(l => `<g id="${l.name}" data-motion="${l.motion}"><path d="${l.d}" ${l.stroke ? `stroke="${palette[l.color]}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"` : `fill="${palette[l.color]}"`}/></g>`).join('')}</svg>`;
  fs.writeFileSync(path.join(out, asset.name+'.svg'), svg+'\n');
  const layers = asset.layers.map((l, index) => {
    const b = bezier(l.d);
    const center = b.v.reduce((a,p) => a.map((n,k) => n+p[k]/b.v.length), [0,0]);
    const scale = l.motion === 'breathe' ? animated([[0,[100,100,100]],[30,[106,106,100]],[60,[100,100,100]]]) : fixed([100,100,100]);
    const delay = index*6;
    const position = l.motion === 'bounce' ? animated([[0,[...center,0]],[delay,[...center,0]],[delay+10,[center[0],center[1]-12,0]],[delay+20,[...center,0]],[60,[...center,0]]].filter((e,j,a) => j===0 || e[0] > a[j-1][0])) : fixed([...center,0]);
    const paint = l.stroke ? { ty:'st', c:fixed(rgb(palette[l.color])), o:fixed(100), w:fixed(6), lc:2, lj:2, ml:4, bm:0, nm:l.name+' stroke' } : { ty:'fl', c:fixed(rgb(palette[l.color])), o:fixed(100), r:1, bm:0, nm:l.name+' fill' };
    return { ddd:0, ind:index+1, ty:4, nm:l.name, sr:1, ks:{ o:fixed(100), r:fixed(0), p:position, a:fixed([...center,0]), s:scale }, ao:0,
      shapes:[{ty:'sh',ks:fixed(b),nm:l.name+' path'}, paint, ...(l.motion === 'draw' ? [{ty:'tm',s:fixed(0),e:asset.once ? animated([[0,[0]],[32,[100]],[60,[100]]]) : animated([[0,[25]],[30,[100]],[60,[25]]]),o:fixed(0),m:1,nm:'reveal'}] : [])], ip:0,op:60,st:0,bm:0 };
  }).reverse();
  fs.writeFileSync(path.join(out,asset.name+'.json'),JSON.stringify({v:'5.12.2',fr:30,ip:0,op:60,w:128,h:128,nm:'HOVUCA '+asset.title,ddd:0,assets:[],layers,markers:[]},null,2)+'\n');
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({ palette, source:'/Hovuca.png', note:'Original motion motifs inspired by the existing raster logo; not an exact vector trace.', assets:assets.map(a => ({name:a.name,use:a.use,svg:`${a.name}.svg`,lottie:`${a.name}.json`,loop:!a.once,duration:2,size:128})) },null,2)+'\n');
fs.writeFileSync(path.join(out,'preview.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HOVUCA motion assets</title><style>body{margin:0;padding:40px;background:#fcfbf7;color:#193832;font:16px/1.5 Arial,sans-serif}main{max-width:980px;margin:auto}h1{font-size:36px;margin:0}p{max-width:65ch}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:32px;margin-top:40px}article{border-top:1px solid #d9dfdb;padding-top:20px}img{width:128px;height:128px}h2{font-size:19px;margin:12px 0 0}a{color:#183b35}small{display:block}header img{width:70px;height:83px;float:right}</style><main><header><img src="../Hovuca.png" alt="Original HOVUCA logo"><h1>Small gestures. Shared purpose.</h1><p>Six vector motifs drawn from HOVUCA’s people, orbit ribbons, and original logo colors. Static artwork below; each includes a two-second native Lottie animation.</p></header><div class="grid">${assets.map(a=>`<article><img src="${a.name}.svg" alt="${a.title}"><h2>${a.title}</h2><p>${a.use}</p><a href="${a.name}.svg">SVG</a> · <a href="${a.name}.json">Lottie JSON</a><small>${a.layers.length} named layers · ${a.once?'Play once':'Loop'}</small></article>`).join('')}</div></main></html>`);
console.log(`Generated ${assets.length} SVGs and ${assets.length} Lottie animations in ${out}`);
