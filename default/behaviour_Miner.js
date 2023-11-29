var {getTarget_miner, removeCreep_energyRooms} = require("cycle_energyAcquire");
var {getSpawnerRoomIndex} = require("manager_Memory");

var miner_tasks = {
    task : function(creep){
        if(creep.memory.ID == null){        //################# COULD CHANGE TO !....
            creep.memory.ID = creep.id;}    //## NOT A GREAT METHOD BUT WORKS FOR NOW ##

        var target = getTarget_miner(creep);    //This function already considers the state of the miner to determine what must be done
        if(creep.memory.isMining){
            var inCorrectRoom = creep.room.name == creep.memory.houseKey.roomID;
            if(inCorrectRoom){
                if(creep.memory.travelRoute){
                    delete creep.memory.travelRoute;}
                //In correct room, therefore mine to the source you are here for
                if(creep.harvest(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }
            else{
                //Not in correct room, therefore path to this room
                if(!creep.memory.travelRoute){   //Deleted once it is no longer in use
                    //Generate route to the final room
                    creep.memory.travelRoute = Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID);}
                else{
                    //Follow the route to the final room
                    if(creep.room.name == creep.memory.travelRoute[0].room){    //If in next room, remove it to mark it as travelled
                        creep.memory.travelRoute.shift();}
                    if(creep.memory.travelRoute.length > 0){
                        creep.moveTo(creep.memory.travelRoute[0].exit);}
                    //#############################################################################################
                    //## MAY BREAK AS I ENTER THE FINAL ROOM HERE, HE MAY PAUSE FOR 2 FRAMES BEFORE PROPER GOING ##
                    //#############################################################################################
                }
            }
            //Reset mining condition
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = false;
            }
        }
        else{
            //Move resources to storage
            var inCorrectRoom = creep.room.name == creep.memory.houseKey.roomID;
            if(inCorrectRoom){
                if(creep.memory.travelRoute){
                    delete creep.memory.travelRoute;}
                //In correct room, therefore deposit materials
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }
            else{
                //Not in correct room, therefore path to this room
                if(!creep.memory.travelRoute){   //Deleted once it is no longer in use
                    //Generate route to the final room
                    creep.memory.travelRoute = Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID);}
                else{
                    //Follow the route to the final room
                    if(creep.room.name == creep.memory.travelRoute[0].room){    //If in next room, remove it to mark it as travelled
                        creep.memory.travelRoute.shift();}
                    if(creep.memory.travelRoute.length > 0){
                        creep.moveTo(creep.memory.travelRoute[0].exit);}
                    //#############################################################################################
                    //## MAY BREAK AS I ENTER THE FINAL ROOM HERE, HE MAY PAUSE FOR 2 FRAMES BEFORE PROPER GOING ##
                    //#############################################################################################
                }
            }
            //Reset mining condition
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = true;
            }
        }
    },
    queue : function(roomID, sourceID, parts){
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Miner", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        - Spawns at the specified spawner ID, and this is registered as their 'home' spawner in spawnKey
        */
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:creepSpec.roomID, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, ID:null, isMining:true}});
    },
    death : function(houseKey, creepRole, creepID){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. Remove itself from energyRooms->sources->miners
        2. ...
        */
        //1
        removeCreep_energyRooms(houseKey, creepRole, creepID);
    }
};

module.exports = miner_tasks;