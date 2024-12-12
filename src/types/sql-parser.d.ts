declare module 'sql-parser' {
    export function parse(sql: string): unknown;
    export function lexer(sql: string): unknown;
}
