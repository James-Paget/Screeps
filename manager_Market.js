function calcMarket_general(){
    /*
    Just a test function to get a feel for how transactions should occur
    */
    var transactionCost = Game.market.calcTransactionCost(1000, "E53N22", "E44N1");
    console.log("TransactionCost; ",transactionCost);
}
function other(){
    //pass
}

module.exports = {
    calcMarket_general,
    other
};