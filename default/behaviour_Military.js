var military_tasks = {
    task : function(){
        //pass
    },
    generateCreepParts : function(){
        //--> Maybe;
        //Specify creep level; # of multiples of components
        //Specify the overal job they are doing --> use preset multiples required / HEALER / ATTACKER
        return [];
    },
    queue : function(roomID, sourceID, parts, jobOrder){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, jobOrder:jobOrder, role:"Military", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};    //Their target room info
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};              //Their spawner info
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, priority:creepSpec.priority}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

function generate_militia(spawnerID, markID, lvl){
    /*
    This can be called at any time to queue up a militia squad;
    -From a given spawner, spawnerID
    -Attacking a given room, markID
    -Of a given power level, lvl

    --> Job order contains target priorities, markID, ...
    */
    //###########
    //## EACH MILITIA MEMBER SHOULD ESSENTIALLY WORK AUTONOMOUSLY, BUT MAY 
    //## HAVE SOME FEATURES THAT ALLOW THEM TO WAIT FOR EACH OTHER
    //##    --> EACH SHOULD REMEMBER KEY FACTS
    //###########
    var creepNumber = 1*lvl;
    for(var i=0; i<creepNumber; i++){
        var jobOrder = generate_preset_jobOrder(markID);
        var parts    = generate_creepParts();
        military_tasks.queue(spawnerRoomID, null, parts, jobOrder);
    }
}
//A simple function for each required military group
//...

function generate_preset_jobOrder(){
    //pass
    return null;
}
function generate_creepParts(){
    //pass
    return null;
}
/*
Maybe split into multiple var sections;
- Army Guard
- Post Guard
- Army Attack
- Post Attack
- Militia Attack

--> So different behaviours can be switched between and triggered at an instant

WHAT I WANT;
- NEED a function to let me call an [arbitrary attack] of [arbitrary size] to 
an [arbitrary map], with [arbitrary targets] maybe
- Their brains should work the same, but just follow their given priorities
- Call a function from miltary tasks to queue up a set number of creeps 
from a given spawner, that will head towards a given map , an attack enemies 
in that area
    --> This attacking should occur in a given priority, parsed into the creeps memory, 
    so they can each remember their own orders (e.g attack creeps, then core, then ... 
    OR heal this unit, then this unit, then ...)
- Each function should queue up a different set of fighters to do different roles
- Each should be very reactive
- There should be functions to auto-spawn militia if invader cores OR enemies are detected 
at the spawnerRoom or linked energyRooms
*/
module.exports = military_tasks;