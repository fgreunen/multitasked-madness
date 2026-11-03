import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CONFIG,recordDemands} from '../src/game.js';

test('the five-worker roster stays fixed through every unlock, failures and retries',()=>{
 for(const level of [1,2]){const g=new Game(17,level);g.start();
  for(const total of CONFIG.slotMilestones){const t=g.slots[0]=g.createDemand();t.dependencyChecked=true;g.delivered=total-g.pointsFor(t).reward;g.finish(t,true);assert.equal(g.minions.length,5);}
  assert.equal(g.unlockedSlots,4);g.quit();assert.equal(new Game(17,level).minions.length,5);
 }
});
test('recorded arrivals, categories, sizes and labels are immutable and identical across levels',()=>{
 const a=new Game(17,1),b=new Game(17,2);assert.deepEqual(a.demandPlan,b.demandPlan);
 assert.ok(Object.isFrozen(a.demandPlan));assert.ok(a.demandPlan.every(r=>Object.isFrozen(r.task)));
 assert.notDeepEqual(recordDemands(18),a.demandPlan);
 a.start();b.start();a.tick(45);for(let i=0;i<450;i++){b.random();b.tick(.1);}
 assert.deepEqual(a.pending,b.pending);assert.equal(a.arrivalIndex,b.arrivalIndex);
});
test('a chosen later task can start while older work waits unchanged',()=>{
 const g=new Game();g.start();g.unlockedSlots=2;g.tick(10);
 const older=g.pending[0],chosen=g.pending[1],snapshot=JSON.stringify(older);
 assert.equal(g.admitDemand(chosen.id),true);assert.ok(g.slots.includes(chosen));
 assert.equal(g.pending[0],older);assert.equal(JSON.stringify(older),snapshot);
 assert.equal(g.admitDemand(chosen.id),false);assert.equal(g.minions.length,5);
});
test('round end is exact across coarse and uneven frames, with no output after the boundary',()=>{
 for(const level of[1,2]){const games=[new Game(17,level),new Game(17,level)];games.forEach(g=>g.start());
  games[0].tick(999);for(const t of[.13,20.4,70.01,100])games[1].tick(t);
  for(const g of games){assert.equal(g.elapsed,180);assert.equal(g.endReason,'round');assert.equal(g.minions.length,5);const frozen=JSON.stringify(g);g.tick(100);assert.equal(JSON.stringify(g),frozen);assert.equal(g.admitDemand(),false);}
  assert.equal(games[0].delivered,games[1].delivered);assert.deepEqual(games[0].pending,games[1].pending);
 }
});
test('waiting demand never starts itself and no replacement is invented after completion',()=>{
 const g=new Game();g.slots[0].size=1;g.start();g.tick(10);
 assert.equal(g.workCount,0);assert.ok(g.pending.length>0);assert.equal(g.completed,1);
 assert.equal(g.generated,g.arrivalIndex);assert.equal(g.slots.filter(Boolean).length,0);
});
