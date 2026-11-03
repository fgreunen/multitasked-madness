import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './ui-harness.mjs';
import { CATEGORIES } from '../src/config.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('START leaves five workers unassigned; clicking an empty position allocates one directly',async()=>{
  const ui=await app();ui.roster(0);assert.equal(ui.run('selectedMinion'),null);
  ui.click('start');assert.equal(ui.game.status,'running');assert.equal(ui.game.availableMinions,5);
  assert.equal(ui.run('workerButtons[0][0]').disabled,false);
  ui.position(0);assert.equal(ui.game.minionCountFor(0),1);assert.equal(ui.game.availableMinions,4);
  assert.match(ui.elements.get('pool-count').textContent,/1 working/);
});

test('direct clicks use unassigned workers only and stop when all five are placed',async()=>{
  const ui=await app();ui.click('start');
  for(const [slot,position] of [[0,0],[0,1],[0,2],[1,0],[1,1]])ui.position(slot,position);
  assert.equal(ui.game.availableMinions,0);assert.equal(ui.game.minions.length,5);
  assert.equal(ui.run('workerButtons[1][2]').disabled,true);
  const before=JSON.stringify(ui.game.minions);ui.position(1,2);assert.equal(JSON.stringify(ui.game.minions),before);
  ui.position(0,0);assert.equal(ui.run('workerButtons[1][2]').disabled,false);ui.position(1,2);
  assert.deepEqual(ui.game.minions[0],{slot:1,position:2});assert.equal(ui.game.minionCountFor(0),2);
});

test('explicitly selected worker takes priority over available unassigned workers',async()=>{
  const ui=await app();ui.click('start');ui.position(0);ui.position(0);ui.position(2);
  assert.deepEqual(ui.game.minions[0],{slot:2,position:0});assert.equal(ui.game.availableMinions,4);
  assert.equal(ui.run('selectedMinion'),null);
});
test('manual transfers, cancelling selection, prepositioning and output meters work',async()=>{
  const ui=await app();ui.click('start');ui.roster(0);ui.position(0);ui.position(0);
  assert.equal(ui.run('selectedMinion'),0);ui.position(0);assert.equal(ui.run('selectedMinion'),null);
  ui.position(0);ui.position(3);assert.equal(ui.game.minionCountFor(0),0);assert.equal(ui.game.minionCountFor(3),1);
  ui.roster(0);ui.position(0);for(const w of [1,2]){ui.roster(w);ui.position(0,w);}
  assert.match(ui.slot(0).querySelector('.minion-status').className,/max-output/);
  assert.equal(ui.slot(0).querySelector('.minion-status').querySelector('strong').textContent,'3.2 output');
});
test('roster and column button children stay connected across frames and task replacement',async()=>{
  const ui=await app(),worker=ui.run('workerButtons[0][0]'),roster=ui.run('rosterButtons[0]');
  const writes=[worker.htmlWrites,roster.htmlWrites];ui.click('start');ui.roster(0);ui.position(0);
  Object.assign(ui.game.slots[0],{size:'S',progress:99,scopeCreepChecked:true,dependencyChecked:true});
  ui.frame(200);ui.frame(1300);assert.equal(ui.game.completed,1);assert.equal(ui.game.minionCountFor(0),1);
  assert.deepEqual([worker.htmlWrites,roster.htmlWrites],writes);assert.equal(worker.disabled,false);
  ui.frame(6000);assert.equal(ui.run('workerButtons[0][0]'),worker);assert.equal(ui.run('rosterButtons[0]'),roster);
});
test('input sync prevents retroactive output on worker transfer',async()=>{
  const ui=await app();Object.assign(ui.game.slots[0],{size:'L',category:CATEGORIES[3],scopeCreepChecked:true});
  ui.click('start');ui.roster(0);ui.position(0);
  const t=ui.game.createDemand();Object.assign(t,{size:'L',category:CATEGORIES[3],scopeCreepChecked:true,revealedAt:0});ui.game.slots[1]=t;
  ui.clock.now=300;ui.position(0);ui.clock.now=600;ui.position(1);ui.frame(900);
  near(ui.game.slots[0].progress,40+3*.6-2.25*.3);near(t.progress,40-2.25*.6+3*.3);
});
test('keyboard-generated clicks cannot start, select or transfer workers',async()=>{
  const ui=await app();ui.click('start',0);assert.equal(ui.game.status,'ready');
  ui.click('start');ui.roster(0,0);assert.equal(ui.run('selectedMinion'),null);
  ui.roster(0);ui.position(0,0,0);assert.equal(ui.game.availableMinions,5);
});
test('automatic arrivals have no queue controls or score display',async()=>{
  const ui=await app();ui.click('start');ui.frame(5000);assert.equal(ui.game.workCount,2);
  assert.equal(ui.elements.has('backlog-list'),false);assert.equal(ui.elements.has('delivered'),false);
  assert.match(ui.elements.get('work-count').textContent,/2\/4 live/);
  assert.match(ui.slot(1).querySelector('.column-value').textContent,/^\+/);
});
test('hidden tabs freeze all clocks, rewards and assignments until explicit Resume; visible blur continues',async()=>{
  const ui=await app();ui.click('start');ui.roster(0);ui.position(0);ui.frame(1000);
  ui.run('document.hidden=true');ui.window.dispatch('visibilitychange');const frozen=JSON.stringify(ui.game);
  ui.frame(15000);assert.equal(JSON.stringify(ui.game),frozen);
  ui.run('document.hidden=false');ui.window.dispatch('visibilitychange');ui.frame(16000);assert.equal(JSON.stringify(ui.game),frozen);
  ui.click('resume');ui.frame(16200);near(ui.game.elapsed,1.2);
  ui.window.dispatch('blur');ui.frame(16400);near(ui.game.elapsed,1.4);
});
test('round and quit results show satisfaction gains and individual outcomes without points or aggregate final satisfaction',async()=>{
  for(const quit of [false,true]) {
    const ui=await app();if(!quit)ui.game.stakeholders.forEach(p=>p.satisfaction=30);ui.click('start');ui.frame(quit?1000:181000);if(quit)ui.click('quit');
    assert.equal(ui.game.endReason,quit?'quit':'round');assert.match(ui.elements.get('reflection').textContent,quit?/chose to stop/:/round is complete/);
    assert.match(ui.elements.get('result-stats').innerHTML,/Satisfaction gained from work/);
    assert.doesNotMatch(ui.elements.get('result-stats').innerHTML,/pts|points|Final satisfaction|Total satisfaction/i);
    assert.match(ui.elements.get('result-stakeholders').innerHTML,/Satisfaction/);
    assert.match(ui.elements.get('result-flow').textContent,/delayed/);
  }
});
test('retry, level selection and reload preserve tape and names, reset workers, retain latest baseline',async()=>{
  const ui=await app();ui.click('start');ui.roster(0);ui.position(0);ui.frame(1000);ui.click('quit');
  const seed=ui.game.scenarioSeed,tape=ui.game.demandPlan,names=ui.game.stakeholders.map(p=>p.name);
  ui.click('next-level');assert.equal(ui.game.level,2);assert.equal(ui.game.availableMinions,5);assert.equal(ui.game.satisfaction,20);
  assert.deepEqual(ui.game.demandPlan,tape);assert.deepEqual(ui.game.stakeholders.map(p=>p.name),names);
  ui.click('start');ui.frame(2000);ui.click('quit');
  const html=ui.elements.get('level-comparison').innerHTML;assert.match(html,/Same recorded arrival/);assert.match(html,/practice/);assert.doesNotMatch(html,/pts|points|Final satisfaction/);
  const reload=await app(ui.saved);assert.equal(reload.game.scenarioSeed,seed);assert.deepEqual(reload.game.demandPlan,tape);
  assert.ok(reload.run('level1Results'));ui.click('restart');assert.equal(ui.game.status,'ready');
  ui.elements.get('level-comparison').dispatch('click',{target:{closest:()=>true}});assert.equal(ui.run('level1Results'),null);assert.equal(ui.saved.size,1);
});
test('prior scoring-rule baselines are excluded',async()=>{
  const ui=await app(new Map([['multitasked-madness:level-1-results:wip-round-v8','{"scenarioSeed":17,"level":1,"elapsed":1,"endReason":"quit"}']]));
  assert.equal(ui.run('level1Results'),null);
});

