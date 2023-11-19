var {getSpawnQueueIndex} = require("manager_Memory");

var upgradingTasks = {
    task : function(creep){
        if(creep.memory.isUpgrading){
            if(Memory.spawnQueue[getSpawnQueueIndex(creep.memory.spawnKey.spawnID)].queue.length == 0){    //Only upgrade when no one is being spawned at YOUR spawner, e.g excess energy
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.controller);
                }
            }
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isUpgrading = false;
            }
        }
        else{
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                var energyCaches = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_SPAWN && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_EXTENSION && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) )}});
                if(creep.room.energyAvailable >= 500){   //If at least 500 total energy available, then take it and use it to upgrade
                    var target = creep.pos.findClosestByPath(energyCaches);
                    if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                else{
                    //Move out of the way
                    creep.moveTo(creep.room.controller);
                }
            }
            else{
                creep.memory.isUpgrading = true;
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:null, sourceID:null, parts:[WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], role:"Upgrader", time:Game.time};
        Memory.spawnQueue[getSpawnQueueIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        //[WORK, WORK, MOVE, CARRY]
        //var creepName = creepSpec.role+Game.time;
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:creepSpec.roomID, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isUpgrading:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = upgradingTasks;