import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CONFIG,CATEGORIES} from '../src/game.js';
import { setTaskSize } from './helpers.mjs';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,actual+' != '+expected);

test('all unlocked clocks run while staffed, empty or blocked; ready and stopped time are frozen',()=>{
  const game=new Game(); game.unlockedSlots=3; game.slots[0].progress=1;
  game.slots[1]=game.createDemand(); game.slots[1].state='waiting'; game.slots[1].progress=100;
  game.tick(100); assert.equal(game.satisfaction,5);
  staff(game, 1); game.tick(2);
  near(game.stakeholders[0].satisfaction,4.8);
  for(const slot of [1,2]) near(game.stakeholders[slot].satisfaction,-0.2);
  near(game.satisfaction,4.4);
  assert.ok(game.stakeholders.slice(3).every(person=>person.satisfaction===0));
  assert.equal(game.slots[1].progress,100); assert.equal(game.slots[2],null);
  game.quit(); const snapshot=JSON.stringify(game); game.tick(100); assert.equal(JSON.stringify(game),snapshot);
  assert.equal(new Game().satisfaction,5);
});

test('a new stakeholder starts at zero and their clock begins at unlocking',()=>{
  const game=new Game(); staff(game, 1); game.tick(1);
  near(game.stakeholders[0].satisfaction,4.9); assert.equal(game.stakeholders[1].satisfaction,0);
  game.delivered=99; game.finish(game.slots[0],true);
  assert.equal(game.unlockedSlots,2); near(game.satisfaction,5.9);
  assert.equal(game.stakeholders[1].satisfaction,0); assert.equal(game.slots[1],null);
  game.tick(0.5);
  near(game.stakeholders[0].satisfaction,5.85); near(game.stakeholders[1].satisfaction,-0.05);
  near(game.satisfaction,5.8); assert.equal(game.stakeholders[2].satisfaction,0);
});

test('failure counts never alter satisfaction; only completions add one',()=>{
  const games=[new Game(),new Game()];
  games.forEach(game=>{staff(game, 1);unstaff(game);});
  games[0].slots[0].category=CATEGORIES[2]; games[1].slots[0].category=CATEGORIES[0]; games[1].slots[0].progress=25;
  games.forEach(game=>game.tick(5));
  assert.equal(games[0].failed,0); assert.ok(games[1].failed>0);
  for(const game of games) near(game.satisfaction,4.5);
  const game=games[0],task=game.slots[0]; game.finish(task,true); near(game.satisfaction,5.5);
  game.finish(task,true); near(game.satisfaction,5.5); game.tick(0.5); near(game.satisfaction,5.45);
});

test('fractional stakeholder satisfaction rounds delivered value with a one-point floor; failure is zero',()=>{
  for(const bonus of [0,0.49,0.5,0.51,-0.49,-0.5,-0.51,-5.5,-100.25,100.25]) {
    for(const success of [true,false]) {
      const game=new Game(); game.unlockedSlots=2;
      game.stakeholders[0].satisfaction=bonus; game.stakeholders[1].satisfaction=200;
      const task=game.slots[0]; task.category=CATEGORIES[1];
      setTaskSize(task,13);
      const expected=success?Math.max(1,Math.round(13*0.9*1.1+bonus)):0;
      assert.equal(game.pointsFor(task)[success?'reward':'failure'],expected);
      staff(game, task.id); game.finish(task,success);
      assert.equal(game.delivered,expected); assert.equal(game.stakeholders[0].satisfaction,bonus+(success?1:0));
      assert.equal(game.satisfaction,bonus+200+(success?1:0));
      assert.ok(Number.isInteger(game.delivered)); assert.ok(game.events.every(event=>Number.isInteger(event.value)));
    }
  }
});

test('time loss and half-point rounding are independent of frame sizes',()=>{
  const games=[new Game(),new Game(),new Game()];
  for(const game of games){setTaskSize(game.slots[0],13);staff(game, 1);unstaff(game);game.slots[0].category=CATEGORIES[3];}
  games[0].tick(5); for(let frame=0;frame<300;frame++) games[1].tick(1/60);
  for(const seconds of [0.123,0.456,2.234,2.187]) games[2].tick(seconds);
  for(const game of games){
    near(game.satisfaction,4.5); const task=game.slots[0];
    assert.equal(game.pointsFor(task).reward,15); assert.equal(game.pointsFor(task).failure,0);
    game.finish(task,true); assert.equal(game.delivered,15); near(game.satisfaction,5.5);
    assert.equal(game.peakDeliveryRate,15/CONFIG.deliveryRateWindowSeconds*60);
  }
});

test('negative satisfaction stays playable until the fixed round ends',()=>{
  for(const level of [1,2]) {
    const game=new Game(17,level); staff(game, 1); unstaff(game); game.tick(50);
    assert.equal(game.satisfaction,0); assert.equal(game.status,'running'); assert.equal(game.delivered,0);
    assert.ok(game.failed>0); game.tick(CONFIG.stepSeconds);
    assert.equal(game.status,'running'); assert.ok(game.satisfaction<0);
    game.tick(CONFIG.roundSeconds);
    assert.equal(game.status,'over'); assert.equal(game.endReason,'round');
    assert.equal(game.elapsed,CONFIG.roundSeconds); assert.equal(game.minions.length,0);
  }
});
