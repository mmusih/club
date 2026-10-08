import assert from 'node:assert/strict';
import {inMatchView} from '../app/fixture-view.ts';
const today='2026-10-05';
for(const [status,date,expected] of [
  ['scheduled','2026-10-05','Upcoming'], ['scheduled','2026-10-06','Upcoming'],
  ['scheduled','2026-10-04','Other matches'], ['cancelled','2026-10-06','Other matches'],
  ['postponed','2026-10-06','Other matches'], ['played','2026-10-04','Results'],
]) {
  const views=['Upcoming','Results','Other matches'].filter(view=>inMatchView({status,date},view,today));
  assert.deepEqual(views,[expected]);
}
console.log('PASS: each fixture appears in exactly one view; today, past dates, cancellations, postponements and results.');
