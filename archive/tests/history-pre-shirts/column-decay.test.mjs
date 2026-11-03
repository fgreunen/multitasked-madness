import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CONFIG,CATEGORIES} from '../src/game.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9, actual+' != '+expected);

test('column decay never increases with elapsed time, demand phase, season, stakeholder count or level',()=>{
  for(const level of [1,2]) for(const elapsed of [0,30,60,100,140,170]) for(const slots of [1,2,CONFIG.slots]) {
    for(const category of [CATEGORIES[0],CATEGORIES[2]]) {
      const game=new Game(17,level); game.unlockedSlots=slots;
      game.stakeholders[0].satisfaction=100; game.elapsed=elapsed; game.nextArrivalAt=elapsed+100;
      const task=game.slots[0]; task.category=category; task.progress=80;
      staff(game, task.id); unstaff(game);
      const rate=category.urgent?7.875:2.25;
      const satisfaction=game.satisfaction;
      game.tick(0.2); near(task.progress,80-rate*0.2);
      const progress=task.progress; game.tick(0.2); near(progress-task.progress,rate*0.2);
      near(game.satisfaction,satisfaction-slots*CONFIG.satisfactionDecayPerSecond*0.4);
    }
  }
});

test('slower decay doubles untouched task lifetime and failed tasks still have no penalty',()=>{
  for(const level of [1,2]) for(const urgent of [true,false]) {
    const game=new Game(17,level); const task=game.slots[0];
    task.category=CATEGORIES.find(category=>category.urgent===urgent);
    game.nextArrivalAt=100;
    staff(game, task.id); unstaff(game);
    const beforeFailure=urgent?5.05:17.75;
    game.tick(beforeFailure); assert.equal(task.state,'task'); assert.equal(game.failed,0);
    const satisfaction=game.satisfaction; game.tick(0.05);
    assert.equal(task.state,'failed'); assert.equal(task.outcomeValue,0);
    assert.equal(game.delivered,0); near(game.satisfaction,satisfaction-0.005);
    assert.equal(game.status,'running');
  }
});
