import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES, recordDemands } from '../src/game.js';
import { sizeFor } from '../src/config.js';

const near = (a, b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);
function fixture(size='S', category=CATEGORIES[3], level=1) {
  const g = new Game(17,level);
  Object.assign(g.slots[0], { size, category, scopeCreepChecked:true, dependencyChecked:true });
  g.start(); return g;
}
function task(g, slot, size='S', category=CATEGORIES[3]) {
  const t = g.createDemand();
  Object.assign(t, {size, category, scopeCreepChecked:true, dependencyChecked:true, revealedAt:g.elapsed});
  g.slots[slot]=t; return t;
}

test('four unique stakeholders start at five, with five unassigned workers',()=>{
  for(const level of [1,2]) {
    const g=new Game(17,level);
    assert.equal(g.unlockedSlots,4); assert.equal(g.minions.length,5); assert.equal(g.availableMinions,5);
    assert.equal(new Set(g.stakeholders.map(p=>p.name)).size,4);
    assert.deepEqual(g.stakeholders.map(p=>p.satisfaction),[5,5,5,5]);
    assert.equal(g.satisfaction,20); assert.equal(g.workCount,1);
    assert.equal(g.slots[0].category,CATEGORIES[0]);
    assert.equal('delivered' in g,false); assert.equal('score' in g,false);
  }
});
test('size weights, durations and rewards match requested configuration',()=>{
  assert.deepEqual(CONFIG.taskSizes.map(s=>[s.size,s.chance,s.seconds,s.satisfaction,s.importantSatisfaction,s.urgentSeconds]),
    [['S',.35,10,1,1.2,5],['M',.4,15,2,2.5,10],['L',.25,20,3,4,15]]);
  assert.equal(CONFIG.taskSizes.reduce((n,s)=>n+s.chance,0),1);
  assert.throws(()=>sizeFor({size:'XL'}),RangeError);
  const counts={S:0,M:0,L:0}, total=100000, g=new Game(42);
  for(let i=0;i<total;i++) counts[g.createDemand().size]++;
  for(const s of CONFIG.taskSizes) assert.ok(Math.abs(counts[s.size]/total-s.chance)<.006);
});
for(const size of CONFIG.taskSizes) {
  test(`${size.size}: one worker finishes fresh work in exactly ${size.seconds}s`,()=>{
    const g=fixture(size.size), t=g.slots[0];g.transfer(0,0);
    g.tick(size.seconds-.01);assert.equal(t.state,'task');
    g.tick(.01);assert.equal(t.state,'completed');near(g.events[0].time,size.seconds);
    near(g.events[0].value,size.satisfaction);
    near(g.stakeholders[0].satisfaction,5-size.seconds*.1+size.satisfaction);
  });
  for(const important of [false,true]) test(`${size.size}: ${important?'important':'ordinary'} reward decays linearly only when urgent`,()=>{
    const g=fixture(size.size,CATEGORIES[important?0:1]);const t=g.slots[0];
    const base=important?size.importantSatisfaction:size.satisfaction;
    near(g.rewardFor(t),base);g.elapsed=size.urgentSeconds/2;near(g.rewardFor(t),base/2);
    g.elapsed=size.urgentSeconds;near(g.rewardFor(t),0);
    g.elapsed=100;near(g.rewardFor(t),0);
    t.category=CATEGORIES[important?2:3];near(g.rewardFor(t),base);
    g.finish(t,true);near(g.satisfactionGained,base);
    near(g.stakeholders[0].satisfaction,5+base);
  });
  test(`${size.size}: staffed urgent reward expires independently of progress`,()=>{
    const g=fixture(size.size,CATEGORIES[0]);g.transfer(0,0);g.tick(size.urgentSeconds);
    near(g.rewardFor(g.slots[0]),0);assert.ok(g.slots[0].progress>=40);
  });
}
test('two and three workers scale output to 2.1 and 3.2',()=>{
  for(const [count,output] of [[1,1],[2,2.1],[3,3.2]]) {
    const g=fixture('L');for(let w=0;w<count;w++)assert.equal(g.transfer(w,0),true);
    near(g.outputFor(0),output);g.tick(1);near(g.slots[0].progress,40+3*output);
  }
});
test('workers never move without clicks, even on empty, resolved and blocked columns',()=>{
  const g=fixture();g.tick(5);assert.deepEqual(g.minions,Array(5).fill(null));
  g.transfer(0,3);g.transfer(1,0);g.slots[0].state='waiting';g.slots[0].progress=100;
  const before=structuredClone(g.minions);g.tick(20);assert.deepEqual(g.minions,before);
  g.resolve([g.slots[0]],true);g.tick(1);assert.deepEqual(g.minions,before);
});
test('transfers are atomic, conserve workers and reject invalid or occupied destinations',()=>{
  const g=fixture();assert.equal(g.transfer(0,0,0),true);
  const before=JSON.stringify(g.minions);
  for(const args of [[-1,0,1],[5,0,1],[0,-1,0],[0,4,0],[0,1,3],[1,0,0],[.5,1,0]])
    assert.equal(g.transfer(...args),false);
  assert.equal(JSON.stringify(g.minions),before);
  assert.equal(g.transfer(0,2,2),true);assert.equal(g.minionCountFor(0),0);
  assert.deepEqual(g.minions[0],{slot:2,position:2});assert.equal(g.minions.length,5);
  g.quit();assert.equal(g.transfer(0,0,0),false);
});
for(const urgent of [false,true]) test(`unstaffed ${urgent?'urgent':'calm'} work stops at 10% without failure`,()=>{
  const g=fixture('L',CATEGORIES[urgent?1:3]);const t=g.slots[0];
  g.tick(1);near(t.progress,40-(urgent?7.875:2.25));
  g.tick(40);near(t.progress,10);assert.equal(t.state,'task');assert.equal(g.failed,0);
  g.transfer(0,0);g.tick(1);near(t.progress,13);
});
for(const level of [1,2]) test(`level ${level}: incoming work fills columns automatically, then delays FIFO`,()=>{
  const g=fixture('L',CATEGORIES[3],level);g.tick(25);
  const limit=level===1?4:2;
  assert.equal(g.workCount,limit);assert.equal(g.delayedDemands.length,6-limit);
  const delayed=g.delayedDemands[0], frozen=JSON.stringify(delayed);
  g.tick(1);assert.equal(JSON.stringify(delayed),frozen);assert.equal(delayed.revealedAt,null);
  g.slots[0].dependencyChecked=true;g.finish(g.slots[0],true);
  g.tick(.94);assert.equal(g.slots[0].state,'completed');
  g.tick(.01);const admitted=g.slots.find(t=>t?.id===delayed.id);assert.ok(admitted);
  near(admitted.revealedAt,26.95);
  const age=26.95-admitted.revealedAt;
  near(admitted.progress,Math.max(10,40-age*(admitted.category.urgent?7.875:2.25)));
  assert.ok(g.workCount<=limit);assert.equal('admitDemand' in g,false);
});
test('shared admission interval and feedback crossing resolve at exact times',()=>{
  const g=fixture();const a=g.createDemand(), b=g.createDemand();
  g.delayedDemands.push(a,b);g.allocateDemands();assert.equal(g.slots[1],a);
  g.tick(.39);assert.equal(g.slots[2],null);g.tick(.01);assert.equal(g.slots[2],b);near(b.revealedAt,.4);
});
test('delayed urgent work receives its full reward when it enters a column',()=>{
  const g=fixture();const d=g.createDemand();Object.assign(d,{size:'M',category:CATEGORIES[0]});
  g.delayedDemands.push(d);g.elapsed=50;near(g.rewardFor(d),2.5);
  g.allocateDemands();near(d.revealedAt,50);near(g.rewardFor(d),2.5);
  g.elapsed=55;near(g.rewardFor(d),1.25);
});
test('positive satisfaction can continue through the exact round end and freeze state',()=>{
  const g=fixture();g.stakeholders.forEach(p=>p.satisfaction=30);g.tick(60);assert.equal(g.status,'running');
  g.tick(200);assert.equal(g.elapsed,180);assert.equal(g.endReason,'round');
  const frozen=JSON.stringify(g);g.tick(30);g.transfer(0,1);assert.equal(JSON.stringify(g),frozen);
  for(const p of g.stakeholders)near(p.satisfaction,12);
});
test('ready, invalid ticks, voluntary stops and same-seed resets freeze/reset correctly',()=>{
  const g=new Game();const before=JSON.stringify(g);g.tick(10);assert.equal(JSON.stringify(g),before);
  g.start();for(const value of [0,-1,NaN,Infinity])g.tick(value);assert.equal(g.elapsed,0);
  g.tick(.5);g.quit();assert.equal(g.endReason,'quit');const ended=JSON.stringify(g);g.tick(10);assert.equal(JSON.stringify(g),ended);
  const reset=new Game(g.scenarioSeed);assert.equal(reset.elapsed,0);assert.equal(reset.satisfaction,20);
  assert.deepEqual(reset.minions,Array(5).fill(null));assert.deepEqual(reset.demandPlan,g.demandPlan);
});
test('immutable recorded demand and names replay across levels and outcome draws',()=>{
  const a=new Game(42,1),b=new Game(42,2);const tape=JSON.stringify(a.demandPlan);
  assert.deepEqual(a.stakeholders,b.stakeholders);assert.deepEqual(a.demandPlan,b.demandPlan);
  assert.ok(Object.isFrozen(a.demandPlan)&&Object.isFrozen(a.demandPlan[0].task));
  assert.notEqual(a.slots[0],a.demandPlan[0].task);a.start();a.transfer(0,0);a.tick(180);
  assert.equal(JSON.stringify(a.demandPlan),tape);assert.deepEqual(recordDemands(42),b.demandPlan);
  assert.notDeepEqual(recordDemands(43),b.demandPlan);
  assert.ok(a.demandPlan.every(x=>x.at<180));
  near(a.demandPlan[1].at,5);near(a.demandPlan[6].at,30);near(a.demandPlan[7].at,33.5);
});
test('completion at 180s counts; output after 180s does not',()=>{
  for(const remaining of [1,1.01]) {
    const g=fixture();g.elapsed=179;g.slots[0].progress=100-6*remaining;
    g.transfer(0,0);g.tick(2);assert.equal(g.completed,remaining===1?1:0);
    assert.equal(g.elapsed,180);assert.equal(g.endReason,'round');
  }
});
test('results are immutable satisfaction snapshots without numeric score or aggregate final satisfaction',()=>{
  const g=fixture('M',CATEGORIES[2]);g.finish(g.slots[0],true);g.tick(1);g.quit();
  const r=g.results;assert.ok(Object.isFrozen(r));near(r.satisfactionGained,2.5);
  near(r.importantSatisfactionGained,2.5);near(r.averageDeliveryRate,150);
  assert.equal(r.completed,1);assert.equal(r.liveTasks,g.workCount);assert.equal(r.delayedTasks,g.delayedDemands.length);
  for(const key of ['score','delivered','importantDelivered','satisfaction','queuedTasks'])assert.equal(key in r,false);
  const before=JSON.stringify(r);g.satisfactionGained=9;assert.equal(JSON.stringify(r),before);
});
