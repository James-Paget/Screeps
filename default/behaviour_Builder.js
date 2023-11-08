var buildingTasks = {
    task : function(creep){
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
    respawn : function(creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        //[WORK, CARRY, MOVE, MOVE]
        var spawner   = Game.spawns["Spawn1"];
        var creepName = creepSpec[3]+Game.time;
        var houseKey  = {roomID:creepSpec[0], sourceID:creepSpec[1]};
        spawner.spawnCreep(creepSpec[2], creepName, {memory:{role:creepSpec[3], houseKey:houseKey, isBuilding:false}});
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