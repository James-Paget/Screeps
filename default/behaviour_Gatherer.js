var gatheringTasks = {
    goGather : function(creep){
        if(creep.memory.isGathering){
            var target = Game.getObjectById(creep.memory.containerID);
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
            var assignedContainerID = getAssignedContainerID(Game.spawns["Spawn1"].room);
            Game.spawns["Spawn1"].spawnCreep([MOVE, MOVE, MOVE, MOVE, CARRY, CARRY], creepName, {memory:{role:"Gatherer", isGathering:true, containerID:assignedContainerID}});}
    }
}

function getGathererNumberRequired(room){
    var containerNumber = room.find(FIND_STRUCTURES, {filter : (structure) => {return ( structure.structureType == STRUCTURE_CONTAINER )}});
    return 2*containerNumber.length;
}
function getAssignedContainerID(room){
    /*
    ################################
    ## CONTAINER WILL NEED REPAIR ##
    ######################################
    ## HAVE THIS STORED AND JUST UPDATE ##
    ######################################
    */
    //Finds number of gatherers looking after each container
    var containers = room.find(FIND_STRUCTURES, {filter : (structure) => {return (structure.structureType == STRUCTURE_CONTAINER)}});
    var allGatherers = _.filter(Game.creeps, function(creep) { return (creep.memory.role == "Gatherer") });
    var gatherersAssigned = [];
    for(var i in containers){
        gatherersAssigned.push(0);}
    for(var gathererIndex in allGatherers){
        for(var containerIndex in containers){
            if(allGatherers[gathererIndex].memory.containerID == containers[containerIndex].id){
                gatherersAssigned[containerIndex] = gatherersAssigned[containerIndex]+1;        //## TRY WITH ++, LIST MAY NOT LIKE IT ##
                break;
            }
            containerIndex++;
        }
    }
    //Find spaces for this new guy
    var containerID = "0";
    for(var containerIndex in containers){
        if( gatherersAssigned[containerIndex] < 2){    //If has free space
            containerID = containers[containerIndex].id;
            break;
        }
    }
    return containerID
}

module.exports = gatheringTasks;