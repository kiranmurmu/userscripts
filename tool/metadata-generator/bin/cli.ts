#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
import { program as prog } from "commander";

type Options = { input?: string; output?: string; };
const _default = { input: "package.json" } as const;

interface ErrorWithCode extends Error {
    code: (
        "ERR_MODULE_NOT_FOUND" |
        "ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE" |
        "ERR_UNKNOWN_FILE_EXTENSION"
    );
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
