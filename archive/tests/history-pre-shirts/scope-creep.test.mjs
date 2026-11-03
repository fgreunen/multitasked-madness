import {staff,unstaff} from './helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG } from '../src/game.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('scope creep rolls once per staffed task, not per worker, preserving growth past its crossing',()=>{
 const g=new Game();const t=g.slots[0];t.size=21;t.progress=79.9;g.start();
 let rolls=0;g.random=()=>{rolls++;return 0;};g.tick(.1);
 assert.equal(rolls,1);assert.equal(g.scopeCreepEvents.length,1);near(t.progress,79.9+48/21*3.2*.1-20);
 assert.equal(g.minionCountFor(0),3);assert.equal(g.delivered,0);near(g.satisfaction,4.99);
 t.progress=79.9;g.tick(.1);assert.equal(rolls,1);
});
test('an unsuccessful 10% scope roll never rerolls on re-crossing',()=>{
 const g=new Game();const t=g.slots[0];t.size=21;t.progress=79.99;staff(g,g.slots[0].id);let rolls=0;
 g.random=()=>{rolls++;return .1;};g.tick(.1);assert.equal(g.scopeCreepEvents.length,0);
 t.progress=79.99;g.tick(.1);assert.equal(rolls,1);
});
test('unstaffed work never rolls for scope creep',()=>{
 const g=new Game();staff(g,g.slots[0].id);unstaff(g);g.slots[0].progress=81;
 let rolls=0;g.random=()=>{rolls++;return 0;};g.tick(.1);assert.equal(rolls,0);assert.equal(g.slots[0].scopeCreepChecked,false);
});
test('scope and completion crossings agree across coarse, fine and uneven frames',()=>{
 const games=[new Game(),new Game(),new Game()];
 for(const g of games){g.slots[0].size=1;g.random=()=>0;staff(g,g.slots[0].id);}
 games[0].tick(1.8);for(let i=0;i<180;i++)games[1].tick(.01);for(const s of [.3,.01,.49,.2,.8])games[2].tick(s);
 for(const g of games){near(g.scopeCreepEvents[0].time,40/48);near(g.events[0].time,80/48);assert.equal(g.completed,1);near(g.satisfaction,games[0].satisfaction);}
});
test('arrival interval fills and resets with game time and freezes on ending',()=>{
 const g=new Game();staff(g,g.slots[0].id);unstaff(g);g.tick(2.5);near(g.arrivalProgress,.5);
 g.tick(2.5);near(g.arrivalProgress,0);assert.equal(g.lastArrivalAt,5);
 g.quit();const frozen=g.arrivalProgress;g.tick(99);assert.equal(g.arrivalProgress,frozen);assert.equal(new Game().arrivalProgress,0);
 assert.equal(CONFIG.scopeCreepChance,.1);
});
