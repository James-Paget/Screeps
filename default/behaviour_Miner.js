var {getTarget_miner, removeCreep_energyRooms} = require("cycle_energyAcquire");
var {getSpawnerRoomIndex} = require("manager_Memory");

var miner_tasks = {
    task : function(creep){
        if(creep.memory.ID == null){        //################# COULD CHANGE TO !....
            creep.memory.ID = creep.id;}    //## NOT A GREAT METHOD BUT WORKS FOR NOW ##

        var target = getTarget_miner(creep);    //&& Considers all factors, returns choice --> nulls are allowed if nothing is required
        if(target){                             //If there is any target required
            var inRequiredRoom = (creep.room.name == target.room.name);
            if(inRequiredRoom){
                //(1) Reset routing
                if(creep.memory.travelRoute){           //If you still have a travel route, clear that space
                    delete creep.memory.travelRoute;}
                //(2) Do task
                if(creep.memory.isMining){              //Going to mine    -->Will be the "houseKey" room
                    if(creep.harvest(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);}
                }
                else{                                   //Going to deposit -->Could be anywhere (anywhere to deposit at)
                    var repairNeeded = (target.structureType == STRUCTURE_CONTAINER && target.hits <= 0.8*target.hitsMax);    //If container needs repairing
                    if(repairNeeded){
                        if(creep.repair(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    else{
                        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                }
            }
            else{   //Move to required room
                if(!creep.memory.travelRoute){                                                          //Create multi-room travel route
                    creep.memory.travelRoute = Game.map.findRoute(creep.room.name, target.room.name);}  //
                else{
                    if(creep.memory.travelRoute.length == 0){   //Backup precaution
                        delete creep.memory.travelRoute;}       //
                    else{
                        if(creep.room.name == creep.memory.travelRoute[0].room){                                            //Move along travel route to required room
                            creep.memory.travelRoute.shift();}                                                              //
                        if(creep.memory.travelRoute.length > 0){                                                            //
                            creep.moveTo(creep.pos.findClosestByPath(creep.room.find(creep.memory.travelRoute[0].exit)));}  //
                    }
                }
            }
        }
        //Reset mining condition
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isMining = true;}
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isMining = false;}





        /*
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
                        creep.moveTo(creep.pos.findClosestByPath(creep.room.find(creep.memory.travelRoute[0].exit)));}
                    //#############################################################################################
                    //## MAY BREAK AS I ENTER THE FINAL ROOM HERE, HE MAY PAUSE FOR 2 FRAMES BEFORE PROPER GOING ##
                    //#############################################################################################
                }
            }
        }
        else{
            //Move resources to storage
            var inCorrectRoom = creep.room.name == creep.memory.spawnKey.roomID;    //target.room.name; ------------> THIS NEEDS FIXING VISON TROUBLES EVERYWHERE #######
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
                    creep.memory.travelRoute = Game.map.findRoute(creep.room.name, creep.memory.spawnKey.roomID);}
                else{
                    //Follow the route to the final room
                    if(creep.room.name == creep.memory.travelRoute[0].room){    //If in next room, remove it to mark it as travelled
                        creep.memory.travelRoute.shift();}
                    if(creep.memory.travelRoute.length > 0){
                        creep.moveTo(creep.pos.findClosestByPath(creep.room.find(creep.memory.travelRoute[0].exit)));}
                    //#############################################################################################
                    //## MAY BREAK AS I ENTER THE FINAL ROOM HERE, HE MAY PAUSE FOR 2 FRAMES BEFORE PROPER GOING ##
                    //#############################################################################################
                }
            }
        }
        //Reset mining condition
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isMining = true;
        }
        //Reset mining condition
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isMining = false;
        }
        */
    },
    queue : function(roomID, energyRoomID, sourceID, parts){
        var creepSpec = {roomID:roomID, energyRoomID:energyRoomID, sourceID:sourceID, parts:parts, role:"Miner", time:Game.time};
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
        var houseKey = {roomID:creepSpec.energyRoomID , sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:spawner.room.name, spawnID:spawnerID};            //###THIS SHOULD BE THE ROOM OF THE SPAWNER, NOT THE ROOM THEY WORK IN##
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