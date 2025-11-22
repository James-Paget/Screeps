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
    /*
    (1) Setup colony restart functions
    (2) Rework all spawn functions + death functions + etc to work with multi-spawners (per room) AND multi-spawners (several rooms)
    (3) Setup auto-builder functions for all existing buildings
    */


    //## PUT THIS INOT A "RESTART COLONY" FUNCTION
    //## PUT THIS INOT A "RESTART COLONY" FUNCTION

    //restartMemory() <--- MAKE REQUIRED CHANGES HERE IN PARENT OBJECT

    //delete Memory.energyRooms;
    //delete Memory.spawnerRooms;
    //Memory.spawnerRooms[...].towers = [];
    // + CHANGE E ROOM INIT NAME
    // + CHANGE SPAWNER ROOM INIT NAME
    //## PUT THIS INOT A "RESTART COLONY" FUNCTION
    //## PUT THIS INOT A "RESTART COLONY" FUNCTION
    
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
//##########
//## NEED TO DEPLOY MILITIA TO KILL CORES AUTOMATICALLY
//##
//## NEED TO SETUP CREEPS TO RESERVE ENERGY ROOMS
//##########

function creep_taskManager(){
    var creeps = Game.creeps;
    for(name in creeps)
    {
        // if(name == "Upgrader74427326") {
        //     var creep = creeps[name]
        //     if(creep.room.controller) {
        //         if(creep.signController(creep.room.controller, "Ello") == ERR_NOT_IN_RANGE) {
        //             creep.moveTo(creep.room.controller);
        //         }
        //     }
        // }
        if(creeps[name].memory.role == "Miner"){
            miner_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Gatherer"){
            gatherer_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Upgrader"){
            upgrading_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Builder"){
            building_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Repairer"){
            repairing_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Defender"){
            defender_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Extractor"){
            extractor_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Military"){
            military_tasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Claimer"){
            claimer_tasks.task(creeps[name]);}
        //...
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
            delete Memory.creeps[memoryName];
        }
    }
}
