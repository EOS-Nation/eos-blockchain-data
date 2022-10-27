import glob from 'glob';
import * as jsonl from "node-jsonl";
import { Schema } from "../adapters/swap.defi/index.js";

const account = "myaccount";
const filename = "swap.defi"
const files = glob.sync(`data/eos/${filename}/${filename}-*.jsonl`);

let quantity_ins = 0;
let quantity_outs = 0;
let total = 0;

function getAmount(quantity: string) {
  const [amount, symbol] = quantity.split(" ");
  if ( symbol != "EOS" ) return 0;
  return parseFloat(amount);
}


for ( const filepath of files ) {
    console.log(filepath);
    const rl = jsonl.readlines<Schema<any>>(filepath)

    while (true) {
        const {value, done} = await rl.next()
        if ( done ) break;
        if ( value.action == "swaplog") {
            const { owner, quantity_in, quantity_out } = value.jsonData;
            if ( owner == account) {
                quantity_ins += getAmount(quantity_in);
                quantity_outs += getAmount(quantity_out);
                total++;
            }
        }
    }
}

console.log({quantity_ins, quantity_outs, total});
