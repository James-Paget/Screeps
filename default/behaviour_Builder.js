var {getSpawnerRoomIndex} = require("manager_Memory");

var building_tasks = {
    task : function(creep){
        var target = getTarget_builder(creep);
        if(target){
            if(creep.memory.isBuilding){
                var inCorrectRoom = creep.room.name == target.room.name;
                if(inCorrectRoom){
                    if(creep.memory.travelRoute){
                        delete creep.memory.travelRoute;}
                    //In correct room, therefore mine to the source you are here for
                    if(target.structureType == STRUCTURE_TOWER){    //(1) Refill towers as a priority
                        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    else{                                           //(2) Construct within this spawner's influence (e.g associated energy rooms)
                        if(creep.build(target) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                }
                else{
                    //Not in correct room, therefore path to this room
                    if(!creep.memory.travelRoute){   //Deleted once it is no longer in use
                        //Generate route to the final room
                        creep.memory.travelRoute = Game.map.findRoute(creep.room.name, target.room.name);}
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
                //## MAYBE MOVE CREEPS TO A SAFE FLAG SPOT IF NO SITES NEED TO BE MADE ##
                if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                    creep.memory.isBuilding = false;
                }
            }
            else{
                //Prepare for construction
                var inCorrectRoom = creep.room.name == creep.memory.spawnKey.roomID;
                if(inCorrectRoom){
                    if(creep.memory.travelRoute){
                        delete creep.memory.travelRoute;}
                    //In correct room, therefor withdraw required
                    if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
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
                if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                    creep.memory.isBuilding = true;
                }
            }
        }
    },
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:null, parts:[WORK, CARRY, MOVE], role:"Builder", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        //[WORK, CARRY, MOVE, MOVE]
        //var creepName = creepSpec.role+Game.time;
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isBuilding:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

function getTarget_builder(creep){
    /*
    Finds targets for this builder to construct

    resupplyTowers = towers that NEED a resupply
    */
    var target = null;
    if(creep.memory.isBuilding){
        //Look for (1) Towers to refill, (2) Construction sites within influence of spawner
        var resupplyTowers = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter:(structure) => {return ( (structure.structureType == STRUCTURE_TOWER) && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) )}});
        if(resupplyTowers.length > 0){  //(1)
            target = creep.pos.findClosestByPath(resupplyTowers);
        }
        else{                           //(2)
            for(var roomIndex in Memory.energyRooms){
                if(Memory.energyRooms[roomIndex].spawnerRoomID == creep.memory.spawnKey.roomID){    //If this energy room is associated with this builder's spawn, check if he has any jobs he can do there
                    if(Game.rooms[Memory.energyRooms[roomIndex].ID]){                               //If you currently have vision of that room (this will change as creeps enter, leave and die in a room)
                        var constructSites = Game.rooms[Memory.energyRooms[roomIndex].ID].find(FIND_CONSTRUCTION_SITES);
                        if(constructSites.length > 0){
                            target = constructSites[0]; //May be in other rooms, so cant simply check path diff => just complete them in order (fine assumption because 90% of time nothing will require building)
                            break;
                        }
                    }
                }
            }
        }
    }
    else{
        //For look place to gather resources from in spawner room
        if(creep.room.name == creep.memory.spawnKey.roomID){
            //If in spawner room, look for closest storage (extension or spawner)
            // --> WAS CAUSING ERRORS
            var possibleTargets = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return( (structure.structureType == STRUCTURE_EXTENSION)&&(structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) )}});
            if(possibleTargets.length == 0){
                possibleTargets = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return( (structure.structureType == STRUCTURE_SPAWN)&&(structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) )}});
            }
            target = creep.pos.findClosestByPath(possibleTargets);
        }
        else{
            //If NOT in home spawner room, just travel to the spawner generally, re-adjust later
            target = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter:(structure) => {return(structure.structureType == STRUCTURE_SPAWN)}})[0];
        }
    }
    return target;
}

module.exports = building_tasks;