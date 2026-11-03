import { staff, unstaff } from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import { setTaskSize } from './helpers.mjs';

test('saved level 1 results are an immutable snapshot independent of level 2 and retries',()=>{
  const first=new Game(17,1); first.slots[0].scopeCreepChecked=true;
  setTaskSize(first.slots[0]);
  staff(first, 1); first.tick(2.2); first.quit();
  const baseline=first.results;
  assert.equal(baseline.level,1); assert.equal(baseline.endReason,'quit');
  assert.equal(baseline.completed,1); assert.equal(baseline.importantCompleted,1);
  assert.equal(baseline.failed,0); assert.equal(baseline.delivered,6);
  assert.equal(baseline.satisfaction,first.satisfaction);
  assert.equal(baseline.averageDeliveryRate,first.delivered/first.elapsed*60);
  assert.equal(baseline.peakDeliveryRate,first.peakDeliveryRate);
  assert.ok(Object.isFrozen(baseline));
  const json=JSON.stringify(baseline); first.delivered=999;
  const second=new Game(17,2); staff(second, 1); second.tick(1); second.quit();
  assert.equal(second.results.level,2); assert.equal(second.results.delivered,0);
  assert.equal(JSON.stringify(baseline),json);
  assert.equal(new Game(17,1).results.delivered,0);
  assert.deepEqual(JSON.parse(json),baseline);
});

test('ready and zero-duration results have finite delivery metrics',()=>{
  for(const level of [1,2]) {
    const game=new Game(17,level); game.quit();
    assert.equal(game.results.elapsed,0); assert.equal(game.results.averageDeliveryRate,0);
    assert.equal(game.results.peakDeliveryRate,0); assert.equal(game.results.satisfaction,5);
    assert.ok(Object.values(game.results).filter(value=>typeof value==='number').every(Number.isFinite));
  }
});
