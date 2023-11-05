var warriorTasks = {
    goFight : function(creep){
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
        if(creep.memory.isFighting){
            if(creep.rangedAttack(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
        }
        else{
            if(Game.flags["Flag2"]){
                creep.moveTo(Game.flags["Flag2"]);}
            else{
                creep.moveTo(creep.room.controller);}
        }
        if(_.filter(Game.creeps, function(creep) { return ((creep.memory.role == "Warrior")||(creep.memory.role == "Defender")) }).length >= 6 ){    //Wait for 6 boys
            if( creep.pos.getRangeTo(target) < 100 ){
                creep.memory.isFighting = true;
            }
        }
        if(creep.pos.getRangeTo(target) > 100){
            creep.memory.isFighting = false;
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 5){
            var creepName = "Warrior"+Game.time;
            Game.spawns["Spawn1"].spawnCreep([MOVE, RANGED_ATTACK], creepName, {memory:{role:"Warrior"}}, {memory:{isFighting:false}});
        }
    }
}

module.exports = warriorTasks;