import fs from "node:fs";
import { writeJsonFileSync } from 'write-json-file';
import { Adapter } from "../adapters/index.js";
import { data_filepath } from "../src/utils.js";
import { streamBlocks, get_blocks } from "../src/firehose.js";
import { GetBlock } from "../src/interfaces.js";
import { CHAIN } from "../src/config.js";

export async function main( adapter: Adapter, start_date: string, stop_date: string ) {
    const store: any = adapter.init();
    const { filename, extension } = adapter;

    console.log(`[adapter::${filename}] starting...`);
    const { start_block, stop_block } = await get_blocks( start_date, stop_date );
    const message = await streamBlocks(start_block.num, stop_block.num, adapter.callback, store, {...adapter});

    // save data
    if ( message == "stream.on::end") {
        console.log(`[adapter::${filename}] saving...`);
        const date = start_date.slice(0, 10);
        const filepath = data_filepath(CHAIN, filename, date, extension);
        if ( extension == "json" ) handle_json(filepath, store, start_block, stop_block );
        if ( extension == "jsonl" ) handle_jsonl(filepath, store);
        console.log(`[adapter::${filename}] done!`);
    } else {
        console.log(`[adapter::${filename}] exit without saving`);
    }
}

function handle_json( filepath: string, store: any, start_block: GetBlock, stop_block: GetBlock ) {
    store.start_block = start_block;
    store.stop_block = stop_block;
    writeJsonFileSync(filepath, store);
}

function handle_jsonl( filepath: string, store: any[] ) {
    const writer = fs.createWriteStream(filepath);
    for ( const row of store ) {
        writer.write(JSON.stringify(row) + "\n");
    }
}