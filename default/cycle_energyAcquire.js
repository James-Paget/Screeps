var miner_tasks = {
    goMine : function(creep){
        if(creep.memory.isMining){
            var targetSource = Game.getObjectById(creep.memory.sourceID);
            if(creep.harvest(targetSource) == ERR_NOT_IN_RANGE){
                creep.moveTo(targetSource)
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = false;
            }
        }
        else{
            //Move resources to storage
            //#### MAY WANT TO CHECK IF HAS SPACE TOO, BUT I WOULD RATHER THEY QUEUE AT THEIR CLOSEST CONTAINER ####
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return (((structure.structureType == STRUCTURE_EXTENSION) && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) || ((structure.structureType == STRUCTURE_SPAWN) && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) || (structure.structureType == STRUCTURE_CONTAINER))}});
            var target = creep.pos.findClosestByPath(transferTargets);
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            
            //Reset mining condition
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        var spawner = Game.spawns["Spawn1"];            //## MAY WANT TO ADAPT SO THIS CAN SOMETIMES BE IN THE ROOM THEY ARE REQUIRED ##
        var specs   = checkMinerRequired();
        if(specs.length != 0){
            var creepName = "Miner"+Game.time;
            var houseKey  = {roomID:specs[0], sourceID:specs[1]};
            if(relatedCreepNumber == 0){
                spawner.spawnCreep([WORK, CARRY, MOVE], creepName, {memory:{role:"Miner", isMining:true, houseKey:houseKey}});}
            else{
                spawner.spawnCreep([WORK, WORK, WORK, CARRY, MOVE], creepName, {memory:{role:"Miner", isMining:true, houseKey:houseKey}});}
                //spawner.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], creepName, {memory:{role:"Miner", isMining:true, sourceID:assignedSourceID}});}
        }
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. Remove itself from energyRooms->sources->miners
        2. ...
        */
        //1
        removeCreep_energyRooms(this);
    }
};
var gatherer_tasks = {
    goGather : function(creep){
        if(creep.memory.isGathering){
            var target = Game.getObjectById(creep.memory.containerID);
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }

            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isGathering = false;
            }
        }
        else{
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||(structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            var target  = creep.pos.findClosestByPath(transferTargets);
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }

            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isGathering = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        var spawner = Game.spawns["Spawn1"];        //## MAY WANT TO ADAPT SO THIS CAN SOMETIMES BE IN THE ROOM THEY ARE REQUIRED ##
        var specs   = checkGathererRequired();
        if(specs.length != 0){
            var creepName = "Gatherer"+Game.time;
            var houseKey  = {roomID:specs[0], sourceID:specs[1]};
            //spawner.spawnCreep([MOVE, CARRY], creepName, {memory:{role:"Gatherer", isGathering:true, houseKey:houseKey}});}
            spawner.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], creepName, {memory:{role:"Gatherer", isGathering:true, houseKey:houseKey}});}
        }
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. Remove from energyRooms
        2. ...
        */
        //1
        removeCreep_energyRooms(this);
    }
};

