var funTask = {
    task : function(creep){
        //Run to other base and spam words
        var targetLocation;
        if(creep.room.name == "E53N22"){
            targetLocation = new RoomPosition(6,49,creep.room.name);}
        else{
            targetLocation = new RoomPosition(21,21,creep.room.name);}
        creep.moveTo(targetLocation);
        creep.say('📯📯📯');
    },
    respawn : function(creepSpec){
        //[MOVE]
        var spawner   = Game.spawns["Spawn1"];
        var creepName = creepSpec[3]+Game.time;
        var houseKey  = {roomID:creepSpec[0], sourceID:creepSpec[1]};
        spawner.spawnCreep(creepSpec[2], creepName, {memory:{role:creepSpec[3], houseKey:houseKey}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

module.exports = funTask;