Eos = require('eosjs');
var ecc = require('eosjs-ecc');
const crypto = require('@trust/webcrypto')
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var nameContractAccount = 'lottotest222';
eos = Eos({
    keyProvider: '5JEPU69YB2fjkcERiVrDpj7sG1scuj92YzyPkLV1d4yeZjg1KPy', // private key of game
    httpEndpoint: 'http://junglehistory.cryptolions.io:18888',
    chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'
});

MongoClient.connect(url, function (err, db) {

    if (err) throw err;
    var dbo = db.db("mydb");
    var col = dbo.collection("games");
    var bulk = col.initializeOrderedBulkOp();

      var mAsyncReadWait = setInterval(AsyncRead, 500);
        function AsyncRead() {
        async function main() {
            const actions = (await eos.getActions(nameContractAccount)).actions;
            console.log(actions.map(a => a.action_trace).length)
            for (let i = 0; i < actions.map(a => a.action_trace).length; ++i) {


                if ((actions.map(a => a.action_trace)[i]['act']['name'] === 'gamestart') && Number.isInteger((actions.map(a => a.action_trace)[i]['act']['data']['game_id']))) {

                    bulk.find({_id: (actions.map(a => a.action_trace)[i]['act']['data']['game_id'])}).upsert().replaceOne({
                        _id: (actions.map(a => a.action_trace)[i]['act']['data']['game_id']),
                        state: actions.map(a => a.action_trace)[i]['act']['name'],
                        numbers: []
                    });

                } else if (actions.map(a => a.action_trace)[i]['act']['name'] === 'housereveal' && Number.isInteger((actions.map(a => a.action_trace)[i]['act']['data']['game_id']))) {

                    bulk.find({_id: (actions.map(a => a.action_trace)[i]['act']['data']['game_id'])}).upsert().replaceOne({
                        _id: (actions.map(a => a.action_trace)[i]['act']['data']['game_id']),
                        state: actions.map(a => a.action_trace)[i]['act']['name'],
                        numbers: actions.map(a => a.action_trace)[i]['act']['data']['house_numbers'],
                        prize: actions.map(a => a.action_trace)[i]['act']['data']['prize']
                    });
                }
                else if (actions.map(a => a.action_trace)[i]['act']['name'] === 'gameend' && Number.isInteger((actions.map(a => a.action_trace)[i]['act']['data']['game_id']))) {

                    bulk.find({_id: (actions.map(a => a.action_trace)[i]['act']['data']['game_id'])}).upsert().replaceOne({
                        _id: (actions.map(a => a.action_trace)[i]['act']['data']['game_id']),
                        state: actions.map(a => a.action_trace)[i]['act']['name'],
                        numbers: actions.map(a => a.action_trace)[i]['act']['data']['house_numbers'],
                        prize: actions.map(a => a.action_trace)[i]['act']['data']['prize']
                    });
                }
            }

            bulk.execute(function (err, result) {
                ///db.close();
            });

           await col.find({state: 'gamestart'}).toArray(function (err, result) {
                if (err) throw err;

                if (!Array.isArray(result) || !result.length) {
                    console.log("No game in start state");

                } else {

                    for (let i = 0; i < result.length; i++) {
                        var array = new Uint32Array(6);

                        var long =  crypto.getRandomValues(array).join("");

                        var byteArray = Array.from(long.toString()).map(Number);


                        for (let i = 0; i < 64 - Array.from(long.toString()).map(Number).length;) {
                            byteArray.push(0);
                            i++;
                        }

                        eos.transaction({
                            actions: [
                                {
                                    account: nameContractAccount,
                                    name: 'housereveal',
                                    authorization: [{
                                        actor: nameContractAccount,
                                        permission: 'active'
                                    }],
                                    data: {
                                        game_id: result[i]._id,
                                        commit: ecc.sha256(Buffer.from(byteArray.join(""), 'hex')),
                                        secret: byteArray.join("")
                                    }
                                }
                            ]


                        }).then(trx => {
                            console.log(`Transaction ID: ${trx.transaction_id}`);
                        })
                    }

                }

            });

         }

        main().catch(error => {
            console.error(error);
            process.exit(1);
        });
    }
});

