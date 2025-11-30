var {getSpawnerRoomIndex} = require("manager_Memory");

var scientist_tasks = {
    task : function(creep){
        var target = getTarget_scientist(creep);
        if(target){
            // isWorking
        }
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Scientist", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID , sourceID:null};
        var spawnKey = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isResearching:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

function getTarget_scientist(creep){
    /*
    . Finds targets for scientists
    . This consists of carrying different resources to and from the main mineral storage and each of the labs

    resupplyTowers = towers that NEED a resupply
    */
    var target = null;
    // pass
    return target;
}

module.exports = scientist_tasks;