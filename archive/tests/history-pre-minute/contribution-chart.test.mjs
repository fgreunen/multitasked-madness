import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionChartData, decayArrowCount } from '../src/contribution-chart.js';

test('chart fixes the x-axis to the full round, adds a live endpoint and keeps inputs unchanged', () => {
  const history=[{time:0,contribution:0},{time:1,contribution:.05}];
  const before=JSON.stringify(history);
  const chart=contributionChartData(history,60,50);
  assert.equal(chart.maximum,50);assert.ok(chart.line.endsWith('L180.00,16.00'));
  assert.equal(JSON.stringify(history),before);assert.ok(chart.area.endsWith('L180.00,82 L12,82 Z'));
});
test('empty and idle histories have finite baseline paths; final endpoint spans the whole round', () => {
  for(const total of [0,115]){
    const chart=contributionChartData([{time:0,contribution:0}],120,total);
    assert.doesNotMatch(chart.line,/NaN|Infinity/);assert.match(chart.line,/L348.00,/);
  }
  assert.equal(contributionChartData([{time:0,contribution:0}],0,0).line,'M12.00,82.00');
});
test('decay arrows cover slow, medium and fast rates; empty columns are stationary', () => {
  assert.equal(decayArrowCount(100),1);assert.equal(decayArrowCount(80),1);
  assert.equal(decayArrowCount(50),2);assert.equal(decayArrowCount(20),3);
  assert.equal(decayArrowCount(.1),3);assert.equal(decayArrowCount(0),0);
});
