#!/usr/bin/env node

import process from "node:process";

function main(_argv: string[]) {
    for (let i = 1; i < _argv.length; i++) {
        console.log(_argv[i]);
    }
    console.log("hello world: from metadata generator!");
}

if (import.meta?.main) { main(process.argv); }
