import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { Game, CONFIG, phaseAt, seasonAt, CATEGORIES } from '../src/game.js';
import { taskValueMultiplier } from '../src/config.js';
import { FocusAudio } from '../src/audio.js';
import { satisfactionChartData } from '../src/satisfaction-chart.js';
import * as feedback from '../src/run-feedback.js';

// Exercise the actual app listeners and model together without a DOM dependency.
// This small surface implements only the elements used by rendering/input.
async function app(saved = new Map()) {
  const elements = new Map();
  const document = { hidden: false, activeElement: null };
  const clock = { now: 0 };
  class Element {
    constructor() {
      this.listeners = new Map(); this.dataset = {}; this.attributes = new Map();
      this.children = []; this.queries = new Map(); this.className = ''; this.hidden = false;
      this.disabled = false; this.style = { setProperty() {} };
      this.classList = {
        contains: (name) => this.className.split(' ').includes(name),
        toggle: (name, on) => {
          const names = new Set(this.className.split(' '));
          if (on) names.add(name); else names.delete(name);
          this.className = [...names].join(' ');
        },
      };
    }
    set innerHTML(value) { this.html = value; this.htmlWrites = (this.htmlWrites ?? 0) + 1; }
    get innerHTML() { return this.html; }
    addEventListener(type, listener) { const listeners = this.listeners.get(type) ?? []; listeners.push(listener); this.listeners.set(type, listeners); }
    dispatch(type, event = {}) { for (const listener of this.listeners.get(type) ?? []) listener({ preventDefault() {}, ...event }); }
    append(child) { this.children.push(child); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    querySelector(selector) { if (!this.queries.has(selector)) this.queries.set(selector, new Element()); return this.queries.get(selector); }
    focus() { document.activeElement = this; }
    setPointerCapture(id) { this.captureId = id; }
    hasPointerCapture(id) { return this.captureId === id; }
    releasePointerCapture(id) { this.captureId = null; this.dispatch('lostpointercapture', { pointerId: id }); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const window = new Element();
  Object.assign(document, {
    documentElement: new Element(),
    getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); },
    createElement() { return new Element(); },
    addEventListener: window.addEventListener.bind(window),
  });
  const context = vm.createContext({
    document, window, performance: { now: () => clock.now }, requestAnimationFrame() {},
    sessionStorage: { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: (key) => saved.delete(key) },
    Game, CONFIG, CATEGORIES, taskValueMultiplier, phaseAt, seasonAt, FocusAudio, satisfactionChartData, ...feedback,
  });
  const source = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
  vm.runInContext(source, context);
  return {
    window, elements, context, saved, clock,
    get game() { return vm.runInContext('game', context); },
    slot: (index = 0) => elements.get('slots').children[index],
    key(type, key = '1', code = 'Digit1') { window.dispatch(type, { key, code }); },
  };
}

const click=(ui,slot=0,position=0,detail=1)=>vm.runInContext('workerButtons['+slot+']['+position+']',ui.context).dispatch('click',{detail});
const render=ui=>vm.runInContext('render()',ui.context);
const frame=(ui,time)=>{ui.clock.now=time;vm.runInContext('frame('+time+')',ui.context);};
const start=ui=>ui.elements.get('start').dispatch('click',{detail:1});
function addSecondTask(ui){ui.game.unlockedSlots=2;const t=ui.game.createDemand();t.size=21;t.category=CATEGORIES[2];t.scopeCreepChecked=true;ui.game.slots[1]=t;render(ui);return t;}

test('START begins a three-minute round with a fixed five-person team and three staffed positions',async()=>{
 const ui=await app();click(ui);ui.key('keydown');ui.elements.get('start').dispatch('click',{detail:0});assert.equal(ui.game.status,'ready');
 start(ui);assert.equal(ui.game.status,'running');assert.equal(ui.game.minionCountFor(0),3);assert.equal(ui.game.availableMinions,2);
 assert.equal(ui.elements.get('pool-count').textContent,'5 workers · 3 working · 2 waiting');assert.equal(ui.elements.get('elapsed').textContent,'03:00');
});
test('selecting and cancelling transfers keeps the selected worker working',async()=>{
 const ui=await app();ui.game.slots[0].size=21;start(ui);click(ui);assert.equal(vm.runInContext('selectedMinion',ui.context),0);
 const p=ui.game.slots[0].progress;frame(ui,100);assert.ok(ui.game.slots[0].progress>p);click(ui);assert.equal(vm.runInContext('selectedMinion',ui.context),null);assert.equal(ui.game.minionCountFor(0),3);
});
test('direct transfer moves one worker without pooling or changing the team size',async()=>{
 const ui=await app();start(ui);addSecondTask(ui);click(ui);click(ui,1,0);assert.equal(ui.game.minionCountFor(0),2);assert.equal(ui.game.minionCountFor(1),1);assert.equal(ui.game.minions.length,5);
});
test('input synchronizes work before transfers without retroactive output',async()=>{
 const ui=await app();ui.game.minions=Array(2).fill(null);const first=ui.game.slots[0];first.size=21;first.scopeCreepChecked=true;start(ui);const second=addSecondTask(ui);
 ui.clock.now=300;click(ui);ui.clock.now=600;click(ui,1,0);frame(ui,900);
 assert.ok(Math.abs(first.progress-(40+48/21*2.1*.6+48/21*.3))<1e-8);assert.ok(Math.abs(second.progress-(40-2.25*.6+48/21*.3))<1e-8);
});
test('worker button children remain stable across render frames and task completion',async()=>{
 const ui=await app(),control=vm.runInContext('workerButtons[0][0]',ui.context);const writes=control.htmlWrites;
 const t=ui.game.slots[0];t.size=1;t.progress=99;t.scopeCreepChecked=true;start(ui);frame(ui,200);frame(ui,400);
 assert.equal(ui.game.completed,1);assert.equal(control.htmlWrites,writes);assert.equal(ui.game.availableMinions,5);assert.equal(control.disabled,true);
});
test('three workers produce the maximum 3.2 output indicator',async()=>{
 const ui=await app();start(ui);const status=ui.slot().querySelector('.minion-status');assert.match(status.className,/max-output/);assert.equal(status.querySelector('strong').textContent,'3.2 output');assert.equal(status.querySelector('.output-meter').attributes.get('aria-valuenow'),'3.2');
});
test('waiting cards require a click to start and retain their DOM targets across frames',async()=>{
 const ui=await app();ui.game.slots[0].size=21;ui.game.slots[0].scopeCreepChecked=true;start(ui);ui.game.unlockedSlots=2;frame(ui,5000);
 assert.equal(ui.game.pending.length,1);assert.equal(ui.game.workCount,1);
 const card=vm.runInContext('backlogCards.get(game.pending[0].id)',ui.context),writes=card.element.htmlWrites;
 frame(ui,5100);assert.equal(card.element.htmlWrites,writes);assert.equal(ui.game.pending.length,1);
 card.button.dispatch('click',{detail:1});assert.equal(ui.game.pending.length,0);assert.equal(ui.game.workCount,2);assert.equal(card.element.hidden,true);assert.equal(ui.game.availableMinions,0);
});
test('keyboard-generated admission clicks cannot start queued work',async()=>{
 const ui=await app();start(ui);ui.game.unlockedSlots=2;frame(ui,5000);const card=vm.runInContext('backlogCards.get(game.pending[0].id)',ui.context);
 card.button.dispatch('click',{detail:0});assert.equal(ui.game.pending.length,1);
});
test('hidden tabs freeze round time and admission until explicit Resume',async()=>{
 const ui=await app();start(ui);frame(ui,5000);vm.runInContext('document.hidden=true',ui.context);ui.window.dispatch('visibilitychange');const frozen=JSON.stringify(ui.game);
 frame(ui,15000);assert.equal(JSON.stringify(ui.game),frozen);vm.runInContext('document.hidden=false',ui.context);ui.window.dispatch('visibilitychange');
 assert.doesNotMatch(ui.slot().querySelector('.minion-status').className,/producing/);ui.elements.get('resume').dispatch('click');frame(ui,15200);assert.ok(Math.abs(ui.game.elapsed-5.2)<1e-8);
});
test('round results show important value, honest end reason and stakeholder outcomes',async()=>{
 const ui=await app();start(ui);frame(ui,181000);assert.equal(ui.game.elapsed,180);assert.equal(ui.game.endReason,'round');assert.match(ui.elements.get('reflection').textContent,/round is complete/);
 assert.match(ui.elements.get('result-stats').innerHTML,/Important value delivered/);assert.match(ui.elements.get('result-stakeholders').innerHTML,/Satisfaction/);assert.doesNotMatch(ui.elements.get('reflection').textContent,/patience ran out/);
});
test('level changes and reloads replay the same demand plan and retain a truthful comparison',async()=>{
 const ui=await app();start(ui);frame(ui,100);ui.elements.get('quit').dispatch('click');const seed=ui.game.scenarioSeed,plan=ui.game.demandPlan;
 ui.elements.get('next-level').dispatch('click');assert.equal(ui.game.level,2);assert.equal(ui.game.scenarioSeed,seed);assert.deepEqual(ui.game.demandPlan,plan);
 start(ui);frame(ui,200);ui.elements.get('quit').dispatch('click');assert.match(ui.elements.get('level-comparison').innerHTML,/Same recorded arrival/);
 const reloaded=await app(ui.saved);assert.equal(reloaded.game.scenarioSeed,seed);assert.deepEqual(reloaded.game.demandPlan,plan);
 ui.elements.get('restart').dispatch('click');assert.equal(ui.game.status,'ready');assert.equal(ui.game.minions.length,5);assert.equal(vm.runInContext('backlogCards.size',ui.context),0);
 ui.elements.get('level-comparison').dispatch('click',{target:{closest:()=>true}});assert.equal(vm.runInContext('level1Results',ui.context),null);assert.equal(ui.saved.size,1);
});
test('baselines from the survival rules are excluded from fixed-round comparisons',async()=>{
 const old=new Game();old.start();old.tick(.1);old.quit();const saved=new Map([['multitasked-madness:level-1-results:four-columns-v7',JSON.stringify(old.results)]]);const ui=await app(saved);assert.equal(vm.runInContext('level1Results',ui.context),null);
});
