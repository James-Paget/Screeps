var miningTasks    = require("behaviour_Miner");
var gatheringTasks = require("behaviour_Gatherer");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var warriorTasks   = require("behaviour_Warrior");
var defenderTasks  = require("behaviour_Defender");
var structureManager = require("manager_Structures");
var respawnManager   = require("manager_Respawn");

module.exports.loop = function () {
    var creeps  = Game.creeps;
    
    //Clean dead dudes
    for(var memoryName in Memory.creeps){
        if(!Game.creeps[memoryName]){
            delete Memory.creeps[memoryName];
        }
    }
    
    //Spawn required dudes
    respawnManager.decideSpawn();
    
    //Make each dude do his job
    for(name in creeps)
    {
        if(creeps[name].memory.role == "Miner"){
            miningTasks.goMine(creeps[name]);}
        if(creeps[name].memory.role == "Gatherer"){
            miningTasks.goGather(creeps[name]);}
        if(creeps[name].memory.role == "Upgrader"){
            upgradingTasks.goUpgrade(creeps[name]);}
        if(creeps[name].memory.role == "Builder"){
            buildingTasks.goBuild(creeps[name]);}
        if(creeps[name].memory.role == "Warrior"){
            warriorTasks.goFight(creeps[name]);}
        if(creeps[name].memory.role == "Defender"){
            defenderTasks.goDefend(creeps[name]);}
        //...
    }
    //Build structures where required
    var rooms = Game.rooms;
    for(var room in rooms){
        structureManager.placeExtensions(room); //Make try and place only once by flicking a boolean as the level changes
    }
}