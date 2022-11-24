import glob from 'glob';
import * as jsonl from "node-jsonl";
import { Schema } from "../adapters/eosio.yield/index.js";

const files = glob.sync(`data/eos/eosio.yield/eosio.yield-*.jsonl`);

const data = new Map<string, Set<number>>();

const tvls = new Map<string, string>();

for ( const filepath of files ) {
    console.log(filepath);
    const rl = jsonl.readlines<Schema<any>>(filepath)

    while (true) {
        const {value, done} = await rl.next()
        if ( done ) break;
        if ( value.action == "report") {
            const { protocol, period, tvl } = value.jsonData;
            const periods = data.get(protocol) || new Set<number>();
            const time = new Date(period + "Z").valueOf();
            data.set( protocol, periods.add(time) );
            tvls.set(protocol, tvl )
        }
    }
}

const missed = new Map<string, number>();

for ( const [protocol, periods] of data ) {
    let start = new Date("2022-10-17T00:00:00Z").valueOf();
    let end = new Date("2022-10-24T00:00:00Z").valueOf();
    let current = start;
    while ( true ) {
        if ( !periods.has(current) ) {
            missed.set(protocol, (missed.get(protocol) || 0) + 1);
            console.log(protocol, new Date(current).toISOString());
        }
        current += 600 * 1000;
        if ( current > end ) break;
    }
    // console.log(protocol, periods);
}
console.log({missed});
console.log({tvls});
