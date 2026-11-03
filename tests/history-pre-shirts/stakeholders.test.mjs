import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, CATEGORIES } from '../src/game.js';
import { setTaskSize } from './helpers.mjs';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9, actual+' != '+expected);
function outcome(game,slot,category,success,time=game.elapsed,size=13) {
  const task=game.slots[slot]=game.createDemand(); task.category=category; setTaskSize(task,size);
  game.elapsed=time; game.finish(task,success); return task;
}

test('total satisfaction starts at five, equals the individual sum and has no unlock bonus',()=>{
  for(const level of [1,2]) {
    const game=new Game(17,level);
    setTaskSize(game.slots[0],21);
    assert.equal(game.satisfaction,5); assert.equal(game.stakeholders[0].satisfaction,5);
    assert.ok(game.stakeholders.slice(1).every(person=>person.satisfaction===0));
    game.delivered=70; staff(game, 1); game.finish(game.slots[0],true);
    assert.equal(game.delivered,100); assert.equal(game.unlockedSlots,2);
    assert.equal(game.stakeholders[1].satisfaction,0); assert.equal(game.satisfaction,6);
    game.tick(1); near(game.satisfaction,5.8);
    near(game.satisfaction,game.stakeholders.slice(0,2).reduce((sum,person)=>sum+person.satisfaction,0));
  }
});

test('completion adds one satisfaction once and delivered bonuses belong to its stakeholder',()=>{
  const game=new Game(); const first=setTaskSize(game.slots[0],21); staff(game, first.id); game.finish(first,true);
  assert.equal(first.outcomeValue,30); assert.equal(game.satisfaction,6);
  game.finish(first,true); assert.equal(game.satisfaction,6);
  const low=outcome(game,0,CATEGORIES[1],true);
  assert.equal(low.outcomeValue,19); assert.equal(game.satisfaction,7); assert.equal(game.delivered,49);
  game.unlockedSlots=2;
  const other=outcome(game,1,CATEGORIES[1],true);
  assert.equal(other.outcomeValue,13); assert.equal(game.stakeholders[1].satisfaction,1);
  assert.equal(game.stakeholders[0].satisfaction,7); assert.equal(game.satisfaction,8);
});

test('failures change neither individual nor total satisfaction or delivered value',()=>{
  const game=new Game(); staff(game, 1); const task=outcome(game,0,CATEGORIES[0],false);
  assert.equal(task.outcomeValue,0); assert.equal(game.satisfaction,5); assert.equal(game.delivered,0);
  game.finish(task,false); assert.equal(game.failed,1); assert.equal(game.satisfaction,5);
});

test('an individual may be negative while the total remains positive; delivery retains its floor',()=>{
  const game=new Game(); game.unlockedSlots=2;
  game.stakeholders[0].satisfaction=-3; game.stakeholders[1].satisfaction=5;
  staff(game, 1); const failed=outcome(game,0,CATEGORIES[3],false);
  assert.equal(failed.outcomeValue,0); assert.equal(game.status,'running'); assert.equal(game.satisfaction,2);
  const completed=outcome(game,0,CATEGORIES[3],true);
  assert.equal(completed.outcomeValue,8); assert.equal(game.delivered,8);
  assert.equal(game.stakeholders[0].satisfaction,-2); assert.equal(game.satisfaction,3);
  game.stakeholders[0].satisfaction=-100; game.stakeholders[1].satisfaction=200;
  const task=game.slots[0]=game.createDemand();
  setTaskSize(task,13); task.category=CATEGORIES[3];
  assert.deepEqual(game.pointsFor(task),{bonus:-100,base:task.size*0.81,reward:1,failure:0});
});

test('delivered value includes satisfaction adjustments, remains monotonic, and alone unlocks stakeholders',()=>{
  const game=new Game(); setTaskSize(game.slots[0],21); staff(game, 1); game.delivered=69; game.finish(game.slots[0],true);
  assert.equal(game.delivered,99); assert.equal(game.unlockedSlots,1);
  outcome(game,0,CATEGORIES[1],true);
  assert.equal(game.delivered,118); assert.equal(game.satisfaction,7); assert.equal(game.unlockedSlots,2);
  outcome(game,0,CATEGORIES[0],false);
  assert.equal(game.delivered,118); assert.equal(game.satisfaction,7); assert.equal(game.unlockedSlots,2);
  const high=new Game(); setTaskSize(high.slots[0],21); high.stakeholders[0].satisfaction=50; staff(high, 1);
  high.finish(high.slots[0],true);
  assert.equal(high.delivered,75); assert.equal(high.unlockedSlots,1);
});

