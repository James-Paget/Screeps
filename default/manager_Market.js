function calcMarket_general(){
    /*
    Just a test function to get a feel for how transactions should occur
    */
    var transactionCost = Game.market.calcTransactionCost(1000, "E53N22", "E59N29");
    console.log("TransactionCost; ",transactionCost);
    //E59N29
    //656c846f77f75f001288d1a8
    Game.market.deal(orderId, amount, [yourRoomName])
}

module.exports = {
    calcMarket_general
};