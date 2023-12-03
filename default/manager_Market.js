function calcMarket_general(){
    /*
    Just a test function to get a feel for how transactions should occur
    */
    var deal_room_name = "";    //Room name related to order
    var deal_ID        = "";    //Order ID on the market
    var deal_amount    = 0;     //Sell amount to order
    var deal_sell_cost = Game.market.calcTransactionCost(deal_amount, "E53N22", "deal_room_name");
    
    //console.log("---");
    //console.log("TransactionCost; ",deal_sell_cost);
    //console.log("cTime -> ",Game.time);
    
    if(Game.time == 0){
        console.log("### Deal Executed ###");
        Game.market.deal(deal_ID, deal_amount, "E53N22");
    }
}

module.exports = {
    calcMarket_general
};