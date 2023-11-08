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
        var creepName = creepSpec.role+Game.time;
        var houseKey  = {roomID:creepSpec.roomID, sourceID:creepSpec.sourceID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, houseKey:houseKey}});
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