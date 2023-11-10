var {miner_tasks, gatherer_tasks, init_energyRoom, queueCreeps_energyRooms, assignCreeps_energyRooms} = require("cycle_energyAcquire");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");
var structureManager = require("manager_Structures");
var respawnManager   = require("manager_Respawn");

module.exports.loop = function () {
    var creeps  = Game.creeps;
    
    /*
    ###
    NEEDS TO UPDATE CONTAINERS BEING REMOVED PERIODICALLY --> energyRooms global memory
    ----> SPAWNED WITH MEMORY "Undefined" --> LOOKS LIKE A SIM BUG POSSIBLY

    --> PUT QUEUE FUNCTION INTO ALL WORKERS

    ----> FOR QUEUE, JUST LOOK AT THE ROLES ALREADY IN THE QUEUE; IF NONE OF SAME TYPE, PUT YOURS IN, DO 1 AT A TIME TYPE DEAL (OTHER THAN ENERGY ROOM WORKERS)
    . AUTO PLACE NEW EXTENSIONS & Containers => AUTO ADD THEM TO THE GLOBAL MEMORY
    . THEN MAKE OTHERS GUYS GET ADDED TO THE QUEUE
    .       --> MAKE SURE THEY DO THEIR WORK PROPERLY
    ###
    */
    if(!Memory.spawnQueue){
        var queueSet       = [];    //Spawn Queue init here too
        var unassignedSet  = [];    //### MAYBE GOOD TO MOVE SOMEWHERE ELSE ###
        Memory.spawnQueue  = {queue:queueSet, unassigned:unassignedSet};}
    if(!Memory.energyRooms){
        Memory.energyRooms = [];}
    init_energyRoom(Game.spawns["Spawn1"].room);    //## HAVE A MANAGER FOR THIS ##
    
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
    
    //Spawn & assign required dudes
    assignCreeps_energyRooms();         //this order is important, prevents nulls occurring when spawning and istantly assigning, gives a frame of breather room
    respawnManager.spawnFromQueue();    //assign -> respawn => respawn -> frame gap -> assign
    respawnManager.extendQueue();
    
    //Make each dude do his job
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
    //Build structures where required
    var rooms = Game.rooms;
    for(var room in rooms){
        structureManager.placeExtensions(room); //Make try and place only once by flicking a boolean as the level changes
    }
}