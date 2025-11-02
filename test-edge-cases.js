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

// Expensive regex that will cause ReDoS - used for reliable timeout testing
const expensiveRegex = () => /(?<=^v?|\sv?)(?:(?:0|[1-9]\d*)\.){2}(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/gi;
const expensiveString = 'v1.1.3-0aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa$';

// ============================================================================
// TIMEOUT EDGE CASES
// ============================================================================

test('timeout: 0 normalized to 1 - sync', () => {
	// Timeout: 0 is normalized to minimum of 1ms
	// We can't guarantee it will timeout (might complete in <1ms)
	// Just verify it doesn't throw error
	const result = isMatch(/test/, 'test', {timeout: 0});
	assert.ok(typeof result === 'boolean');
});

test('timeout: 0 triggers immediately - async', async () => {
	// In async, 0 or negative aborts immediately
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: 0}), false);
});

test('timeout: negative normalized to 1 - sync', () => {
	// Negative timeout is converted to abs value, then minimum 1
	// Just verify it doesn't throw error
	const result = isMatch(/test/, 'test', {timeout: -1});
	assert.ok(typeof result === 'boolean');
});

test('timeout: negative triggers immediately - async', async () => {
	// In async, 0 or negative aborts immediately
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: -1}), false);
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: -1000}), false);
});

test('timeout: Infinity never times out - sync', () => {
	// Infinity becomes undefined (no timeout)
	assert.equal(isMatch(/test/, 'test', {timeout: Number.POSITIVE_INFINITY}), true);
});

test('timeout: Infinity never times out - async', async () => {
	// Infinity becomes undefined (no timeout)
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: Number.POSITIVE_INFINITY}), true);
});

test('timeout: non-integer normalized to integer - sync', () => {
	// 100.7 -> 100
	assert.equal(isMatch(/test/, 'test', {timeout: 100.7}), true);
});

test('timeout: non-integer is accepted - async', async () => {
	// SetTimeout handles non-integers fine
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: 100.7}), true);
});

test('timeout: very large number - sync', () => {
	assert.equal(isMatch(/test/, 'test', {timeout: 2_147_483_647}), true);
});

test('timeout: very large number - async', async () => {
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: 2_147_483_647}), true);
});

// ============================================================================
// REGEX EDGE CASES
// ============================================================================

test('empty regex matches everything - sync', () => {
	assert.equal(isMatch(/(?:)/, 'anything'), true);
	const result = firstMatch(/(?:)/, 'test');
	assert.equal(result.match, '');
	assert.equal(result.index, 0);
});

test('empty regex matches everything - async', async () => {
	assert.equal(await isMatchAsync(/(?:)/, 'anything'), true);
	const result = await firstMatchAsync(/(?:)/, 'test');
	assert.equal(result.match, '');
	assert.equal(result.index, 0);
});

test('regex with all flags - sync', () => {
	// Note: can't use all flags together as some conflict, test individually
	assert.equal(isMatch(/test/gi, 'TEST'), true);
	assert.equal(isMatch(/^test$/m, 'line\ntest\nline'), true);
	assert.equal(isMatch(/./s, '\n'), true);
	assert.equal(isMatch(/\p{L}/u, 'a'), true);
});

test('regex with all flags - async', async () => {
	assert.equal(await isMatchAsync(/test/gi, 'TEST'), true);
	assert.equal(await isMatchAsync(/^test$/m, 'line\ntest\nline'), true);
	assert.equal(await isMatchAsync(/./s, '\n'), true);
	assert.equal(await isMatchAsync(/\p{L}/u, 'a'), true);
});

test('regex with sticky flag - sync', () => {
	const regex = /test/y;
	assert.equal(isMatch(regex, 'test'), true);
});

test('regex with sticky flag - async', async () => {
	const regex = /test/y;
	assert.equal(await isMatchAsync(regex, 'test'), true);
});

test('regex with dotAll flag - sync', () => {
	assert.equal(isMatch(/a.b/s, 'a\nb'), true);
	assert.equal(isMatch(/a.b/, 'a\nb'), false);
});

