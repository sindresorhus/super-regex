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
	return {
		* [Symbol.iterator]() {
			try {
				const matches = string.matchAll(regex); // The regex is only executed when iterated over.
				const nextMatch = functionTimeout(() => matches.next(), {timeout}); // `matches.next` must be called within an arrow function so that it doesn't loose its context.

				while (true) {
					const {value, done} = nextMatch();

					if (done) {
						break;
					}

					yield resultToMatch(value);
				}
			} catch (error) {
				if (isTimeoutError(error)) {
					return [];
				}

				throw error;
			}
		},
	};
}
