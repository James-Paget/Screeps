var gatheringTasks = {
    goGather : function(creep){
        if(creep.memory.isGathering){
            var target = Game.findObjectById(creep.memory.containerID);
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }

            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isGathering = false;
            }
        }
        else{
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||(structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            var target  = creep.pos.findClosestByPath(transferTargets);
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }

            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isGathering = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < getGathererNumberRequired(Game.spawns["Spawn1"].room)){
            var creepName = "Gatherer"+Game.time;
            var assignedContainerID = getAssignedContainerID();
            Game.spawns["Spawn1"].spawnCreep([MOVE, MOVE, MOVE, MOVE, CARRY, CARRY], creepName, {memory:{role:"Gatherer", isGathering:true, containerID:assignedContainerID}});}
    }
}

function getGathererNumberRequired(room){
    var containerNumber = room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_CONTAINER) && (structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) )}});
    return 2*containerNumber.length;
}
function getAssignedContainerID(){
    /*
    ################################
    ## CONTAINER WILL NEED REPAIR ##
    ################################
    */
    return "0";
}

module.exports = gatheringTasks;