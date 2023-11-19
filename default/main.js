var miner_tasks    = require("behaviour_Miner");
var gatherer_tasks = require("behaviour_Gatherer");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");
var {military_tasks, tower_tasks} = require("behaviour_military");
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
            upgradingTasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Builder"){
            buildingTasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Repairer"){
            repairingTasks.task(creeps[name]);}
        if(creeps[name].memory.role == "Defender"){
            defenderTasks.task(creeps[name]);}
        //...
    }
}
function tower_taskManager(){
    for(var towerIndex in Memory.towers){
        tower_tasks.task( Game.findObjectById(Memory.towers[towerIndex]) );
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