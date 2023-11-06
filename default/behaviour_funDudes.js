var funTask = {
    doFun : function(creep){
        //Run to other base and spam words
        var targetLocation;
        if(creep.room.name == "E53N22"){
            targetLocation = new RoomPosition(6,49,creep.room.name);}
        else{
            targetLocation = new RoomPosition(22,21,creep.room.name);}
        console.log(targetLocation);
        creep.moveTo(targetLocation);
        creep.say('🤡🍆☠️🍑💨🍆🤡👽🥵👽🥵');
    },
    respawn : function(relatedCreepNumber){
        if(relatedCreepNumber < 1){
            var creepName = "The Updog";
            Game.spawns["Spawn1"].spawnCreep([MOVE], creepName, {memory:{role:"BasedIndividual"}}, {memory:{isTrolling:true}});
        }
    }
}

module.exports = funTask;