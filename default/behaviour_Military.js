//################################################
//################################################
//## NEED TO MINIMISE NUMBER OF CREEPS BEING USED --> MAKE LARGER ONES MORE OFTEN
//################################################
//################################################
var military_tasks = {
    task : function(){
        /*
        1. Go through the creeps priorities
        2. Keep looking until you reach a task that hasnt been satisfied
        3. Do that action

        Note; Priority 0 will almost always be travel to the target location, 
            OR maybe attack-move to the target room
        */
        //1
        for(var prioIndex in creep.memory.jobOrder.priority){
            //2
            var isPrioSatisfied = checkPrioritySatisfied(creep, creep.memory.jobOrder.priority[prioIndex]);
            if(isPrioSatisfied==false){ //null NOT allowed to enter if --> cautious wording
                //3
                performPriority(creep, creep.memory.jobOrder.priority[prioIndex]);
            }
        }
    },
    generateCreepParts : function(creepBuild, lvl, spawnerRoomID){
        var parts = null;
        if      (creepBuild == "meleeStrong"){
            parts = generateCreepParts_meleeStrong(lvl, spawnerRoomID);}
        else if (creepBuild == "healer"){
            parts = generateCreepParts_healer(lvl, spawnerRoomID);}
        else if (creepBuild == "..."){
            //pass
        }
        return parts;
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
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, jobOrder:creepSpec.jobOrder}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

//----------------
//Military Groups
//----------------
/*
- Army Guard
- Post Guard
- Army Attack
- Post Attack
- Militia Attack
--> So different behaviours can be switched between and triggered at an instant
*/
function generate_militia(lvl, spawnerRoomID, targetRoomID){
    /*
    #####################################################################
    ## THEY SHOULD SAY ABOVE THEM PERIODICALLY WHAT TYPE OF UNIT THEY ARE 
    ## e.g Skull&CrossBones for militia, ...
    #####################################################################

    This can be called at any time to queue up a militia squad;
    -From a given spawner, spawnerID
    -Attacking a given room, targetRoomID
    -Of a given power level, lvl

    Militia work as follows (roughly);
    (0) Wait for other 'squad members'
    (1) Move to the target room (soft-like)
    (2) Attempt to kill any hostile creeps in that room
    (3) Attempt to destroy any hostile towers
    (4) Attempt to destroy any "Invader Cores" or similar
    (5) Try to keep all friendly creeps healed during this

    The creepNumber must match the number of creep builds specified
    */
    var creepNumber  = 5;
    var creepBuilds = ["meleeStrong", "meleeStrong", "meleeStrong", "meleeStrong", "healer"];
    for(var i=0; i<creepNumber; i++){
        var jobOrder = generateJobOrder("militia", creepBuilds[i], targetRoomID);
        var parts    = generateCreepParts(creepBuilds[i], spawnerRoomID);
        var squadID  = null;    //Used to group squads
        //###################################
        //#### MAKE A PART OF THEIR NAME ####
        //###################################
        military_tasks.queue(spawnerRoomID, null, parts, jobOrder);
    }
}
//...

//---------------------
//Job Order Generation
//---------------------
function generateJobOrder(squadType, creepBuild, targetRoomID){
    var jobOrder = null;
    if      (squadType == "militia"){
        jobOrder = generateJobOrder_militia(creepBuild, targetRoomID);}
    else if (squadType == "..."){
        //pass
    }
    return jobOrder;
}
function generateJobOrder_militia(creepBuild, targetRoomID){
    var jobOrder = {targetRoomID:targetRoomID, priority:[]};
    if(creepBuild == "meleeStrong"){
        jobOrder.priority = ["moveToTargetSoft", "killCreepsInRoom", "killTowersInRoom", "killCoresInRoom"];}
    if(creepBuild == "healer"){
        jobOrder.priority = ["moveToTargetSoft", "healCreepsInRoom"];}
    return jobOrder;
}

//--------------------
//Priority Management
//--------------------
function checkPrioritySatisfied(creep, priority){
    /*
    Checks if a given priority is satisfied

    As more priority types are added, extend this list
    */
    var isSatisfied = null;
    if      (priority.name == "moveToTargetSoft"){
        isSatisfied = checkPrioritySatisfied_moveToTargetSoft(creep, priority);}
    else if (priority.name == "killCreepsInRoom"){
        isSatisfied = checkPrioritySatisfied_killCreepsInRoom(creep, priority);}
    else if (priority.name == "killTowersInRoom"){
        isSatisfied = checkPrioritySatisfied_killTowersInRoom(creep, priority);}
    else if (priority.name == "killCoresInRoom"){
        isSatisfied = checkPrioritySatisfied_killCoresInRoom(creep, priority);}
    else if (priority.name == "healCreepsInRoom"){
        isSatisfied = checkPrioritySatisfied_healCreepsInRoom(creep, priority);}
    else if (priority.name == "..."){
        //...
    }
    //...
    return isSatisfied; //null OR true => ignore and move onto next priority
}
function performPriority(creep, priority){
    /*
    Complete the given priority (/take a step towards completing)

    As more priority types are added, extend this list
    */
    if      (priority.name == "moveToTargetSoft"){
        performPriority_moveToTargetSoft(creep, priority);}
    else if (priority.name == "killCreepsInRoom"){
        performPriority_killCreepsInRoom(creep, priority);}
    else if (priority.name == "killTowersInRoom"){
        performPriority_killTowersInRoom(creep, priority);}
    else if (priority.name == "killCoresInRoom"){
        performPriority_killCoresInRoom(creep, priority);}
    else if (priority.name == "healCreepsInRoom"){
        performPriority_healCreepsInRoom(creep, priority);}
    else if (priority.name == "..."){
        //...
    }
    //...
}

//-------------------
//Priority Specifics
//-------------------
function checkPrioritySatisfied_moveToTargetSoft(creep, priority){
    /*
    Checks if the creep is currently in the required room / exact location (which 
    can be specified through an optional arguement, by changing from null)
    */
    //pass
}
function performPriority_moveToTargetSoft(creep, priority){
    /*
    Move to room target WITHOUT attacking on the way
    */
    //pass
}
function checkPrioritySatisfied_killCreepsInRoom(creep, priority){
    //pass
}
function performPriority_killCreepsInRoom(creep, priority){
    //pass
}
function checkPrioritySatisfied_killTowersInRoom(creep, priority){
    //pass
}
function performPriority_killTowersInRoom(creep, priority){
    //pass
}
function checkPrioritySatisfied_killCoresInRoom(creep, priority){
    //pass
}
function performPriority_killCoresInRoom(creep, priority){
    //pass
}
function checkPrioritySatisfied_healCreepsInRoom(creep, priority){
    //pass
}
function performPriority_healCreepsInRoom(creep, priority){
    //pass
}

//----------------
//Part Generation
//----------------
function generateCreepParts_meleeStrong(lvl, spawnerRoomID){
    var parts = [ATTACK, MOVE];
    var energyMax = Game.rooms[spawnerRoomID].energyCapacityAvailable;
    for(var i=0; i<lvl; i++){
        parts.unshift(ATTACK);parts.unshift(TOUGH);parts.unshift(MOVE);parts.unshift(MOVE);
        var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
        if(energyCost > 0.5*energyMax){
            parts.shift();parts.shift();parts.shift();parts.shift();
        }
    }
    return parts;
}
function generateCreepParts_healer(lvl, spawnerRoomID){
    var parts = [HEAL, MOVE];
    var energyMax = Game.rooms[spawnerRoomID].energyCapacityAvailable;
    for(var i=0; i<lvl; i++){
        parts.unshift(HEAL);parts.unshift(MOVE);
        var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
        if(energyCost > 0.5*energyMax){
            parts.shift();parts.shift();
        }
    }
    return parts;
}

module.exports = military_tasks;