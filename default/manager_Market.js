function calcMarket_general(){
    /*
    Just a test function to get a feel for how transactions should occur
    */
    var my_room_name   = "";    //Room you are in
    var deal_room_name = "";    //Room name related to order
    var deal_ID        = "";    //Order ID on the market
    var deal_amount    = 0;     //Sell amount to order
    var deal_sell_cost = Game.market.calcTransactionCost(deal_amount, my_room_name, deal_room_name);
    
    //console.log("---");
    //console.log("TransactionCost; ",deal_sell_cost);
    //console.log("cTime -> ",Game.time);
    
    if(Game.time == 0){
        console.log("### Deal Executed ###");
        Game.market.deal(deal_ID, deal_amount, my_room_name);
    }
}

module.exports = {
    calcMarket_general
};