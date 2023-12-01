var miner_tasks     = require("behaviour_Miner");
var gatherer_tasks  = require("behaviour_Gatherer");
var upgrading_tasks = require("behaviour_Upgrader");
var building_tasks  = require("behaviour_Builder");
var repairing_tasks = require("behaviour_Repairer");
var defender_tasks  = require("behaviour_Defender");
var extractor_tasks = require("behaviour_Extractor");
var {getSpawnerRoomIndex} = require("manager_Memory");
var {queueCreeps_energyRooms} = require("cycle_energyAcquire");

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
        for(var spawnerRoomIndex in Memory.spawnerRooms){
            if(Memory.spawnerRooms[spawnerRoomIndex].queue.length > 0){                            //If anything to spawn
                var spawnerID = Game.rooms[Memory.spawnerRooms[spawnerRoomIndex].roomID].find(FIND_STRUCTURES, {filter:(structure) => {return(structure.structureType == STRUCTURE_SPAWN)}})[0].id;
                var spawner   = Game.getObjectById(spawnerID);
                var creepSpec = Memory.spawnerRooms[spawnerRoomIndex].queue[0];
                if(!spawner.spawning){                                                          //And not busy
                    var energyRequired = _.sum(Memory.spawnerRooms[spawnerRoomIndex].queue[0].parts, part => BODYPART_COST[part]);
                    if(energyRequired <= spawner.room.energyAvailable){                         //And have enough energy
                        var creepName = Memory.spawnerRooms[spawnerRoomIndex].queue[0].role+Game.time;
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Miner"){
                            miner_tasks.respawn(creepName, spawnerID, creepSpec);
                            Memory.spawnerRooms[spawnerRoomIndex].unassigned.push(creepName);}     //energyRoom unit, => requires assigning
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Gatherer"){
                            gatherer_tasks.respawn(creepName, spawnerID, creepSpec);
                            Memory.spawnerRooms[spawnerRoomIndex].unassigned.push(creepName);}     //energyRoom unit, => requires assigning
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Repairer"){
                            repairing_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Builder"){
                            building_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Upgrader"){
                            upgrading_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Defender"){
                            defender_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Extractor"){
                            extractor_tasks.respawn(creepName, spawnerID, creepSpec);}
                        //...
                        Memory.spawnerRooms[spawnerRoomIndex].queue.shift();
                    }
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
        for(var spawnerRoomIndex in Memory.spawnerRooms){
            if( (Memory.spawnerRooms[spawnerRoomIndex].queue.length == 0) && (Memory.spawnerRooms[spawnerRoomIndex].unassigned.length == 0) ){
                queueCreeps_energyRooms();  //Can contribute 2 at once, maximum (miner and/or gatherer)
                this.populateQueue_general(Memory.spawnerRooms[spawnerRoomIndex].roomID);    //Can contribute 1 at once, maximum
            }
        }
    },
    populateQueue_general : function(roomID){
        /*
        . Adds creeps NOT related to energy rooms (Miners and Gatherers) to the spawning queue
        . This is performed such that energyRooms are utilised well before excess energy is spent on these other workers

        Priorities are;
        (1) Repairer
        (2) Builders
        (3) Upgraders
        (4) Army
        */
        //#################################################################################################
        //#### NOTE LOTS OF THESE DEPEND ON CREEPS IN A ROOM, => CANNOT LEAVE OR WILL INFINTE RESPAWN #####
        //#################################################################################################

        //#############################################################################################################
        //## REPLACE THIS WITH FUNCTIONAL CONDITION, MAKE IT FAR BETTER, THIS IS A TERRIBLE METRIC FOR WHEN TO SPAWN ##
        //#############################################################################################################
        var sourceOccupied_miners    = getSummed_potential_role(roomID, "Miner")    >= Game.rooms[roomID].find(FIND_SOURCES).length;
        var sourceOccupied_gatherers = getSummed_potential_role(roomID, "Gatherer") >= Game.rooms[roomID].find(FIND_STRUCTURES, {filter:(structure)=>{return(structure.structureType == STRUCTURE_CONTAINER)}}).length;
        if(sourceOccupied_miners && sourceOccupied_gatherers){
            var repairerFilter = getSummed_potential_role(roomID, "Repairer");
            if(repairerFilter > 1){
                var builderFilter  = getSummed_potential_role(roomID, "Builder");
                if(builderFilter > 1){
                    var upgraderFilter = getSummed_potential_role(roomID, "Upgrader");
                    if(upgraderFilter >= 5){
                        var extractorFilter = getSummed_potential_role(roomID, "Extractor");
                        if(extractorFilter > 0){
                            var armyFilter     = getSummed_potential_role(roomID, "Defender");
                            if(armyFilter < 3){
                                defender_tasks.queue(roomID);}
                        }
                        else{
                            extractor_tasks.queue(roomID);}
                    }
                    else{
                        upgrading_tasks.queue(roomID);}
                }
                else{
                    building_tasks.queue(roomID);}
            }
            else{
                repairing_tasks.queue(roomID);}
        }
    }
}
function getSummed_potential_role(roomID, role){
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
    for(var element in Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue){
        if(Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue[element].role == role){
            total++;}
    }
    return total;
}

module.exports = respawnManager;