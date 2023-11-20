var {getTarget_gatherer, removeCreep_energyRooms} = require("cycle_energyAcquire");
var {getSpawnerRoomIndex} = require("manager_Memory");

var gatherer_tasks = {
    task : function(creep){
        if(creep.memory.ID == null){
            creep.memory.ID = creep.id;}    //## NOT A GREAT METHOD BUT WORKS FOR NOW ##
            
        var target = getTarget_gatherer(creep);
        if(creep.memory.isGathering){
            //Collect resources
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            //Reset gather condition
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isGathering = false;
            }
        }
        else{
            //Drop off resources
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            //Reset gather condition
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isGathering = true;
            }
        }
    },
    queue : function(roomID, sourceID, parts){
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Gatherer", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:creepSpec.roomID, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, ID:null, isGathering:true}});
    },
    death : function(houseKey, creepRole, creepID){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. Remove from energyRooms
        2. ...
        */
        //1
        removeCreep_energyRooms(houseKey, creepRole, creepID);
    }
};

module.exports = gatherer_tasks;