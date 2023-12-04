var {getSpawnerRoomIndex} = require("manager_Memory");

var defender_tasks = {
    task : function(creep){
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(creep.memory.isDefending){
            if(creep.attack(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
        }
        else{
            if(Game.flags["Flag1"]){
                creep.moveTo(Game.flags["Flag1"]);}
            else{
                creep.moveTo(creep.room.controller);}
        }
        if(_.filter(Game.creeps, function(creep) { return (creep.memory.role == "Defender") }).length >= 1 ){    //Wait for X boys
            if( creep.pos.getRangeTo(target) < 100 ){
                creep.memory.isDefending = true;
            }
        }
        if( (target == null) || (creep.pos.getRangeTo(target) > 100) ){
            creep.memory.isDefending = false;
        }
    },
    generateCreepParts : function(spawnerRoomID){
        /*
        Looks at the state of the spawner and determines what modules to build on this creep
        */
        var creepParts   = null;
        var creepsOwned  = _.filter(Game.creeps, function(creep) {return (creep.spawnKey.roomID == spawnerRoomID && creep.role == "Defender")}); //Owned by this spawner, of this type
        var creepNumberRequired = creepsOwned.length -4;    //<-- Specify the number of creeps wanted here
        if(creepNumberRequired > 0){    //If actually need any more workers
            var workPerCreep = 3;       //A rough Guess at an upper bound/ideal value --> Can make it more sophisticated
            var energyMax = Game.rooms[getSpawnerRoomIndex(spawnerRoomID)].energyCapacityAvailable;
            var partSet = [ATTACK,MOVE];            //Base line body parts required
            for(var i=0; i<workPerCreep; i++){  //Attempts to spawn the most expensive (but not overkill) miner it can afford
                partSet.unshift(ATTACK);
                partSet.unshift(MOVE);
                var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
                if(energyCost > energyMax){
                    partSet.shift();
                    partSet.shift();
                    break;}
            }
            creepParts = partSet;
        }
        return creepParts;
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Defender", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        //[MOVE, ATTACK]
        //var creepName = creepSpec.role+Game.time;
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isDefending:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = defender_tasks;