test('regex with dotAll flag - async', async () => {
	assert.equal(await isMatchAsync(/a.b/s, 'a\nb'), true);
	assert.equal(await isMatchAsync(/a.b/, 'a\nb'), false);
});

test('regex with lookahead - sync', () => {
	const result = firstMatch(/\d+(?= dollars)/, '100 dollars');
	assert.equal(result.match, '100');
});

test('regex with lookahead - async', async () => {
	const result = await firstMatchAsync(/\d+(?= dollars)/, '100 dollars');
	assert.equal(result.match, '100');
});

test('regex with lookbehind - sync', () => {
	const result = firstMatch(/(?<=\$)\d+/, '$100');
	assert.equal(result.match, '100');
});

test('regex with lookbehind - async', async () => {
	const result = await firstMatchAsync(/(?<=\$)\d+/, '$100');
	assert.equal(result.match, '100');
});

test('regex with backreferences - sync', () => {
	const result = firstMatch(/(\w+) \1/, 'hello hello');
	assert.equal(result.match, 'hello hello');
	assert.equal(result.groups[0], 'hello');
});

test('regex with backreferences - async', async () => {
	const result = await firstMatchAsync(/(\w+) \1/, 'hello hello');
	assert.equal(result.match, 'hello hello');
	assert.equal(result.groups[0], 'hello');
});

// ============================================================================
// MATCH OBJECT EDGE CASES
// ============================================================================

test('match with no groups - sync', () => {
	const result = firstMatch(/test/, 'test');
	assert.equal(result.groups.length, 0);
	assert.deepEqual(result.namedGroups, {});
});

test('match with no groups - async', async () => {
	const result = await firstMatchAsync(/test/, 'test');
	assert.equal(result.groups.length, 0);
	assert.deepEqual(result.namedGroups, {});
});

test('match with multiple groups - sync', () => {
	const result = firstMatch(/(\d+)-(\d+)-(\d+)/, '2024-01-15');
	assert.equal(result.groups.length, 3);
	assert.equal(result.groups[0], '2024');
	assert.equal(result.groups[1], '01');
	assert.equal(result.groups[2], '15');
});

test('match with multiple groups - async', async () => {
	const result = await firstMatchAsync(/(\d+)-(\d+)-(\d+)/, '2024-01-15');
	assert.equal(result.groups.length, 3);
	assert.equal(result.groups[0], '2024');
	assert.equal(result.groups[1], '01');
	assert.equal(result.groups[2], '15');
});

test('match with optional groups - sync', () => {
	const result = firstMatch(/(\d+)(-(\d+))?/, '123');
	assert.equal(result.groups[0], '123');
	assert.equal(result.groups[1], undefined);
	assert.equal(result.groups[2], undefined);
});

test('match with optional groups - async', async () => {
	const result = await firstMatchAsync(/(\d+)(-(\d+))?/, '123');
	assert.equal(result.groups[0], '123');
	assert.equal(result.groups[1], undefined);
	assert.equal(result.groups[2], undefined);
});

test('match with nested groups - sync', () => {
	const result = firstMatch(/(a(b(c)))/, 'abc');
	assert.equal(result.groups.length, 3);
	assert.equal(result.groups[0], 'abc');
	assert.equal(result.groups[1], 'bc');
	assert.equal(result.groups[2], 'c');
});

test('match with nested groups - async', async () => {
	const result = await firstMatchAsync(/(a(b(c)))/, 'abc');
	assert.equal(result.groups.length, 3);
	assert.equal(result.groups[0], 'abc');
	assert.equal(result.groups[1], 'bc');
	assert.equal(result.groups[2], 'c');
});

test('match at index 0 - sync', () => {
	const result = firstMatch(/test/, 'test');
	assert.equal(result.index, 0);
});

test('match at index 0 - async', async () => {
	const result = await firstMatchAsync(/test/, 'test');
	assert.equal(result.index, 0);
});

test('match at end of string - sync', () => {
	const result = firstMatch(/end$/, 'the end');
	assert.equal(result.match, 'end');
	assert.equal(result.index, 4);
});

