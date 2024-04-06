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

function calculate_transaction_automatic(){
    /*
    . Sells material in the terminal automatically
    -(1) This action occurs periodically
    -(2) Prior market orders will be cancelled when this is performed to prevent errors
    -(3) This will calculate a 'best' price (set to money-price trade off, OR max price)
    -(4) Make the sale of this new 
    */
    //(1)
    if(Game.time.toString().slice(-1) == 0){    //[Once] every [10 seconds]
        //(2)
        //...
        //Clear all old stuff
        //...
        //(3)
        var priceDetails = find_bestSellOrder("balanced");
        //(4)
        console.log("### Deal Executed ###");
        Game.market.deal(priceDetails.offerID, priceDetails.offerAmount, priceDetails.sellingRoom);
    }
}

function find_bestSellOrder(criteria){
    /*
    Finds the best sell offer currently in the market fitting the criteria specified
    Criteria can be;
    - "balanced"  => Find trade-off between money gained and energy paid
    - "priceOnly" => Take highest sell price (most money, very energy expensive)

    Returns {offerID, offerAmount, offerRoom, sellingRoom}
    sellingRoom  =>  Room YOU are selling material from (e.g terminal room)
    offerAmount  =>  Amount YOU are going to sell, NOT the max amount that is being offer (although it could be equal to this)
    */
    var priceDetails = {offerID:"OFFER ID", offerAmount:"OFFER AMOUNT", offerRoom:"OFFER ROOM", sellingRoom:"OFFER SELL ROOM"}
    for( ... ){                         //Check every sell trade offer in the market
        var travelCost  = ...;          //FIXED ENERGY cost based on distance to buyer
        var costPerUnit = ...;          //ENERGY cost per UNIT of MATERIAL
        //#####################################################################################################
        //## BETTER DEAL --> DEPENDS ON AMOUNT BEING SOLD --> GRAPH AND CONSIDER MAX AND MINS TO MAKE CHOICE ##
        //#####################################################################################################
        //## ---> Sell as much as possible for most gain at any given moment ##
        //#####################################################################
        betterDeal = false;
        if(criteria == "balanced"){
            //pass
            //betterDeal = true;
        }
        if(criteria == "priceOnly"){
            //pass
            //betterDeal = true;
        }
        if(betterDeal){
            priceDetails = { ... };
        }
    }
    return priceDetails;
}

module.exports = {
    calcMarket_general
};