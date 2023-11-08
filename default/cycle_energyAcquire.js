var miner_tasks = {
    task : function(creep){
        if(creep.ticksToLive <= 5){         //####### TRY REQWORK THIS, ITS BODGE BUT IM TIRED MY DUDE ####
            creep.memory.ID = creep.id;}    //#############################################################

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
    respawn : function(creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        var spawner   = Game.spawns["Spawn1"];
        var creepName = creepSpec[3]+Game.time;
        var houseKey  = {roomID:creepSpec[0], sourceID:creepSpec[1]};
        spawner.spawnCreep(creepSpec[2], creepName, {memory:{role:creepSpec[3], houseKey:houseKey, isMining:true}});
    },
    death : function(houseKey, creepID){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. Remove itself from energyRooms->sources->miners
        2. ...
        */
        //1
        removeCreep_energyRooms(houseKey, creepID);
    }
};
var gatherer_tasks = {
    task : function(creep){
        if(creep.ticksToLive <= 5){         //####### TRY REQWORK THIS, ITS BODGE BUT IM TIRED MY DUDE ####
            creep.memory.ID = creep.id;}    //#############################################################
            
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
    respawn : function(creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        var spawner   = Game.spawns["Spawn1"];
        var creepName = creepSpec[3]+Game.time;
        var houseKey  = {roomID:creepSpec[0], sourceID:creepSpec[1]};
        spawner.spawnCreep(creepSpec[2], creepName, {memory:{role:creepSpec[3], houseKey:houseKey, isGathering:true}});
    },
    death : function(houseKey, creepID){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. Remove from energyRooms
        2. ...
        */
        //1
        removeCreep_energyRooms(houseKey, creepID);
    }
};

function init_energyRoom(room){
    /*
    . Initialises an empty array structure for a new room (if the room is not currently registered)
    . This will allow miners & gatherers to enter this room and be assigned sources, containers, etc
    . All rooms being mined will require one of these structures
    . A given structure can be removed from here using the "removeEnergyRoom()" function

    Structure is as follows;
    {[], []} == spawnQueue
    (0)Queue of creeps to be spawned
    (1)To Be Assigned Creeps; list of creep NAMES that are required to assigned to their positions, added here when created for a specific role in here
    Creeps will only be spawned when everyone here has been assigned
    
    [ {}, {}, {ID, [{ID, FreeSpace, [], [], []}, ...]}, ... ]
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
            var queueSet       = [];                                            //Spawn Queue init here too
            var unassignedSet  = [];                                            //### MAYBE GOOD TO MOVE SOMEWHERE ELSE ###
            Memory.spawnQueue  = {queue:queueSet, unassigned:unassignedSet};    //
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
function removeCreep_energyRooms(houseKey, creepID){
    /*
    Takes a creep and removes them from all relevent lists 
    in the energyRooms global memory

    #######################################################################
    ## REWORK TO DO THIS RECCURSIVELY, WOULD BE CLEANER AND MORE GENERAL ##
    #######################################################################
    */
    var creepRoom   = houseKey.roomID;
    var creepSource = houseKey.sourceID;
    for(var roomIndex in Memory.energyRooms){
        if(creepRoom == Memory.energyRooms[roomIndex].ID){  //# Note the break later assumes that the creep is only assigned to 1 source, and therefore only 1 room
            for(var sourceIndex in Memory.energyRooms[roomIndex].sources){
                if(creepSource == Memory.energyRooms[roomIndex].sources[sourceIndex].ID){   //# "" ""
                    if(creep.memory.role == "Miner"){
                        for(var creepIndex in Memory.energyRooms[roomIndex].sources[sourceIndex].miners){
                            if(creepID == Memory.energyRooms[roomIndex].sources[sourceIndex].miners[creepIndex]){
                                Memory.energyRooms[roomIndex].sources[sourceIndex].miners.pop(creepIndex);
                            }
                            break;
                        }
                    }
                    if(creep.memory.role == "Gatherer"){
                        for(var creepIndex in Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers){
                            if(creepID == Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers[creepIndex]){
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
function queueCreeps_energyRooms(){
    /*
    -- Call this periodically or continually
    . Checks through energyRoom data for unsaturation
    . Calculates the type of creep (role, parts, etc) needed to satisfy this condition
    . Adds required creeps to the spawn queue (Note, when checking, it will add miners before gatherers, which is good behaviour)

    The spawnQueue.queue      HOLDS [{roomID, sourceID, Parts, Role}, {...}, ...] <-- Specify what creeps to make                 <-*Only THIS list is touched here*
    The spawnQueue.unassigned HOLDS [creepNames, ...]                             <-- Specify the creeps who have just been made
    */
    //#####################################
    //## THIS IF COULD BE HANDLED BETTER ##
    //#####################################
    if((Memory.spawnQueue.queue.length == 0) && (Memory.spawnQueue.unassigned.length == 0)){  //Only do this when all unassigned positions have been resolved -> so when choosing new spawns, only have to consider energyRooms, not spawnQueue.unassigned
        for(var roomIndex in Memory.energyRooms){
            for(var sourceIndex in Memory.energyRooms[roomIndex].sources){
                //Check mining is saturated
                var total_workParts = 0;
                for(var minerIndex in Memory.energyRooms[roomIndex].sources.miners){
                    total_workParts += _.filter(Game.getObjectById(Memory.energyRooms[roomIndex].sources.miners[minerIndex]).body, {filter : (bodyPart) => {return (bodyPart.type == WORK)}}).length;}
                var isSaturated_mining = (total_workParts >= 5);            //#### MAKE THIS A FUNCTION INPUT, SO IT CAN VARY #######
                if(!isSaturated_mining){
                    //Put new miners into the queue
                    var partsSet = [WORK, WORK, WORK, CARRY, MOVE];         //#### MAKE THIS A FUNCTION INPUT, SO IT CAN VARY #######
                    var creepSpec = {roomID:Memory.energyRooms[roomIndex].ID, sourceID:Memory.energyRooms[roomIndex].sources[sourceIndex].ID, parts:partsSet, role:"Miner"};
                    Memory.spawnQueue.queue.push(creepSpec);
                }

                //Check gathering is saturated
                var total_carryParts = 0;
                for(var gathererIndex in Memory.energyRooms[roomIndex].sources.gatherers){
                    total_carryParts += _.filter(Game.getObjectById(Memory.energyRooms[roomIndex].sources.gatherers[gathererIndex]).body, {filter : (bodyPart) => {return (bodyPart.type == CARRY)}}).length;}
                var isSaturated_gathering = total_carryParts >= 12;                         //#### MAKE THIS A FUNCTION INPUT, SO IT CAN VARY #######
                if(!isSaturated_gathering){
                    //Put new gatherers into the queue
                    var partsSet = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];    //#### MAKE THIS A FUNCTION INPUT, SO IT CAN VARY #######
                    var creepSpec = {roomID:Memory.energyRooms[roomIndex].ID, sourceID:Memory.energyRooms[roomIndex].sources[sourceIndex].ID, parts:partsSet, role:"Gatherer"};
                    Memory.spawnQueue.queue.push(creepSpec);
                }

                //...
            }
        }
    }
}
function assignCreeps_energyRooms(){
    /*
    -- Call this function continually
    . Looks through all unassigned creeps
    . Waits until they are alive (so their ID is available)
    . Then goes to their houseKey and leaves their ID in the energyRooms global memory (so they are assigned/registered)
    */
    var unassignedLength = Memory.spawnQueue.unassigned.length;         //Not by reference => constant value throughout popping
    for(var unassignedName_from0 in unassignedLength){
        var unassignedName = unassignedLength -unassignedName_from0;    //Means the list will iterate backwards through elements
        for(var creepName in Game.creeps){                                                 //Look through creeps that exist, see if unassigned dude is there yet
            if(Memory.spawnQueue.unassigned[unassignedName] == Game.creeps[creepName]){    //If you find him, and he exists, put his houseKey in the energyRooms global memory & remove him from the unassigned
                var roomID   = Game.creeps[creepName].houseKey.roomID;
                var sourceID = Game.creeps[creepName].houseKey.sourceID;
                for(var roomIndex in Memory.energyRooms){
                    if(Memory.energyRooms[roomIndex].ID == roomID){
                        for(var sourceIndex in Memory.energyRooms[roomIndex].sources){
                            if(Memory.energyRooms[roomIndex].sources[sourceIndex].ID == sourceID){
                                if(Game.creeps[creepName].role == "Miner"){
                                    Memory.energyRooms[roomIndex].sources[sourceIndex].miners.push(Game.creeps[creepName].id);  //Assigned it correctly
                                    Memory.spawnQueue.unassigned.pop(unassignedName);                                           //Now it must be removed from this "waiting list"
                                }
                                if(Game.creeps[creepName].role == "Gatherer"){
                                    Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers.push(Game.creeps[creepName].id);
                                    Memory.spawnQueue.unassigned.pop(unassignedName);
                                }
                                //...
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
}
function clearSpawnQueue_queue(){
    Memory.spawnQueue.queue = [];
}
function clearSpawnQueue_unassigned(){
    Memory.spawnQueue.unassigned = [];
}
// . MAKE FUNCTION TO REMAKE THE CONTAINER SET FOR EACH SOURCE
// . MAKE FUNCTION TO REASSIGN ALL MINERS TO SOURCES AGAIN; WILL FIX SITUATIONS WHEN EVERYONE IS CONFUSED WHERE THEY ARE --> GlobalReassignment

module.exports = {
    miner_tasks, 
    gatherer_tasks,
    queueCreeps_energyRooms:queueCreeps_energyRooms,
    assignCreeps_energyRooms:assignCreeps_energyRooms};