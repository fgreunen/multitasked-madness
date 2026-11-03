import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CATEGORIES } from '../src/game.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('unattended game ends at exact zero total satisfaction in both levels',()=>{
  for(const level of [1,2]){
    const g=new Game(17,level);g.start();g.tick(180);
    assert.equal(g.endReason,'satisfaction');near(g.elapsed,50);near(g.satisfaction,0);
    const frozen=JSON.stringify(g);g.tick(50);assert.equal(JSON.stringify(g),frozen);
  }
});
test('individual zero does not end a game whose total remains positive',()=>{
  const g=new Game();g.stakeholders[0].satisfaction=0;g.start();g.tick(1);
  assert.equal(g.status,'running');assert.ok(g.stakeholders[0].satisfaction<0);
});
test('satisfaction ending is independent of frame sizes and wins a simultaneous completion',()=>{
  for(const step of [1,.017,.13]){
    const g=new Game();g.stakeholders.forEach(p=>p.satisfaction=.1);
    Object.assign(g.slots[0],{category:CATEGORIES[2],size:'S',progress:94,scopeCreepChecked:true,dependencyChecked:true});
    g.start();g.transfer(0,0);
    while(g.status==='running')g.tick(step);
    near(g.elapsed,1);near(g.satisfaction,0);assert.equal(g.completed,0);assert.equal(g.endReason,'satisfaction');
  }
});
test('replenished satisfaction can reach the round timer, while quit keeps its reason',()=>{
  const g=new Game();g.stakeholders.forEach(p=>p.satisfaction=30);g.start();g.tick(200);
  assert.equal(g.endReason,'round');near(g.elapsed,180);
  const q=new Game();q.start();q.tick(1);q.quit();assert.equal(q.endReason,'quit');
});
