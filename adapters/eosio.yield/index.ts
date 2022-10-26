import path from "node:path";
import { fileURLToPath } from "node:url";
import { Block } from "../../src/firehose.js"
import { log_event, to_date } from "../../src/utils.js";

// filters
const events = [
    "eosio.yield::report",
    "eosio.yield::rewardslog",
    "oracle.yield::updatelog"
];
export const include_filter_expr = events.map(event => {
    const [ receiver, action ] = event.split("::");
    return `(receiver == "${receiver}" && action == "${action}")`;
}).join(" || ");
export const exclude_filter_expr = 'action == "*"'

// adapter folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const filename = path.basename(__dirname);
export const extension = "jsonl";

interface Schema {
    date: string;
    timestamp: number;
    block_num: number;
    transaction_id: string;
    account: string;
    action: string;
    jsonData: string;
}

export function init(): Schema[] {
    return [];
}

export function callback(block: Block, store: Schema[]) {
    const block_num = block.number;
    const timestamp = Number(block.header.timestamp.seconds);
    log_event(filename, block);

    for ( const { actionTraces } of block.filteredTransactionTraces ) {
        for ( const { action, filteringMatched, transactionId } of actionTraces ) {
            // validate input
            if ( filteringMatched !== true ) continue; // exclude not matched & additional inline notifications
            if ( action.jsonData.length == 0 ) continue; // sometimes return empty traces
            const jsonData = JSON.parse(action.jsonData);
            store.push({
                date: to_date(timestamp),
                timestamp,
                block_num,
                transaction_id: transactionId,
                account: action.account,
                action: action.name,
                jsonData,
            });
        }
    }
}
