var repairingTasks = {
    goRepair : function(creep){
        /*
        Repair priority;
        1. ...
        */
        if(creep.memory.isRepairing){
            var targets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return (structure.hits < structure.hitsMax*0.8)}});    //### CAREFUL, THIS LIKELY WILL INSTANTLY GO BELOW THRESHOLD AGAIN IN SECONDFS ##
            var target  = creep.pos.findClosestByPath(targets);
            if(creep.repair(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isRepairing = false;
            }
        }
        else{
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            var target = creep.pos.findClosestByPath(transferTargets);
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }

            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isRepairing = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 1){
            var creepName = "Repairer"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([WORK, MOVE, CARRY], creepName, {memory:{role:"Repairer", isRepairing:true}});
        }
    }
}

module.exports = repairingTasks;