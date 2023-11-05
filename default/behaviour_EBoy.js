var EBoyTasks = {
    goPerformTasks : function(creep){
        /*
        Will;
        1. Move energy from spawn to extensions ---> PROBABLY JUST OBSOLETE
        2. Loot dead bodies
        3. Loot energy left on the floor
        */
        if(!goAllocateEnergy(creep)){
            if(!goScavenge(creep)){
                goSearchFloor(creep);
            }
        }
    },
    goAllocateEnergy : function(creep){
        /*
        Moves energy from the spawn to extensions
        This behaviour is performed as early as possible
        */
        var isAllocating = false;
        var extensions = creep.room.find(STRUCTURE_EXTENSION);
        for(var extension in extensions){
            if(extension.store.getFreeCapacity() > 20){  //If any require some threshold of energy
                isAllocating = true;
                if(creep.store.getUsedCapacity(RESOURCE_ENERGY) < extension.store.getFreeCapacity(RESOURCE_ENERGY)){                   //Get energy yourself
                    if(creep.withdraw(Game.spawns["Spawn1"], RESOURCE_ENERGY, extension.store.getFreeCapacity(RESOURCE_ENERGY)-creep.store.getUsedCapacity(RESOURCE_ENERGY)) == ERR_NOT_IN_RANGE){
                        creep.moveTo(Game.spawns["Spawn1"]);
                    }
                }
                else{                                   //Then deliver it to the extension
                    if(creep.transfer(extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(extension);
                    }
                }
            }
        }
        return isAllocating;
    },
    goScavenge : function(creep){
        //pass
    },
    goSearchFloor : function(creep){
        //pass
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 1){
            var creepName = "EBoy"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE, MOVE, MOVE], creepName, {memory:{role:"EBoy"}});
        }
    }
}
module.exports = EBoyTasks;