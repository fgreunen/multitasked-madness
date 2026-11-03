import test from 'node:test';
import assert from 'node:assert/strict';
import { FocusAudio } from '../src/audio.js';

test('audio initializes only on interaction, uses one voice and stops on release/mute', () => {
  let created=0, voices=0, stopped=0;
  const param={setValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};
  const context={state:'running',currentTime:0,destination:{},
    createOscillator(){voices++;return {frequency:param,connect(){},start(){},stop(){stopped++;},disconnect(){}};},
    createGain(){return {gain:param,connect(){},disconnect(){}};}};
  const audio=new FocusAudio(()=>{created++;return context;});
  audio.update(50);assert.equal(created,0);audio.unlock();audio.update(0);audio.update(100);
  assert.equal(created,1);assert.equal(voices,1);audio.update(null);assert.equal(stopped,1);
  audio.update(50);audio.setEnabled(false);assert.equal(stopped,2);audio.update(50);assert.equal(voices,2);
});
test('unavailable audio never blocks gameplay', () => {
  const audio=new FocusAudio(()=>{throw new Error('unavailable');});
  assert.doesNotThrow(()=>{audio.unlock();audio.update(20);audio.stop();});
});
