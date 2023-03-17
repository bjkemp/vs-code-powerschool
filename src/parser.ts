/**
 * parsers.ts
 *
 * This module exports a parser object that uses Prettier to parse different types of code.
 * It defines custom parsers for the `tlist_sql` tag and uses the HTML, JavaScript, and JSON
 * parsers provided by the `prettier/parser-html` module to parse HTML, JavaScript, and JSON,
 * respectively. The `html` parser also handles the `tlist_sql` tag by extracting the SQL
 * and content within the tag and returning an array of ParsedTlistSql objects.
 *
 * This module exports the `PARSER` object, which is a map of parser names to parser functions.
 * Each parser function takes an options object and a string of code, and returns the parsed code
 * as a string or an array of ParsedTlistSql objects.
 *
 */


import { Options, resolveConfig } from 'prettier';
import { parsers as PRETTIER_HTML_PARSERS } from 'prettier/parser-html';

type ParsedTlistSql = {
  type: 'tlist_sql';
  sql: string;
  content: string;
};

type ParsedFile = string | ParsedTlistSql[];

type Parser = {
  [key: string]: (options: Options, text: string) => any;
};

const PARSER: Parser = {
  tlist_sql(this: any): ParsedTlistSql | undefined {
    const start = this.match(
      /^~\[\s*tlist_sql\s*;\s*([\s\S]*?)\s*\]\s*([\s\S]*?)\s*\[\/\s*tlist_sql\s*\]/
    );
    if (start) {
      const sql = start[1].trim();
      const content = start[2].trim();
      this.consume(content.length + 14);
      return { type: 'tlist_sql', sql, content };
    }
  },

  async html(options: Options, text: string): Promise<ParsedFile> {
    // Get the required options for the HTML parser
    const prettierOptions = await resolveConfig('./', { parser: 'html' });

    // Use the HTML parser from the `prettier/parser-html` module
    const parsedHtml = PRETTIER_HTML_PARSERS.html.parse(text, {
      ...PARSER,
      ...prettierOptions,
      ...options,
    });

    // Handle tlist_sql tag
    const parsed: ParsedTlistSql[] = [];
    let cursor = 0;
    parsedHtml.forEach((node) => {
      if (node.type === 'tlist_sql') {
        const contentStart = node.start + 14;
        const contentEnd = node.end - 14;
        const sql = text.slice(node.start + 12, contentStart).trim();
        const content = text.slice(contentStart, contentEnd).trim();
        if (contentStart > cursor) {
          parsed.push(text.slice(cursor, node.start));
        }
        parsed.push({ type: 'tlist_sql', sql, content });
        cursor = contentEnd;
      }
    });
    if (cursor < text.length) {
      parsed.push(text.slice(cursor));
    }
    return parsed;
  },

  javascript(options: Options, text: string): string {
    // Use the JavaScript parser from the `prettier/parser-html` module
    return PRETTIER_HTML_PARSERS.babel.parse(text, {
      ...PARSER,
      ...options,
    });
  },

  json(options: Options, text: string): string {
    // Use the JSON parser from the `prettier/parser-html` module
    return PRETTIER_HTML_PARSERS.json.parse(text, options);
  },
};

export default PARSER;
