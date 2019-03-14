
var prizeNumbers = undefined;

function CallTryScatter() {

    ScatterJS.plugins(new ScatterEOS());

    var array = new Uint32Array(6);

    var long =  crypto.getRandomValues(array).join("");

console.log(long);
    var byteArray = Array.from(long.toString()).map(Number);
    for (var i = 0; i < 64 - Array.from(long.toString()).map(Number).length;) {
        byteArray.push(0);
        i++;
    }

    var copy = [];
    if(gameData.selectArray.length === 0) {
        return 0;
    }else {
        gameData.selectArray.forEach(function (elemet) {
            copy.push(elemet + 1);
        });
    }
    const network = {
         blockchain: 'eos',
        host: 'junglehistory.cryptolions.io',
       port: 18888,
        protocol: 'http',
        chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
           };

    ScatterJS.scatter.connect('Lotto').then(connected => {


            if (!connected)
            {
                goPage('noScatt');
            }

            const scatter = ScatterJS.scatter;

            const requiredFields = {accounts: [network]};
            scatter.getIdentity(requiredFields).then(() => {

                const account = scatter.identity.accounts.find(x => x.blockchain === 'eos');

                const eosOptions = {expireInSeconds: 60};

                const eos = scatter.eos(network, Eos, eosOptions);

                const transactionOptions = {authorization: [`${account.name}@${account.authority}`]};

                var transact_val;
                var game_id;
                eos.transfer(account.name, 'lottotest222', '1.0000 EOS', eosjs_ecc.sha256(Buffer.from(byteArray.join(""), 'hex')) + ',' + copy.join(','), transactionOptions).then(trx => {
                    transact_val = trx.transaction_id;
                    var IntervalCheck = setInterval(InterCheck, 500);

                    function InterCheck() {
                        async function main() {
                            const actions = (await eos.getActions('lottotest222')).actions;

                            for (var i = 0; i < actions.map(a => a.action_trace).length; i++) {

                                if (actions.map(a => a.action_trace)[i]['act']['name'] === 'gamestart' && actions.map(a => a.action_trace)[i]['trx_id'] === trx.transaction_id) {
                                    for (let g = 0; g < actions.map(a => a.action_trace).length; g++) {
                                        if ((actions.map(a => a.action_trace)[i]['act']['data']['game_id'] === actions.map(a => a.action_trace)[g]['act']['data']['game_id']) && actions.map(a => a.action_trace)[g]['act']['name'] === 'housereveal') {
                                            game_id = actions.map(a => a.action_trace)[i]['act']['data']['game_id'];
                                            eos.transaction({
                                                actions: [
                                                    {
                                                        account: 'lottotest222',
                                                        name: 'playerreveal',
                                                        authorization: [{
                                                            actor: account.name,
                                                            permission: 'active',
                                                        }],
                                                        data: {
                                                            game_id: actions.map(a => a.action_trace)[i]['act']['data']['game_id'],
                                                            secret: byteArray.join("")
                                                        }
                                                    }
                                                ]


                                            }).then(trx => {
                                                // console.log(`Transaction ID: ${trx.transaction_id}`);
                                            });
                                            clearInterval(IntervalCheck);
                                        }

                                    }

                                }

                            }

                        }

                        main().catch(error => {
                            //console.error(error);
                            process.exit(1);
                        });
                    }


                    var GetNumbers = setInterval(GNumbers, 500);

                    function GNumbers() {
                        async function main() {
                            const actions = (await eos.getActions('lottotest222')).actions;
                            for (var i = 0; i < actions.map(a => a.action_trace).length; i++){
                            if (actions.map(a => a.action_trace)[i]['act']['name'] === 'gameend' && (actions.map(a => a.action_trace)[i]['act']['data']['game_id'] === game_id)) {
                                prizeNumbers = actions.map(a => a.action_trace)[i]['act']['data']['house_numbers'];

                                clearInterval(GetNumbers);
                            }
                            }

                        }

                        main().catch(error => {
                            //console.error(error);
                            process.exit(1);
                        });
                    }

                }).catch(error => {
                   // console.error(error);
                });

              //  window.ScatterJS = null;

            }).catch(error => {
                // The user rejected this request, or doesn't have the appropriate requirements.

            });

    });



}

