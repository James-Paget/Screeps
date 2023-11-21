var miner_tasks     = require("behaviour_Miner");
var gatherer_tasks  = require("behaviour_Gatherer");
var upgrading_tasks = require("behaviour_Upgrader");
var building_tasks  = require("behaviour_Builder");
var repairing_tasks = require("behaviour_Repairer");
var defender_tasks  = require("behaviour_Defender");
var extractor_tasks = require("behaviour_Extractor");
var {military_tasks, tower_tasks} = require("behaviour_Military");
var respawnManager   = require("manager_Respawn");
var {init_energyRoom, assignCreeps_energyRooms} = require("cycle_energyAcquire");
var {manageMemory_energyRooms, manageMemory_queues, manageMemory_towers} = require("manager_Memory");

module.exports.loop = function () {
    //Ensure memory values are accurate and up to date
    manageMemory_queues();
    manageMemory_energyRooms();
    manageMemory_towers();
    manageMemory_dead_cleanup();
    init_energyRoom(Game.spawns["Spawn1"].room);    //### MOVE THIS OUT ### ---> HAVE A PERIODIC CHECK FOR E_ROOMS, CONTAAINERS LOST, ETC --> e.g every 5/10/20 frames
    
    //Spawn & assign required dudes
    assignCreeps_energyRooms(Game.spawns["Spawn1"].room.name);      //this order is important, prevents nulls occurring when spawning and istantly assigning, gives a frame of breather room
    respawnManager.spawnFromQueue();                                //assign -> respawn => respawn -> frame gap -> assign
    respawnManager.extendQueue();
    
    //Make each dude do his job
    creep_taskManager();
    tower_taskManager();

    //Build structures where required
    //...
}

function creep_taskManager(){
    var creeps = Game.creeps;
    for(name in creeps)
    {
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
        //...
    }
}
function tower_taskManager(){
    for(var towerIndex in Memory.towers){
        tower_tasks.task( Game.getObjectById(Memory.towers[towerIndex]) );
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
                upgrading_tasks.death();}
            if(Memory.creeps[memoryName].role == "Builder"){
                building_tasks.death();}
            if(Memory.creeps[memoryName].role == "Repairer"){
                repairing_tasks.death();}
            if(Memory.creeps[memoryName].role == "Defender"){
                defender_tasks.death();}
            if(Memory.creeps[memoryName].role == "Extractor"){
                extractor_tasks.death();}
            //...
            delete Memory.creeps[memoryName];
        }
    }
}