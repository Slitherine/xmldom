'use strict';

const { describe, expect, test } = require('@jest/globals');

const { MIME_TYPE } = require('../../lib/conventions');
const { DOMParser } = require('../../lib/dom-parser');
const { getTestParser } = require('../get-test-parser');

describe('DOMLocator', () => {
	test('empty line number', () => {
		const xml =
			// language=XML
			`<scxml xmlns="http://www.w3.org/2005/07/scxml" version="1.0"
       profile="ecmascript" id="scxmlRoot" initial="start">

  <!--
      some comment (next line is empty)

  -->

  <state id="start" name="start">
    <transition event="init" name="init" target="main_state" />
  </state>

  </scxml>`.replaceAll('\r\n', '\n'); // normalize line endings

		const doc = new DOMParser().parseFromString(xml, MIME_TYPE.XML_TEXT);

		expect(doc.getElementsByTagName('transition')[0]).toMatchObject({
			// we are not testing for columnNumber here to keep this test as specific as possible
			// it proves that empty lines are counted as lines
			// it should only fail if that changes
			lineNumber: 10,
		});
	});

	test('node positions', () => {
		const dom = new DOMParser().parseFromString(
			// language=XML
			`<?xml version="1.0"?><!-- aaa -->
<test>
  <a attr="value"><![CDATA[1]]>something
</a>x<b   /></test >`.replaceAll('\r\n', '\n'), // normalize line endings
			MIME_TYPE.XML_TEXT
		);

		expect(dom).toMatchObject({
			firstChild: {
				// <?xml version="1.0"?>
				lineNumber: 1,
				columnNumber: 1,
				starts: 0,
				ends: 21,
				nextSibling: {
					nodeName: '#comment',
					lineNumber: 1,
					columnNumber: 22,
					starts: 21,
					ends: 33,
				},
			},
			documentElement: {
				nodeName: 'test',
				lineNumber: 2,
				columnNumber: 1,
				starts: 34,
				ends: 102,
				firstChild: {
					nodeName: '#text',
					lineNumber: 2,
					columnNumber: 7,
					starts: 40,
					ends: 43,
					nextSibling: {
						nodeName: 'a',
						lineNumber: 3,
						columnNumber: 3,
						starts: 43,
						ends: 86,
						firstChild: {
							nodeName: '#cdata-section',
							lineNumber: 3,
							columnNumber: 19,
							starts: 59,
							ends: 72,
						},
						lastChild: {
							textContent: 'something\n',
							lineNumber: 3,
							columnNumber: 32,
							starts: 72,
							ends: 82,
						},
					},
				},
				lastChild: {
					nodeName: 'b',
					lineNumber: 4,
					columnNumber: 6,
					starts: 87,
					ends: 94,
					previousSibling: {
						textContent: 'x',
						lineNumber: 4,
						columnNumber: 5,
						starts: 86,
						ends: 87,
					},
				},
			},
		});
	});

	test('attribute position', () => {
		const xml = `<html><body title = "1&lt;2" data-item ="x"
data-item2= "y" data-item3 data-item4=k><table>&lt;;test</table></body></html>`;
		const { errors, parser } = getTestParser({
			locator: { systemId: 'c:/test/1.xml' },
		});

		const doc = parser.parseFromString(xml, 'text/html');

		expect({ actual: doc.toString(), ...(errors.length ? { errors } : undefined) }).toMatchSnapshot();

		let attributes = doc.documentElement.firstChild.attributes;
		const attrs = [...attributes];

		expect(attrs).toMatchObject([
			{
				lineNumber: 1,
				columnNumber: 13,
				starts: 12,
				ends: 28,
			},
			{
				lineNumber: 1,
				columnNumber: 30,
				starts: 29,
				ends: 43,
			},
			{
				lineNumber: 2,
				columnNumber: 1,
				starts: 44,
				ends: 59,
			},
			{
				lineNumber: 2,
				columnNumber: 17,
				starts: 60,
				ends: 70,
			},
			{
				lineNumber: 2,
				columnNumber: 28,
				starts: 71,
				ends: 83,
			},
		]);
	});

	test('logs error positions', () => {
		const { errors, parser } = getTestParser();

		parser.parseFromString('<root>\n\t<err</root>', 'text/html');

		expect(errors).toMatchSnapshot();
	});
});
