var funTask = {
    doFun : function(creep){
        //Run to other base and spam words
        if(creep.memory.isTrolling){
            var targetLocation;
            if(creep.room.roomName == E53N22){
                targetLocation = Game.map.findRoute(E53N22, E53N21);}
            else{
                targetLocation = new RoomPosition(20,20);}
            creep.moveTo(targetLocation);
            creep.say('🤡🤡🤡🤡🤡');
        }
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 1){
            var creepName = "The Updog";
            Game.spawns["Spawn1"].spawnCreep([MOVE], creepName, {memory:{role:"BasedIndividual"}}, {memory:{isTrolling:true}});
        }
    }
}

module.exports = funTask;