import test from 'ava';
import {isMatch, firstMatch, matches} from './index.js';

const fixtureRegex = () => /(?<=^v?|\sv?)(?:(?:0|[1-9]\d*)\.){2}(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/gi;
const fixtureString = 'v1.1.3-0aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa$';

test('isMatch', t => {
	t.false(isMatch(fixtureRegex(), fixtureString, {timeout: 10}));
	t.true(isMatch(fixtureRegex(), 'v1.1.3', {timeout: 10}));
	t.true(isMatch(/^v\d+/, fixtureString, {timeout: 1000}));
	t.true(isMatch(/^v\d+/, fixtureString));
});

test('firstMatch', t => {
	t.is(firstMatch(fixtureRegex(), fixtureString, {timeout: 10}), undefined);
	t.is(firstMatch(fixtureRegex(), 'v1.1.3', {timeout: 10}).match, '1.1.3');
	t.is(firstMatch(/^v\d+/g, fixtureString, {timeout: 1000}).match, 'v1');
	t.is(firstMatch(/^v\d+/g, fixtureString).match, 'v1');
});

test('matches', t => {
	t.deepEqual([...matches(fixtureRegex(), fixtureString, {timeout: 10})], []);
	t.is([...matches(fixtureRegex(), 'v1.1.3', {timeout: 10})][0].match, '1.1.3');
	t.is([...matches(/^v\d+/g, fixtureString, {timeout: 1000})][0].match, 'v1');
	t.is([...matches(/^v\d+/g, fixtureString)][0].match, 'v1');
});
