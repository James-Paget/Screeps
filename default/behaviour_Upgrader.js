var {getSpawnerRoomIndex} = require("manager_Memory");

var upgrading_tasks = {
    task : function(creep){
        if(!creep.memory.isRenewing) { creep.memory.isRenewing=false; }    // If creep doesn't have renewal memory setup, set it up now
        if(creep.ticksToLive < 100) { creep.memory.isRenewing = true; }    // If under 100 ticks left, try to go back to spawn to renew

        if(creep.memory.isRenewing==true) { // If renewing, move to spawner when it is free (NOT respawning)
            const availableEnergy = Game.rooms[creep.spawnKey.roomID].energyAvailable;
            if(creep.ticksToLive >= 500) { creep.memory.isRenewing == false; }
            else {
                const spawner = Game.rooms[creep.spawnKey.roomID].find(FIND_STRUCTURES, {filter:(structure) => {return ( (structure.structureType == STRUCTURE_SPAWN) && (structure.progress==null) )}});
                if(spawner) {
                    if((!spawner.spawning) && (availableEnergy>100)) {
                        if(spawner.renewCreep(creep) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(spawner);
                        }
                    }
                }
            }
        } else {    // If not renewing, behave normally
            if(creep.memory.isUpgrading){
                //if(Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].queue.length == 0){    //Only upgrade when no one is being spawned at YOUR spawner, e.g excess energy ==> THIS SEEMS EXCESSIVE AND UNCESSARY GIVEN THE 80% CONDITION
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.controller);
                }
            }
            else{
                if(creep.room.energyAvailable >= 0.5*creep.room.energyCapacityAvailable){   //Above X% energy in order to start upgrading
                    var energyCaches = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_SPAWN && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_EXTENSION && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) )}});
                    var target = creep.pos.findClosestByPath(energyCaches);
                    if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                else{
                    //Move out of the way
                    if(Game.flags["UpgraderWait"]){
                        creep.moveTo(Game.flags["UpgraderWait"].pos);}
                    else{
                        creep.moveTo(creep.room.controller);}
                }
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isUpgrading = true;}
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isUpgrading = false;}
        }
    },
    generateCreepParts : function(spawnerRoomID){
        /*
        Looks at the state of the spawner and determines what modules to build on this creep
        */
        var creepParts   = null;
        var creepsOwned  = _.filter(Game.creeps, function(creep) {return (creep.memory.spawnKey.roomID == spawnerRoomID && creep.memory.role == "Upgrader")}); //Owned by this spawner, of this type
        var creepNumberRequired = 2 -creepsOwned.length;    //<-- Specify the number of creeps wanted here
        if(creepNumberRequired > 0){    //If actually need any more workers
            var workPerCreep = 2;       //A rough Guess at an upper bound/ideal value --> Can make it more sophisticated
            var energyMax = Game.rooms[spawnerRoomID].energyCapacityAvailable;
            var partSet = [WORK,CARRY,MOVE,MOVE];   //Base line body parts required
            for(var i=0; i<workPerCreep; i++){      //Attempts to spawn the most expensive (but not overkill) miner it can afford
                partSet.unshift(WORK);
                partSet.unshift(MOVE);
                var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
                if(energyCost > energyMax){
                    partSet.shift();
                    partSet.shift();
                    break;}
            }
            creepParts = partSet;
        }
        return creepParts;
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Upgrader", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        //[WORK, WORK, MOVE, CARRY]
        //var creepName = creepSpec.role+Game.time;
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isUpgrading:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = upgrading_tasks;