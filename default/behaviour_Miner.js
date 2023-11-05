var miningTasks = {
    goMine : function(creep){
        if(creep.memory.isMining){
            var sources = creep.room.find(FIND_SOURCES);
            var closestSource = creep.pos.findClosestByPath(sources);
            if(creep.harvest(closestSource) == ERR_NOT_IN_RANGE){
                creep.moveTo(closestSource)
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = false;
            }
        }
        else{
            //Move resources to storage
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||(structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            var target  = creep.pos.findClosestByPath(transferTargets);
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            
            //Reset mining condition
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = true;
            }
        }
    },
    respawn_initial : function(){
        var creepName = "Miner"+Game.time;
        Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], creepName, {memory:{role:"Miner"}}, {memory:{isMining:true}});
    },
    respawn_strong : function(relatedCreepNumber){
        if(relatedCreepNumber < 6){
            var creepName = "Miner"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], creepName, {memory:{role:"Miner"}}, {memory:{isMining:true}});
        }
    }
};

module.exports = miningTasks;