test('level 2 creates only two DOM columns, rotates names and keeps worker controls connected',async()=>{
  const ui=await app();ui.click('level-2');assert.equal(ui.elements.get('slots').children.length,2);
  assert.equal(ui.run('workerButtons.length'),2);ui.click('start');ui.position(0);
  const control=ui.run('workerButtons[0][0]'), first=ui.game.slots[0];
  Object.assign(first,{category:CATEGORIES[2],size:'S',progress:99,scopeCreepChecked:true,dependencyChecked:true});
  const original=ui.game.stakeholders[0].name, incoming=ui.game.stakeholders[2].name;
  ui.frame(100);ui.frame(1200);
  assert.equal(ui.game.slotStakeholders[0],2);assert.equal(ui.game.events[0].stakeholder,0);
  assert.match(ui.slot(0).querySelector('.slot-content').innerHTML,new RegExp(incoming));
  assert.equal(ui.run('workerButtons[0][0]'),control);assert.equal(ui.game.minionCountFor(0),1);
  ui.click('quit');const html=ui.elements.get('result-stakeholders').innerHTML;
  assert.ok(html.includes(original+'</strong><span>Satisfaction'));assert.match(html,/1 delivered/);
  ui.click('restart');assert.deepEqual(ui.game.slotStakeholders,[0,1]);assert.equal(ui.elements.get('slots').children.length,2);
  ui.click('level-1');assert.equal(ui.elements.get('slots').children.length,4);
});

test('zero-satisfaction results and saved comparison report the real end reason',async()=>{
  const ui=await app();ui.click('start');ui.frame(51000);
  assert.equal(ui.game.endReason,'satisfaction');near(ui.game.elapsed,50);
  assert.match(ui.elements.get('reflection').textContent,/satisfaction reached zero/);
  assert.doesNotMatch(ui.elements.get('reflection').textContent,/round is complete/);
  const reloaded=await app(ui.saved);assert.equal(reloaded.run('level1Results.endReason'),'satisfaction');
  ui.click('next-level');ui.click('start');ui.frame(52000);ui.click('quit');
  assert.match(ui.elements.get('level-comparison').innerHTML,/total satisfaction reached zero/);
});
