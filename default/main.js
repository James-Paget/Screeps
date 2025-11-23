var miner_tasks     = require("behaviour_Miner");
var gatherer_tasks  = require("behaviour_Gatherer");
var upgrading_tasks = require("behaviour_Upgrader");
var building_tasks  = require("behaviour_Builder");
var repairing_tasks = require("behaviour_Repairer");
var defender_tasks  = require("behaviour_Defender");
var {extractor_tasks} = require("behaviour_Extractor");
var {claimer_tasks, generate_claimer, automatic_spawnClaimers} = require("behaviour_Claimer");
var tower_tasks       = require("behaviour_Tower");
var {military_tasks, generate_coreClearers, generate_militia, automatic_clearCores}   = require("behaviour_Military");
var respawnManager    = require("manager_Respawn");
var {init_energyRoom, assignCreeps_energyRooms} = require("cycle_energyAcquire");
var {manageMemory_setupMemory, manageMemory_queues} = require("manager_Memory");
var {calculate_transaction_manual, calculate_transaction_automatic} = require("manager_Market");

module.exports.loop = function () {
    //Ensure memory values are accurate and up to date
    manageMemory_setupMemory();
    manageMemory_queues();
    manageMemory_dead_cleanup();

    //Spawn & assign required dudes
    assignCreeps_energyRooms();         //this order is important, prevents nulls occurring when spawning and instantly assigning, gives a frame of breather room
    respawnManager.spawnFromQueue();    //assign -> respawn => respawn -> frame gap -> assign
    respawnManager.extendQueue();
    
    //Make each dude do his job
    creep_taskManager();
    tower_taskManager();

    //Build structures where required
    //...

    //Market functionality
    //calculate_transaction_manual();
    calculate_transaction_automatic();

    //BIT BODGED
    // automatic_spawnClaimers();
    automatic_clearCores();

    //## TEST THIS FUNCTION ## ------> THIS IS WORKING NOW (HEALERS BROKE)
    if(Game.time.toString().slice(-1) == 0){
        //generate_coreClearers(0, "W7S14", "W7S15")
        //generate_militia(1, "W7S14", "W7S13")
        //generate_claimer(false, "W7S14", null);
    }
}

function creep_taskManager(){
    var creeps = Game.creeps;
    for(creepName in creeps) {
        if(creeps[creepName].memory.role!=null) {   // ** Note; All creeps require; spawnKey=[roomID, spawnID]
            if( (creeps[creepName].memory.spawnKey["roomID"]!=null)&&(creeps[creepName].memory.spawnKey["spawnID"]!=null) ) {
                if(creeps[creepName].memory.role == "Miner"){       // ** Note; Miner requires; spawnKey=[roomID, spawnID], houseKey=[roomID, sourceID] 
                    if( (creeps[creepName].memory.houseKey["roomID"]!=null)&&(creeps[creepName].memory.houseKey["sourceID"]!=null) ) {
                        miner_tasks.task(creeps[creepName]);
                    }
                }
                if(creeps[creepName].memory.role == "Gatherer"){    // ** Note; Gatherer requires; spawnKey=[roomID, spawnID], houseKey=[roomID, sourceID] 
                    if( (creeps[creepName].memory.houseKey["roomID"]!=null)&&(creeps[creepName].memory.houseKey["sourceID"]!=null) ) {
                        gatherer_tasks.task(creeps[creepName]);
                    }
                }
                if(creeps[creepName].memory.role == "Upgrader"){
                    upgrading_tasks.task(creeps[creepName]);}
                if(creeps[creepName].memory.role == "Builder"){
                    building_tasks.task(creeps[creepName]);}
                if(creeps[creepName].memory.role == "Repairer"){
                    repairing_tasks.task(creeps[creepName]);}
                if(creeps[creepName].memory.role == "Defender"){
                    defender_tasks.task(creeps[creepName]);}
                if(creeps[creepName].memory.role == "Extractor"){
                    extractor_tasks.task(creeps[creepName]);}
                if(creeps[creepName].memory.role == "Military"){
                    military_tasks.task(creeps[creepName]);}
                if(creeps[creepName].memory.role == "Claimer"){
                    claimer_tasks.task(creeps[creepName]);}
                //...
            }       // If spawnKey is corrupted, do not try to perform tasks
        }           // If its role is corrupted, do not try to perform tasks
    }
}
function tower_taskManager(){
    for(var spawnerRoomIndex in Memory.spawnerRooms){
        for(var towerIndex in Memory.spawnerRooms[spawnerRoomIndex].towers){
            tower_tasks.task( Game.getObjectById(Memory.spawnerRooms[spawnerRoomIndex].towers[towerIndex]) );
        }
    }
}
function manageMemory_dead_cleanup(){
    //Clean dead dudes
    for(var memoryName in Memory.creeps){
        if(!Game.creeps[memoryName]){
            if(Memory.creeps[memoryName].role != null) {
                if(Memory.creeps[memoryName].role == "Miner"){
                    miner_tasks.death(Memory.creeps[memoryName].houseKey, Memory.creeps[memoryName].role, Memory.creeps[memoryName].ID);}
                if(Memory.creeps[memoryName].role == "Gatherer"){
                    gatherer_tasks.death(Memory.creeps[memoryName].houseKey, Memory.creeps[memoryName].role, Memory.creeps[memoryName].ID);}
                if(Memory.creeps[memoryName].role == "Upgrader"){
                    upgrading_tasks.death();}
                if(Memory.creeps[memoryName].role == "Builder"){
                    building_tasks.death();}
                if(Memory.creeps[memoryName].role == "Repairer"){
                    repairing_tasks.death();}
                if(Memory.creeps[memoryName].role == "Defender"){
                    defender_tasks.death();}
                if(Memory.creeps[memoryName].role == "Extractor"){
                    extractor_tasks.death();}
                if(Memory.creeps[memoryName].role == "Military"){
                    military_tasks.death();}
                if(Memory.creeps[memoryName].role == "Claimer"){
                    claimer_tasks.death();}
                //...
            }   // If has a corrupted role memory, delete anyway but without extra cleanup
            delete Memory.creeps[memoryName];
        }
    }
}
