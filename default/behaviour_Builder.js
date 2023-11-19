var {getSpawnQueueIndex} = require("manager_Memory");

var buildingTasks = {
    task : function(creep){
        if(creep.memory.isBuilding){
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
                var towersNeedingSupply = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return ( (structure.structureType == STRUCTURE_TOWER) && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) )}});
                var towersSupplied      = (towersNeedingSupply.length == 0);
                if(towersSupplied){
                    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                    if(targets.length > 0){
                        if(creep.build(targets[0]) == ERR_NOT_IN_RANGE){
                            creep.moveTo(targets[0]);
                        }
                    }
                }
                else{
                    var target = creep.pos.findClosestByPath(towersNeedingSupply);
                    if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                //## MAYBE MOVE CREEPS TO A SAFE FLAG SPOT IF NO SITES NEED TO BE MADE ##
            }
            else{
                creep.memory.isBuilding = false;
            }
        }
        else{
            //Prepare for construction
            var spawn = Game.getObjectById(creep.spawnKey.spawnID);
            if(creep.withdraw(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isBuilding = true;
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:null, sourceID:null, parts:[WORK, CARRY, MOVE], role:"Builder", time:Game.time};
        Memory.spawnQueue[getSpawnQueueIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        //[WORK, CARRY, MOVE, MOVE]
        //var creepName = creepSpec.role+Game.time;
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:creepSpec.roomID, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isBuilding:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = buildingTasks;