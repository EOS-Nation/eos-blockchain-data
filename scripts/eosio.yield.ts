import glob from 'glob';
import * as jsonl from "node-jsonl";
import { Schema } from "../adapters/eosio.yield/index.js";

const files = glob.sync(`data/eos/eosio.yield/eosio.yield-*.jsonl`);

const data = new Map<string, Set<string>>();

for ( const filepath of files ) {
    console.log(filepath);
    const rl = jsonl.readlines<Schema<any>>(filepath)

    while (true) {
        const {value, done} = await rl.next()
        if ( done ) break;
        if ( value.action == "report") {
            const { protocol, period } = value.jsonData;
            const periods = data.get(protocol) || new Set<string>();
            data.set( protocol, periods.add(period) );
        }
    }
}
for ( const [protocol, periods] of data ) {
    console.log(protocol, periods);
}
// console.log(data.get("swap.defi"));