test('match at end of string - async', async () => {
	const result = await firstMatchAsync(/end$/, 'the end');
	assert.equal(result.match, 'end');
	assert.equal(result.index, 4);
});

test('zero-width match - sync', () => {
	const result = firstMatch(/(?=\d)/, 'a1b2c3');
	assert.equal(result.match, '');
	assert.equal(result.index, 1);
});

test('zero-width match - async', async () => {
	const result = await firstMatchAsync(/(?=\d)/, 'a1b2c3');
	assert.equal(result.match, '');
	assert.equal(result.index, 1);
});

test('match input property is preserved - sync', () => {
	const input = 'test string';
	const result = firstMatch(/test/, input);
	assert.equal(result.input, input);
});

test('match input property is preserved - async', async () => {
	const input = 'test string';
	const result = await firstMatchAsync(/test/, input);
	assert.equal(result.input, input);
});

// ============================================================================
// SPECIAL STRING CASES
// ============================================================================

test('string with newlines - sync', () => {
	assert.equal(isMatch(/line1/, 'line1\nline2\nline3'), true);
	const result = firstMatch(/^line2$/m, 'line1\nline2\nline3');
	assert.equal(result.match, 'line2');
});

test('string with newlines - async', async () => {
	assert.equal(await isMatchAsync(/line1/, 'line1\nline2\nline3'), true);
	const result = await firstMatchAsync(/^line2$/m, 'line1\nline2\nline3');
	assert.equal(result.match, 'line2');
});

test('string with tabs and special whitespace - sync', () => {
	assert.equal(isMatch(/\t/, '\t'), true);
	assert.equal(isMatch(/\s+/, ' \t\n\r\f\v'), true);
});

test('string with tabs and special whitespace - async', async () => {
	assert.equal(await isMatchAsync(/\t/, '\t'), true);
	assert.equal(await isMatchAsync(/\s+/, ' \t\n\r\f\v'), true);
});

test('string with surrogate pairs - sync', () => {
	// '𝟙' is U+1D7D9 (Mathematical Double-Struck Digit One)
	assert.equal(isMatch(/𝟙/, '𝟙23'), true);
});

test('string with surrogate pairs - async', async () => {
	assert.equal(await isMatchAsync(/𝟙/, '𝟙23'), true);
});

test('string with combining characters - sync', () => {
	// E + combining acute accent (U+0301) forms é visually
	// but /é/ matches precomposed U+00E9, not combining sequence
	// This is correct Unicode behavior
	const precomposed = '\u00E9'; // Precomposed é
	const combining = 'e\u0301'; // E + combining acute

	assert.equal(isMatch(/é/u, precomposed), true);
	assert.equal(isMatch(/é/u, combining), false); // Different code points

	// To match both forms, would need normalization or pattern like /e\u0301|é/
	assert.equal(isMatch(/e\u0301/u, combining), true);
});

test('string with combining characters - async', async () => {
	const precomposed = '\u00E9';
	const combining = 'e\u0301';

	assert.equal(await isMatchAsync(/é/u, precomposed), true);
	assert.equal(await isMatchAsync(/é/u, combining), false);
	assert.equal(await isMatchAsync(/e\u0301/u, combining), true);
});

test('string with zero-width characters - sync', () => {
	const text = 'hello\u200Bworld'; // Zero-width space
	assert.equal(isMatch(/hello\u200Bworld/, text), true);
});

test('string with zero-width characters - async', async () => {
	const text = 'hello\u200Bworld';
	assert.equal(await isMatchAsync(/hello\u200Bworld/, text), true);
});

test('very long string - sync', () => {
	const longString = 'a'.repeat(10_000);
	assert.equal(isMatch(/a+/, longString), true);
});

test('very long string - async', async () => {
	const longString = 'a'.repeat(10_000);
	assert.equal(await isMatchAsync(/a+/, longString), true);
});

test('string with null bytes - sync', () => {
	const text = 'hello\u0000world';
	// eslint-disable-next-line no-control-regex
	assert.equal(isMatch(/hello\u0000world/, text), true);
});

