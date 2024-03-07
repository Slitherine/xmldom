'use strict';

const fs = require('fs');
const { describe, expect, test } = require('@jest/globals');
const grammar = require('../../lib/grammar');
const alphabetical = Object.keys(grammar)
	.filter((key) => grammar[key] instanceof RegExp)
	.sort();
const Grammar = Object.keys(grammar)
	.filter((key) => grammar[key] instanceof RegExp)
	// then by the length (complexity) of the regular expression
	// shortest ones first
	.sort((a, b) => {
		const length = grammar[a].source.length - grammar[b].source.length;
		return length === 0 ? alphabetical.indexOf(a) - alphabetical.indexOf(b) : length;
	})
	.reduce((acc, key) => {
		acc[key] = grammar[key];
		return acc;
	}, {});
var REGEXP_DUMP = `'use strict';
// THIS FILE IS GENERATED by tests, don't change it manually
${Object.entries(Grammar)
	.map(
		([name, reg]) =>
			`const ${name} = /${reg.source
				// to make the test pass with all node version,
				// we need to "sync" how `/` is being serialized
				// in node v10 it serializes to just /
				// in later versions it serializes to \/
				.replace(/\\?\//g, '\\/')}/${reg.flags};`
	)
	.join('\n')}`;
describe('all grammar regular expressions', () => {
	test('should have the expected keys', () => {
		expect(Object.keys(Grammar)).toMatchSnapshot();
	});
	test('should match the file on disk', () => {
		var fileName = __dirname + '/regexp.js';
		// delete the file and rerun the test(s) to update to current value, in case you touched grammar.js
		if (!fs.existsSync(fileName)) {
			fs.writeFileSync(fileName, REGEXP_DUMP);
		}
		var content = fs.readFileSync(fileName, 'utf-8');
		// ignore git lf->crlf transforms for purpose of test on windows platform
		if (content[REGEXP_DUMP.indexOf('\n')] =='\r') {
			console.warn(`ignoring line ending mismatch`)
			content = content.replaceAll('\r\n', '\n');
		}
		expect(content).toBe(REGEXP_DUMP);
	});
});
