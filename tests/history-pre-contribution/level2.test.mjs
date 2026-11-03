import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CATEGORIES, CONFIG } from '../src/game.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function game(){const g=new Game(17,2);g.start();Object.assign(g.slots[0],{category:CATEGORIES[2],size:'S',dependencyChecked:true,scopeCreepChecked:true});return g;}
test('level 2 has exactly two physical columns and rejects worker placement elsewhere',()=>{
  const g=game();assert.equal(g.slots.length,2);assert.equal(g.feedbacks.length,2);
  assert.deepEqual(g.slotStakeholders,[0,1]);assert.deepEqual(g.waitingStakeholders,[2,3]);
  assert.equal(g.stakeholders.length,4);assert.equal(g.minions.length,5);
  assert.equal(g.transfer(0,2),false);assert.equal(g.transfer(0,3),false);
  g.tick(20);assert.equal(g.workCount,2);assert.equal(g.slots.length,2);assert.ok(g.delayedDemands.length>0);
});
test('completion rewards outgoing stakeholder, then rotates after feedback while retaining workers',()=>{
  const g=game();g.transfer(0,0);g.finish(g.slots[0],true);
  assert.equal(g.events[0].stakeholder,0);near(g.stakeholders[0].satisfaction,6.2);
  g.tick(CONFIG.feedbackSeconds);assert.deepEqual(g.slotStakeholders,[2,1]);assert.deepEqual(g.waitingStakeholders,[3,0]);
  assert.deepEqual(g.minions[0],{slot:0,position:0});assert.equal(g.stakeholderFor(0),g.stakeholders[2]);
  near(g.stakeholders[2].satisfaction,5-.095);
});
test('repeated completion cycles through waiting stakeholders without duplicates or resets',()=>{
  const g=game();const seen=[];
  for(let n=0;n<6;n++){
    if(!g.slots[0]){g.slots[0]=g.createDemand();g.slots[0].revealedAt=g.elapsed;}
    Object.assign(g.slots[0],{dependencyChecked:true,category:CATEGORIES[2],size:'S'});
    seen.push(g.slotStakeholders[0]);g.finish(g.slots[0],true);g.tick(CONFIG.feedbackSeconds);
    assert.equal(new Set([...g.slotStakeholders,...g.waitingStakeholders]).size,4);
  }
  assert.deepEqual(seen,[0,2,3,0,2,3]);assert.equal(g.slotStakeholders[1],1);
  for(const e of g.events)assert.ok([0,2,3].includes(e.stakeholder));
});
test('dependency waiting keeps owners and paired settlement rotates both exactly once',()=>{
  const g=game();const a=g.slots[0],b=g.createDemand();Object.assign(b,{size:'M',category:CATEGORIES[2],revealedAt:0,dependencyChecked:true});g.slots[1]=b;
  a.dependencyId=b.id;b.dependencyId=a.id;g.finish(a,true);assert.equal(a.state,'waiting');
  g.tick(.1);assert.deepEqual(g.slotStakeholders,[0,1]);g.finish(b,true);
  assert.deepEqual(g.events.map(e=>e.stakeholder),[0,1]);near(g.satisfactionGained,3.7);
  g.tick(CONFIG.feedbackSeconds);assert.deepEqual(g.slotStakeholders,[2,3]);assert.deepEqual(g.waitingStakeholders,[0,1]);
});
test('failure does not rotate, while level 1 retains four fixed stakeholder columns',()=>{
  const g=game();g.finish(g.slots[0],false);g.tick(1);assert.deepEqual(g.slotStakeholders,[0,1]);
  const first=new Game(17,1);first.start();first.slots[0].dependencyChecked=true;first.finish(first.slots[0],true);first.tick(1);
  assert.equal(first.slots.length,4);assert.deepEqual(first.slotStakeholders,[0,1,2,3]);
});
test('rotation with delayed admission is independent of frame sizes and replay resets owners',()=>{
  const run=step=>{const g=game();g.transfer(0,0);g.transfer(1,0);g.transfer(2,0);g.transfer(3,1);g.transfer(4,1);
    while(g.status==='running'&&g.elapsed<40-1e-9)g.tick(Math.min(step,40-g.elapsed));return g;};
  const a=run(40),b=run(.017);assert.deepEqual(a.slotStakeholders,b.slotStakeholders);assert.deepEqual(a.waitingStakeholders,b.waitingStakeholders);
  assert.deepEqual(a.events.map(e=>e.stakeholder),b.events.map(e=>e.stakeholder));near(a.satisfaction,b.satisfaction);
  assert.deepEqual(new Game(17,2).slotStakeholders,[0,1]);assert.deepEqual(a.demandPlan,new Game(17,1).demandPlan);
});
