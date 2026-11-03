import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { Game, CONFIG, phaseAt, seasonAt, CATEGORIES } from '../src/game.js';
import { sizeFor } from '../src/config.js';
import { FocusAudio } from '../src/audio.js';
import { satisfactionChartData } from '../src/satisfaction-chart.js';
import * as feedback from '../src/run-feedback.js';

// Minimal DOM surface for executing real listeners, rendering and clock sync.
export async function app(saved = new Map()) {
  const elements = new Map(), document = { hidden:false, activeElement:null }, clock={now:0};
  class Element {
    constructor() {
      this.listeners=new Map();this.dataset={};this.attributes=new Map();this.children=[];
      this.queries=new Map();this.className='';this.hidden=false;this.disabled=false;
      this.style={setProperty(){}};
      this.classList={contains:name=>this.className.split(' ').includes(name),toggle:(name,on)=>{
        const names=new Set(this.className.split(' '));if(on)names.add(name);else names.delete(name);this.className=[...names].join(' ');
      }};
    }
    set innerHTML(value){this.html=value;this.children=[];this.htmlWrites=(this.htmlWrites??0)+1;}
    get innerHTML(){return this.html;}
    addEventListener(type,listener){const list=this.listeners.get(type)??[];list.push(listener);this.listeners.set(type,list);}
    dispatch(type,event={}){for(const listener of this.listeners.get(type)??[])listener({preventDefault(){},...event});}
    append(child){this.children.push(child);}
    setAttribute(name,value){this.attributes.set(name,value);}
    querySelector(selector){if(!this.queries.has(selector))this.queries.set(selector,new Element());return this.queries.get(selector);}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
    showModal(){this.open=true;}
    close(){this.open=false;}
  }
  const window=new Element();
  Object.assign(document,{documentElement:new Element(),
    getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},
    createElement(){return new Element();},addEventListener:window.addEventListener.bind(window)});
  const context=vm.createContext({document,window,performance:{now:()=>clock.now},requestAnimationFrame(){},
    sessionStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},
    Game,CONFIG,CATEGORIES,sizeFor,phaseAt,seasonAt,FocusAudio,satisfactionChartData,...feedback});
  const source=(await readFile(new URL('../src/app.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
  vm.runInContext(source,context);
  const run=source=>vm.runInContext(source,context);
  return {elements,window,context,saved,clock,run,get game(){return run('game');},
    slot:index=>elements.get('slots').children[index],render:()=>run('render()'),
    click(id,detail=1){elements.get(id).dispatch('click',{detail});},
    roster(worker,detail=1){run(`rosterButtons[${worker}]`).dispatch('click',{detail});},
    position(slot,position=0,detail=1){run(`workerButtons[${slot}][${position}]`).dispatch('click',{detail});},
    frame(time){clock.now=time;run(`frame(${time})`);}};
}
