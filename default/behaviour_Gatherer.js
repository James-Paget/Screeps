var {getTarget_gatherer, removeCreep_energyRooms} = require("cycle_energyAcquire");
var {getSpawnerRoomIndex} = require("manager_Memory");

var gatherer_tasks = {
    task : function(creep){
        if(creep.memory.ID == null){        //################# COULD CHANGE TO !....
            creep.memory.ID = creep.id;}    //## NOT A GREAT METHOD BUT WORKS FOR NOW ##

        var target = getTarget_gatherer(creep); //&& Considers all factors, returns choice --> nulls are allowed if nothing is required
        if(target){                             //If there is any target required
            var inRequiredRoom = (creep.room.name == target.room.name);
            if(inRequiredRoom){
                //(1) Reset routing
                if(creep.memory.travelRoute){           //If you still have a travel route, clear that space
                    delete creep.memory.travelRoute;}
                //(2) Do task
                if(creep.memory.isGathering){           //Going to gather  -->Will be in "houseKey" room
                    if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);}
                }
                else{                                   //Going to deposit -->Could be anywhere (anywhere to deposit at)
                    if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);}
                }
            }
            else{   //Move to required room
                if(!creep.memory.travelRoute){                                                                      //Create multi-room travel route
                    creep.memory.travelRoute = Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID);}  //
                else{
                    if(travelRoute.length == 0){            //Backup precaution
                        delete creep.memory.travelRoute;}   //
                    else{
                        if(creep.room.name == creep.memory.travelRoute[0].room){                                            //Move along travel route to required room
                            creep.memory.travelRoute.shift();}                                                              //
                        if(creep.memory.travelRoute.length > 0){                                                            //
                            creep.moveTo(creep.pos.findClosestByPath(creep.room.find(creep.memory.travelRoute[0].exit)));}  //
                    }
                }
            }
        }
        //Reset gather condition
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isGathering = true;}
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isGathering = false;}





        /*
        if(creep.memory.ID == null){
            creep.memory.ID = creep.id;}    //## NOT A GREAT METHOD BUT WORKS FOR NOW ##
            
        var target = getTarget_gatherer(creep);
        if(creep.memory.isGathering){
            var inCorrectRoom = creep.room.name == creep.memory.houseKey.roomID;    //### COULD BE PROBLEMATIC, ASSUMES ITS TARGET ALSWAYS IN OPPOSITE ROOM ##
            if(inCorrectRoom){
                if(creep.memory.travelRoute){
                    delete creep.memory.travelRoute;}
                //In correct room, therefore mine to the source you are here for
                if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
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
            var inCorrectRoom = creep.room.name == creep.memory.spawnKey.roomID;    //### COULD BE PROBLEMATIC, ASSUMES ITS TARGET ALSWAYS IN OPPOSITE ROOM ##
            if(inCorrectRoom){
                if(creep.memory.travelRoute){
                    delete creep.memory.travelRoute;}
                //In correct room, therefore deposit materials
                //Drop off resources
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
        //Reset gather condition
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isGathering = true;
        }
        //Reset gather condition
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.isGathering = false;
        }
        */
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
        var houseKey = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:spawner.room.name, spawnID:spawnerID};
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