let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let slputils = require('./slputils');
let bchaddr = require('bchaddrjs-slp');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

class Network {
    static async getUtxo(address) {
        return new Promise( (resolve, reject) => {
            BITBOX.Address.utxo(address).then((result) => {
                if (!result || !result.length || !result[0].satoshis) {
                    reject(null)
                }

                let utxo = result.sort((a, b) => { return a.satoshis - b.satoshis })[result.length-1]
                resolve(utxo)
            }, (err) => { 
                console.log(err)
                reject(err)
            })
        })
    }

    static async sendTx(hex) {
        return new Promise( (resolve, reject) => {
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log("txid: ", result)
                if (result.length != 64) {
                    reject("Transaction failed: ", result)
                }
                else {
                    resolve(result)
                }
            }, (err) => { 
                console.log(err)
                reject(err)
            })
        })
    }

    static async monitorForPayment(paymentAddress, fee, onPaymentCB) {
        // must be a cash or legacy addr
        if(!bchaddr.isCashAddress(paymentAddress) && !bchaddr.isLegacyAddress(paymentAddress)) {
            throw new Error("Not an a valid address format.");
        }

        while (true) {
            try {
                let utxo = await this.getUtxo(paymentAddress)
                if (utxo && utxo.satoshis >= fee) {
                    break
                }
            } catch (ex) {
                console.log(ex)
            }

            await sleep(5000)
        }

        onPaymentCB()
    }
}

module.exports = Network