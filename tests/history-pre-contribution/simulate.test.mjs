import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, auditSimulations, AUDIT_STRATEGIES } from '../scripts/simulate.mjs';
import { completionPace, metricDifference, comparisonHeadline } from '../src/run-feedback.js';
import { Game, CATEGORIES } from '../src/game.js';
test('scripted policies finish both levels against matched incoming work',()=>{
  for(const seed of [1,17,42]) for(const strategy of AUDIT_STRATEGIES) {
    const a=simulate(strategy,seed,1),b=simulate(strategy,seed,2);
    assert.deepEqual(a.demandTape,b.demandTape);
    for(const run of [a,b]) {
      assert.ok(run.elapsed>0&&run.elapsed<=180);assert.ok(['round','satisfaction'].includes(run.endReason));
      if(run.endReason==='round')assert.equal(run.elapsed,180);
      else assert.ok(Math.abs(run.stakeholderSatisfaction.reduce((a,b)=>a+b,0))<1e-7);
      assert.ok(run.completed>0);assert.ok(run.liveTasks<=(run.level===2?2:4));
      assert.equal(run.stakeholderSatisfaction.length,4);assert.ok(Number.isFinite(run.satisfactionGained));
      assert.ok(run.delayedTasks>=0);
    }
  }
});
test('audit describes manual policies and reports measured satisfaction with human limitations',()=>{
  const audit=auditSimulations({seeds:2});assert.equal(audit.summaries.length,6);
  assert.match(audit.limitations.join(' '),/human/);assert.match(audit.methodology,/matched immutable/);
  for(const row of audit.summaries)assert.ok(Number.isFinite(row.meanSatisfactionGained));
});
test('feedback compares gained satisfaction per minute, without assuming a fixed reward per finish',()=>{
  const g=new Game();g.start();g.slots[0].category=CATEGORIES[2];g.slots[0].size='M';g.finish(g.slots[0],true);
  const pace=completionPace(g);assert.equal(pace.recent,15);assert.equal(pace.required,24);
  assert.match(comparisonHeadline({averageDeliveryRate:3},{averageDeliveryRate:2}),/1.0 more satisfaction\/min/);
  assert.match(metricDifference(2.01,2,'averageDeliveryRate',String),/sat\/min/);
});
