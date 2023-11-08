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
                        if(creep.room.energyCapacityAvailable -creep.room.energyAvailable <= 30){   //If loads of spare energy, then do walls
                            targetsPrio = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return (structure.hits < structure.hitsMax*0.8)}});
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
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 1){
            var creepName = "Repairer"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([WORK, MOVE, CARRY], creepName, {memory:{role:"Repairer", isRepairing:true}});
        }
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