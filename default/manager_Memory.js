var {miner_tasks, gatherer_tasks} = require("cycle_energyAcquire");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");
var {military_tasks, tower_tasks} = require("behaviour_military");

function manageMemory_energyRooms(){
    //Make sure energyRooms{} exists
    if(!Memory.energyRooms){
        Memory.energyRooms = [];}
    //...
}
function manageMemory_queues(){
    //Make sure Queues{} exist
    if(!Memory.spawnQueue){
        Memory.spawnQueue = [];
        init_spawnQueue("sim");      //#### WILL NEED TO CLEVERLY CHECK WHEN TO MAKE THIS DEPENDING ON WHAT IS BEING ASKED TO BE SPAWNED, NEED TO CHECK IF THIS QUEUE FOR THIS ROOM ALREADY EXISTS
    }

    //Remove old queued creeps --> prevents clogging
    if(Game.time.toString().slice(-1) == 0){                                        //Every 10 frames
        for(var spawnQueueIndex in Memory.spawnQueue){
            for(let i=Memory.spawnQueue[spawnQueueIndex].queue.length-1; i>=0; i--){
                if(Math.abs(Game.time-Memory.spawnQueue[spawnQueueIndex].queue[i].time) >= 100){
                    Memory.spawnQueue[spawnQueueIndex].queue.splice(i,1);                            //If has been sat in queue for too long, get rid of it
                }
            }
        }
    }
}
function init_spawnQueues(roomID){
    /*
    . Creates a space in the "Memory.spawnQueue" for a spawner in a room not currently assigned
    . If this is left empty for some time, it will be removed
    . Inside a Memory.spawnQueue element, you have; {roomID, queue, unassigned}
        roomID       = roomName (name)
        queue[{}]    = creeps in queue for that room (list[] of specs{})
        unassigned[] = creeps unassigned for that room (list[] of names)
    */
    var queueSet        = [];
    var unassignedSet   = [];
    var spawnQueue_elem = {roomID:roomID, queue:queueSet, unassigned:unassignedSet};
    Memory.spawnQueue.push(spawnQueue_elem);
}
function getSpawnQueueIndex(roomName){
    /*
    . Takes a room name, finds the index in the "spawnQueues" corresponding to it
    */
    var requiredIndex = null;
    for(var spawnQueueIndex in Memory.spawnQueue){
        if(Memory.spawnQueue[spawnQueueIndex].roomID == roomName){
            requiredIndex = spawnQueueIndex;
            break;
        }
    }
    return requiredIndex;
}
function manageMemory_towers(){
    //Make sure towers[] exist
    if(!Memory.towers){
        Memory.towers = []; //List of IDs
    }
}
function manageMemory_dead_cleanup(){
    //Clean dead dudes
    for(var memoryName in Memory.creeps){
        if(!Game.creeps[memoryName]){
            //console.log("CREEP JUST REGISTERED AS DEAD");
            if(Memory.creeps[memoryName].role == "Miner"){
                miner_tasks.death(Memory.creeps[memoryName].houseKey, Memory.creeps[memoryName].role, Memory.creeps[memoryName].ID);}
            if(Memory.creeps[memoryName].role == "Gatherer"){
                gatherer_tasks.death(Memory.creeps[memoryName].houseKey, Memory.creeps[memoryName].role, Memory.creeps[memoryName].ID);}
            if(Memory.creeps[memoryName].role == "Upgrader"){
                upgradingTasks.death();}
            if(Memory.creeps[memoryName].role == "Builder"){
                buildingTasks.death();}
            if(Memory.creeps[memoryName].role == "Repairer"){
                repairingTasks.death();}
            if(Memory.creeps[memoryName].role == "Defender"){
                defenderTasks.death();}
            //...
            delete Memory.creeps[memoryName];
        }
    }
}

module.exports = {
    manageMemory_energyRooms,
    manageMemory_queues,
    manageMemory_towers,
    manageMemory_dead_cleanup
};