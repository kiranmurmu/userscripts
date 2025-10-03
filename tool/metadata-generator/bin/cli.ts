#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
import { program as prog, type OptionValues } from "commander";
import { readFile, writeFile } from "node:fs/promises";

const ExitCode = {
    "ERR_INVALID_SYNTAX": 2,
    "ERR_UNREADABLE_JSON": 3,
    "ERR_OPTION_HANDLE": 4,
    "ERR_WRITE_FILE": 5,
} as const;

type ExitCode = keyof typeof ExitCode;
type ErrorOptions = { code?: ExitCode, exitCode?: typeof ExitCode[ExitCode] };
type ThisError<T extends Error> = T & ErrorOptions;
type DefaultOptions = Readonly<{ output: string | boolean; input: string; }>;

interface ScriptHeader {
    antifeature: string;
    author: string;
    connect: string;
    copyright: string;
    defaulticon: string;
    description: string;
    downloadURL: string;
    exclude: string;
    grant: string;
    homepage: string;
    homepageURL: string;
    icon64: string;
    icon64URL: string;
    icon: string;
    iconURL: string;
    include: string;
    match: string;
    name: string;
    namespace: string;
    noframes: string;
    require: string;
    resource: string;
    "run-at": string;
    "run-in": string;
    sandbox: string;
    source: string;
    supportURL: string;
    tag: string;
    unwrap: string;
    updateURL: string;
    version: string;
    webRequest: string;
    website: string;
}

type Optional<T> = { [K in keyof T]+?: T[K]; };
type PickAsOptional<T, K extends keyof T> = { [P in K]+?: T[P]; };
type HeaderList = ["name", "namespace", "version", "description", "author", "match", "icon", "grant"];
type ExtractHeader<T> = T extends string[] ? T[number] : never;
type DefaultHeader = PickAsOptional<ScriptHeader, ExtractHeader<HeaderList>>;

async function readJson<T extends Optional<ScriptHeader>>(source: string): Promise<T> {
    const cwd = process.cwd();
    const headerData: DefaultHeader = {
        name: "New Userscript",
        namespace: "http://tampermonkey.net/",
        version: new Date().toISOString().split('T')[0],
        description: "try to take over the world!",
        author: "You",
        match: "http://*/*",
        icon: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        grant: "none"
    };

    try {
        const buffer = await readFile(path.join(cwd, source), "utf-8");
        const result: unknown = JSON.parse(buffer);

        if (isObject(result) && "userscript" in result) {
            const { userscript: scriptData } = result;

            if (!isObject(scriptData)) {
                return headerData as T;
            }

            for (const key in scriptData) {
                if (hasOwnProperty(scriptData, key)) {
                    if (key.startsWith("@")) {
                        throw `key can't starts with "@"`;
                    }
                }
            }

            for (const key in headerData) {
                if (hasOwnProperty(headerData, key)) {
                    scriptData[key] = scriptData[key] || headerData[key];
                }
            }
            return scriptData as T;
        }

        throw `key "userscript" not found`;
    }
    catch (exception: unknown) {
        const error: ThisError<Error> = (
            exception instanceof Error ? exception : new Error(
                typeof exception == "string" ? exception : undefined
            )
        );

        if (error instanceof SyntaxError) {
            error.message = "invalid json syntax";
            error.code = "ERR_INVALID_SYNTAX";
        }
        else {
            error.message = error.message || "unable to read json";
            error.code = "ERR_UNREADABLE_JSON";
        }

        throw (
            error.exitCode = ExitCode[error.code],
            exception = error
        );
    }
}

async function writeData(data: string[], file: string) {
    const cwd = process.cwd();

    try {
        await writeFile(path.join(cwd, file), data.join("\n"), "utf-8");
    }
    catch (exception: unknown) {
        const error: ThisError<Error> = (
            exception instanceof Error ? exception : new Error()
        );

        throw (
            error.message = "unable to write data",
            error.code = "ERR_WRITE_FILE",
            error.exitCode = ExitCode[error.code],
            exception = error
        );
    }
}

function createMetadata(data: Optional<ScriptHeader>) {
    const result = ["// ==UserScript=="];
    const buffer: Array<[string, string]> = [];

    for (const key in data) {
        if (!hasOwnProperty(data, key)) continue;
        const value: unknown = data[key];

        if (typeof value == "string") {
            buffer.push([key, value]);
        }
        else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item == "string") {
                    buffer.push([key, item]);
                }
                else if (isObject(item)) {
                    for (const name in item) {
                        if (!hasOwnProperty(item, name)) continue;
                        buffer.push([`${key}:${name}`, item[name]]);
                    }
                }
            }
        }
        else if (isObject(value)) {
            for (const name in value) {
                if (!hasOwnProperty(value, name)) continue;
                buffer.push([`${key} ${name}`, value[name]]);
            }
        }
    }

    const maxLen = buffer.reduce((prev, [key]) => (key.length > prev ? key.length : prev), 1);
    result.push(...buffer.map(([key, value]) => {
        const count = maxLen - key.length;
        const space = " ".repeat(count < 1 ? 0 : count);
        return `// @${key} ${space} ${value}`;
    }));

    return (result.push("// ==/UserScript=="), result);
}

async function handleOptions(options: OptionValues, defaultOpts: DefaultOptions) {
    if (isEmpty(options)) prog.help();

    const input: string = options.input ?? defaultOpts.input;
    const output: string | boolean = options.output ?? defaultOpts.output;

    try {
        const dataObj = await readJson(input);
        const metadata = createMetadata(dataObj);

        if (typeof output == "string" && output) {
            await writeData(metadata, output);
        }
        else {
            console.log(metadata.join("\n"));
        }
    }
    catch(exception: unknown) {
        const error: ThisError<Error> = (
            exception instanceof Error ? exception : new Error("unable to handle command option")
        );

        prog.error(`error: ${error.message}`, {
            code: error.code ?? "ERR_OPTION_HANDLE",
            exitCode: error.exitCode ?? ExitCode["ERR_OPTION_HANDLE"]
        } as ErrorOptions);
    }
}

function hasOwnProperty(obj: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function isEmpty(obj: object | any[]) {
    if (Array.isArray(obj)) {
        return !obj.length;
    }
    for (const key in obj) {
        if (hasOwnProperty(obj, key)) {
            return false;
        }
    }
    return true;
}

function isObject(arg: any): arg is object {
    if (typeof arg == "object" && arg != null && !Array.isArray(arg)) {
        return true;
    }
    return false;
}

function main(argv: string[]) {
    const options: DefaultOptions = {
        input: "package.json",
        output: false
    };

    prog.name("metag")
        .description("Metadata generator for userscript.")
        .version("1.0.0");

    prog.option("-i, --input <file>", `input json file (default: "${options.input}")`)
        .option("-o, --output [file]", "show output or save to file (default: false)")
        .parse(argv);

    handleOptions(prog.opts(), options);
}

if (import.meta?.main) { main(process.argv); }
