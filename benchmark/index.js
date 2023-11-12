import fs from 'node:fs';
import {firstMatch, matches} from '../index.js';

const string_ = fs.readFileSync('benchmark/fixture.txt', 'utf8');
const regex = /^(?:\d{2}\.){2}4\d{4}/;

// `str.matchAll` VS `matches`
const gRegex = new RegExp(regex, 'gm');

console.time('str.matchAll');
const r1 = [];
for (const match of string_.matchAll(gRegex)) {
	r1.push(match);
}

console.timeEnd('str.matchAll');

console.time('matches');
const r2 = [];
for (const match of matches(gRegex, string_)) {
	r2.push(match);
}

console.timeEnd('matches');

console.time('matches-t500');
const r3 = [];
for (const match of matches(gRegex, string_, {timeout: 500})) {
	r3.push(match);
}

console.timeEnd('matches-t500');

// `str.match` VS `firstMatch`
const rows = string_.split('\n');

console.time('str.match');
const r4 = rows
	.map(row => row.match(regex))
	.filter(match => match !== null);
console.timeEnd('str.match');

console.time('firstMatch');
const r5 = rows
	.map(row => firstMatch(regex, row))
	.filter(match => match !== undefined);
console.timeEnd('firstMatch');

console.time('firstMatch-t500');
const r6 = rows
	.map(row => firstMatch(regex, row, {timeout: 500}))
	.filter(match => match !== undefined);
console.timeEnd('firstMatch-t500');

console.log(`
	Count chars: ${string_.length}
	Count rows: ${rows.length}
	Count matches: ${r1.length} ${r2.length} ${r3.length} ${r4.length} ${r5.length} ${r6.length}
`);
