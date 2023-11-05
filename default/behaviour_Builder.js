var buildingTasks = {
    goBuild : function(creep){
        if(creep.memory.isBuilding){
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
                //var targets = creep.room.find(Game.constructionSites);
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if(targets.length > 0){
                    if(creep.build(targets[0]) == ERR_NOT_IN_RANGE){
                        creep.moveTo(targets[0]);
                    }
                }
                //## MAYBE MOVE CREEPS TO A SAFE FLAG SPOT IF NO SITES NEED TO BE MADE ##
            }
            else{
                creep.memory.isBuilding = false;
            }
        }
        else{
            var spawn = Game.spawns["Spawn1"];
            if(creep.withdraw(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isBuilding = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 1){
            var creepName = "Builder"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE, MOVE, MOVE], creepName, {memory:{role:"Builder"}}, {memory:{isBuilding:false}});
        }
    }
}

module.exports = buildingTasks;