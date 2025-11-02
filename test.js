import {strict as assert} from 'node:assert';
import test from 'node:test';
import {
	isMatch,
	firstMatch,
	matches,
	isMatchAsync,
	firstMatchAsync,
	matchesAsync,
} from './index.js';

const fixtureRegex = () => /(?<=^v?|\sv?)(?:(?:0|[1-9]\d*)\.){2}(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/gi;
const fixtureString = 'v1.1.3-0aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa$';

test('isMatch - timeout', () => {
	assert.equal(isMatch(fixtureRegex(), fixtureString, {timeout: 10}), false);
});

test('isMatch - match found within timeout', () => {
	assert.equal(isMatch(fixtureRegex(), 'v1.1.3', {timeout: 10}), true);
});

test('isMatch - simple match', () => {
	assert.equal(isMatch(/^v\d+/, fixtureString, {timeout: 1000}), true);
});

test('isMatch - no timeout', () => {
	assert.equal(isMatch(/^v\d+/, fixtureString), true);
});

test('isMatch - throwOnTimeout', () => {
	assert.throws(() => {
		isMatch(fixtureRegex(), fixtureString, {timeout: 10, throwOnTimeout: true});
	});
});

test('firstMatch - timeout returns undefined', () => {
	assert.equal(firstMatch(fixtureRegex(), fixtureString, {timeout: 10}), undefined);
});

test('firstMatch - returns match object', () => {
	const result = firstMatch(fixtureRegex(), 'v1.1.3', {timeout: 10});
	assert.equal(result.match, '1.1.3');
	assert.equal(result.index, 1);
	assert.equal(result.input, 'v1.1.3');
	assert.ok(Array.isArray(result.groups));
	assert.ok(typeof result.namedGroups === 'object');
});

test('firstMatch - with global flag', () => {
	const result = firstMatch(/^v\d+/g, fixtureString, {timeout: 1000});
	assert.equal(result.match, 'v1');
	assert.equal(result.index, 0);
});

test('firstMatch - no timeout', () => {
	const result = firstMatch(/^v\d+/g, fixtureString);
	assert.equal(result.match, 'v1');
});

test('firstMatch - throwOnTimeout', () => {
	assert.throws(() => {
		firstMatch(fixtureRegex(), fixtureString, {timeout: 10, throwOnTimeout: true});
	});
});

test('matches - timeout returns empty array', () => {
	const result = [...matches(fixtureRegex(), fixtureString, {timeout: 10})];
	assert.deepEqual(result, []);
});

test('matches - returns matches', () => {
	const result = [...matches(fixtureRegex(), 'v1.1.3', {timeout: 10})];
	assert.equal(result[0].match, '1.1.3');
	assert.equal(result[0].index, 1);
	assert.equal(result[0].input, 'v1.1.3');
});

test('matches - ignores regex lastIndex', () => {
	const regex = /\d+/g;
	regex.lastIndex = 4;
	const result = [...matches(regex, 'a1b2c3')];
	assert.deepEqual(result.map(match => match.match), ['1', '2', '3']);
	assert.equal(regex.lastIndex, 4);
});

test('matches - simple match', () => {
	const result = [...matches(/^v\d+/g, fixtureString, {timeout: 1000})];
	assert.equal(result[0].match, 'v1');
});

test('matches - with matchTimeout', () => {
	const result = [...matches(/^v\d+/g, fixtureString, {timeout: 1000, matchTimeout: 1000})];
	assert.equal(result[0].match, 'v1');
});

test('matches - no timeout', () => {
	const result = [...matches(/^v\d+/g, fixtureString)];
	assert.equal(result[0].match, 'v1');
});

test('matches - throwOnTimeout', () => {
	assert.throws(() => {
		const result = [...matches(fixtureRegex(), fixtureString, {timeout: 10, throwOnTimeout: true})];
		return result;
	});
});

test('matches - throwOnTimeout when total timeout exhausted', () => {
	assert.throws(
		() => {
			const result = [...matches(/\d+/g, '123', {timeout: 0, throwOnTimeout: true})];
			return result;
		},
		{code: 'ERR_SCRIPT_EXECUTION_TIMEOUT'},
	);
});

test('matches - requires global flag', () => {
	assert.throws(() => {
		const result = [...matches(/test/, 'test')];
		return result;
	}, {message: /global flag/});
});

test('isMatchAsync - timeout', async () => {
	const result = await isMatchAsync(fixtureRegex(), fixtureString, {timeout: 10});
	assert.equal(result, false);
});

test('isMatchAsync - match found within timeout', async () => {
	const result = await isMatchAsync(fixtureRegex(), 'v1.1.3', {timeout: 1000});
	assert.equal(result, true);
});

test('isMatchAsync - simple match', async () => {
	const result = await isMatchAsync(/^v\d+/, fixtureString, {timeout: 1000});
	assert.equal(result, true);
});

test('isMatchAsync - no timeout', async () => {
	const result = await isMatchAsync(/^v\d+/, fixtureString);
	assert.equal(result, true);
});

test('isMatchAsync - throwOnTimeout', async () => {
	await assert.rejects(
		async () => isMatchAsync(fixtureRegex(), fixtureString, {timeout: 10, throwOnTimeout: true}),
		{name: 'TimeoutError'},
	);
});

test('firstMatchAsync - timeout returns undefined', async () => {
	const result = await firstMatchAsync(fixtureRegex(), fixtureString, {timeout: 10});
	assert.equal(result, undefined);
});

test('firstMatchAsync - returns match object', async () => {
	const result = await firstMatchAsync(fixtureRegex(), 'v1.1.3', {timeout: 1000});
	assert.equal(result.match, '1.1.3');
	assert.equal(result.index, 1);
	assert.equal(result.input, 'v1.1.3');
	assert.ok(Array.isArray(result.groups));
	assert.ok(typeof result.namedGroups === 'object');
});

test('firstMatchAsync - with global flag', async () => {
	const result = await firstMatchAsync(/^v\d+/g, fixtureString, {timeout: 1000});
	assert.equal(result.match, 'v1');
	assert.equal(result.index, 0);
});

test('firstMatchAsync - no timeout', async () => {
	const result = await firstMatchAsync(/^v\d+/g, fixtureString);
	assert.equal(result.match, 'v1');
});

test('firstMatchAsync - throwOnTimeout', async () => {
	await assert.rejects(
		async () => firstMatchAsync(fixtureRegex(), fixtureString, {timeout: 10, throwOnTimeout: true}),
		{name: 'TimeoutError'},
	);
});

test('matchesAsync - timeout returns empty iterable', async () => {
	const result = [];
	for await (const match of matchesAsync(fixtureRegex(), fixtureString, {timeout: 10})) {
		result.push(match);
	}

	assert.deepEqual(result, []);
});

test('matchesAsync - returns matches', async () => {
	const result = [];
	for await (const match of matchesAsync(fixtureRegex(), 'v1.1.3', {timeout: 1000})) {
		result.push(match);
	}

	assert.equal(result[0].match, '1.1.3');
	assert.equal(result[0].index, 1);
	assert.equal(result[0].input, 'v1.1.3');
	assert.ok(Array.isArray(result[0].groups));
	assert.ok(typeof result[0].namedGroups === 'object');
});

test('matchesAsync - simple match', async () => {
	const result = [];
	for await (const match of matchesAsync(/^v\d+/g, fixtureString, {timeout: 1000})) {
		result.push(match);
	}

	assert.equal(result[0].match, 'v1');
});

test('matchesAsync - no timeout', async () => {
	const result = [];
	for await (const match of matchesAsync(/^v\d+/g, fixtureString)) {
		result.push(match);
	}

	assert.equal(result[0].match, 'v1');
});

test('matchesAsync - throwOnTimeout', async () => {
	await assert.rejects(async () => {
		for await (const _match of matchesAsync(fixtureRegex(), fixtureString, {timeout: 10, throwOnTimeout: true})) {
			// Should throw before yielding matches
		}
	}, {name: 'TimeoutError'});
});

test('matchesAsync - requires global flag', async () => {
	await assert.rejects(async () => {
		for await (const _match of matchesAsync(/test/, 'test')) {
			// Should throw immediately
		}
	}, {message: /global flag/});
});

test('firstMatch - with named groups', () => {
	const result = firstMatch(/(?<year>\d{4})-(?<month>\d{2})/, '2024-01-15');
	assert.equal(result.match, '2024-01');
	assert.equal(result.namedGroups.year, '2024');
	assert.equal(result.namedGroups.month, '01');
	assert.equal(result.groups[0], '2024');
	assert.equal(result.groups[1], '01');
});

test('firstMatchAsync - with named groups', async () => {
	const result = await firstMatchAsync(/(?<year>\d{4})-(?<month>\d{2})/, '2024-01-15');
	assert.equal(result.match, '2024-01');
	assert.equal(result.namedGroups.year, '2024');
	assert.equal(result.namedGroups.month, '01');
	assert.equal(result.groups[0], '2024');
	assert.equal(result.groups[1], '01');
});

test('matches - with named groups', () => {
	const result = [...matches(/(?<word>\w+)/g, 'hello world')];
	assert.equal(result.length, 2);
	assert.equal(result[0].namedGroups.word, 'hello');
	assert.equal(result[1].namedGroups.word, 'world');
});

test('matchesAsync - with named groups', async () => {
	const result = [];
	for await (const match of matchesAsync(/(?<word>\w+)/g, 'hello world')) {
		result.push(match);
	}

	assert.equal(result.length, 2);
	assert.equal(result[0].namedGroups.word, 'hello');
	assert.equal(result[1].namedGroups.word, 'world');
});

test('isMatch - empty string', () => {
	assert.equal(isMatch(/test/, ''), false);
	assert.equal(isMatch(/^$/, ''), true);
});

test('isMatchAsync - empty string', async () => {
	assert.equal(await isMatchAsync(/test/, ''), false);
	assert.equal(await isMatchAsync(/^$/, ''), true);
});

test('firstMatch - no match returns undefined', () => {
	assert.equal(firstMatch(/xyz/, 'abc'), undefined);
});

test('firstMatchAsync - no match returns undefined', async () => {
	assert.equal(await firstMatchAsync(/xyz/, 'abc'), undefined);
});

test('matches - multiple matches', () => {
	const result = [...matches(/\d+/g, 'a1b22c333')];
	assert.equal(result.length, 3);
	assert.equal(result[0].match, '1');
	assert.equal(result[1].match, '22');
	assert.equal(result[2].match, '333');
});

test('matchesAsync - multiple matches', async () => {
	const result = [];
	for await (const match of matchesAsync(/\d+/g, 'a1b22c333')) {
		result.push(match);
	}

	assert.equal(result.length, 3);
	assert.equal(result[0].match, '1');
	assert.equal(result[1].match, '22');
	assert.equal(result[2].match, '333');
});

test('isMatch - unicode support', () => {
	assert.equal(isMatch(/😀/, '😀😁😂'), true);
	assert.equal(isMatch(/\p{Emoji}/u, '😀'), true);
});

test('isMatchAsync - unicode support', async () => {
	assert.equal(await isMatchAsync(/😀/, '😀😁😂'), true);
	assert.equal(await isMatchAsync(/\p{Emoji}/u, '😀'), true);
});

test('matchesAsync - early termination cleanup', async () => {
	const iterator = matchesAsync(/\d+/g, 'a1 b2 c3 d4 e5', {timeout: 10_000});
	await iterator.next(); // Get first match only
	await iterator.return(); // Explicitly close - should cleanup timeout
	// If cleanup doesn't happen, timeout stays active for 10 seconds
});

test('matchesAsync - break in loop cleanup', async () => {
	let count = 0;
	for await (const _match of matchesAsync(/\d+/g, 'a1 b2 c3 d4 e5', {timeout: 10_000})) {
		count++;
		if (count === 2) {
			break; // Early exit should trigger finally block
		}
	}

	assert.equal(count, 2);
});

test('isMatch - with case insensitive flag', () => {
	assert.equal(isMatch(/test/i, 'test'), true);
});

test('isMatchAsync - with case insensitive flag', async () => {
	assert.equal(await isMatchAsync(/test/i, 'test'), true);
});

test('firstMatch - with multiline flag', () => {
	const result = firstMatch(/^test$/m, 'hello\ntest\nworld');
	assert.equal(result.match, 'test');
});

test('firstMatchAsync - with multiline flag', async () => {
	const result = await firstMatchAsync(/^test$/m, 'hello\ntest\nworld');
	assert.equal(result.match, 'test');
});

test('matches - no matches returns empty', () => {
	const result = [...matches(/xyz/g, 'abc')];
	assert.deepEqual(result, []);
});

test('matchesAsync - no matches returns empty', async () => {
	const result = [];
	for await (const match of matchesAsync(/xyz/g, 'abc')) {
		result.push(match);
	}

	assert.deepEqual(result, []);
});
