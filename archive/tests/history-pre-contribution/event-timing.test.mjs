import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES } from '../src/game.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup() {
  const g=new Game(42);g.start();
  Object.assign(g.slots[0],{size:'S',category:CATEGORIES[2],dependencyChecked:true});
  g.transfer(0,0);return g;
}
function add(g,slot,size='S',category=CATEGORIES[2]) {
  const t=g.createDemand();Object.assign(t,{size,category,revealedAt:0,scopeCreepChecked:true,dependencyChecked:true});g.slots[slot]=t;return t;
}
test('scope creep rolls once at exact 80%, resets to 60% and preserves later output',()=>{
  const g=setup(),t=g.slots[0];let draws=0;g.random=()=>{draws++;return 0;};
  g.tick(7);near(g.scopeCreepEvents[0].time,40/6);near(t.progress,62);
  assert.equal(draws,1);assert.equal(g.minionCountFor(0),1);
  g.tick(7);assert.equal(draws,1);assert.equal(g.completed,1);near(g.events[0].time,80/6);
});
test('a failed scope roll never repeats',()=>{
  const g=setup();let draws=0;g.random=()=>{draws++;return .9;};g.tick(12);
  assert.equal(draws,1);assert.equal(g.scopeCreepEvents.length,0);assert.equal(g.completed,1);
});
test('dependency detection holds first completion without reward or relocation',()=>{
  const g=setup();g.slots[0].scopeCreepChecked=true;g.slots[0].dependencyChecked=false;
  add(g,1,'L');g.random=()=>0;g.tick(10);
  assert.equal(g.slots[0].state,'waiting');assert.equal(g.completed,0);near(g.slots[0].progress,100);
  assert.equal(g.minionCountFor(0),1);assert.equal(g.dependencyPairs.length,1);
  const satisfaction=g.stakeholders[0].satisfaction;g.tick(3);
  near(g.slots[0].progress,100);near(g.stakeholders[0].satisfaction,satisfaction-.3);
  assert.equal(g.minionCountFor(0),1);
});
for(const reverse of [false,true]) test(`dependency cohort settles simultaneously (${reverse?'reversed':'normal'} slots) with distinct rewards`,()=>{
  const g=setup();const a=g.slots[0],b=add(g,1,'M',CATEGORIES[3]);
  Object.assign(a,{scopeCreepChecked:true,progress:94,dependencyId:b.id});
  Object.assign(b,{progress:96,dependencyId:a.id});
  if(reverse)g.slots.reverse();
  g.minions.fill(null);g.transfer(0,g.slots.indexOf(a));g.transfer(1,g.slots.indexOf(b));g.tick(1);
  assert.equal(g.completed,2);assert.equal(g.dependencyPairs.length,0);near(g.satisfactionGained,3.2);
  near(g.events[0].time,1);near(g.events[1].time,1);assert.equal(a.state,'completed');assert.equal(b.state,'completed');
});
test('urgent waiting reward continues expiring until dependency settlement',()=>{
  const g=setup();const a=g.slots[0],b=add(g,1,'M');
  Object.assign(a,{category:CATEGORIES[0],state:'waiting',progress:100,dependencyId:b.id});b.dependencyId=a.id;
  g.tick(6);near(g.rewardFor(a),0);assert.equal(g.minionCountFor(0),1);
  g.finish(b,true);assert.equal(g.completed,2);near(g.satisfactionGained,2.5);
  near(g.stakeholders[0].satisfaction,4.4);near(g.stakeholders[1].satisfaction,6.9);
});
test('explicit partner failure still fails both atomically without satisfaction penalties',()=>{
  const g=setup(),a=g.slots[0],b=add(g,1);a.dependencyId=b.id;b.dependencyId=a.id;a.state='waiting';a.progress=100;
  g.finish(b,false);assert.equal(g.failed,2);near(g.satisfactionGained,0);near(g.satisfaction,20);
  assert.equal(g.dependencyPairs.length,0);assert.equal(g.minionCountFor(0),1);
});
test('coarse, fine and uneven frames resolve scope, feedback, arrivals, decay and rewards identically',()=>{
  function run(steps) {
    const g=setup();g.random=()=>0;
    const other=add(g,1,'L',CATEGORIES[0]);g.transfer(1,1);
    let i=0;while(g.elapsed<50-1e-9)g.tick(Math.min(steps[i++%steps.length],50-g.elapsed));
    return g;
  }
  const coarse=run([50]);
  for(const fine of [run([.017]),run([.13,.027,.6,1.3])]) {
    assert.equal(coarse.completed,fine.completed);near(coarse.satisfaction,fine.satisfaction);
    assert.equal(coarse.events.length,fine.events.length);
    coarse.events.forEach((e,i)=>{near(e.time,fine.events[i].time);near(e.value,fine.events[i].value);assert.equal(e.slot,fine.events[i].slot);});
    for(let slot=0;slot<4;slot++) {
      assert.equal(coarse.slots[slot]?.id,fine.slots[slot]?.id);
      if(coarse.slots[slot])near(coarse.slots[slot].progress,fine.slots[slot].progress);
    }
    assert.deepEqual(coarse.minions,fine.minions);assert.equal(coarse.delayedDemands.length,fine.delayedDemands.length);
  }
});
test('full unstaffed round does not spin at the progress floor and stays frame independent',()=>{
  const a=new Game(1),b=new Game(1);a.start();b.start();a.tick(200);
  while(b.status==='running')b.tick(.037);
  near(a.satisfaction,b.satisfaction);assert.equal(a.delayedDemands.length,b.delayedDemands.length);
  assert.deepEqual(a.slots.map(t=>t?.progress),[10,10,10,10]);
});