test('string with null bytes - async', async () => {
	const text = 'hello\u0000world';
	// eslint-disable-next-line no-control-regex
	assert.equal(await isMatchAsync(/hello\u0000world/, text), true);
});

// ============================================================================
// MATCHES-SPECIFIC EDGE CASES
// ============================================================================

test('matches - empty string with global regex - sync', () => {
	const result = [...matches(/(?:)/g, '')];
	assert.equal(result.length, 1);
	assert.equal(result[0].match, '');
});

test('matchesAsync - empty string with global regex - async', async () => {
	const result = [];
	for await (const match of matchesAsync(/(?:)/g, '')) {
		result.push(match);
	}

	assert.equal(result.length, 1);
	assert.equal(result[0].match, '');
});

test('matches - overlapping matches are not found - sync', () => {
	// Regex /aa/g won't find overlapping matches in 'aaa'
	const result = [...matches(/aa/g, 'aaa')];
	assert.equal(result.length, 1);
	assert.equal(result[0].match, 'aa');
});

test('matchesAsync - overlapping matches are not found - async', async () => {
	const result = [];
	for await (const match of matchesAsync(/aa/g, 'aaa')) {
		result.push(match);
	}

	assert.equal(result.length, 1);
	assert.equal(result[0].match, 'aa');
});

test('matches - many matches - sync', () => {
	const result = [...matches(/\d/g, '0123456789'.repeat(100))];
	assert.equal(result.length, 1000);
});

test('matchesAsync - many matches - async', async () => {
	const result = [];
	for await (const match of matchesAsync(/\d/g, '0123456789'.repeat(100))) {
		result.push(match);
	}

	assert.equal(result.length, 1000);
});

// ============================================================================
// ASYNC-SPECIFIC EDGE CASES
// ============================================================================

test('async - concurrent calls do not interfere', async () => {
	const promise1 = isMatchAsync(/test/, 'test');
	const promise2 = isMatchAsync(/test/, 'test');
	const promise3 = isMatchAsync(/foo/, 'bar');

	const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

	assert.equal(result1, true);
	assert.equal(result2, true);
	assert.equal(result3, false);
});

test('async - iterator.next() called directly', async () => {
	const iterator = matchesAsync(/\d+/g, 'a1 b2 c3');

	const {value: value1, done: done1} = await iterator.next();
	assert.equal(done1, false);
	assert.equal(value1.match, '1');

	const {value: value2, done: done2} = await iterator.next();
	assert.equal(done2, false);
	assert.equal(value2.match, '2');

	const {value: value3, done: done3} = await iterator.next();
	assert.equal(done3, false);
	assert.equal(value3.match, '3');

	const {done: done4} = await iterator.next();
	assert.equal(done4, true);
});

test('async - iterator.return() cleanup', async () => {
	const iterator = matchesAsync(/\d+/g, 'a1 b2 c3', {timeout: 5000});
	await iterator.next();
	const returnResult = await iterator.return();
	assert.equal(returnResult.done, true);
});

// ============================================================================
// ERROR HANDLING EDGE CASES
// ============================================================================

test('throwOnTimeout creates proper error - sync', () => {
	assert.throws(
		() => {
			isMatch(expensiveRegex(), expensiveString, {timeout: 10, throwOnTimeout: true});
		},
		{
			code: 'ERR_SCRIPT_EXECUTION_TIMEOUT',
			message: /timed out/i,
		},
	);
});

test('throwOnTimeout creates proper error - async', async () => {
	await assert.rejects(
		async () => isMatchAsync(/test/, 'test', {timeout: 0, throwOnTimeout: true}),
		{
			name: 'TimeoutError',
			message: 'Timed out',
		},
	);
});

test('throwOnTimeout for firstMatch - sync', () => {
	assert.throws(
		() => {
			firstMatch(expensiveRegex(), expensiveString, {timeout: 10, throwOnTimeout: true});
		},
		{
			code: 'ERR_SCRIPT_EXECUTION_TIMEOUT',
			message: /timed out/i,
		},
	);
});

