import test from 'node:test';
import assert from 'node:assert/strict';
import { satisfactionChartData } from '../src/satisfaction-chart.js';

const coordinates = (path) => [...path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);

test('satisfaction charts have a finite, fixed-size zero baseline before play', () => {
  for (const history of [[], [{ time: 0, satisfaction: 0 }], [{ time: 0, satisfaction: 5 }]]) {
    const chart = satisfactionChartData(history, 0);
    assert.equal(chart.width, 240);
    assert.equal(chart.height, 90);
    assert.equal(chart.endTime, 1);
    assert.equal(chart.minSatisfaction, 0);
    assert.equal(chart.zeroY, chart.bottom);
    assert.ok(!/NaN|Infinity/.test(chart.path));
  }
});

test('the entire time and satisfaction range zoom out in the same space as the run grows', () => {
  const history = [{ time: 0, satisfaction: 0 }, { time: 5, satisfaction: 0 }, { time: 5, satisfaction: 10 }];
  const early = satisfactionChartData(history, 5);
  const later = satisfactionChartData([...history, { time: 60, satisfaction: 10 }, { time: 60, satisfaction: 100 }], 120);
  assert.equal(later.width, early.width);
  assert.equal(later.height, early.height);
  assert.equal(later.endTime, 120);
  assert.ok(later.maxSatisfaction > early.maxSatisfaction);
  assert.ok(coordinates(later.path)[2][0] < coordinates(early.path)[2][0]);
  assert.ok(coordinates(later.path)[2][1] > coordinates(early.path)[2][1]);
  assert.equal(coordinates(later.path).at(-1)[0], later.right);
  assert.deepEqual(history.at(-1), { time: 5, satisfaction: 10 });
});

test('negative satisfactions and large results remain inside chart bounds, including on the end screen', () => {
  const history = [{ time: 0, satisfaction: 0 }, { time: 10, satisfaction: 50000 }, { time: 600, satisfaction: -25 }];
  for (const dimensions of [undefined, { width: 480, height: 110 }]) {
    const chart = satisfactionChartData(history, 600, dimensions);
    assert.ok(chart.minSatisfaction < -25);
    assert.ok(chart.maxSatisfaction > 50000);
    assert.ok(chart.zeroY > chart.top && chart.zeroY < chart.bottom);
    for (const [x, y] of coordinates(chart.path)) {
      assert.ok(x >= chart.left && x <= chart.right);
      assert.ok(y >= chart.top && y <= chart.bottom);
    }
  }
});
