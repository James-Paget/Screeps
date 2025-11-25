var {getSpawnerRoomIndex} = require("manager_Memory");

function getTarget_miner(creep){
    /*
    . Considers the source this MINER is assigned to (all miners will be assigned)
    . Returns the target location this creep should move to
    . If SOURCE in the same room as this, that is directly the target
    . If SOURCE is in a different room to this, the target should be a route to the next room, that is closer to the target room (multi-room pathing)

    ####
    ## BE AWARE THAT THE 'FAKE' TARGET USED FOR PATHING WITH NO VISION IS IMMITAATING A ROOM OBJECT, SO MAY NOT HAVE ALL THE REQUIRED ATTRIBUTES
    ####
    */
    var target = null;
    if(creep.memory.isMining){  //Mining => want to go to associated source
        var hasVision = Game.rooms[creep.memory.houseKey.roomID];
        if(hasVision){  //=> Can directly set source as target
            target = Game.getObjectById(creep.memory.houseKey.sourceID);
        }
        else{           //=> Will have to path to the room generally to gain vision
            target = {room:{name:creep.memory.houseKey.roomID}, pos:creep.pos.findClosestByPath(creep.room.find(Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID)[0].exit))};
        }
    }
    else{                       //Depositing => want to deliver to associated container OR spawn (both could be in other rooms => need to vision check)
        var roomIndex   = searchEnergyRooms_roomIndex(creep.memory.houseKey.roomID);
        var sourceIndex = searchEnergyRooms_sourceIndex(roomIndex, creep.memory.houseKey.sourceID);
        var hasGatherers = Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers.length  > 0;
        var hasContainers= Memory.energyRooms[roomIndex].sources[sourceIndex].containers.length > 0;
        var manualDelivery = true;  //Deliver to spawn MANUALLY
        if(hasContainers){
            if(hasGatherers){   //Deliver to containers (may have no vision)
                manualDelivery = false;
                var hasVision  = Game.rooms[creep.memory.houseKey.roomID];                              //## CURRENTLY HAVE TO ASSUME ALL CONTAINERS ARE IN THE ROOM WHERE THE MINING OCCURS ##
                if(hasVision){  //=> Can directly search for and retrieve container
                    var containerObjects = [];
                    //var containerIDs = [];                                                            //To stop reference parsing --> #####LIKELY NOT NEEDED#####
                    //containerIDs = Memory.energyRooms[roomIndex].sources[sourceIndex].containers;     //To stop reference parsing --> #####LIKELY NOT NEEDED#####
                    for(var index in Memory.energyRooms[roomIndex].sources[sourceIndex].containers){
                        containerObjects.push(Game.getObjectById(Memory.energyRooms[roomIndex].sources[sourceIndex].containers[index]));}                //No vision problem as have ASSUMED VISION
                    containerObjects = _.filter(containerObjects, function(obj) { return (obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0) });
                    if(creep.room.name == creep.memory.houseKey.roomID){    //Same room      => direct pathing
                        target = creep.pos.findClosestByPath(containerObjects);}
                    else{                                                   //Different room => indirect pathing (will become direct after)
                        target = containerObjects[0];}
                }
                else{           //=> Will need to path to the room generally to gain vision
                    target = {room:{name:creep.memory.houseKey.roomID}, pos:creep.pos.findClosestByPath(creep.room.find(Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID)[0].exit))};   //## PATHING TO CONTAINERS, ASSUMED ALL INSIDE ROOM IN QUESTION, => JUST SAME AS PATHING TO SOURCE IN THAT ROOM ##
                }
            }
        }
        if(manualDelivery){     //Deliver to spawn MANUALLY (always vision)
            var deliveryTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            if(creep.room.name == creep.memory.spawnKey.roomID){        //Same room      => direct pathing
                target = creep.pos.findClosestByPath(deliveryTargets);}
            else{                                                       //Different room => indirect pathing (will become direct after)
                target = deliveryTargets[0];}
        }
    }
    return target;






    /*
    var target = null;
    if(creep.memory.isMining){ //Go to source
        var hasVision = Game.getObjectById(creep.memory.houseKey.sourceID);
        if(hasVision){    //If has VISION
            target = Game.getObjectById(creep.memory.houseKey.sourceID);}
        else{             //If NO VISION
            target = creep.pos.findClosestByPath(creep.room.find(Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID)[0].exit));
        }
    }
    else{               //Go to closest of spawn, ext or container
        var roomIndex   = searchEnergyRooms_roomIndex(creep.memory.houseKey.roomID);
        var sourceIndex = searchEnergyRooms_sourceIndex(roomIndex, creep.memory.houseKey.sourceID);
        var hasGatherers = Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers.length > 0;
        if(hasGatherers){
            //(1) Try to give to a linked container
            //(2) If no linked containers, then hand deliver
            
            //(1)
            var containerIDs = [];
            containerIDs = Memory.energyRooms[roomIndex].sources[sourceIndex].containers;

            //Outside if, so if there are containers but they are all full he will hand deliver; prevents 0 energy deliver situations (so no 300 energy cap from spawn when spawning new workers)
            var containerObjects = [];
            for(var index in containerIDs){
                containerObjects.push(Game.getObjectById(containerIDs[index]));}
            containerObjects = _.filter(containerObjects, function(obj) { return (obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0) });    //Picks out containers with energy available

            if(containerObjects.length > 0){
                target = creep.pos.findClosestByPath(containerObjects);     //All containers shold be in the same room as the miner
                if(target == null){                                         //But if they arent, or they leave the room, just use the 0th as a fallback
                    target = containerObjects[0];}
            }
            else{
                //(2)
                var possibleTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
                if(creep.room.name == creep.memory.spawnKey.roomID){    //If in spawn room (where resources being delivered), then find closest thing
                    target = creep.pos.findClosestByPath(possibleTargets);}
                else{                                                   //If not in the spawn room, just choose any of them --> Wll re-path properly once they enter the room
                    target = possibleTargets[0];}
            }
        }
        else{
            //(2)
            var possibleTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            if(creep.room.name == creep.memory.spawnKey.roomID){    //If in spawn room (where resources being delivered), then find closest thing
                target = creep.pos.findClosestByPath(possibleTargets);}
            else{                                                   //If not in the spawn room, just choose any of them --> Wll re-path properly once they enter the room
                target = possibleTargets[0];}
        }
    }
    return target;
    */
}
function getTarget_gatherer(creep){
    /*
    . Considers the source this GATHERER is assigned to (all gatherers will be assigned)
    . Returns the target location this creep should move to
    . If SOURCE in the same room as this, move to containers associated with this source
    . If SOURCE is in a different room to this, the target should be a route to the next room, that is closer to the target room (multi-room pathing)

    ####
    ## BE AWARE THAT THE 'FAKE' TARGET USED FOR PATHING WITH NO VISION IS IMMITAATING A ROOM OBJECT, SO MAY NOT HAVE ALL THE REQUIRED ATTRIBUTES
    ####
    */
    var target = null;
    if(creep.memory.isGathering){  //Gathering => want to go to associated source
        var roomIndex   = searchEnergyRooms_roomIndex(creep.memory.houseKey.roomID);
        var sourceIndex = searchEnergyRooms_sourceIndex(roomIndex, creep.memory.houseKey.sourceID);
        var hasContainers= Memory.energyRooms[roomIndex].sources[sourceIndex].containers.length > 0;
        if(hasContainers){
            var hasVision = Game.rooms[creep.memory.houseKey.roomID];
            if(hasVision){  //=> Can directly search room for containers
                var containerObjects = [];
                //var containerIDs = [];                                                            //To stop reference parsing --> #####LIKELY NOT NEEDED#####
                //containerIDs = Memory.energyRooms[roomIndex].sources[sourceIndex].containers;     //To stop reference parsing --> #####LIKELY NOT NEEDED#####
                for(var index in Memory.energyRooms[roomIndex].sources[sourceIndex].containers){
                    containerObjects.push(Game.getObjectById(Memory.energyRooms[roomIndex].sources[sourceIndex].containers[index]));}                //No vision problem as have ASSUMED VISION
                containerObjects = _.filter(containerObjects, function(obj) { return (obj.store.getUsedCapacity(RESOURCE_ENERGY) > 0) });
                if(creep.room.name == creep.memory.houseKey.roomID){    //Same room      => direct pathing
                    target = creep.pos.findClosestByPath(containerObjects);}
                else{                                                   //Different room => indirect pathing (will become direct after)
                    target = containerObjects[0];}
            }
            else{           //=> Will have to path to the room generally to gain vision
                target = {room:{name:creep.memory.houseKey.roomID}, pos:creep.pos.findClosestByPath(creep.room.find(Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID)[0].exit))};
            }
        }
        //No containers => do nothing (null target)
    }
    else{                       //Depositing => returning to spawnerRoom => always vision
        //Try find delivery target
        var deliveryTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
        if(deliveryTargets.length == 0){    //If spawner full of energy, give to any terminals in the room
            deliveryTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return (structure.structureType == STRUCTURE_TERMINAL && structure.store.getUsedCapacity(RESOURCE_ENERGY) <= 150000)}});}
        if(creep.room.name == creep.memory.spawnKey.roomID){        //Same room      => direct pathing
            target = creep.pos.findClosestByPath(deliveryTargets);}
        else{                                                       //Different room => indirect pathing (will become direct after)
            target = deliveryTargets[0];}
    }
    return target;



    /*
    var target = null;
    if(creep.memory.isGathering){ //Go to source
        //(1)
        var containerIDs = [];
        var roomIndex    = searchEnergyRooms_roomIndex(creep.memory.houseKey.roomID);
        var sourceIndex  = searchEnergyRooms_sourceIndex(roomIndex, creep.memory.houseKey.sourceID);
        containerIDs = Memory.energyRooms[roomIndex].sources[sourceIndex].containers;
        //(2)
        var hasVision = Game.getObjectById(Memory.energyRooms[roomIndex].sources[sourceIndex].ID);
        if(hasVision){    //If has VISION
            var containerObjects = [];
            for(var index in containerIDs){
                containerObjects.push(Game.getObjectById(containerIDs[index]));}
            containerObjects = _.filter(containerObjects, function(obj) { return (obj.store.getUsedCapacity(RESOURCE_ENERGY) > 0) });    //Picks out containers with energy available
            target = creep.pos.findClosestByPath(containerObjects);
        }
        else{                                                       //If NOT in the room, DONT search directly (NOT guaranteed vision)
            target = creep.pos.findClosestByPath(creep.room.find(Game.map.findRoute(creep.room.name, creep.memory.houseKey.roomID)[0].exit));
        }
    }
    else{               //Go to closest of spawn, ext or container
        //(2)
        var possibleTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) || (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});   //Fill spawnerRoom with energy
        if(possibleTargets.length == 0){
            possibleTargets = Game.rooms[creep.memory.spawnKey.roomID].find(FIND_STRUCTURES, {filter : (structure) => {return (structure.structureType == STRUCTURE_TERMINAL && structure.store.getUsedCapacity(RESOURCE_ENERGY) <= 150000)}});}  //Fill terminal with energy
        if(creep.room.name == creep.memory.spawnKey.roomID){    //If in spawn room (where resources being delivered), then find closest thing
            target = creep.pos.findClosestByPath(possibleTargets);}
        else{                                                   //If not in the spawn room, just choose any of them --> Wll re-path properly once they enter the room
            target = possibleTargets[0];}
    }
    return target;
    */
}
function init_energyRoom(room, spawnerRoomID){
    /*
    . Initialises an empty array structure for a new room (if the room is not currently registered)
    . This will allow miners & gatherers to enter this room and be assigned sources, containers, etc
    . All rooms being mined will require one of these structures
    . A given structure can be removed from here using the "removeEnergyRoom()" function

    Structure is as follows;
    {[], []} == spawnerRoom
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
    var thresholdDist_container = 4;    //Within this radius of source => assign this container to this source (container can be assigned to multiple sources, and vice versa)
    if(!copyExists){
        if(Memory.energyRooms){         //Just a double check
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
            Memory.energyRooms.push({ID:room.name, spawnerRoomID:spawnerRoomID, sources:sources});
        }
    }
}
function removeCreep_energyRooms(houseKey, creepRole, creepID){
    /*
    . Takes a creep and removes them from all relevent lists in the energyRooms global memory

    #######################################################################
    ## REWORK TO DO THIS RECCURSIVELY, WOULD BE CLEANER AND MORE GENERAL ##
    #######################################################################
    */
    if( (houseKey!=null) && (creepRole!=null) ) {
        if( (houseKey.roomID!=null) && (houseKey.sourceID!=null) ) {
            var roomIndex   = searchEnergyRooms_roomIndex(houseKey.roomID);
            var sourceIndex = searchEnergyRooms_sourceIndex(roomIndex, houseKey.sourceID); //# Note the break later assumes that the creep is only assigned to 1 source, and therefore only 1 room
            if( (roomIndex!=null) && (sourceIndex!=null) ) {
                if(creepRole == "Miner"){
                    for(var creepIndex in Memory.energyRooms[roomIndex].sources[sourceIndex].miners){
                        if(creepID == Memory.energyRooms[roomIndex].sources[sourceIndex].miners[creepIndex]){
                            Memory.energyRooms[roomIndex].sources[sourceIndex].miners.splice(creepIndex,1);
                            break;
                        }
                    }
                }
                if(creepRole == "Gatherer"){
                    for(var creepIndex in Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers){
                        if(creepID == Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers[creepIndex]){
                            Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers.splice(creepIndex,1);
                            break;
                        }
                    }
                }
                //... -> If more roles become involved in energyRooms
            }   // If either roomIndex or sourceIndex not found, then cannot identify where creep was assigned to, hence do not try to remove any details (this assumes it was also not assigned correctly)
        }
    }
}
function searchEnergyRooms_roomIndex(roomID){
    var index = null;
    for(var roomIndex in Memory.energyRooms){
        if(roomID == Memory.energyRooms[roomIndex].ID){
            index = roomIndex;
            break;
        }
    }
    return index;
}
function searchEnergyRooms_sourceIndex(roomIndex, sourceID){
    var index = null;
    for(var sourceIndex in Memory.energyRooms[roomIndex].sources){
        if(sourceID == Memory.energyRooms[roomIndex].sources[sourceIndex].ID){
            index = sourceIndex;
            break;
        }
    }
    return index;
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
function assignCreeps_energyRooms(){
    /*
    --- Applies to all spawner rooms
    -- Call this function continually
    . spawnerRoom = roomName of home for this creep
    . Looks through 0th unassigned creeps
    . Waits until they are alive (so their ID is available)
    . Then goes to their houseKey and leaves their ID in the energyRooms global memory (so they are assigned/registered)
    */
    for(var spawnerIndex in Memory.spawnerRooms){
        var spawnerRoomID = Memory.spawnerRooms[spawnerIndex].roomID;
        var unassignedLength = Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].unassigned.length;
        for(var i=0; i<unassignedLength; i++){
            var creepName = Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].unassigned[0];
            if(Memory.creeps[creepName]){   //Prevents a bug where the 1 time a creep, in sim, spawned with undefined memory => ignore his assignment and execute him
                var roomIndex    = searchEnergyRooms_roomIndex(Memory.creeps[creepName].houseKey.roomID);
                var sourceIndex  = searchEnergyRooms_sourceIndex(roomIndex, Memory.creeps[creepName].houseKey.sourceID);
                if( (roomIndex!=null)&&(sourceIndex!=null) ) {
                    if(Memory.creeps[creepName].role == "Miner"){
                        Memory.energyRooms[roomIndex].sources[sourceIndex].miners.push(Game.creeps[creepName].id);  //Assigned it correctly
                        Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].unassigned.shift();                    //Now it must be removed from this "waiting list"
                    }
                    if(Memory.creeps[creepName].role == "Gatherer"){
                        Memory.energyRooms[roomIndex].sources[sourceIndex].gatherers.push(Game.creeps[creepName].id);
                        Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].unassigned.shift();
                    }
                    //...
                } else {    // If you cannot find a correct roomIndex or sourceIndex
                    Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].unassigned.shift();
                    Game.creeps[creepName].suicide();
                }
            }
            else{
                //Game.creeps[creepName].suicide();       //May bug out if he is still spawning
                Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].unassigned.shift();
            }
        }
    }
}
function clearSpawnerRoom_queue(roomID){
    Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue = [];
}
function clearSpawnerRoom_unassigned(roomID){
    Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].unassigned = [];
}

module.exports = {
    getTarget_miner,
    getTarget_gatherer,
    init_energyRoom,
    removeCreep_energyRooms,
    assignCreeps_energyRooms};