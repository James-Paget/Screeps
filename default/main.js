var {miner_tasks, gatherer_tasks, init_energyRoom, queueCreeps_energyRooms, assignCreeps_energyRooms} = require("cycle_energyAcquire");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");
var {military_tasks, tower_tasks} = require("behaviour_military");
var structureManager = require("manager_Structures");
var respawnManager   = require("manager_Respawn");

module.exports.loop = function () {
    var creeps  = Game.creeps;
    
    /*
    ###
    ----> SPAWNED WITH MEMORY "Undefined" --> LOOKS LIKE A SIM BUG POSSIBLY
    . AUTO PLACE NEW EXTENSIONS & Containers => AUTO ADD THEM TO THE GLOBAL MEMORY
    . NEEDS TO UPDATE CONTAINERS BEING REMOVED PERIODICALLY --> energyRooms global memory
    ###
    */
    if(!Memory.spawnQueue){
        var queueSet       = [];    //Spawn Queue init here too
        var unassignedSet  = [];    //### MAYBE GOOD TO MOVE SOMEWHERE ELSE ###
        Memory.spawnQueue  = {queue:queueSet, unassigned:unassignedSet};}
    if(!Memory.energyRooms){
        Memory.energyRooms = [];}
    init_energyRoom(Game.spawns["Spawn1"].room);    //## HAVE A MANAGER FOR THIS ##
    if(Game.time.toString().slice(-1) == 0){        //Every 10 frames
        for(let i=Memory.spawnQueue.queue.length-1; i>=0; i--){                 //################# MOVE ALL THIS ELSEWHERE
            if(Math.abs(Game.time-Memory.spawnQueue.queue[i].time) >= 100){     //#################
                Memory.spawnQueue.queue.splice(i,1);    //If has been sat in queue for too long, get rid of it
            }
        }
    }
    
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
        var towers = Game.spawns["Spawn1"].room.find(FIND_STRUCTURES, {filter:(structure)=>{return(structure.structureType == STRUCTURE_TOWER)}});
        for(var tower in towers){
            tower_tasks.task(towers[tower]);
        }
        //...
    }
    //Build structures where required
    var rooms = Game.rooms;
    for(var room in rooms){
        structureManager.placeExtensions(room); //Make try and place only once by flicking a boolean as the level changes
    }
}