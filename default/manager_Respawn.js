var miningTasks    = require("behaviour_Miner");
var gatheringTasks = require("behaviour_Gatherer");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var warriorTasks   = require("behaviour_Warrior");
var defenderTasks  = require("behaviour_Defender");

var respawnManager = {
    decideSpawn : function(){
        /*
        Creeps must be built to these parameter;
        1. An initial weak miner has to be made (to start colony off cheaply)
        2. At least 2 fast miners should be made as soon as possible (Ideally 3 per source, so 6 ish total is pretty good)
        3.      Once all miners exist, now start making builders (1 or 2) for base infrastructure
        4.          Once builders are no longer busy, start building the army (change depending on spawn level)
        5.              If there is now spare money, make upgraders (1 or 2) to improve spawn level
        */
        var creeps = Game.creeps;
        
        var minerFilter    = _.filter(creeps, function(creep) { return (creep.memory.role == "Miner") });
        var gathererFilter = _.filter(creeps, function(creep) { return (creep.memory.role == "Gatherer") });
        var builderFilter  = _.filter(creeps, function(creep) { return (creep.memory.role == "Builder") });
        var upgraderFilter = _.filter(creeps, function(creep) { return (creep.memory.role == "Upgrader") });
        var armyFilter     = _.filter(creeps, function(creep) { return (creep.memory.role == "Warrior" || creep.memory.role == "Defender") });
        
        miningTasks.respawn(minerFilter.length);                    //1 & 2
        if(minerFilter.length > gathererFilter.length){
            gatheringTasks.respawn(gathererFilter.length);}      //Ensure you have some as you go
        if(minerFilter.length >= 6){
            gatheringTasks.respawn(gathererFilter.length);       //Then try to reach maximum quickly
            buildingTasks.respawn(builderFilter.length);            //3
            if(builderFilter.length >= 1){
                warriorTasks.respawn(armyFilter.length);            //4
                defenderTasks.respawn(armyFilter.length);
                if(armyFilter.length >= 4){
                    upgradingTasks.respawn(upgraderFilter.length);   //5
                }
            }
        }
    }
}
module.exports = respawnManager;