import tether from "./tether/index.js"
import resources from "./resources/index.js"
import producerpay from "./producerpay/index.js"

export default new Map<string, any>([
    ["tether", tether],
    ["resources", resources],
    ["producerpay", producerpay],
]);