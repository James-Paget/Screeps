var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        var resourceType = RESOURCE_ENERGY; //#### WHATEVER MINERAL IS BEING MINED ####
        if(isExtracting){
            //Go mine from somewhere
            //pass

            if(creep.store.getFreeCapacity(resourceType) == 0){
                creep.memory.isExtracting = false;
            }
        }
        else{
            //go deliver somewhere
            //pass

            if(creep.store.getUsedCapacity(resourceType) == 0){
                creep.memory.isExtracting = true;
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        //#### THIS WILL WANT TO HAVE A SOURCE ID --> IN REALITY IS AN EXTRACTOR ID ####
        var creepSpec = {roomID:roomID, sourceID:null, parts:[WORK, WORK, CARRY, MOVE, MOVE, MOVE], role:"Extractor", time:Game.time};
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

module.exports = extractor_tasks;