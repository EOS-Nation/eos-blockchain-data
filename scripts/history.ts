import fs from "node:fs";
import adapters from "../adapters/index.js"
import PQueue from "p-queue";
import { CONCURRENCY, MAX_TASKS, ADAPTERS, REVERSE, CHAIN } from '../src/config.js';
import { data_filepath } from "../src/utils.js";

const queue = new PQueue({concurrency: CONCURRENCY});

function is_date_early( date: string ) {
    // date ranges
    // start = -24 hours
    // stop  = 0 hours
    const INTERVAL = 86400; // 1 day
    const now = Math.floor(new Date().valueOf() / 1000);
    const sec_since_epoch = Math.floor(new Date(date).valueOf() / 1000);
    return (now - sec_since_epoch) < INTERVAL;
}

function split_date( date: string ) {
    const [ year, month, day ] = date.split("T")[0].split("-");
    return { year, month, day };
}

function is_valid_date( date: string ) {
    const previous = split_date(date);
    const current = split_date(new Date(date).toISOString());

    if ( new Date(date).valueOf() == NaN ) return false;
    if ( previous.month != current.month) return false;
    if ( previous.day != current.day) return false;
    return true;
}

let active_tasks = 0;

const years = ["2021", "2022"];
const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

for ( const year of REVERSE ? years.reverse() : years ) {
    for ( const month of REVERSE ? months.reverse() : months ) {
        for ( const day of REVERSE ? days.reverse() : days ) {
            const date = `${year}-${month}-${day}`;
            const start_date = `${date}T00:00:00Z`;
            const stop_date = `${date}T23:59:59.5Z`;

            // is valid calendar date
            if ( !is_valid_date( start_date ) ) {
                continue; // invalid date
            }

            // skip if in the future or before -1 hour
            if ( is_date_early( stop_date )) {
                continue; // skipped too early
            }
            if ( active_tasks >= MAX_TASKS ) continue;

            // Process adapters
            for ( const adapter of ADAPTERS ) {
                if ( !adapters.has(adapter) ) throw new Error(`[history] adapter not found: ${adapter}`);
                if ( !fs.existsSync(data_filepath(CHAIN, adapter, date))) {
                    active_tasks += 1;
                    queue.add(() => adapters.get(adapter)(start_date, stop_date));
                } else {
                    console.log(`[history::${adapter}] already exists`, start_date);
                }
            }
        }
    }
}
queue.on("completed", () => 'finished!')
