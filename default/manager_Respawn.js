var {miner_tasks, gatherer_tasks} = require("cycle_energyAcquire");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");
var funTasks       = require("behaviour_funDudes");

/*
The current solution for spawning;
. Certain roles (like builders, repairers, etc) spawn up to a fixed quantity -------------> MAKE BUILDERS SCALE WITH # OF CONSTRUCTION SITES IN FUTURE
. Creeps involved in energyRooms (miners and gatherers) are periodically spawned based on saturation needs
-   For example; A function will check whether any new creeps are needed, and if so will output the parts, 
                room and source desired. On another tick, a function will then look through spawned assigned 
                creeps of given roles, and assign them to the location they were intended for. This is separate 
                because the ID of a creep can only be accessed after spawning.
*/

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
        var repairerFilter = _.filter(creeps, function(creep) { return (creep.memory.role == "Repairer") });
        var upgraderFilter = _.filter(creeps, function(creep) { return (creep.memory.role == "Upgrader") });
        var armyFilter     = _.filter(creeps, function(creep) { return (creep.memory.role == "Defender") });
        var funFilter      = _.filter(creeps, function(creep) { return (creep.memory.role == "BasedIndividual") });
        
        //#########################################################
        //## WILL NEED SOME REQORKING WITH NEW ASSIGNMENT SYSTEM ##
        //#########################################################
        miner_tasks.respawn(minerFilter.length);                            //1 & 2
        if(minerFilter.length >= 4){                //########################################################## BIG PROBLEM, MAKE VARIABLE #######
            gatherer_tasks.respawn(gathererFilter.length);
            if(gathererFilter.length >= 2){         //########################################################## BIG PROBLEM, MAKE VARIABLE #######
                buildingTasks.respawn(builderFilter.length);                //3
                if(builderFilter.length >= 1){
                    repairingTasks.respawn(repairerFilter.length);
                    if(repairerFilter.length >= 1){
                        defenderTasks.respawn(armyFilter.length);           //4
                        if(armyFilter.length >= 4){
                            upgradingTasks.respawn(upgraderFilter.length);  //5
                            //funTasks.respawn(funFilter.length);
                        }
                    }
                }
            }
        }
    }
}
module.exports = respawnManager;