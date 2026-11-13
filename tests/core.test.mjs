import test from 'node:test';
import assert from 'node:assert/strict';
import { convertUnit, dateDifference, discount, textStats, combineDecibels, parseDecibels, generatePassword } from '../core.mjs';
test('units: length, ping, temperature and impossible temperature', () => {
  assert.equal(convertUnit('length','km','m',2),2000);
  assert.ok(Math.abs(convertUnit('area','ping','sqm',1)-3.305785123966942)<1e-10);
  assert.ok(Math.abs(convertUnit('temperature','C','F',0)-32)<1e-8);
  assert.ok(Math.abs(convertUnit('temperature','F','C',212)-100)<1e-8);
  assert.throws(()=>convertUnit('temperature','K','C',-1),/絕對零度/);
});
test('dates: leap day, reverse order and inclusive',()=>{
  assert.deepEqual(dateDifference('2024-02-28','2024-03-01'),{signedDays:2,days:2});
  assert.deepEqual(dateDifference('2024-03-01','2024-02-28',true),{signedDays:-2,days:3});
  assert.throws(()=>dateDifference('2025-02-29','2025-03-01'),/無效日期/);
});
test('discounts: subtotal, savings and input validation',()=>{
  assert.deepEqual(discount(1000,20,2),{originalTotal:2000,saved:400,final:1600});
  assert.throws(()=>discount(100,-1,1));
  assert.throws(()=>discount(100,50,1.5));
});
test('text stats: Unicode and UTF-8',()=>{
  assert.deepEqual(textStats('中 A\n文'),{characters:5,withoutSpaces:3,lines:2,bytes:9});
  assert.equal(textStats('😀').characters,1);
});
test('noise energy addition and parsing',()=>{
  assert.ok(Math.abs(combineDecibels([60,60])-(60+10*Math.log10(2)))<1e-10);
  assert.deepEqual(parseDecibels('65, 68\n70'),[65,68,70]);
  assert.throws(()=>parseDecibels('65, abc'),/無效/);
});
test('password: structure and validation',()=>{
  const random=n=>new Uint8Array(n).fill(42);
  const pass=generatePassword(20,{lower:true,upper:true,digits:true,symbols:true},random);
  assert.equal(pass.length,20);
  assert.match(pass,/[a-z]/);
  assert.match(pass,/[A-Z]/);
  assert.match(pass,/[0-9]/);
  assert.match(pass,/[!@#$%&*_+=?\-]/);
  assert.throws(()=>generatePassword(4,{lower:true},random),/長度/);
});
