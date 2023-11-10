var {miner_tasks, queueCreeps_energyRooms, gatherer_tasks} = require("cycle_energyAcquire");
var upgradingTasks = require("behaviour_Upgrader");
var buildingTasks  = require("behaviour_Builder");
var repairingTasks = require("behaviour_Repairer");
var defenderTasks  = require("behaviour_Defender");

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
        if(Memory.spawnQueue.queue.length > 0){                                             //If anything to spawn
            var spawner = Game.spawns["Spawn1"];
            if(!spawner.spawning){                                                          //And not busy
                var energyRequired = _.sum(Memory.spawnQueue.queue[0].parts, part => BODYPART_COST[part]);
                if(energyRequired <= spawner.room.energyAvailable){                         //And have enough energy
                    var creepName = Memory.spawnQueue.queue[0].role+Game.time;
                    if(Memory.spawnQueue.queue[0].role == "Miner"){
                        miner_tasks.respawn(creepName, Memory.spawnQueue.queue[0]);
                        Memory.spawnQueue.unassigned.push(creepName);}  //energyRoom unit, => requires assigning
                    if(Memory.spawnQueue.queue[0].role == "Gatherer"){
                        gatherer_tasks.respawn(creepName, Memory.spawnQueue.queue[0]);
                        Memory.spawnQueue.unassigned.push(creepName);}  //energyRoom unit, => requires assigning
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
                    Memory.spawnQueue.queue.shift();
                }
            }
        }
    },
    extendQueue : function(){
        /*
        . Manages the turn-taking of the different 'factors' trying to add creeps to the queue
        . Each 'factor' can add 1 creep to the queue each time this function is called (to give them all opportunity to populate their workers)

        For example, some factors are;
        -energyRoom creeps
        -General creeps
        -...
        */
        if( (Memory.spawnQueue.queue.length == 0) && (Memory.spawnQueue.unassigned.length == 0) ){
            queueCreeps_energyRooms();  //Can contribute 2 at once, maximum (miner and/or gatherer)
            this.populateQueue_general();    //Can contribute 1 at once, maximum
        }
    },
    populateQueue_general : function(){
        /*
        . Adds creeps NOT related to energy rooms (Miners and Gatherers) to the spawning queue
        . This is performed such that energyRooms are utilised well before excess energy is spent on these other workers

        Priorities are;
        (1) Repairer
        (2) Builders
        (3) Upgraders
        (4) Army
        */
        var creeps = Game.creeps;
        
        //#######################################################################################################
        //#### THIS WILL REQUIRE SOME INTERESTING THOUGHT FOR MULTI-ROOM STUFF, PARTICULARLY MULTI-SPAWNERS #####
        //#######################################################################################################

        //#### -----> Assuming this functions how one spawner will be governed...
        //Sources covered
        var sourceOccupied_miners    = getSummed_potential_role("Miner")    > Game.spawns["Spawn1"].room.find(FIND_SOURCES).length;
        var sourceOccupied_gatherers = getSummed_potential_role("Gatherer") > Game.spawns["Spawn1"].room.find(FIND_STRUCTURES, {filter:(structure)=>{return(structure.structureType == STRUCTURE_CONTAINER)}}).length;
        if(sourceOccupied_miners && sourceOccupied_gatherers){
            var repairerFilter = getSummed_potential_role("Repairer");
            if(repairerFilter > 0){
                var builderFilter  = getSummed_potential_role("Builder");
                if(builderFilter > 1){
                    var upgraderFilter = getSummed_potential_role("Upgrader");
                    if(upgraderFilter > 4){
                        var armyFilter     = getSummed_potential_role("Defender");
                        if(armyFilter < 4){
                            defenderTasks.queue();}
                    }
                    else{
                        upgradingTasks.queue();}
                }
                else{
                    buildingTasks.queue();}
            }
            else{
                repairingTasks.queue();}
        }
    }
}
function getSummed_potential_role(role){
    /*
    . Sums all the creeps with the given role
    . Sums creep that are currently alive AND that are queued up

    #####
    ## HOPEFULLY NO PROBLEM IN THE 1 FRAME IT IS IN UNASSIGNED => BUT SHOULD STILL EXIST IN BOARD AT THIS POINT SO SHOULD BE FINE, BUT WORTH TESTING
    #####
    */
    var total = 0;
    for(var creepName in Game.creeps){
        if(Game.creeps[creepName].memory.role == role){
            total++;}
    }
    for(var element in Memory.spawnQueue.queue){
        if(Memory.spawnQueue.queue[element].role == role){
            total++;}
    }
    return total;
}

module.exports = respawnManager;