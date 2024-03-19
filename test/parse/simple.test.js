'use strict';

const { describe, expect, test } = require('@jest/globals');
const { MIME_TYPE, ParseError } = require('../../lib/conventions');
const { getTestParser } = require('../get-test-parser');
const { Document } = require('../../lib/dom');
const { DOMParser } = require("../../lib/dom-parser");

describe('parse', () => {
	test('simple', () => {
		const { errors, parser } = getTestParser();

		const actual = parser.parseFromString('<html><body title="1<2"></body></html>', 'text/html').toString();

		expect({ actual, ...(errors.length ? { errors } : undefined) }).toMatchSnapshot();
	});

	test('svg test', () => {
		const svgCase = [
			'<svg>',
			'  <metadata>...</metadata>',
			'  <defs id="defs14">',
			'  <path id="path4" d="M 68.589358,...-6.363961,-6.363964 z" />',
			'  <path id="path4" d="M 68.589358,...-6.363961,-6.363964 z" /></defs>',
			'</svg>',
		].join('\n');
		const { errors, parser } = getTestParser({ locator: {} });

		const actual = parser.parseFromString(svgCase, MIME_TYPE.XML_TEXT).toString();

		expect({ actual, ...(errors.length ? { errors } : undefined) }).toMatchSnapshot();
	});

	test('wrong closing tag', () => {
		const { errors, parser } = getTestParser({ locator: {} });

		const actual = parser
			.parseFromString(
				// TODO: xml not well formed but no warning or error, extract into different test?
				'<html><body title="1<2"><table>&lt;;test</table></body></html>',
				'text/html'
			)
			.toString();

		expect({ actual, ...(errors.length ? { errors } : undefined) }).toMatchSnapshot();
	});

	describe('invalid input', () => {
		test.each([
			['falsy string', ''],
			['object', {}],
			['number', 12345],
			['null', null],
		])('%s', (msg, testValue) => {
			const { parser } = getTestParser();

			expect(() => parser.parseFromString(testValue, MIME_TYPE.XML_TEXT)).toThrow(ParseError);
		});
	});

	describe('option for errors as text nodes', () => {

		test('malformed xml 1', () => {
			const { DOMParser } = require('../../lib/dom-parser');
			const parser = new DOMParser({ locator: true, errorsAsTextNodes: true });

			const malformed = '<root><child></><><child =</root>';

			let dom;

			expect(() => (dom = parser.parseFromString(malformed, MIME_TYPE.XML_TEXT))).not.toThrow();

			expect(dom).toMatchObject({
				documentElement: {
					nodeName: 'root',
					firstChild: {
						nodeName: 'child',
						firstChild: {
							nodeName: '#text',
							nodeValue: '</><><child =',
						},
					},
				},
			});
		});
		test('malformed xml 2', () => {
			const { DOMParser } = require('../../lib/dom-parser');
			const parser = new DOMParser({ locator: true, errorsAsTextNodes: true });

			const malformed = '<root><child></><><child =</root>';

			let dom;

			expect(() => (dom = parser.parseFromString(malformed, MIME_TYPE.XML_TEXT))).not.toThrow();

			expect(dom).toMatchObject({
				documentElement: {
					nodeName: 'root',
					firstChild: {
						nodeName: 'child',
						firstChild: {
							nodeName: '#text',
							nodeValue: '</><><child =',
						},
					},
				},
			});
		});
		test('malformed xml 3 (deadlock)', () => {
			const { DOMParser } = require('../../lib/dom-parser');
			const parser = new DOMParser({ locator: true, errorsAsTextNodes: true });

			const malformed = '<>';

			let dom;

			expect(() => (dom = parser.parseFromString(malformed, MIME_TYPE.XML_TEXT))).not.toThrow();

			expect(dom).toMatchObject({
				documentElement: null,
			});
		});
	});
});

describe('exposure', () => {
	describe('DOMImplementation', () => {
		test('should not look like a pure object on Document.implementation', () => {
			const { parser } = getTestParser();

			const doc = parser.parseFromString('<root/>', 'application/xml');

			expect(doc.implementation.constructor).not.toBe(Object);
		});
	});
	describe('Element', () => {
		test('should not look like a pure object on Document.documentElement', () => {
			const { parser } = getTestParser();

			const doc = parser.parseFromString('<root/>', 'application/xml');

			expect(doc.constructor).toBe(Document);
			expect(doc instanceof Document).toBeTruthy();
			expect(doc.documentElement.constructor).not.toBe(Object);
		});
	});
});
