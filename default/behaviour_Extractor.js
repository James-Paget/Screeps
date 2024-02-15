var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        /*
        Note; Mention of material here can be minerals or energy
        */
        if(Game.time.toString().slice(-1) == 2){                                        //Periodically, e.g every frame ending in X, re-evaluate the state of the creep
            creep.memory.creepState = determineCreepState_extractor(creep);}            //Will determine what state the creep should be in for general behaviour
        if(creep.memory.creepState){                                                    //When you have decided what you need to do, ... then do stuff
            targetSpec = getTargetSpec_extractor(creep, creep.memory.creepState);       //Target found based on creepState
            if(targetSpec){
                var target       = Game.getObjectById(targetSpec.ID);
                var resourceType = targetSpec.resourceType;
                if(target){
                    if(creep.memory.creepState.name == "mine_minerals"){
                        //Mine minerals
                        if(creep.harvest(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    if(creep.memory.creepState.name == "unload_storeToTarget"){
                        //Unload inventory into main storage
                        if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    if(creep.memory.creepState.name == "load_storeFromTarget"){
                        //Retrieve [material] from main storage
                        if(creep.withdraw(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    //...
                }
            }
        }
        /*
        if(creep.memory.sourceID != "null"){      //If an extractor exists --> source here referes to mineral instead
            var resourceType = Game.getObjectById(creep.memory.houseKey.sourceID).mineralType;
            var target = Game.getObjectById(creep.memory.houseKey.sourceID);
            if(target.mineralAmount > 0){   //State; Mining Mineral
                if(creep.memory.isExtracting){
                    //####################################################
                    //## MAKE IT WAIT FOR THE COOLDOWN BETWEEN HARVESTS ##
                    //####################################################
                    if(creep.harvest(target, resourceType) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                else{
                    var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
                    if(mineralStorage_available.length > 0){
                        target = Game.getObjectById(mineralStorage_available[0]);
                        if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);
                        }
                    }
                }
            }
            else{                           //State; Fill up terminal
                var terminals_available      = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {return( (structure.structureType == STRUCTURE_TERMINAL) && (structure.progress == null) )}});
                var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
                if( (terminals_available.length > 0) && (mineralStorage_available.length > 0) ){
                    var mineralLimitSatisfied = Game.getObjectById(mineralStorage_available[0]).store.getUsedCapacity(resourceType) > Game.getObjectById(mineralStorage_available[0]).store.getCapacity()/3.0;
                    if(!mineralLimitSatisfied){
                        if(creep.memory.isExtracting){
                            target = Game.getObjectById(mineralStorage_available[0]);
                            if(creep.withdraw(target, resourceType) == ERR_NOT_IN_RANGE){
                                creep.moveTo(target);
                            }
                        }
                        else{
                            target = terminals_available[0];
                            if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                                creep.moveTo(target);
                            }
                        }
                    }
                }
            }
            if(creep.store.getFreeCapacity(resourceType) == 0){
                creep.memory.isExtracting = false;
            }
            if(creep.store.getUsedCapacity(resourceType) == 0){
                creep.memory.isExtracting = true;
            }
        }
        */
    },
    generateCreepParts : function(spawnerRoomID){
        /*
        Looks at the state of the spawner and determines what modules to build on this creep
        
        Only consider making extractor creeps if;
        (1) You have any extractor constructs
        (2) You have a mineral with quantity > 0
        (3) OR You have BOTH a mineral with 0 quantity & storage with non-zero quantity it is tethered to
        */
        var creepParts  = null;
        var extractors_available     = Game.rooms[spawnerRoomID].find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_EXTRACTOR && structure.progress == null)}});    //If you need to mine minerals
        var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].mineralStorage;
        var ableToExtract = (extractors_available.length > 0) && (mineralStorage_available.length > 0);
        if(ableToExtract){
            var minerals_available    = Game.rooms[spawnerRoomID].find(FIND_MINERALS);
            var harvestingNeeded      = minerals_available[0].mineralAmount > 0;
            var terminalFillingNeeded = (minerals_available[0].mineralAmount == 0) && (Game.getObjectById(mineralStorage_available[0]).store.getUsedCapacity(minerals_available[0].mineralType) > 0);
            if(harvestingNeeded || terminalFillingNeeded){  //If extractor requires creeps now
                var creepsOwned  = _.filter(Game.creeps, function(creep) {return (creep.memory.spawnKey.roomID == spawnerRoomID && creep.memory.role == "Extractor")});         //Owned by this spawner, of this type
                var creepNumberRequired = 2 -creepsOwned.length;    //<-- Specify the number of creeps wanted here
                if(creepNumberRequired > 0){    //If actually need any more workers
                    var workPerCreep = 3;       //A rough Guess at an upper bound/ideal value --> Can make it more sophisticated
                    var energyMax = Game.rooms[spawnerRoomID].energyCapacityAvailable;
                    var partSet = [WORK,CARRY,CARRY,MOVE];            //Base line body parts required
                    for(var i=0; i<workPerCreep; i++){  //Attempts to spawn the most expensive (but not overkill) miner it can afford
                        partSet.unshift(WORK);
                        partSet.unshift(MOVE);
                        var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
                        if(energyCost > energyMax){
                            partSet.shift();
                            partSet.shift();
                            break;}
                    }
                    creepParts = partSet;
                }
            }
        }
        return creepParts;
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Extractor", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isExtracting:true}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

function determineCreepState_extractor(creep){
    /*
    . Determines the immediate objective the creep wants to resolve
    . This follows a standard priority chain
    . An object is returned that contains a [name, target, resourceType] ????????????

    1.1. If there are minerals to be mined, and you are NOT holding anything, [Go mine these]
    1.2. If there are minerals to be mined, and you are holding something, [Store this]
    2.1. If no minerals, and you are NOT holding minerals, [Collect minerals]
    2.2. If no minerals, and you are holding minerals, [process these in a factory]
    3.

    ################################################################################################################################
    ## NOTE HERE; ALWAYS ARE USING THE MINERAL IN THEIR ROOM --> THIS ASSUMES NOTHING IS TRADED OR BROUGHT INTO THE SYSTEM OTHER  ##
    ## THAN THE MINERAL YOU HAVE ---> HAVE SOME CHAIN OF COMMAND PASS DOWN THE MINERAL YOU WISH TO WORK WITH RATHER THAN DO THIS  ##
    ################################################################################################################################
    ##
    ## --> ESPECIALLY TRUE FOR WHEN YOU START MOVING ENERGY AROUND TOO
    ##
    */
    var stateName = null;
    var targetID  = null;
    var resourceType = null;
    var mineralPatches = creep.room.find(FIND_MINERALS);
    if(mineralPatches.length > 0){
        if(mineralPatches[0].mineralAmount > 0){
            if(creep.store.getUsedCapacity() > 0){
                //(1.2)
                var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
                if(mineralStorage_available.length > 0){
                    stateName = "unload_storeToTarget";
                    targetID  = mineralStorage_available[0];
                    resourceType = mineralPatches[0].mineralType;}      //################
            }
            else{
                //(1.1)
                stateName = "mine_minerals";
                targetID  = mineralPatches[0].id;
                resourceType = mineralPatches[0].mineralType;           //################
            }
        }
        else{
            if(creep.store.getUsedCapacity() > 0){
                //(2.2)
                var factories_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_FACTORY)}});
                if(factories_available.length > 0){
                    stateName = "unload_storeToTarget";
                    targetID  = factories_available[0].id;
                    resourceType = mineralPatches[0].mineralType;}      //################
            }
            else{
                //(2.1)
                var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
                if(mineralStorage_available.length > 0){
                    stateName = "load_storeFromTarget";
                    targetID  = mineralStorage_available[0];
                    resourceType = mineralPatches[0].mineralType;}      //################
            }
        }
    }
    var creepState = {name:stateName, targetID:targetID, resourceType:resourceType}
    return creepState;
}
function getTargetSpec_extractor(creep, creepState){
    /*
    . Determines the target that is required for the given creepState

    #################################################################################
    ## MAY NOT EVEN USE IDs HERE, JUST PARSE RESOURCE TYPE + OTHER SPECIFICS MAYBE ## ----> both not used currently ---> maybe reconsider a bunch
    #################################################################################
    */
    var targetSpec = null;
    if(creepState.name == "mine_minerals"){
        //Mine minerals
        var mineralPatches = creep.room.find(FIND_MINERALS);    //Mineral Object
        if(mineralPatches.length > 0){
            if(mineralPatches[0].mineralAmount > 0){            //If there is anything to be mined, go mine it
                targetSpec = {ID:mineralPatches[0].id, resourceType:mineralPatches[0].resourceType};
            }
        }
    }
    else if(creepState.name == "unload_storeToTarget"){
        //Unload inventory into main storage
        targetSpec = {ID:creepState.targetID, resourceType:creepState.resourceType}    //###### NULL maybe cause problems
    }
    else if(creepState.name == "load_storeFromTarget"){
        //Retrieve [material] from main storage
        targetSpec = {ID:creepState.targetID, resourceType:creepState.resourceType}    //###### NULL maybe cause problems
    }
    //...
    return targetSpec;
}

function getExtractionID(roomID){
    /*
    . Looks in the room they are spawned for the 1 extractor present
    . Records its ID
    */
    var sourceID = null;
    var extractorsInRoom = Game.rooms[roomID].find(FIND_MINERALS);
    if(extractorsInRoom.length > 0){
        sourceID = extractorsInRoom[0].id;}
    return sourceID;
}

module.exports = {
    getExtractionID,
    extractor_tasks};