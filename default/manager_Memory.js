function manageMemory_setupMemory() {
    /*
    . (1) Creates the baseline structure if not present
    . (2) Make spawnerRooms if not registered already
    */
    // (1)
    if(!Memory.spawnerRooms){ Memory.spawnerRooms = []; }
    if(!Memory.energyRooms){ Memory.energyRooms = []; }

    // (2)
    if(Game.time.toString().slice(-1) == 5) {   // Periodically call this
        for(spawnerName in Game.spawns) {
            var spawnerRoomExists = false;
            for(spawnerRoomIndex in Memory.spawnerRooms) {                                  // Look if the spawner has a spawnerRoom already registered
                if(Game.spawns[spawnerName].room == Memory.spawnerRooms[spawnerRoomIndex].roomID) { spawnerRoomExists=true;break; }
            }
            if(!spawnerRoomExists) { init_spawnerRooms(Game.spawns[spawnerName].room) }     // If no spawnerRoom registered, make one
        }
    }
}
function manageMemory_queues(){
    //Remove old queued creeps --> prevents clogging
    if(Game.time.toString().slice(-1) == 0){                                        //Every 10 frames
        for(var spawnerRoomIndex in Memory.spawnerRooms){
            for(let i=Memory.spawnerRooms[spawnerRoomIndex].queue.length-1; i>=0; i--){
                if(Math.abs(Game.time-Memory.spawnerRooms[spawnerRoomIndex].queue[i].time) >= 100){
                    Memory.spawnerRooms[spawnerRoomIndex].queue.splice(i,1);                            //If has been sat in queue for too long, get rid of it
                }
            }
        }
    }
}

function init_spawnerRooms(roomID){
    /*
    . Creates a space in the "Memory.spawnerRooms" for a spawner in a room not currently assigned
    . If this is left empty for some time, it will be removed
    . Inside a Memory.spawnerRooms element, you have; {roomID, queue, unassigned}
        roomID       = roomName (name)
        queue[{}]    = creeps in queue for that room (list[] of specs{})
        unassigned[] = creeps unassigned for that room (list[] of names)
    */
    var queueSet          = [];
    var unassignedSet     = [];     //**NOTE; Only required for energy room creeps (anywhere where creep ID is needed). Creep names temporarily stored here while spawning since their ID is not available while spawning. After, IDs are given to relevant locations and unassigned are removed
    var mineralStorageSet = [];     //Stores minerals -> This holds IDs for storages used to hold minerals
    var towers            = [];     //Stores IDs of towers in room -> auto updated by another function
    var autoStructures    = [];     //Stores structure types, locations, and priorities (what, where and when to spawn)
    var spawnerRoom_elem  = {roomID:roomID, queue:queueSet, unassigned:unassignedSet, mineralStorage:mineralStorageSet, towers:towers, autoStructures:autoStructures};
    Memory.spawnerRooms.push(spawnerRoom_elem);
}
function remove_spawnerRooms(roomID, fullPurge=true) {
    /*
    . roomID = Name of room to be removed from spawnerRooms e.g. W1S1
    . fullPurge = Whether to terminate after finding a single instance or continue through full list (if true, ensures duplicates are removed)
    */
    for(spawnerRoomIndex in Memory.spawnerRooms) {
        if(Memory.spawnerRooms[spawnerRoomIndex].roomID == roomID) {    // If you find a match for the room to be deleted
            Memory.spawnerRooms.splice(spawnerRoomIndex, 1)             // Delete element
            if(!fullPurge) {break}                                  // Don't cancel for loop early so it can remove duplicates too -> ensures it completely purges
        }
    }
}
function getSpawnerRoomIndex(roomID){
    /*
    . Takes a room name, finds the index in the "spawnerRooms" corresponding to it
    */
    var requiredIndex = null;
    for(var spawnerRoomIndex in Memory.spawnerRooms){
        if(Memory.spawnerRooms[spawnerRoomIndex].roomID == roomID){
            requiredIndex = spawnerRoomIndex;
            break;
        }
    }
    return requiredIndex;
}
function updateTowers_spawnerRooms(){
    for(var spawnerRoomIndex in Memory.spawnerRooms){
        //Spawner room => never vision problems
        var towers = Game.rooms[Memory.spawnerRooms[spawnerRoomIndex].roomID].find(FIND_STRUCTURES, {filter:(structure) => {return( (structure.structureType == STRUCTURE_TOWER)&&(structure.progress == null) )}});    //Is is a tower, and is finished building
        //Add towers in this room to the list
        Memory.spawnerRooms[spawnerRoomIndex].towers = [];
        for(var towerIndex in towers){
            Memory.spawnerRooms[spawnerRoomIndex].towers.push(towers[towerIndex].id);
        }
    }
}

function remove_energyRooms(ID, spawnerRoomID, fullPurge=true) {
    /*
    . ID = Name of the energy room to be removed e.g. W1S1 (if null => remove any energy room where spawnerRoomID matches, irrespective of energy room's ID)
    . spawnerRoomID = Name of the spawner room the energy room is tied to (if null => remove any energy room irrespective of spawnerRoomID)
    . fullPurge = Whether to terminate after finding a single instance or continue through full list (if true, ensures duplicates are removed)

    Cases for [ID, spawnerRoomID];
    A: [value, value] => NEED specified energy room and spawner room
    B: [value, null]  => ONLY NEED specified energy room
    C: [null, value]  => ONLY NEED specified spawner room
    D: [null, null]   => CLEAR all energy rooms
    */
    if(ID == null) {
        if(spawnerRoomID == null) {     // Case D
            console.log("-- WARNING: Clearing all energy rooms --");
            delete Memory.energyRooms;
            Memory.energyRooms = [];
        } else {                        // Case C
            for(energyRoomIndex in Memory.energyRooms) {
                if(Memory.energyRooms[energyRoomIndex].spawnerRoomID == spawnerRoomID) {
                    Memory.energyRooms.splice(energyRoomIndex, 1);
                    if(!fullPurge) {break;}
                }
            }
        }
    } else {
        if(spawnerRoomID == null) {     // Case B
            for(energyRoomIndex in Memory.energyRooms) {
                if(Memory.energyRooms[energyRoomIndex].ID == ID) {
                    Memory.energyRooms.splice(energyRoomIndex, 1);
                    if(!fullPurge) {break;}
                }
            }
        } else {                        // Case A
            for(energyRoomIndex in Memory.energyRooms) {
                if( (Memory.energyRooms[energyRoomIndex].ID == ID) && (Memory.energyRooms[energyRoomIndex].spawnerRoomID == spawnerRoomID) ) {
                    Memory.energyRooms.splice(energyRoomIndex, 1);
                    if(!fullPurge) {break;}
                }
            }
        }
    }
}

module.exports = {
    getSpawnerRoomIndex,
    manageMemory_setupMemory,
    manageMemory_queues,
    updateTowers_spawnerRooms
};