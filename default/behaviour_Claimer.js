var {getSpawnerRoomIndex} = require("manager_Memory");

var claimer_tasks = {
    task : function(creep){
        /*
        (1). Path towards (without vision) room controller (sourceID)
        (2). Continually reserve it
        */
        //pass
    },
    generateCreepParts : function(spawnerRoomID){
        /*
        Looks at the state of the spawner and determines what modules to build on this creep

        ################################################
        ## ALLOW A RESERVER AND A CAPTURER TO BE MADE ## --> CAPTURER MORE MANUAL THAN RESERVER
        ################################################
        */
        var creepParts  = null;
        var claimerRequired = get_claimerRequired();    //Send N claimers to each energy room (N likely = 1), at time periods T
        if(claimerRequired != null){                    //!= null as this is NOT a boolean variable, => treat it like one with this
            //Basic claimer -> Should never really get more complex
            creepParts = [CLAIM, MOVE];
        }
        return creepParts;
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Claimer", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

function get_claimerRequired(){
    /*
    Checks more claimers are required anywhere, and returns where
    (1) Add all room candidates for claiming
    (2) Remove perma claimed rooms (spawner rooms)
    (3) Look through current claimers, cross rooms of requiredRoomIDs list, create a new claimer for an unfulfilled room
    */
    var claimerDetails  = null;  //Info about where a claimer is needed
    var requiredRoomIDs = [];
    //(1)
    for(var i=0; i<Memory.energyRooms.length; i++){
        requiredRoomIDs.push(Memory.energyRooms[i].ID);
    }
    //...
    //(2)
    for(var i=0; i<Memory.spawnerRooms.length; i++){
        for(var j=requiredRoomIDs.length-1; j>=0; j--){
            if(Memory.spawnerRooms[i].roomID == requiredRoomIDs[j]){
                requiredRoomIDs.splice(j,1);    //Remove jth element
            }
        }
    }
    //...
    //(3)
    for(name in Game.creeps){
        if(Game.creeps[name].role == "Claimer"){
            //Look through all claimers
            //...
            //NEED TO MARK OFF ENERGY ROOMS -> RULE OUT SPAWNER ROOMS BY DEFAULT
        }
    }
}

module.exports = {
    claimer_tasks
}