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

async function handleOptions(opts: Options) {
    if (isEmpty(opts)) prog.help();
    const cwd = process.cwd();
    const input = opts.input ?? _default.input;

    try {
        const { default: data } = await import(path.join(cwd, input), {
            with: { type: "json"}
        });
        console.log(data);
    }
    catch(err: unknown) {
        if (!(err instanceof Error)) throw err;
        const error = err as ErrorWithCode;

        switch (error.code) {
            case "ERR_MODULE_NOT_FOUND": {
                prog.error("error: file not found", {
                    code: error.code,
                    exitCode: 1,
                });
            }
            case "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE": {
                prog.error(`error: file is not of type "json"`, {
                    code: error.code,
                    exitCode: 2,
                });
            }
            case "ERR_UNKNOWN_FILE_EXTENSION": {
                prog.error(`error: unknown file extension "${path.extname(input)}"`, {
                    code: error.code,
                    exitCode: 3,
                });
            }
            default: break;
        }

        if (err instanceof SyntaxError) {
            prog.error(`error: file is not valid "json"`, {
                code: "ERR_INVALID_SYNTAX",
                exitCode: 4,
            });
        }
        else {
            prog.error(`error: ${err.message}`, {
                code: "ERR_UNKNOWN",
                exitCode: -1,
            });
        }
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
    prog.name("metag")
        .description("Metadata generator for userscript.")
        .version("1.0.0");

    prog.option("-i, --input [file]", `input json file (default: "${_default.input}")`)
        .option("-o, --output <file>", "output meta file")
        .option("-p, --print", "print meta output")
        .parse(argv);

    handleOptions(prog.opts<Options>());
}

if (import.meta?.main) { main(process.argv); }
