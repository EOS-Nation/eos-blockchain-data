// import tether from "./tether/index.js"
// import resources from "./resources/index.js"
import * as producerpay from "./producerpay/index.js"
import { Block } from "../src/firehose.js"

export interface Adapter {
    filename: string;                               // adapter filename (ex: "producerpay")
    extension: "json" | "jsonl";                    // file extension (ex: "json", "jsonl")
    include_filter_expr: string;                    // include Firehose filter expressions
    exclude_filter_expr: string;                    // exclude Firehose filter expressions
    init: () => any;                                // initalize store
    callback(block: Block, store: any): void;       // on block callback
}

export default new Map<string, Adapter>([
    // ["tether", tether],
    // ["resources", resources],
    ["producerpay", producerpay],
]);
