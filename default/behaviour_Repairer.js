var {getSpawnQueueIndex} = require("manager_Memory");

var repairingTasks = {
    task : function(creep){
        /*
        Repair priority;
        1. Containers
        2. Turrets
        3. Other not walls
        4. Walls
        */
        if(creep.memory.isRepairing){
            //Target selection
            //###############################################################################
            //### CAREFUL, THIS LIKELY WILL INSTANTLY GO BELOW THRESHOLD AGAIN IN SECONDFS ##
            //###############################################################################
            var targetsPrio;
            targetsPrio = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_CONTAINER) && (structure.hits < structure.hitsMax*0.8) )}});
            if(targetsPrio.length == 0){
                targetsPrio = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_TOWER) && (structure.hits < structure.hitsMax*0.8) )}});
                if(targetsPrio.length == 0){
                    targetsPrio = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType != STRUCTURE_WALL) && (structure.hits < structure.hitsMax*0.8) )}});
                    if(targetsPrio.length == 0){
                        if(creep.room.energyCapacityAvailable -creep.room.energyAvailable <= 50){   //If loads of spare energy, then do walls                                                                       //Do Walls
                            targetsPrio = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_WALL) && (structure.hits < structure.hitsMax*0.0001) )}});      // --> Do all walls to a small degree
                            if(targetsPrio.length == 0){                                                                                                                                                            //
                                targetsPrio = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_WALL) && (structure.hits < structure.hitsMax*0.01) )}});    // --> Do all walls to a larger degree after
                            }
                        }
                    }
                }
            }
            var target  = creep.pos.findClosestByPath(targetsPrio);
            //Target execution
            if(creep.repair(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isRepairing = false;
            }
        }
        else{
            //## MAYBE ADD A CONDITION TO MAKE THEM MOVE AWAY WHEN JUST SITTING AROUND ##
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0))}});
            var target = creep.pos.findClosestByPath(transferTargets);
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }

            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isRepairing = true;
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:null, sourceID:null, parts:[WORK, CARRY, MOVE], role:"Repairer", time:Game.time};
        Memory.spawnQueue[getSpawnQueueIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        //[WORK, MOVE, CARRY]
        //var creepName = creepSpec.role+Game.time;
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:creepSpec.roomID, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isRepairing:true}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = repairingTasks;