function calculate_transaction_manual(){
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
    -(1) This action occurs periodically#
    -(2) For every terminal you have
    -(3) Determine what to sell and how much
    -(4) This will calculate a 'best' price (set to money-price trade off, OR max price)
    -(5) Make the sale of this new
    */
    //(1)
    if(Game.time.toString().slice(-1) == 0){                    //[Once] every [10 seconds]
        //(2)
        for(var i=0; i<Memory.spawnerRooms.length; i++){        //For each spawner room, look for terminals
            var terminals = Game.rooms[Memory.spawnerRooms[i].roomID].find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_TERMINAL)}});
            if(terminals.length > 0){
                var terminal = terminals[0];                    //Can only ever have 1 max per room
                if(terminal.store.getUsedCapacity(RESOURCE_ENERGY) >= 1000){    //Only trade when at least 1000 energy --> avoid weird trades maybe --> small and not worth it ??????????????? This is likely total bollocks
                    //(3)
                    var sellResource = find_sellResource(terminal);
                    //(4)
                    if(sellResource.type != null)                                           //If there is a resource to sell that isn't energy
                    {
                        var priceDetails = find_bestBuyOrder("balanced", sellResource);     //e.g They are buying
                        if(priceDetails.offerID){                                           //If an offer was found
                            //(5)
                            var dealSituation = Game.market.deal(priceDetails.offerID, priceDetails.offerAmount, priceDetails.sellingRoom);
                            console.log("### Auto Deal Executed ### -> Code;",dealSituation);
                        }
                    }
                }
            }
        }
    }
}

function find_bestBuyOrder(criteria, sellResource){
    /*
    Finds the best sell offer currently in the market fitting the criteria specified
    Criteria can be;
    - "balanced"  => Find trade-off between money gained and energy paid
    - "priceOnly" => Take highest sell price (most money, very energy expensive)

    Returns {offerID, offerAmount, offerRoom, sellingRoom}
    sellingRoom  =>  Room YOU are selling material from (e.g terminal room)
    offerAmount  =>  Amount YOU are going to sell, NOT the max amount that is being offer (although it could be equal to this)
    */
    var priceDetails = {offerID:null, offerAmount:null, offerRoom:null, sellingRoom:null, pricePerEnergy:null};
    var marketOrders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: sellResource.type});
    for(var i=0; i<marketOrders.length; i++){       //Check every sell trade offer in the market
        betterDeal = false;
        var new_pricePerEnergy = null;
        if(criteria == "balanced"){
            new_pricePerEnergy = get_profitEnergyFactor(marketOrders[i], sellResource);
            var threshold = 15.0;    //Minimum acceptable pricePerEnergy offer
            if(priceDetails.offerID){
                threshold = priceDetails.pricePerEnergy;}
            if(new_pricePerEnergy > threshold){
                betterDeal = true;}
        }
        if(criteria == "priceOnly"){
            //pass
            //betterDeal = true;
        }
        //When a better deal is found, replace old one
        if(betterDeal){
            //## CONSIDER MAX ENERGY TO SPEND TOO
            offerAmount  = calculate_largestSellAmount(marketOrders[i], sellResource);
            priceDetails = {offerID:marketOrders[i].id, offerAmount:offerAmount, offerRoom:marketOrders[i].rommName, sellingRoom:sellResource.sellingRoom, pricePerEnergy:new_pricePerEnergy};
        }
    }
    return priceDetails;
}

function find_sellResource(terminal){
    /*
    Finds what resource to sell
    Very simple, just chooses whatever is most abundant
    However will never return energy (not a a resource to sell alone)
    */
    var sellResource = {type:null, resourceAmount:null, energyAmount:null, sellingRoom:null};
    //var resources = Object.keys(structure.store);
    var resource = RESOURCE_OXYGEN; //####### JUST HARDCODING OXYGEN FOR NOW ######
    var amount   = terminal.store.getUsedCapacity(resource);
    if(amount > 0){
        sellResource = {type:resource, resourceAmount:amount, energyAmount:terminal.store.getUsedCapacity(RESOURCE_ENERGY), sellingRoom:terminal.room.name};}
    return sellResource;
}

function get_profitEnergyFactor(marketOffer, sellResource){
    /*
    Calculates the 'Profit-Energy' factor for a given buy trade offer
    (perfect balance of profit and energy)

    Larger value is better
    */
    energy_perUnit = Game.market.calcTransactionCost(1, sellResource.sellingRoom, marketOffer.roomName);
    profit_perUnit = marketOffer.price;
    return (profit_perUnit) / (energy_perUnit);
}

function calculate_largestSellAmount(marketOffer, sellResource){
    /*
    Considers energy and resource max sell amounts to find and overall largest sell total
    */
    var unitCost = Game.market.calcTransactionCost(1, sellResource.sellingRoom, marketOffer.roomName);
    var resourceMaxAmount = Math.min(marketOffer.amount, sellResource.resourceAmount);     //In order to sell as much as feasibly possible at the good price found
    var energyMaxAmount   = 0.9*sellResource.energyAmount/unitCost;                        //Max amount of resources permitted to be moved with this
    return Math.min(resourceMaxAmount, energyMaxAmount);
}

module.exports = {
    calculate_transaction_manual,
    calculate_transaction_automatic
};