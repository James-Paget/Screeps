//################################################
//################################################
//## NEED TO MINIMISE NUMBER OF CREEPS BEING USED --> MAKE LARGER ONES MORE OFTEN
//################################################
//################################################
var {getSpawnerRoomIndex} = require("manager_Memory");

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
            if(!isPrioSatisfied){
                //3
                performPriority(creep, creep.memory.jobOrder.priority[prioIndex]);
                break;
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
    queue : function(roomID, sourceID, parts, jobOrder, squadID){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, jobOrder:jobOrder, role:"Military", time:Game.time, squadID:squadID};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};    //Their target room info
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};              //Their spawner info
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, jobOrder:creepSpec.jobOrder, squadID:creepSpec.squadID}});
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
    var creepBuilds = ["meleeStrong", "meleeStrong", "healer"];
    for(var i=0; i<creepBuilds.length; i++){
        var jobOrder = generateJobOrder("militia", creepBuilds[i], targetRoomID);
        var parts    = military_tasks.generateCreepParts(creepBuilds[i], lvl, spawnerRoomID);
        var squadID  = creepBuilds.length.toString()+"-"+Game.time.toString();    //Used to group squads
        military_tasks.queue(spawnerRoomID, null, parts, jobOrder, squadID);
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
    //######################################
    //## MAKE THEM WAIT FOR REST OF SQUAD ##
    //######################################
    var jobOrder = {priority:[]};
    if(creepBuild == "meleeStrong"){
        jobOrder.priority = [{name:"moveToTargetSoft", targetRoomID:targetRoomID}, {name:"killCreepsInRoom"}, {name:"killTowersInRoom"}, {name:"killCoresInRoom"}];}
    if(creepBuild == "healer"){
        jobOrder.priority = [{name:"moveToTargetSoft"}, {name:"healCreepsInRoom"}];}
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
    var isSatisfied = true; //Assume true by default, so can skip if unknown
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
    var isSatisfied = false;
    if(creep.room.name == priority.targetRoomID){
        isSatisfied = true;}
    return isSatisfied;
}
function performPriority_moveToTargetSoft(creep, priority){
    /*
    Move to room target WITHOUT attacking on the way
    */
    creep.say("🦶💨");
    var inRequiredRoom = (creep.room.name == priority.targetRoomID);
    if(inRequiredRoom){
        //(1) Reset routing
        if(creep.memory.travelRoute){           //If you still have a travel route, clear that space
            delete creep.memory.travelRoute;}
        //(2) Do task
        //Nothing required here -> Just moving towards room
    }
    else{   //Move to required room
        if(!creep.memory.travelRoute){                                                          //Create multi-room travel route
            creep.memory.travelRoute = Game.map.findRoute(creep.room.name, priority.targetRoomID);}  //
        else{
            if(creep.memory.travelRoute.length == 0){   //Backup precaution
                delete creep.memory.travelRoute;}       //
            else{
                if(creep.room.name == creep.memory.travelRoute[0].room){                                            //Move along travel route to required room
                    creep.memory.travelRoute.shift();}                                                              //
                if(creep.memory.travelRoute.length > 0){                                                            //
                    creep.moveTo(creep.pos.findClosestByPath(creep.room.find(creep.memory.travelRoute[0].exit)));}  //
            }
        }
    }
}
function checkPrioritySatisfied_killCreepsInRoom(creep, priority){
    var isSatisfied = false;
    var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
    if(hostileCreeps.length == 0){
        isSatisfied = true;}
    return isSatisfied;
}
function performPriority_killCreepsInRoom(creep, priority){
    var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
    var target = creep.pos.findClosestByPath(hostileCreeps); //#### BY RANGE MIGHT BE FAR LESS TAXING ON CPU ####
    var isCreepRanged = _.filter(creep.body, function(part) {return (part.type==RANGED_ATTACK)});
    if(isCreepRanged.length > 0){
        if(creep.ranged_attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
    else{
        if(creep.attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
}
function checkPrioritySatisfied_killTowersInRoom(creep, priority){
    var isSatisfied = false;
    var hostileTowers = creep.room.find(FIND_STRUCTURES, (structure) => {return (structure.structureType == STRUCTURE_TOWER)});
    if(hostileTowers.length == 0){
        isSatisfied = true;}
    return isSatisfied;
}
function performPriority_killTowersInRoom(creep, priority){
    var hostileTowers = creep.room.find(FIND_STRUCTURES, (structure) => {return (structure.structureType == STRUCTURE_TOWER)});
    var target = creep.pos.findClosestByPath(hostileTowers); //#### BY RANGE MIGHT BE FAR LESS TAXING ON CPU ####
    var isCreepRanged = _.filter(creep.body, function(part) {return (part.type==RANGED_ATTACK)});
    if(isCreepRanged.length > 0){
        if(creep.ranged_attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
    else{
        if(creep.attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
}
function checkPrioritySatisfied_killCoresInRoom(creep, priority){
    var isSatisfied = false;
    var invaderCores = creep.room.find(FIND_STRUCTURES, (structure) => {return (structure.structureType == STRUCTURE_INVADER_CORE)});
    if(invaderCores.length == 0){
        isSatisfied = true;}
    return isSatisfied;
}
function performPriority_killCoresInRoom(creep, priority){
    var invaderCores = creep.room.find(FIND_STRUCTURES, (structure) => {return (structure.structureType == STRUCTURE_INVADER_CORE)});
    var target = creep.pos.findClosestByPath(invaderCores); //#### BY RANGE MIGHT BE FAR LESS TAXING ON CPU ####
    var isCreepRanged = _.filter(creep.body, function(part) {return (part.type==RANGED_ATTACK)});
    creep.say("☠️");
    if(isCreepRanged.length > 0){
        if(creep.ranged_attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
    else{
        if(creep.attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
}
function checkPrioritySatisfied_healCreepsInRoom(creep, priority){
    var alliedCreeps = creep.room.find(FIND_MY_CREEPS);
    var woundedCreeps = _.filter(alliedCreeps, function(creep) {return(creep.hits < creep.hitsMax)});
    var isSatisfied = false;
    if(woundedCreeps.length == 0){
        isSatisfied = true;}
    return isSatisfied;
}
function performPriority_healCreepsInRoom(creep, priority){
    var alliedCreeps  = creep.room.find(FIND_MY_CREEPS);
    var woundedCreeps = _.filter(alliedCreeps, function(creep) {return(creep.hits < creep.hitsMax)});
    if(woundedCreeps.length > 0){
        var target = creep.pos.findClosestByRange(woundedCreeps);
        if(creep.heal(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);}
    }
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

module.exports = {
    military_tasks,
    generate_militia
};