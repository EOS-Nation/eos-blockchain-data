import fs from "node:fs";
import path from "node:path";
import { Block } from "../../src/firehose.js"
import { fileURLToPath } from "node:url";
import { isMain, data_filepath } from "../../src/utils.js";
import { streamBlocks, get_blocks } from "../../src/dfuse.js";
import { CHAIN } from "../../src/config.js";

// filters
const filter_receiver = "eosio.token";
const filter_action = "transfer";
const include_filter_expr = `receiver == "${filter_receiver}" && action == "${filter_action}"`;
const exclude_filter_expr = 'action == "*"'

// adapter folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapter = path.basename(__dirname);

function log_event(block: Block) {
    const block_num = block.number;
    const timestamp = Number(block.header.timestamp.seconds);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 19) + "Z";
    if ( block_num % 120 == 0 ) console.log(date, adapter, JSON.stringify({block_num}));
}

function to_date(timestamp: number) {
    return new Date(timestamp * 1000).toISOString().slice(0, 19) + "Z";
}

const accounts = new Set([
    "eosnationftw",
    "eosnationinc"
])

interface Schema {
    timestamp: number;
    block_num: number;
    transaction_id: string;
    from: string;
    to: string;
    contract: string;
    quantity: string;
    symbol: string;
    amount: number;
    memo: string;
}

export default async function main( start_date: string, stop_date: string ) {
    const transfers: Schema[] = [];

    function callback(block: Block) {
        const block_num = block.number;
        const timestamp = Number(block.header.timestamp.seconds);
        log_event(block);

        //filtering actual trades and duplicated mine actions in a single block
        for ( const { actionTraces } of block.filteredTransactionTraces ) {
            for ( const { action, filteringMatched, transactionId } of actionTraces ) {
                // validate input
                if ( filteringMatched !== true ) continue; // exclude not matched & additional inline notifications
                if ( action.jsonData.length == 0 ) continue; // sometimes return empty traces
                const data = JSON.parse(action.jsonData);

                if ( action.name == "transfer" ) {
                    const { from, to, quantity, memo } = data;

                    // must be a transfer from chain accounts
                    if ( !accounts.has(from) && !accounts.has(to) ) continue;

                    // parse quantity
                    if ( !quantity ) continue;
                    const [ amount, symbol ] = quantity.split(" ");
                    transfers.push({
                        timestamp,
                        block_num,
                        transaction_id: transactionId,
                        from,
                        to,
                        contract: action.account,
                        quantity,
                        amount: Number(amount),
                        symbol,
                        memo,
                    })
                }
            }
        }
    }

    console.log('[transfers] starting...');
    const { start_block, stop_block } = await get_blocks( start_date, stop_date );
    const message = await streamBlocks(start_block.num, stop_block.num, callback, {include_filter_expr, exclude_filter_expr});

    // save data
    if ( message == "stream.on::end") {
        console.log("[transfers] saving...");
        const date = start_date.slice(0, 10);
        const filename = data_filepath(CHAIN, adapter, date, "jsonl");
        const writer = fs.createWriteStream(filename);
        for ( const row of transfers ) {
            writer.write(JSON.stringify(row) + "\n");
        }
        console.log("[transfers] done!");
    } else {
        console.log("[transfers] exit without saving");
    }
}

// for testing purposes
if ( isMain(import.meta.url) ) {
    const date = process.argv[2] || "2022-10-01";
    main(`${date}T00:00:00Z`, `${date}T23:59:59.5Z`);
}