var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        if(creep.memory.sourceID != "null"){      //If an extractor exists --> source here referes to mineral instead
            var resourceType = Game.getObjectById(creep.memory.houseKey.sourceID).mineralType;
            var target = Game.getObjectById(creep.memory.houseKey.sourceID);
            if(target.mineralAmount > 0){   //State; Mining Mineral
                if(creep.memory.isExtracting){
                    //####################################################
                    //## MAKE IT WIAT FOR THE COOLDOWN BETWEEN HARVESTS ##
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