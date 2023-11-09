var {miner_tasks, gatherer_tasks, queueCreeps_energyRooms, assignCreeps_energyRooms} = require("cycle_energyAcquire");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");
var funTasks       = require("behaviour_funDudes");
var structureManager = require("manager_Structures");
var respawnManager   = require("manager_Respawn");

module.exports.loop = function () {
    var creeps  = Game.creeps;
    
    if(!Memory.spawnQueue){
        var queueSet       = [];    //Spawn Queue init here too
        var unassignedSet  = [];    //### MAYBE GOOD TO MOVE SOMEWHERE ELSE ###
        Memory.spawnQueue  = {queue:queueSet, unassigned:unassignedSet};}
    if(!Memory.energyRooms){
        Memory.energyRooms = [];}
    
    
    /*
    #################
    NEEDS TO UPDATE CONTAINERS BEING REMOVED PERIODICALLY
    
    PROBLEMS WHEN REMOVING NAMES WHEN DYING, LEFT NULLS IN THERE. MAY ONLY OCCUR IF OTHER NULLS ARE IN THAT LIST

    SEEMS LIKE BIG PROBLEM WITH REMOVING --> ALSO NEEDS TO CHECK UNASSIGN TOO MAYBE
    #################
    */
    var cName = "Miner"+Game.time;
    var spec = {roomID:Game.spawns["Spawn1"].room.name, sourceID:Game.spawns["Spawn1"].room.find(FIND_SOURCES)[0].id, parts:[MOVE, MOVE, MOVE], role:"Miner"};
    var myCreep = Game.creeps[cName];
    console.log("Name = ",cName);
    if(Game.time == 65){
        miner_tasks.respawn(cName, spec);
        Memory.spawnQueue.unassigned.push(cName);}
    console.log("unassigned AFTER = ",Memory.spawnQueue.unassigned);


    
    //Clean dead dudes
    for(var memoryName in Memory.creeps){
        if(!Game.creeps[memoryName]){
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
            if(Memory.creeps[memoryName].role == "BasedIndividual"){
                funTasks.death();}
            //...
            delete Memory.creeps[memoryName];
        }
    }
    
    //Spawn required dudes
    queueCreeps_energyRooms();
    assignCreeps_energyRooms();         //this order is important, prevents nulls occurring when spawning and istantly assigning, gives a frame of breather room
    respawnManager.spawnFromQueue();    //assign -> respawn => respawn -> frame gap -> assign
    
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
        if(creeps[name].memory.role == "BasedIndividual"){
            funTasks.task(creeps[name]);}
        //...
    }
    //Build structures where required
    var rooms = Game.rooms;
    for(var room in rooms){
        structureManager.placeExtensions(room); //Make try and place only once by flicking a boolean as the level changes
    }
}