import test from 'node:test';
import assert from 'node:assert/strict';
import { FocusAudio } from '../src/audio.js';
import { CATEGORIES } from '../src/config.js';

function parameter() {
  return {
    value: 0,
    setValueAtTime(value) { this.value = value; },
    setTargetAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; },
    cancelScheduledValues() {},
  };
}

function context() {
  return {
    state: 'running', currentTime: 0, destination: {}, oscillators: [], gains: [],
    createOscillator() {
      const oscillator = { frequency: parameter(), connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      this.oscillators.push(oscillator);
      return oscillator;
    },
    createGain() {
      const gain = { gain: parameter(), connect() {}, disconnect() {} };
      this.gains.push(gain);
      return gain;
    },
  };
}

test('sound is initialized only by a user gesture and unavailable audio does not break play', () => {
  let created = 0;
  const audio = new FocusAudio(() => { created++; return context(); });
  audio.update({ id: 1, progress: 40 });
  audio.complete();
  assert.equal(created, 0);
  audio.unlock();
  assert.equal(created, 1);
  const unavailable = new FocusAudio(() => { throw new Error('Unavailable'); });
  assert.doesNotThrow(() => { unavailable.unlock(); unavailable.update({ id: 1, progress: 40 }); unavailable.complete(); });
});

test('one gentle tone rises in pitch and volume with progress and stops on release', () => {
  const fake = context();
  const audio = new FocusAudio(() => fake);
  audio.unlock();
  audio.update({ id: 1, progress: 20 });
  const lowPitch = fake.oscillators[0].frequency.value;
  const lowVolume = fake.gains[0].gain.value;
  audio.update({ id: 1, progress: 80 });
  assert.equal(fake.oscillators.length, 1);
  assert.ok(fake.oscillators[0].frequency.value > lowPitch);
  assert.ok(fake.gains[0].gain.value > lowVolume);
  assert.ok(fake.gains[0].gain.value <= 0.022);
  audio.update(null);
  assert.equal(audio.voice, null);
  assert.equal(fake.oscillators[0].stopped, true);
});

test('switching tasks fades the previous tone, and muting suppresses tones and completion pops', () => {
  const fake = context();
  const audio = new FocusAudio(() => fake);
  audio.unlock();
  audio.update({ id: 1, progress: 40 });
  audio.update({ id: 2, progress: 40 });
  assert.equal(fake.oscillators[0].stopped, true);
  audio.setEnabled(false);
  const count = fake.oscillators.length;
  audio.update({ id: 2, progress: 50 });
  audio.complete();
  assert.equal(fake.oscillators.length, count);
  assert.equal(audio.voice, null);
  audio.setEnabled(true);
  audio.complete();
  assert.equal(fake.oscillators.length, count + 1);
  assert.equal(fake.oscillators.at(-1).started, true);
  assert.equal(fake.oscillators.at(-1).stopped, true);
});

test('all four categories have distinct gentle voices that rise in pitch with progress', () => {
  const signatures = new Set();
  for (const category of CATEGORIES) {
    const fake = context();
    const audio = new FocusAudio(() => fake);
    audio.unlock();
    audio.update({ id: 1, category, progress: 0 });
    const oscillator = fake.oscillators[0];
    assert.equal(oscillator.type, category.sound.wave);
    assert.equal(oscillator.frequency.value, category.sound.lowHz);
    audio.update({ id: 1, category, progress: 100 });
    assert.equal(oscillator.frequency.value, category.sound.highHz);
    assert.ok(category.sound.highHz > category.sound.lowHz);
    assert.ok(fake.gains[0].gain.value <= 0.022);
    signatures.add(`${oscillator.type}:${category.sound.lowHz}:${category.sound.highHz}`);
    audio.setEnabled(false);
    assert.equal(audio.voice, null);
    assert.equal(oscillator.stopped, true);
  }
  assert.equal(signatures.size, 4);
});


test('concurrent worker tones stay gentle and stop individually, on mute and on lifecycle stop',()=>{
 const fake=context(),audio=new FocusAudio(()=>fake); audio.unlock();
 const a={id:1,progress:50,category:CATEGORIES[0]},b={id:2,progress:70,category:CATEGORIES[2]};
 audio.updateMany([a,b]);assert.equal(audio.channels.size,2);assert.equal(fake.oscillators.length,2);
 assert.ok(fake.gains.reduce((sum,g)=>sum+g.gain.value,0)<.022);
 audio.updateMany([b]);assert.equal(fake.oscillators[0].stopped,true);assert.equal(fake.oscillators[1].stopped,undefined);
 audio.setEnabled(false);assert.equal(fake.oscillators[1].stopped,true);assert.equal(audio.channels.size,0);
 audio.setEnabled(true);audio.updateMany([a]);audio.stop();assert.equal(audio.channels.size,0);assert.equal(fake.oscillators.at(-1).stopped,true);
});
