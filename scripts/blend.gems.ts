const template_id = 7925
const url = `https://eos.api.atomicassets.io/atomicassets/v1/assets?template_id=${ template_id }&page=1&limit=100&order=desc&sort=asset_id`
const response = await fetch(url);
const json = await response.json();

let count = 0;
for ( const { asset_id, mutable_data, owner } of json.data) {
    // console.log({asset_id, mutable_data, owner});
    const { timestamp, mana } = mutable_data;
    count++;
    const new_mutable_data = JSON.stringify([
        {
           "key": "mana",
           "value": [
              "uint64",
              Number(mana) + 5,
           ]
        },
        {
           "key": "timestamp",
           "value": [
              "uint64",
              Number(timestamp)
           ]
        }
    ]);
    console.log(`mcleos push action atomicassets setassetdata '[pomelo, ${ owner }, ${asset_id}, ${new_mutable_data}]' -p pomelo`);
}

console.log(count);