import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, auditSimulations, AUDIT_STRATEGIES } from '../scripts/simulate.mjs';
test('worker policies exercise both levels through ending or an fixed three-minute round',()=>{
 for(const strategy of AUDIT_STRATEGIES)for(const level of [1,2]) {
  const r=simulate(strategy,17,level);assert.ok(r.elapsed>0&&r.elapsed<=180.00001);assert.ok(r.delivered>=0);assert.ok(Number.isFinite(r.importantDelivered));assert.ok(r.importantDelivered<=r.delivered);
  assert.ok(r.maxSlots<=4);assert.ok(r.peakWork<=(level===2?2:4));
  assert.ok(r.status==='over'||r.elapsed>=179.99);assert.equal(r.unfinished,r.pending+r.workCount);
  assert.equal(r.important<=r.completed,true);assert.ok(Number.isFinite(r.averageDeliveryRate));
 }
});
test('scripted results are repeatable without imposing an ordering between policies or levels',()=>{
 assert.deepEqual(simulate('prioritize',42,2),simulate('prioritize',42,2));
 assert.throws(()=>simulate('unknown'),RangeError);
});
test('audit reports both levels, actual paired differences, time horizons and the new capacity formula',()=>{
 const a=auditSimulations({seeds:2,maxSeconds:200});assert.equal(a.methodology.seeds,2);
 assert.equal(a.capacity.workers,5);assert.equal(a.capacity.maxWorkers,5);assert.ok(Math.abs(a.capacity.output-3.2)<1e-8);
 assert.equal(a.pairedEffects.level.length,3);assert.ok(a.limitations.some(s=>s.includes('not human')));
 for(const policy of AUDIT_STRATEGIES)for(const level of [1,2]){
  const r=a.summaries[policy][level];assert.ok(r.final.elapsed.mean>0);assert.ok(r.horizons[90].alivePercent>=0);assert.ok(Number.isFinite(r.final.importantDelivered.mean));
 }
});
