var miningTasks = {
    goMine : function(creep){
        if(creep.memory.isMining){
            var targetSource = Game.getObjectById(creep.memory.sourceID);
            if(creep.harvest(targetSource) == ERR_NOT_IN_RANGE){
                creep.moveTo(targetSource)
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = false;
            }
        }
        else{
            //Move resources to storage
            var target;
            var containers = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == STRUCTURE_CONTAINER) && (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) )}});
            var minerFilter= _.filter(Game.creeps, function(creep) { return (creep.memory.role == "Miner") });   //### CURSED CODE RIGHT HERE ##
            if( (containers.length > 0) && (minerFilter.length > 2)){   //Try to put into nearby container (after 2 dudes in )
                target = creep.pos.findClosestByPath(containers);}
            else{   //If no other option, deliver it yourself
                var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||(structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
                target = creep.pos.findClosestByPath(transferTargets);}
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            
            //Reset mining condition
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = true;
            }
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < getMinerNumberRequired(Game.spawns["Spawn1"].room)){
            var creepName = "Miner"+Game.time;
            var assignedSourceID = getSourceID(Game.spawns["Spawn1"].room);
            if(relatedCreepNumber == 0){
                Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], creepName, {memory:{role:"Miner", isMining:true, sourceID:assignedSourceID}});}
            else{
                Game.spawns["Spawn1"].spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], creepName, {memory:{role:"Miner", isMining:true, sourceID:assignedSourceID}});}
        }
    }
};

function getMinerNumberRequired(room){
    /*
    Finds total number of spaces available at all sources in room
    #################################################################
    ## SAVE THIS RESULT AND JUST UPDATE IT AS CREEPS SPAWN AND DIE ##
    #################################################################
    */
    //Finds number of free spots at each source
    var sources = room.find(FIND_SOURCES);
    var totalFreeTiles = 0;
    for(var z in sources){
        //For 3x3 tiles around this source
        for(var j=sources[z].pos.y-1; j<=sources[z].pos.y+1; j++){
            for(var i=sources[z].pos.x-1; i<=sources[z].pos.x+1; i++){
                if( (Game.map.getRoomTerrain(room.name).get(i,j) == 0) || (Game.map.getRoomTerrain(room.name).get(i,j) == 2) ){
                    totalFreeTiles++;
                }
            }
        }
    }
    return totalFreeTiles;
}
function getSourceID(room){
    /*
    Gets a source ID to give to a new miner, such that all sources are not oversubscribed
    
    #################################################################
    ## SAVE THIS RESULT AND JUST UPDATE IT AS CREEPS SPAWN AND DIE ##
    #################################################################
    */
    //Finds number of free spots at each source
    var sources = room.find(FIND_SOURCES);
    var sourceFreeTiles = [];
    for(var z in sources){
        var totalFreeTiles = 0;
        //For 3x3 tiles around this source
        for(var j=sources[z].pos.y-1; j<=sources[z].pos.y+1; j++){
            for(var i=sources[z].pos.x-1; i<=sources[z].pos.x+1; i++){
                if( (Game.map.getRoomTerrain(room.name).get(i,j) == 0) || (Game.map.getRoomTerrain(room.name).get(i,j) == 2) ){
                    totalFreeTiles++;
                }
            }
        }
        sourceFreeTiles.push(totalFreeTiles);
    }
    //Finds number
    var allMiners = _.filter(Game.creeps, function(creep) { return (creep.memory.role == "Miner") });
    var minersAssigned = [];
    for(var i in sources){
        minersAssigned.push(0);}
    for(var minerIndex in allMiners){
        for(var sourceIndex in sources){
            if(allMiners[minerIndex].memory.sourceID == sources[sourceIndex].id){
                minersAssigned[sourceIndex] = minersAssigned[sourceIndex]+1;        //## TRY WITH ++, LIST MAY NOT LIKE IT ##
                break;
            }
            sourceIndex++;
        }
    }
    //Find spaces for this new guy
    var sourceID = "0";
    for(var sourceIndex in sources){
        if( (sourceFreeTiles[sourceIndex] -minersAssigned[sourceIndex]) > 0){    //If has free space
            sourceID = sources[sourceIndex].id;
            break;
        }
    }
    return sourceID
}

module.exports = miningTasks;