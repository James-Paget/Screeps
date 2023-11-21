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
    queue : function(roomID){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:null, parts:[TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE], role:"Defender", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        //[MOVE, ATTACK]
        //var creepName = creepSpec.role+Game.time;
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        var spawnKey = {roomID:creepSpec.roomID, spawnID:spawnerID};
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