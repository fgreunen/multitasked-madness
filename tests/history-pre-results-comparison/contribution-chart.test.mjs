import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionChartData, decayArrowCount } from '../src/contribution-chart.js';

test('chart fixes the x-axis to the full round, adds a live endpoint and keeps inputs unchanged', () => {
  const history=[{time:0,contribution:0},{time:1,contribution:.05}];
  const before=JSON.stringify(history);
  const chart=contributionChartData(history,30,50);
  assert.equal(chart.maximum,50);assert.ok(chart.line.endsWith('L180.00,16.00'));
  assert.equal(JSON.stringify(history),before);assert.ok(chart.area.endsWith('L180.00,82 L12,82 Z'));
});
test('empty and idle histories have finite baseline paths; final endpoint spans the whole round', () => {
  for(const total of [0,55]){
    const chart=contributionChartData([{time:0,contribution:0}],60,total);
    assert.doesNotMatch(chart.line,/NaN|Infinity/);assert.match(chart.line,/L348.00,/);
  }
  assert.equal(contributionChartData([{time:0,contribution:0}],0,0).line,'M12.00,82.00');
});
test('constant decay uses the same arrow at every nonzero height; empty columns are stationary', () => {
  assert.equal(decayArrowCount(100),1);assert.equal(decayArrowCount(80),1);
  assert.equal(decayArrowCount(50),1);assert.equal(decayArrowCount(20),1);
  assert.equal(decayArrowCount(.1),1);assert.equal(decayArrowCount(0),0);
});
test('a completed comparison is prepopulated over the full round and shares the scale', () => {
  const comparison=[{time:0,contribution:0},{time:30,contribution:25},{time:60,contribution:55}];
  const before=JSON.stringify(comparison);
  const chart=contributionChartData([{time:0,contribution:0}],0,0,comparison);
  assert.equal(chart.maximum,60);assert.equal(chart.line,'M12.00,82.00');
  assert.equal(chart.comparisonLine,'M12.00,82.00 L180.00,54.50 L348.00,21.50');
  const overtaken=contributionChartData([{time:0,contribution:0}],30,80,comparison);
  assert.equal(overtaken.maximum,80);assert.match(overtaken.line,/L180.00,16.00$/);
  assert.match(overtaken.comparisonLine,/L348.00,36.63$/);
  assert.equal(JSON.stringify(comparison),before);
});
