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
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 5){
            var creepName = "Defender"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([MOVE, ATTACK], creepName, {memory:{role:"Defender"}}, {memory:{isDefending:false}});
        }
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