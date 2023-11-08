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
    spawnFromQueue : function(){
        /*
        . Uses to queue to decide next spawn
        . Only attempts to spawn when spawner is finished spawning last and has enough energy
        . Moves certain roles to unassigned list when processed in queue
        */
        var spawner = Game.spawns["Spawn1"];
        if(Memory.spawnQueue.queue.length > 0){                                             //If anything to spawn
            if(!spawner.spawning){                                                          //And not busy
                var energyRequired = getPartsEnergyCost(Memory.spawnQueue.queue[0].parts);  //And have enough energy
                if(energyRequired <= spawner.room.energyAvailable){                         //
                    if(Memory.spawnQueue.queue[0].role == "Miner"){
                        miner_tasks.respawn(Memory.spawnQueue.queue[0]);
                        Memory.spawnQueue.unassigned.push(spawner.spawning.name);}  //energyRoom unit, => requires assigning
                    if(Memory.spawnQueue.queue[0].role == "Gatherer"){
                        gatherer_tasks.respawn(Memory.spawnQueue.queue[0]);
                        Memory.spawnQueue.unassigned.push(spawner.spawning.name);}  //energyRoom unit, => requires assigning
                    if(Memory.spawnQueue.queue[0].role == "Repairer"){
                        repairingTasks.respawn(Memory.spawnQueue.queue[0]);}
                    if(Memory.spawnQueue.queue[0].role == "Builder"){
                        buildingTasks.respawn(Memory.spawnQueue.queue[0]);}
                    if(Memory.spawnQueue.queue[0].role == "Upgrader"){
                        upgradingTasks.respawn(Memory.spawnQueue.queue[0]);}
                    if(Memory.spawnQueue.queue[0].role == "Defender"){
                        defenderTasks.respawn(Memory.spawnQueue.queue[0]);}
                    if(Memory.spawnQueue.queue[0].role == "BasedIndiviudal"){
                        funTasks.respawn(Memory.spawnQueue.queue[0]);}
                    //...
                    Memory.spawnQueue.queue.pop(0);
                }
            }
        }
    },
    populateQueue : function(){
        /*
        Creeps must be built to these parameter;
        1. An initial weak miner has to be made (to start colony off cheaply)
        2. At least 2 fast miners should be made as soon as possible (Ideally 3 per source, so 6 ish total is pretty good)
        3.      Once all miners exist, now start making builders (1 or 2) for base infrastructure
        4.          Once builders are no longer busy, start building the army (change depending on spawn level)
        5.              If there is now spare money, make upgraders (1 or 2) to improve spawn level

        ###################################################
        ## NEEDS REWORKING TO WORK WITH QUEUE BEFORE USE ##
        ###################################################
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
function getPartsEnergyCost(parts){
    var partCost = {MOVE:50, WORK:100, CARRY:50, ATTACK:80, RANGED_ATTACK:150, HEAL:250, CLAIM:600, TOUGH:10};
    var total_cost = 0;
    for(var part in parts){
        total_cost += partCost.parts[part];
    }
    return total_cost;
}

module.exports = respawnManager;