var upgradingTasks = {
    task : function(creep){
        if(creep.memory.isUpgrading){
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.controller);
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
            }
            else{
                creep.memory.isUpgrading = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 6){
            var creepName = "Upgrader"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([MOVE, CARRY, WORK, WORK], creepName, {memory:{role:"Upgrader", isUpgrading:false}});
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

module.exports = upgradingTasks;