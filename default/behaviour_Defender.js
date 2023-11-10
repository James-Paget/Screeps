var defenderTasks = {
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
        if(_.filter(Game.creeps, function(creep) { return (creep.memory.role == "Defender") }).length >= 3 ){    //Wait for 6 boys
            if( creep.pos.getRangeTo(target) < 100 ){
                creep.memory.isDefending = true;
            }
        }
        if( creep.pos.getRangeTo(target) > 100 ){
            creep.memory.isDefending = false;
        }
    },
    queue : function(){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:null, sourceID:null, parts:[ATTACK, MOVE], role:"Defender"};
        Memory.spawnQueue.queue.push(creepSpec);
    },
    respawn : function(creepSpec){
        //[MOVE, ATTACK]
        var spawner   = Game.spawns["Spawn1"];
        var creepName = creepSpec.role+Game.time;
        var houseKey  = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, houseKey:houseKey, isDefending:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = defenderTasks;