import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadJsonFileSync } from 'load-json-file';
import { Block } from "../../src/firehose.js"
import { CHAIN } from "../../src/config.js";
import { log_event, to_date } from "../../src/utils.js";

// filters
const filter_receiver = "eosio.token";
const filter_action = "transfer";
export const include_filter_expr = `receiver == "${filter_receiver}" && action == "${filter_action}"`;
export const exclude_filter_expr = 'action == "*"'

// adapter folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const filename = path.basename(__dirname);
export const extension = "jsonl";

const accounts = new Set([
    ...loadJsonFileSync<string[]>(path.join(__dirname, 'accounts', `${CHAIN}.json`))
])

interface Schema {
    date: string;
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

export function init(): Schema[] {
    return [];
}

export function callback(block: Block, store: Schema[]) {
    const block_num = block.number;
    const timestamp = Number(block.header.timestamp.seconds);
    log_event(filename, block);

    //filtering actual trades and duplicated mine actions in a single block
    for ( const { actionTraces } of block.filteredTransactionTraces ) {
        for ( const { action, filteringMatched, transactionId } of actionTraces ) {
            // validate input
            if ( filteringMatched !== true ) continue; // exclude not matched & additional inline notifications
            if ( action.jsonData.length == 0 ) continue; // sometimes return empty traces
            const jsonData = JSON.parse(action.jsonData);

            if ( action.name == "transfer" ) {
                const { from, to, quantity, memo } = jsonData;

                // must be a transfer from chain accounts
                if ( !accounts.has(from) && !accounts.has(to) ) continue;

                // parse quantity
                if ( !quantity ) continue;
                const [ amount, symbol ] = quantity.split(" ");
                store.push({
                    date: to_date(timestamp),
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
