var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        //var resourceType = RESOURCE_ENERGY; //#### WHATEVER MINERAL IS BEING MINED ####
        if(creep.memory.sourceID != "null"){      //If an extractor exists --> source here referes to mineral instead
            if(creep.memory.isExtracting){
                //Go mine from somewhere
                var target = Game.getObjectById(creep.memory.houseKey.sourceID);
                //####################################################
                //## MAKE IT WIAT FOR THE COOLDOWN BETWEEN HARVESTS ##
                //####################################################
                if(creep.harvest(target) == ERR_NOT_IN_RANGE){                  //Leave resource arg blank so it harvests whatever mineral it is
                    creep.moveTo(target);
                }

                if(creep.store.getFreeCapacity() == 0){
                    creep.memory.isExtracting = false;
                }
            }
            else{
                //go deliver somewhere
                if(Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage.length > 0){
                    var target = Game.getObjectById(Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage[0]);
                    if(creep.transfer(target) == ERR_NOT_IN_RANGE){         //Leave resource arg blank so it harvests whatever mineral it is
                        creep.moveTo(target);
                    }

                    if(creep.store.getUsedCapacity() == 0){             //Leave resource arg blank so it harvests whatever mineral it is
                        creep.memory.isExtracting = true;
                    }
                }
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        //##################################
        //## NEEDS A SCALABLE PARTS LIMIT ##
        //##################################
        var creepSpec = {roomID:roomID, sourceID:getExtractionID(roomID), parts:[WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], role:"Extractor", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:creepSpec.roomID, spawnID:spawnerID};
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