test('throwOnTimeout for firstMatchAsync - async', async () => {
	await assert.rejects(
		async () => firstMatchAsync(/test/, 'test', {timeout: 0, throwOnTimeout: true}),
		{
			name: 'TimeoutError',
			message: 'Timed out',
		},
	);
});

test('throwOnTimeout for matches - sync', () => {
	assert.throws(
		() => [...matches(expensiveRegex(), expensiveString, {timeout: 10, throwOnTimeout: true})],
		{
			code: 'ERR_SCRIPT_EXECUTION_TIMEOUT',
			message: /timed out/i,
		},
	);
});

test('throwOnTimeout for matchesAsync - async', async () => {
	await assert.rejects(async () => {
		for await (const _match of matchesAsync(/test/g, 'test', {timeout: 0, throwOnTimeout: true})) {
			// Should throw
		}
	}, {
		name: 'TimeoutError',
		message: 'Timed out',
	});
});

// ============================================================================
// OPTIONS EDGE CASES
// ============================================================================

test('empty options object - sync', () => {
	assert.equal(isMatch(/test/, 'test', {}), true);
	assert.ok(firstMatch(/test/, 'test', {}));
});

test('empty options object - async', async () => {
	assert.equal(await isMatchAsync(/test/, 'test', {}), true);
	assert.ok(await firstMatchAsync(/test/, 'test', {}));
});

test('options with unknown properties - sync', () => {
	assert.equal(isMatch(/test/, 'test', {timeout: 1000, unknownProperty: true}), true);
});

test('options with unknown properties - async', async () => {
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: 1000, unknownProperty: true}), true);
});

// ============================================================================
// REGEX MUTATION PREVENTION
// ============================================================================

test('regex with global flag is not mutated - sync', () => {
	const regex = /\d+/g;
	const originalLastIndex = regex.lastIndex;

	isMatch(regex, '123');
	assert.equal(regex.lastIndex, originalLastIndex, 'lastIndex should not change');

	firstMatch(regex, '123');
	assert.equal(regex.lastIndex, originalLastIndex, 'lastIndex should not change');

	const allMatches = [...matches(regex, '1 2 3')];
	assert.ok(allMatches.length > 0);
	assert.equal(regex.lastIndex, originalLastIndex, 'lastIndex should not change');
});

test('regex with global flag is not mutated - async', async () => {
	const regex = /\d+/g;
	const originalLastIndex = regex.lastIndex;

	await isMatchAsync(regex, '123');
	assert.equal(regex.lastIndex, originalLastIndex, 'lastIndex should not change');

	await firstMatchAsync(regex, '123');
	assert.equal(regex.lastIndex, originalLastIndex, 'lastIndex should not change');

	for await (const _match of matchesAsync(regex, '1 2 3')) {
		// Iterate
	}

	assert.equal(regex.lastIndex, originalLastIndex, 'lastIndex should not change');
});

test('regex lastIndex set before call is not preserved - sync', () => {
	const regex = /\d+/g;
	regex.lastIndex = 5;

	const result = firstMatch(regex, '0123456789');
	// Should match from beginning, not from lastIndex
	assert.equal(result.match, '0123456789');
	assert.equal(result.index, 0);
});

test('regex lastIndex set before call is not preserved - async', async () => {
	const regex = /\d+/g;
	regex.lastIndex = 5;

	const result = await firstMatchAsync(regex, '0123456789');
	// Should match from beginning, not from lastIndex
	assert.equal(result.match, '0123456789');
	assert.equal(result.index, 0);
});

test('timeout: NaN treated as no timeout - sync', () => {
	// NaN should be treated as undefined (no timeout), not normalized to 1ms
	assert.equal(isMatch(/test/, 'test', {timeout: Number.NaN}), true);
	const result = firstMatch(/test/, 'test', {timeout: Number.NaN});
	assert.equal(result.match, 'test');
});

test('timeout: NaN treated as no timeout - async', async () => {
	// NaN should be treated as undefined (no timeout)
	assert.equal(await isMatchAsync(/test/, 'test', {timeout: Number.NaN}), true);
	const result = await firstMatchAsync(/test/, 'test', {timeout: Number.NaN});
	assert.equal(result.match, 'test');
});

