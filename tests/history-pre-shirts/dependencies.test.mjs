import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CATEGORIES}from '../src/game.js';
function fixture(level=1){const g=new Game(17,level);g.unlockedSlots=3;g.slots[1]=g.createDemand();g.random=()=>0;g.start();return g;}
test('dependency detection still needs three stakeholders, an eligible partner and a strict 5% draw',()=>{
 for(const[count,draw,detected]of[[2,0,false],[3,.05,false],[3,.049,true]]){
  const g=fixture();g.unlockedSlots=count;g.random=()=>draw;g.finish(g.slots[0],true);assert.equal(g.dependencyPairs.length,detected?1:0);
 }
 const alone=new Game();alone.unlockedSlots=3;alone.start();alone.random=()=>0;alone.finish(alone.slots[0],true);assert.equal(alone.completed,1);
});
test('waiting at 100% earns nothing and workers immediately help other live work in both levels',()=>{
 for(const level of[1,2]){const g=fixture(level),t=g.slots[0];t.size=1;t.progress=99;t.scopeCreepChecked=true;
  g.slots[1].size=21;g.slots[1].category=CATEGORIES[2];g.tick(.1);
  assert.equal(t.state,'waiting');assert.equal(t.progress,100);assert.equal(g.completed,0);assert.equal(g.delivered,0);
  assert.equal(g.minionCountFor(0),0);assert.equal(g.minionCountFor(1),3);g.tick(.1);assert.equal(t.progress,100);
 }
});
test('partner completion still settles both values and satisfaction gains at one timestamp',()=>{
 const g=fixture(),[a,b]=g.slots;g.finish(a,true);b.size=1;
 const reward=g.pointsFor(a).reward+g.pointsFor(b).reward,before=g.satisfaction;
 b.progress=99;b.scopeCreepChecked=true;g.tick(.1);assert.equal(g.completed,2);assert.equal(g.delivered,reward);
 assert.ok(Math.abs(g.satisfaction-(before+2-.03))<1e-8);assert.equal(g.events[0].time,g.events[1].time);assert.equal(g.dependencyPairs.length,0);
});
test('an unstaffed partner failure fails the pair atomically without score or satisfaction penalties',()=>{
 const g=fixture(),[a,b]=g.slots;g.finish(a,true);g.minions=[];b.progress=.001;
 const before=g.satisfaction;g.tick(.01);assert.equal(g.failed,2);assert.equal(g.completed,0);assert.equal(g.delivered,0);
 assert.equal(g.events[0].time,g.events[1].time);assert.ok(Math.abs(g.satisfaction-(before-.003))<1e-7);assert.equal(g.dependencyPairs.length,0);
});
test('dependency pairs remain disjoint and cannot choose already linked or resolved work',()=>{
 const g=fixture();g.unlockedSlots=4;g.slots[2]=g.createDemand();g.slots[3]=g.createDemand();g.finish(g.slots[0],true);g.finish(g.slots[2],true);
 assert.equal(g.dependencyPairs.length,2);const ids=g.dependencyPairs.flatMap(p=>[p.task.id,p.partner.id]);assert.equal(new Set(ids).size,4);
});
test('combined delivery still unlocks milestones and updates the rolling rate after the pair',()=>{
 const g=fixture(),[a,b]=g.slots;g.finish(a,true);g.delivered=349;g.finish(b,true);
 assert.equal(g.unlockedSlots,4);assert.ok(g.peakDeliveryRate>0);assert.equal(g.completed,2);
});
test('end freezes unresolved pairs and workers without earning unfinished value',()=>{
 const g=fixture();g.finish(g.slots[0],true);g.quit();const frozen=JSON.stringify(g);g.tick(100);
 assert.equal(JSON.stringify(g),frozen);assert.equal(g.delivered,0);assert.equal(new Game(17,g.level).dependencyPairs.length,0);
});
