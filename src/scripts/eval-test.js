const data = require('../../dataset/eval-set');
const {suggestImage} = require('../services/guard.service');

async function main(){
    let tp = tn = fp = fn = 0;

    for (const item of data) {
        const text = item.text;
        const response = await suggestImage(text);

        if(response.data.success === true && item.expected === true) tp += 1;
        if(response.data.success === false && item.expected === false) tn += 1;
        if(response.data.success === true && item.expected === false) fp += 1;
        if(response.data.success === false && item.expected === true) fn += 1;
    }

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;

    return precision
}

main().then(console.log);