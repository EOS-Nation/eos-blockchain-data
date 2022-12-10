import path from "node:path";
import { fileURLToPath } from "node:url";
import { Block, Action } from "../../src/interfaces.js"
import { log_event, to_date } from "../../src/utils.js";

// filters
const filter_action = "transfer";
export const include_filter_expr = `action == "${filter_action}"`;
export const exclude_filter_expr = 'action == "*"'

// adapter folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const filename = path.basename(__dirname);
export const extension = "jsonl";

export interface Schema<T = unknown> {
    date: string;
    timestamp: number;
    block: {
        number: number;
        id: string;
    },
    transactionId: string;
    account: string;
    name: string;
    jsonData: T;
}

export function init(): Schema[] {
    return [];
}

interface Transfer {
    from: string;
    to: string;
    quantity: string;
    memo: string;
}

export function parseTransferAction( action: Action ) {
    try {
        const data = JSON.parse(action.jsonData) as Transfer; 
        if ( !data.from || !data.to || !data.quantity ) return null;
        // memo is optional
        return data;
    } catch (e: any) {
        return null;
    }
}

export function callback(block: Block, store: Schema[]) {
    // const block_num = block.number;
    const timestamp = Number(block.header.timestamp.seconds);
    log_event(filename, block);

    //filtering actual trades and duplicated mine actions in a single block
    for ( const { actionTraces } of block.filteredTransactionTraces ) {
        for ( const { action, filteringMatched, transactionId, receiver } of actionTraces ) {
            // validate input
            if ( filteringMatched !== true ) continue; // exclude not matched & additional inline notifications
            if ( receiver != action.account ) continue; // exclude additional inline notifications

            // validate action
            const { account, name } = action;
            if ( name != "transfer" ) continue; // exclude not transfer actions

            // validate action data
            const jsonData = parseTransferAction(action);
            if ( !jsonData ) continue; // invalid action
    
            store.push({
                date: to_date(timestamp),
                timestamp,
                block: {
                    number: block.number,
                    id: block.id,
                },
                transactionId,
                account,
                name,
                jsonData,
            })
        }
    }
}