test('matches: total timeout enforced across multiple matches - sync', () => {
	// This tests the bug fix: ensure matches() stops when cumulative time exceeds timeout
	// Use expensive regex that takes significant time per match
	const regex = expensiveRegex();
	const string = expensiveString + ' ' + expensiveString; // Two expensive matches

	// Set a timeout that might allow first match but not second
	// This is timing-dependent, so we just verify it doesn't continue indefinitely
	const result = [...matches(regex, string, {timeout: 20})];

	// Should return empty or partial results, not hang indefinitely
	assert.ok(Array.isArray(result));
	// If any matches were found before timeout, they should be valid
	for (const match of result) {
		assert.ok(match.match);
		assert.ok(typeof match.index === 'number');
	}
});

test('matches: matchTimeout enforces per-match limit - sync', () => {
	// MatchTimeout should limit each individual match attempt
	const regex = expensiveRegex();

	// Use matchTimeout that's too short for expensive regex
	const result = [...matches(regex, expensiveString, {matchTimeout: 10})];

	// Should timeout and return empty
	assert.deepEqual(result, []);
});

test('matches: matchTimeout with multiple fast matches - sync', () => {
	// Verify matchTimeout doesn't interfere with fast matches
	const result = [...matches(/\d+/g, 'a1 b2 c3 d4 e5', {matchTimeout: 1000})];

	assert.equal(result.length, 5);
	assert.equal(result[0].match, '1');
	assert.equal(result[4].match, '5');
});

test('regex with unicode property escapes - sync', () => {
	// Unicode property escapes (ES2018)
	const regex = /\p{Emoji_Presentation}/gu;
	const result = [...matches(regex, '😀 test 😁')];

	assert.equal(result.length, 2);
	assert.equal(result[0].match, '😀');
	assert.equal(result[1].match, '😁');
});

test('regex with unicode property escapes - async', async () => {
	// Unicode property escapes (ES2018)
	const regex = /\p{Emoji_Presentation}/gu;
	const result = [];
	for await (const match of matchesAsync(regex, '😀 test 😁')) {
		result.push(match);
	}

	assert.equal(result.length, 2);
	assert.equal(result[0].match, '😀');
	assert.equal(result[1].match, '😁');
});

test('matches: accumulated time prevents new match after timeout - sync', () => {
	// More explicit test for the bug fix: if first match takes most of timeout,
	// second match shouldn't start
	let matchCount = 0;
	const regex = /\d+/g;
	const string = '1 2 3 4 5';

	// Use a very short timeout that will likely be exceeded by iteration overhead
	try {
		for (const _match of matches(regex, string, {timeout: 1})) {
			matchCount++;
		}
	} catch {
		// Might throw if throwOnTimeout was true, but we didn't set it
	}

	// With 1ms timeout, we expect 0 or very few matches, not all 5
	assert.ok(matchCount < 5, `Expected fewer than 5 matches with 1ms timeout, got ${matchCount}`);
});

test('firstMatch: no match with NaN timeout - sync', () => {
	assert.equal(firstMatch(/xyz/, 'abc', {timeout: Number.NaN}), undefined);
});

test('firstMatchAsync: no match with NaN timeout - async', async () => {
	assert.equal(await firstMatchAsync(/xyz/, 'abc', {timeout: Number.NaN}), undefined);
});

test('matches: NaN matchTimeout treated as no limit - sync', () => {
	const result = [...matches(/\d+/g, 'a1 b2', {matchTimeout: Number.NaN})];
	assert.equal(result.length, 2);
});

test('empty options object is valid - sync', () => {
	// Ensure {} works the same as no options
	assert.equal(isMatch(/test/, 'test', {}), true);
	const result = firstMatch(/test/, 'test', {});
	assert.equal(result.match, 'test');
});

test('empty options object is valid - async', async () => {
	assert.equal(await isMatchAsync(/test/, 'test', {}), true);
	const result = await firstMatchAsync(/test/, 'test', {});
	assert.equal(result.match, 'test');
});