test('corporate names are unique and stable across tasks and same-seed retries',()=>{
  const game=new Game(42), names=game.stakeholders.map(person=>person.name);
  assert.equal(new Set(names).size,CONFIG.slots);
  assert.ok(names.every(name=>CONFIG.stakeholderNames.includes(name)));
  assert.equal(game.satisfaction,5);
  staff(game, 1); game.tick(4); staff(game, game.slots[0].id); game.tick(4);
  assert.deepEqual(game.stakeholders.map(person=>person.name),names);
  const retry=new Game(42);
  assert.deepEqual(retry.stakeholders.map(person=>person.name),names); assert.equal(retry.satisfaction,5);
  assert.notDeepEqual(new Game(99).stakeholders.map(person=>person.name),names);
});

test('independent opening-season draws approach the 10/90 importance and 90/10 urgency mix',()=>{
  const game=new Game(42); assert.equal(game.slots[0].category,CATEGORIES[0]);
  const counts=CATEGORIES.map(()=>0), sample=20000;
  for(let index=0;index<sample;index++) counts[CATEGORIES.indexOf(game.createDemand().category)]++;
  [0.09,0.81,0.01,0.09].forEach((expected,index)=>assert.ok(Math.abs(counts[index]/sample-expected)<0.01));
});

test('delivery rates count only completion value, retain the peak, and freeze on quit',()=>{
  const game=new Game(); setTaskSize(game.slots[0],21); assert.equal(game.averageDeliveryRate,0); assert.equal(game.currentDeliveryRate,0);
  staff(game, 1); game.elapsed=2; game.finish(game.slots[0],true);
  assert.equal(game.averageDeliveryRate,900); assert.equal(game.peakDeliveryRate,180);
  outcome(game,0,CATEGORIES[2],true,5,21);
  assert.equal(game.delivered,57); assert.equal(game.averageDeliveryRate,684); assert.equal(game.peakDeliveryRate,342);
  outcome(game,0,CATEGORIES[0],false,6);
  assert.equal(game.delivered,57); assert.equal(game.satisfaction,7); assert.equal(game.peakDeliveryRate,342);
  assert.equal(game.averageDeliveryRate,570);
  game.elapsed=13; assert.equal(game.currentDeliveryRate,162);
  outcome(game,0,CATEGORIES[2],true,14,21); assert.equal(game.peakDeliveryRate,342);
  game.elapsed=25; assert.equal(game.currentDeliveryRate,0); assert.equal(game.peakDeliveryRate,342);
  near(game.averageDeliveryRate,204);
  game.quit(); const snapshot=JSON.stringify(game); game.tick(100); assert.equal(JSON.stringify(game),snapshot);
  assert.equal(new Game().peakDeliveryRate,0);
});

test('history records real decay, completion jumps, unlock slope changes and the negative ending',()=>{
  const game=new Game(); assert.deepEqual(game.satisfactionHistory,[{time:0,satisfaction:5}]);
  setTaskSize(game.slots[0],21);
  staff(game, 1); game.tick(1); unstaff(game);
  near(game.satisfactionHistory.at(-1).satisfaction,4.9);
  game.delivered=99; game.finish(game.slots[0],true);
  const jump=game.satisfactionHistory.slice(-2);
  assert.equal(jump[0].time,jump[1].time); near(jump[1].satisfaction-jump[0].satisfaction,1);
  game.tick(1); near(game.satisfactionHistory.at(-1).satisfaction,5.7);
  // Isolate the decay endpoint; automatic staffing is verified separately.
  unstaff(game);
  game.tick(CONFIG.roundSeconds);
  assert.equal(game.status,'over'); assert.equal(game.endReason,'round');
  assert.ok(game.satisfaction<0); assert.equal(game.satisfactionHistory.at(-1).satisfaction,game.satisfaction);
  const snapshot=JSON.stringify(game.satisfactionHistory); game.tick(100);
  assert.equal(JSON.stringify(game.satisfactionHistory),snapshot);
  assert.ok(game.satisfactionHistory.length<100,'collinear decay samples should not fill the chart');
});
