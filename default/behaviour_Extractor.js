var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        if(creep.memory.sourceID != "null"){      //If an extractor exists --> source here referes to mineral instead
            var resourceType = Game.getObjectById(creep.memory.houseKey.sourceID).mineralType;
            if(creep.memory.isExtracting){
                var target = Game.getObjectById(creep.memory.houseKey.sourceID);
                if(target.mineralAmount > 0){  //----->Start mining minerals
                    //Go mine from somewhere
                    //####################################################
                    //## MAKE IT WIAT FOR THE COOLDOWN BETWEEN HARVESTS ##
                    //####################################################
                    if(creep.harvest(target, resourceType) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                else{   //----->Start selling minerals
                    target = Game.getObjectById(Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage[0]);
                    if(creep.withdraw(target, resourceType) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                if(creep.store.getFreeCapacity(resourceType) == 0){
                    creep.memory.isExtracting = false;
                }
            }
            else{
                if(target.mineralAmount > 0){  //----->Start mining minerals
                    //go deliver somewhere
                    if(Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage.length > 0){
                        var target = Game.getObjectById(Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage[0]);
                        if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);
                        }
                    }
                }
                else{
                    var target = Game.getObjectById("6564e91d3eb96984a8e212a3");
                    if(target){
                        if(target.transfer(target, RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE){
                            target.moveTo(target);
                        }
                    }
                }
                if(creep.store.getUsedCapacity(resourceType) == 0){
                    creep.memory.isExtracting = true;
                }
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        //##################################
        //## NEEDS A SCALABLE PARTS LIMIT ##
        //##################################
        var creepSpec = {roomID:roomID, sourceID:getExtractionID(roomID), parts:[WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], role:"Extractor", time:Game.time};
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

module.exports = extractor_tasks;