export function draw(canvas){
const ctx=canvas.getContext('2d');canvas.width=960;canvas.height=390;ctx.scale(2,2);
let seed=57;const rnd=()=>((seed=seed*16807%2147483647)/2147483647);
const line=(pts,col,w=1)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()};
const poly=(pts,col)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#af94d0';ctx.lineWidth=.7;ctx.stroke()};
for(let i=0;i<190;i++){let x=rnd()*480,y=rnd()*150;ctx.fillStyle='rgba(220,205,251,'+(rnd()*.65+.15)+')';ctx.fillRect(x,y,rnd()*1.8+.5,1)}
ctx.beginPath();ctx.arc(345,60,36,0,Math.PI*2);ctx.fillStyle='#b89eca';ctx.fill();ctx.save();ctx.clip();for(let i=0;i<550;i++){let x=306+rnd()*80,y=24+rnd()*74;line([[x,y],[x+1+rnd()*8,y]],'#8f789f',.5)}ctx.restore();
for(let j=0;j<4;j++){let pts=[[0,198],[0,134]];for(let i=0;i<=100;i++){let x=i*5;pts.push([x,120+j*12+10*Math.sin(x*.027+j)+9*Math.cos(x*.041+j)+rnd()*4])}pts.push([500,200]);poly(pts,['#484059','#40364e','#352d44','#292639'][j])}
ctx.save();ctx.translate(204,5);ctx.rotate(-.052);
for(const [x,top,len] of [[31,63,25],[67,24,36],[102,48,24]]){line([[x,top],[x,150]],'#d6bde4',1.8);poly([[x,top],[x+17,top+2],[x+6,top+6],[x,top+5]],'#ae92c0');for(let j=0;j<3;j++){let y=top+10+j*23,b=len*(.58+j*.19);line([[x-b-3,y],[x+b+4,y-3]],'#e4d1e9',1.2);poly([[x-b,y],[x+b,y-3],[x+b-3,y+6],[x+b+1,y+19],[x,y+22],[x-b-5,y+20],[x-b,y+10]],'#ac94b5');for(let k=1;k<8;k++){let a=x-b+2*b*k/8;line([[a,y],[a-2,y+9],[a-2,y+18]],'#6c5979',.55)}}line([[x,top+6],[x-39,147]],'#b69bc9',.8);line([[x,top+6],[x+36,147]],'#b69bc9',.8)}
poly([[-9,138],[19,144],[98,144],[133,133],[115,152],[93,159],[24,159],[9,153]],'#3d304a');for(let j=0;j<3;j++)line([[3,143+j*3],[30,150+j*3],[94,150+j*3],[122,140+j*3]],'#bba1c7',.8);ctx.restore();
for(let i=0;i<360;i++){let x=rnd()*480,y=157+rnd()*40;line([[x,y],[x+rnd()*15+2,y-1]],'#72647f',.6)}
}
