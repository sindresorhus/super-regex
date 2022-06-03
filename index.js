import functionTimeout, {isTimeoutError} from 'function-timeout';
import cloneRegexp from 'clone-regexp'; // TODO: Use `structuredClone` instead when targeting Node.js 18.

const resultToMatch = result => ({
	match: result[0],
	index: result.index,
	groups: result.slice(1),
	namedGroups: result.groups ?? {},
	input: result.input,
});

export function isMatch(regex, string, {timeout} = {}) {
	try {
		return functionTimeout(() => cloneRegexp(regex).test(string), {timeout})();
	} catch (error) {
		if (isTimeoutError(error)) {
			return false;
		}

		throw error;
	}
}

export function firstMatch(regex, string, {timeout} = {}) {
	try {
		const result = functionTimeout(() => cloneRegexp(regex).exec(string), {timeout})();

		if (result === null) {
			return;
		}

		return resultToMatch(result);
	} catch (error) {
		if (isTimeoutError(error)) {
			return;
		}

		throw error;
	}
}

export function matches(regex, string, {timeout} = {}) {
	try {
		return functionTimeout(() => [...string.matchAll(regex)], {timeout})()
			.map(result => resultToMatch(result));
	} catch (error) {
		if (isTimeoutError(error)) {
			return [];
		}

		throw error;
	}
}
