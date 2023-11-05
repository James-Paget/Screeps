var miningTasks = {
    goMine : function(creep){
        if(creep.memory.isMining){
            var sources = creep.room.find(FIND_SOURCES);
            var closestSource = creep.pos.findClosestByPath(sources);
            if(creep.harvest(closestSource) == ERR_NOT_IN_RANGE){
                creep.moveTo(closestSource)
            }
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.isMining = false;
            }
        }
        else{
            //Move resources to storage
            var transferTargets = creep.room.find(FIND_STRUCTURES, {filter : (structure) => {return ((structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||(structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0))}});
            var target  = creep.pos.findClosestByPath(transferTargets);
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
        if(relatedCreepNumber < getMinerNumberRequired()){         //* Always prioritise this spawn -> Better
            var creepName = "Miner"+Game.time;
            var assignedSourceID = getSourceID(Game.spawns["Spawn1"].room);
            if(relatedCreepNumber == 0){
                Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], creepName, {memory:{role:"Miner"}}, {memory:{isMining:true}}, {memory:{sourceID:assignedSourceID}});}
            else{
                Game.spawns["Spawn1"].spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], creepName, {memory:{role:"Miner"}}, {memory:{isMining:true}}, {memory:{sourceID:assignedSourceID}});}
        }
    }

    /*
    respawn_initial : function(){
        var creepName = "Miner"+Game.time;
        Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], creepName, {memory:{role:"Miner"}}, {memory:{isMining:true}});
    },
    respawn_strong : function(relatedCreepNumber){
        if(relatedCreepNumber < 6){
            var creepName = "Miner"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], creepName, {memory:{role:"Miner"}}, {memory:{isMining:true}});
        }
    }
    */
};

function getMinerNumberRequired(){
    /*
    Finds total number of spaces available at all sources in 
    */
    return 6;
}
function getSourceID(room){
    /*
    Gets a source ID to give to a new miner, such that all sources are not oversubscribed
    */
    console.log("Looking for source...");
    //Finds number of free spots at each source
    var sources = room.find(FIND_SOURCES);
    var sourceFreeTiles = [];
    for(var source in sources){
        var totalFreeTiles = 0;
        //For 3x3 tiles around this source
        console.log("Pos.y -> ",source.pos.y);
        for(var j=source.pos.y-1; j<=source.pos.y+1; j++){
            for(var i=source.pos.x-1; i<=source.pos.x+1; i++){
                if(room.lookAt(i,j) != "terrain"){
                    totalFreeTiles++;
                }
            }
        }
        sourceFreeTiles.push(totalFreeTiles);
    }
    console.log("Free tiles -> ",sourceFreeTiles[0],", ", sourceFreeTiles[1]);
    //Finds number
    var allMiners = _.filter(Game.creeps, function(creep) { return (creep.memory.role == "Miner") });
    var minerAssigned = [];
    for(var source in sources){
        minersAssigned.push(0);}
    for(var miner in allMiners){
        var sourceIndex = 0;
        for(var source in sources){
            if(miner.memory.sourceID == source.id){
                minerAssigned[sourceIndex] = minerAssigned[sourceIndex]+1;  //## TRY WITH ++, LIST MAY NOT LIKE IT ##
                break;
            }
            sourceIndex++;
        }
    }
    //Find spaces for this new guy
    var sourceID;
    for(var i in minersAssigned.length){
        if( (sourceFreeTiles[i] -minersAssigned[i]) > 0){    //If has free space
            sourceID = sources[i].id;
            console.log("SourceIndex -> ",i);
            break;
        }
    }
    console.log("Done");
    return sourceID
}

module.exports = miningTasks;