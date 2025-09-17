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
type ThisError<Type extends Error> = Type & ErrorOptions;
type DefaultOptions = Readonly<{ output: string | boolean; input: string; }>;

type Options = { input?: string; output?: string; };
const _default = { input: "package.json" } as const;

interface ErrorWithCode extends Error {
    code: (
        "ERR_MODULE_NOT_FOUND" |
        "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE" |
        "ERR_UNKNOWN_FILE_EXTENSION"
    );
}

async function readJson(source: string) {
    const cwd = process.cwd();

    try {
        const buffer = await readFile(path.join(cwd, source), "utf-8");
        const result: unknown = JSON.parse(buffer);
        const isTypeObj = isObject(result);

        if (!isTypeObj || (isTypeObj && isEmpty(result))) {
            return {
                metadata: {}
            };
        }
        if ("metadata" in result)
            return result;

        return (result["metadata"] = {}, result);
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

async function handleOptions(options: OptionValues, defaultOpts: DefaultOptions) {
    if (isEmpty(options)) prog.help();

    const input: string = options.input ?? defaultOpts.input;
    const output: string | boolean = options.output ?? defaultOpts.output;

    try {
        const dataObj = await readJson(input);

        if (typeof output == "string" && output) {
            console.log("TODO: save to file");
        }
        else {
            console.log(dataObj);
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
