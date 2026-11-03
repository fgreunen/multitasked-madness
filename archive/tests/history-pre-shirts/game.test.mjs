import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES } from '../src/game.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
function opened(level=1,count=3){
 const g=new Game(17,level);g.unlockedSlots=count;g.minions=Array(Math.min(CONFIG.maxMinions,count+1)).fill(null);
 for(let i=1;i<Math.min(count,g.workLimit);i++)g.slots[i]=g.createDemand();
 for(const t of g.slots.filter(Boolean)){t.size=21;t.scopeCreepChecked=true;t.dependencyChecked=true;}
 return g;
}
test('START alone begins time and immediately sends workers within column capacity to work',()=>{
 const g=new Game();g.tick(99);assert.equal(g.status,'ready');assert.equal(g.elapsed,0);
 assert.equal(g.transfer(0,0),false);assert.equal(g.start(),true);assert.equal(g.availableMinions,2);
 assert.equal(g.minionCountFor(0),3);assert.equal(g.start(),false);
 assert.equal(g.allocate,undefined);assert.equal(g.deallocate,undefined);g.tick(.1);near(g.elapsed,.1);
});
test('all three output values are immediate and constant with no ramp',()=>{
 for(const[n,output]of [[1,1],[2,2.1],[3,3.2]]){
  const g=new Game();const t=g.slots[0];t.size=21;t.scopeCreepChecked=true;
  g.minions=Array(n).fill(null);g.start();near(g.outputFor(0),output);
  g.tick(.5);near(t.progress,40+48/21*output*.5);const before=t.progress;
  g.tick(.5);near(t.progress-before,48/21*output*.5);
 }
});
test('direct transfers preserve worker count and immediately change both column outputs',()=>{
 const g=opened(1,2);g.minions=Array(2).fill(null);g.random=()=>0;g.start();
 const before=JSON.stringify(g.minions);assert.equal(g.transfer(0,7),false);assert.equal(JSON.stringify(g.minions),before);
 assert.equal(g.transfer(0,1,2),true);assert.equal(g.minionCountFor(0),1);assert.equal(g.minionCountFor(1),1);
 assert.equal(g.availableMinions,0);const a=g.slots[0].progress,b=g.slots[1].progress;
 g.tick(.2);near(g.slots[0].progress-a,48/21*.2);near(g.slots[1].progress-b,48/21*.2);
 const snapshot=JSON.stringify(g.minions);assert.equal(g.transfer(1,1,2),false);assert.equal(g.transfer(1,1,3),false);
 assert.equal(JSON.stringify(g.minions),snapshot);
});
test('empty, resolved, dependency-blocked and locked columns cannot receive transfers',()=>{
 const g=opened();g.start();for(const state of [null,'completed','waiting']){
  g.slots[1]=state===null?null:{...g.createDemand(),state};assert.equal(g.transfer(0,1),false);
 }
 assert.equal(g.transfer(0,7),false);assert.equal(g.minions.length,4);
});
test('both levels independently redistribute workers from empty columns at random',()=>{
 for(const level of [1,2]){
  const g=new Game(17,level);g.minions=Array(2).fill(null);g.start();g.unlockedSlots=3;g.slots[0]=null;
  g.slots[1]=g.createDemand();g.slots[2]=g.createDemand();const draws=[0,.999];g.random=()=>draws.shift();
  g.relocateIdleMinions();assert.equal(g.minionCountFor(1),1);assert.equal(g.minionCountFor(2),1);
  assert.equal(g.availableMinions,0);assert.equal(draws.length,0);
 }
});
test('both levels move workers off dependency-blocked work to help unfinished work',()=>{
 for(const level of [1,2]){
  const g=new Game(17,level);g.unlockedSlots=3;g.slots[1]=g.createDemand();g.random=()=>0;
  g.start();const first=g.slots[0];g.finish(first,true);assert.equal(first.state,'waiting');
  g.tick(.01);assert.equal(first.progress,100);assert.equal(g.minionCountFor(0),0);
  assert.equal(g.minionCountFor(1),3);assert.equal(g.availableMinions,2);assert.equal(g.delivered,0);
 }
});
test('workers wait only when usable positions are full and return automatically when space appears',()=>{
 for(const level of [1,2]){
  const g=opened(level,4);g.slots[0].state='task';g.slots[1].state='waiting';
  g.slots.fill(null,2);g.random=()=>0;g.start();assert.equal(g.minionCountFor(0),3);assert.equal(g.availableMinions,2);
  g.slots[1]=g.createDemand();g.relocateIdleMinions();assert.equal(g.availableMinions,0);assert.equal(g.minionCountFor(1),2);
  const positions=g.minions.map(a=>a.slot+':'+a.position);assert.equal(new Set(positions).size,5);
 }
});
test('staffed columns grow concurrently and only unstaffed live work decays',()=>{
 const g=opened(1,4);g.minions=Array(2).fill(null);const draws=[0,.3];g.random=()=>draws.shift()??.99;g.start();
 g.slots[2].category=CATEGORIES[0];const before=g.slots[2].progress;
 g.tick(.5);near(g.slots[0].progress,40+48/21*.5);near(g.slots[1].progress,40+48/21*.5);
 near(g.slots[2].progress,before-7.875*.5);
});
test('admission rotation and worker mechanics match while both boards are within the WIP limit',()=>{
 const games=[opened(1,2),opened(2,2)];for(const g of games){g.start();g.tick(1);}
 const[a,b]=games;assert.equal(a.seed,b.seed);assert.deepEqual(a.minions,b.minions);
 assert.deepEqual(a.slots,b.slots);assert.deepEqual(a.stakeholders,b.stakeholders);
 assert.equal(a.nextStakeholder,b.nextStakeholder);near(a.satisfaction,b.satisfaction);
});
test('the live-task cap is the sole level-specific admission difference',()=>{
 for(const level of [1,2]){
  const g=opened(level,4);g.start();g.slots.fill(null,1);g.pending.push(g.createDemand(),g.createDemand(),g.createDemand());
  g.admitDemand();g.elapsed+=CONFIG.admissionSeconds;g.admitDemand();
  assert.equal(g.workCount,level===2?2:3);assert.equal(g.slots[1]?.state,'task');
  assert.equal(g.slots[2]?.state,level===2?undefined:'task');
 }
});
test('completion leaves queued work waiting for an explicit start',()=>{
 const g=new Game();const first=g.slots[0];first.size=1;first.progress=99;first.scopeCreepChecked=true;
 const next=g.createDemand();next.size=21;next.scopeCreepChecked=true;g.pending.push(next);g.start();g.tick(.1);
 assert.equal(g.completed,1);assert.equal(g.slots[0],first);assert.equal(g.minionCountFor(0),0);assert.equal(next.progress,40);
 g.tick(1);assert.equal(g.slots[0],null);assert.equal(g.pending[0],next);assert.equal(g.admitDemand(next.id),true);assert.equal(g.slots[0],next);assert.equal(g.minionCountFor(0),3);
});
test('coarse and fine frames preserve random staffing, crossings and outcomes',()=>{
 const games=[opened(1,3),opened(1,3)];for(const g of games){g.start();g.pending.push(g.createDemand(),g.createDemand());}
 games[0].tick(8);for(let i=0;i<800;i++)games[1].tick(.01);
 assert.equal(games[0].seed,games[1].seed);assert.deepEqual(games[0].minions,games[1].minions);
 assert.equal(games[0].completed,games[1].completed);assert.equal(games[0].delivered,games[1].delivered);
 near(games[0].satisfaction,games[1].satisfaction);
 for(let i=0;i<games[0].events.length;i++)near(games[0].events[i].time,games[1].events[i].time);
});
test('ending freezes workers and clocks and retry returns to ready with five workers',()=>{
 const g=opened();g.start();g.tick(.1);g.quit();const frozen=JSON.stringify(g);
 assert.equal(g.start(),false);assert.equal(g.transfer(0,1),false);g.tick(999);g.relocateIdleMinions();assert.equal(JSON.stringify(g),frozen);
 const retry=new Game(17,g.level);assert.equal(retry.status,'ready');assert.equal(retry.minions.length,5);assert.equal(retry.satisfaction,5);
});
