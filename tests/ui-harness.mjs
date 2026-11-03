import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { PageSession, CONFIG, contributionRate } from '../src/game.js';
import { contributionChartData } from '../src/contribution-chart.js';

export async function app() {
  const elements = new Map(),
    clock = { now: 0 };
  const document = { hidden: false, activeElement: null };
  class Element {
    constructor() {
      this.listeners = new Map();
      this.children = [];
      this.queries = new Map();
      this.attributes = new Map();
      this.style = {};
      this.hidden = false;
      this.disabled = false;
      this.captures = new Set();
      this.writes = 0;
      this.classList = { toggle() {} };
    }
    set innerHTML(value) {
      this.html = value;
      this.writes++;
      this.children = [];
    }
    get innerHTML() {
      return this.html;
    }
    append(child) {
      this.children.push(child);
    }
    querySelector(selector) {
      if (!this.queries.has(selector)) this.queries.set(selector, new Element());
      return this.queries.get(selector);
    }
    addEventListener(type, listener) {
      const list = this.listeners.get(type) ?? [];
      list.push(listener);
      this.listeners.set(type, list);
    }
    dispatch(type, event = {}) {
      for (const listener of this.listeners.get(type) ?? []) listener({ preventDefault() {}, ...event });
    }
    setAttribute(key, value) {
      this.attributes.set(key, value);
    }
    hasPointerCapture(id) {
      return this.captures.has(id);
    }
    setPointerCapture(id) {
      this.captures.add(id);
    }
    releasePointerCapture(id) {
      this.captures.delete(id);
      this.dispatch('lostpointercapture', { pointerId: id });
    }
    focus() {
      const previous = document.activeElement;
      document.activeElement = this;
      if (previous !== this) previous?.dispatch('blur');
    }
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
    }
  }
  const window = new Element();
  document.getElementById = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  document.createElement = () => new Element();
  document.addEventListener = window.addEventListener.bind(window);
  const context = vm.createContext({
    document,
    window,
    performance: { now: () => clock.now },
    requestAnimationFrame() {},
    PageSession,
    CONFIG,
    contributionRate,
    contributionChartData,
  });
  const source = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8')).replace(
    /^import .*;\r?\n/gm,
    '',
  );
  vm.runInContext(source, context);
  const application = vm.runInContext('({ game, session, controls, frame })', context);
  return {
    elements,
    clock,
    document,
    window,
    get game() {
      return application.game;
    },
    get session() {
      return application.session;
    },
    column: (index) => application.controls[index],
    button: (index) => application.controls[index].button,
    down(index, id = 1, button = 0) {
      this.button(index).dispatch('pointerdown', { pointerId: id, button });
    },
    up(id = 1) {
      window.dispatch('pointerup', { pointerId: id });
    },
    click(id) {
      elements.get(id).dispatch('click');
    },
    frame(time) {
      clock.now = time;
      application.frame(time);
    },
  };
}