function init_energyRoom(room){
    /*
    . Initialises an empty array structure for a new room (if the room is not currently registered)
    . This will allow miners & gatherers to enter this room and be assigned sources, containers, etc
    . All rooms being mined will require one of these structures
    . A given structure can be removed from here using the "removeEnergyRoom()" function

    Structure is as follows;
    [ {}, {ID, [{ID, FreeSpace, [], [], []}, ...]}, ... ]
    (1)Room --> roomName in 0th element of corresponding list; e.g {roomName, [source1Data], [source2Data], ...}
        (2)Source Index --> Its ID in 0th element of corresponding list; e.g {SourceID, [containerIDs], [minerIDs], [gathererIDs]}, Indexed as according to FIND_SOURCES index
            (3)Assigned Info --> IDs of objects assigned to this source; e.g {containerID_1} or {minerID_1, minerID_2, minerID_3} or ...
    
    1. Make sure copy doesnt already exist there
    2. If not, then create structure;
    */
    //1
    var copyExists = false;
    for(var roomIndex in Memory.energyRooms){
        if(Memory.energyRooms[roomIndex].ID == room.name){   //ID of room is its roomName here
            copyExists = true;
            break;
        }
    }
    //2
    var thresholdDist_container = 4;   //Within this radius of source => assign this container to this source (container can be assigned to multiple sources, and vice versa)
    if(!copyExists){
        if(!Memory.energyRooms){
            Memory.energyRooms = [];}
        else{
            var roomSource_Objects    = room.find(FIND_SOURCES);
            var roomContainer_Objects = room.find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_CONTAINER)}});   //# Note here, only recognises containers that exist when the room is initially registered => may want to have a function to update these values periodically
            var sources = [];
            for(var sourceIndex in roomSource_Objects){
                var cSource_ID        = roomSource_Objects[sourceIndex].id;
                var cSource_FreeSpace = getSource_freeSpace(room, roomSource_Objects[sourceIndex]);
                var containerIDs = [];  //Populated below with nearby containers
                var minerIDs     = [];  //These left empty to be populated when spawning
                var gathererIDs  = [];  //"" ""
                for(var containerIndex in roomContainer_Objects){
                    if( roomSource_Objects[sourceIndex].pos.inRangeTo(roomContainer_Objects[containerIndex], thresholdDist_container) ){
                        containerIDs.push(roomContainer_Objects[containerIndex].id);
                    }
                }
                sources.push({ID:cSource_ID, free:cSource_FreeSpace, containers:containerIDs, miners:minerIDs, gatherers:gathererIDs});
            }
            Memory.energyRooms.push({ID:room.name, sources:sources});
        }
    }
}
function remove_energyRoom(room){
    /*
    . Removes the given energyRoom from the memory list structure
    . This will prevent miners being smartly assigned sources for the room
    */
    for(var roomIndex in Memory.energyRooms){
        if(Memory.energyRooms[roomIndex].ID == room.name){   //ID of room is its roomName here
            Memory.energyRooms.pop(roomIndex);
            break;
        }
    }
}
function removeCreep_energyRooms(creep){
    /*
    Takes a creep and removes them from all relevent lists 
    in the energyRooms global memory

    #######################################################################
    ## REWORK TO DO THIS RECCURSIVELY, WOULD BE CLEANER AND MORE GENERAL ##
    #######################################################################
    */
    var creepRoom   = creep.memory.houseKey.roomID;
    var creepSource = creep.memory.houseKey.sourceID;
    for(var roomIndex in Memory.energyRooms){
        if(creepRoom == Memory.energyRooms[roomIndex].ID){  //# Note the break later assumes that the creep is only assigned to 1 source, and therefore only 1 room
            for(var sourceIndex in Memory.energyRooms[roomIndex].sources){
                if(creepSource == Memory.energyRooms[roomIndex].sources[sourceIndex].ID){   //# "" ""
                    if(creep.memory.role == "Miner"){
                        for(var creepIndex in Memory.energyRooms[roomIndex].sources[sourceIndex].miners){
                            if(creep.ID == Memory.energyRooms[roomIndex].sources[sourceIndex].miners[creepIndex]){
                                Memory.energyRooms[roomIndex].sources[sourceIndex].miners.pop(creepIndex);
                            }
                            break;
                        }
                    }
                    if(creep.memory.role == "Gatherer"){
                        for(var creepIndex in Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers){
                            if(creep.ID == Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers[creepIndex]){
                                Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers.pop(creepIndex);
                            }
                            break;
                        }
                    }
                    //... -> If more roles become involved in energyRooms
                }
                break;
            }
            break;
        }
    }
}
function getSource_freeSpace(room, cSource){
    /*
    . Finds the number of free spaces around a source
    . ### This can be improved to make sure all the spaces found can be pathed to ### <------------
    */
    var totalFreeTiles = 0;
    //For 3x3 tiles around this source
    for(var j=cSource.pos.y-1; j<=cSource.pos.y+1; j++){
        for(var i=cSource.pos.x-1; i<=cSource.pos.x+1; i++){
            if( (Game.map.getRoomTerrain(room.name).get(i,j) == 0) || (Game.map.getRoomTerrain(room.name).get(i,j) == 2) ){
                totalFreeTiles++;
            }
        }
    }
    return totalFreeTiles;
}
function checkMinerRequired(){
    /*
    . Returns list containing room (at [0]) and source (at [1]) that requires another miner
    . Returns empty list if not required

    Read total # of WORK on a source, find required to saturate, assign miner
    */
    var spec = [];
    //pass
    return spec;
}
function checkGathererRequired(){
    /*
    . Returns list containing room (at [0]) and source (at [1]) that requires another miner
    . Returns empty list if not required

    Read total # of CARRY on a source, find required to saturate, assign gatherers
    MOVE made to match CARRY as max speed is 1 (when matching 1:1 other parts)
    */
    var spec = [];
    //pass
    return spec;
}
// . MAKE FUNCTION TO REMAKE THE CONTAINER SET FOR EACH SOURCE
// . MAKE FUNCTION TO REASSIGN ALL MINERS TO SOURCES AGAIN; WILL FIX SITUATIONS WHEN EVERYONE IS CONFUSED WHERE THEY ARE --> GlobalReassignment





//################################

function getGathererNumberRequired(room){
    var containerNumber = room.find(FIND_STRUCTURES, {filter : (structure) => {return ( structure.structureType == STRUCTURE_CONTAINER )}});
    return 2*containerNumber.length;
}
function getAssignedContainerID(room){
    /*
    ################################
    ## CONTAINER WILL NEED REPAIR ##
    ######################################
    ## HAVE THIS STORED AND JUST UPDATE ##
    ######################################
    */
    //Finds number of gatherers looking after each container
    var containers = room.find(FIND_STRUCTURES, {filter : (structure) => {return (structure.structureType == STRUCTURE_CONTAINER)}});
    var allGatherers = _.filter(Game.creeps, function(creep) { return (creep.memory.role == "Gatherer") });
    var gatherersAssigned = [];
    for(var i in containers){
        gatherersAssigned.push(0);}
    for(var gathererIndex in allGatherers){
        for(var containerIndex in containers){
            if(allGatherers[gathererIndex].memory.containerID == containers[containerIndex].id){
                gatherersAssigned[containerIndex] = gatherersAssigned[containerIndex]+1;        //## TRY WITH ++, LIST MAY NOT LIKE IT ##
                break;
            }
            containerIndex++;
        }
    }
    //Find spaces for this new guy
    var containerID = "0";
    for(var containerIndex in containers){
        if( gatherersAssigned[containerIndex] < 2){    //If has free space
            containerID = containers[containerIndex].id;
            break;
        }
    }
    return containerID
}

module.exports = {miner_tasks, gatherer_tasks};