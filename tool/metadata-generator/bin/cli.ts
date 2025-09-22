#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
import { program as prog, type OptionValues } from "commander";
import { readFile } from "node:fs/promises";

const ExitCode = {
    "ERR_INVALID_SYNTAX": 2,
    "ERR_UNREADABLE_JSON": 3,
    "ERR_OPTION_HANDLE": 4,
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

            for (const key in headerData) {
                if (Object.prototype.hasOwnProperty.call(headerData, key)) {
                    scriptData[key] = scriptData[key] ?? headerData[key];
                }
            }
            return scriptData as T;
        }

        return headerData as T;
    }
    catch (exception: unknown) {
        let error: ThisError<Error> = (
            exception instanceof Error ? exception : new Error()
        );

        if (error instanceof SyntaxError) {
            error.message = "invalid json syntax";
            error.code = "ERR_INVALID_SYNTAX";
        }
        else {
            error.message = "unable to read json";
            error.code = "ERR_UNREADABLE_JSON";
        }

        throw (
            error.exitCode = ExitCode[error.code],
            exception = error
        );
    }
}

function createMetadata(data: Optional<ScriptHeader>) {
    const buffer = ["// ==UserScript=="];
    const keyArr = Object.keys(data);
    const maxLen = keyArr.reduce((prev, key) => (key.length > prev ? key.length : prev), 1);

    for (const key of keyArr) {
        const name = key.startsWith("@") ? key : `@${key}`;
        const spaces = " ".repeat(maxLen - key.length);

        buffer.push(`// ${name} ${spaces} ${data[key]}`);
    }
    return (buffer.push("// ==/UserScript=="), buffer);
}

async function handleOptions(options: OptionValues, defaultOpts: DefaultOptions) {
    if (isEmpty(options)) prog.help();

    const input: string = options.input ?? defaultOpts.input;
    const output: string | boolean = options.output ?? defaultOpts.output;

    try {
        const dataObj = await readJson(input);
        const metadata = createMetadata(dataObj);

        if (typeof output == "string" && output) {
            console.log("TODO: save to file");
        }
        else {
            console.log(metadata.join("\n"));
        }
    }
    catch(exception: unknown) {
        let error: ThisError<Error> = (
            exception instanceof Error ? exception : new Error("unable to handle command option")
        );

        prog.error(`error: ${error.message}`, {
            code: error.code ?? "ERR_OPTION_HANDLE",
            exitCode: error.exitCode ?? ExitCode["ERR_OPTION_HANDLE"]
        } as ErrorOptions);
    }
}

function isEmpty(obj: object | any[]) {
    if (Array.isArray(obj)) {
        return !obj.length;
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
