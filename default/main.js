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
    /*
    ###
    ------> SPAWNED WITH MEMORY "Undefined" --> LOOKS LIKE A SIM BUG POSSIBLY

    0.) REASSEMBLY OST
    1.) Change all "spawnQueues" to work with multi-room spawnQueue now
    2.) Make sure all "Spawn1"s used are generalise for multi-rooms
    2.5.) [[Make other creep types SCALE with energy capacity properly]]
    3.) Have a periodic function, that checks for containers (& others) that have been destroyed, and removes them from lists
    3.5.) Periodic function that assigns containers to sources automatically (TO WORK WITH NEXT STEP)
    3.75.) Refine the miners and gatherers into LARGER creeps, also try to reduce wastage (especially with gatherers) a bit more --> Mainly just huge carriers for the energy
    4.) Create containers & extensions & roads & walls auto-placer (manager_Structure REMADE)
    5.) Generalise so useful commands like "findNearestEnergySource_inRoom()", ...
    6.) Clean-up some of the vars used, brinf functions out that are general, make required modules more split up (not bunched in main)
    6.5.) Reorganise files names and function names, some files are just a real mess to read/inconsistent
    7.) Reduce memory usage; (a)Make creeps larger, (b)store paths in memory so not recalculated
    8.) Make larger military, more organised, make sit still more so they dont waste CPU
    9.) Figure out some trading stuff with allies
    10.) Start harvesting minerals, commodities in highways, power banks in highways, ...

    */
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
    for(name in Game.creeps)
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