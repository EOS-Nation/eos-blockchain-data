import glob from 'glob';
import path from "node:path";
import { loadJsonFileSync } from 'load-json-file';

const files = glob.sync(`data/eos/tether/tether-*.json`);

export interface Block {
    id: string;
    num: number;
    time: Date;
}

export interface Tether {
    start_block: Block;
    stop_block: Block;
    transfers: number;
    transfer_volume: number;
    cex_transfers: number;
    cex_transfer_volume: number;
    dex_transfers: number;
    dex_transfer_volume: number;
    kucoin_transfers: number;
    kucoin_transfer_volume: number;
    daily_active_accounts: number;
}

console.log([
    "date",
    "transfers",
    "transfer_volume",
    "cex_transfers",
    "cex_transfer_volume",
    "dex_transfers",
    "dex_transfer_volume",
    "kucoin_transfers",
    "kucoin_transfer_volume",
    "daily_active_accounts",
].join(","));
for ( const file of files ) {
    const date = path.parse(file).base.slice(7, 17);
    const data = loadJsonFileSync<Tether>(file);

    console.log([
        date,
        data.transfers,
        data.transfer_volume,
        data.cex_transfers,
        data.cex_transfer_volume,
        data.dex_transfers,
        data.dex_transfer_volume,
        data.kucoin_transfers,
        data.kucoin_transfer_volume,
        data.daily_active_accounts,
    ].join(","));
}