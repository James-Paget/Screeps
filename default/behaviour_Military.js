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
            var isPrioSatisfied = checkPrioritySatisfied(creep, creep.memory.jobOrder.priority[prioIndex]);
            if(!isPrioSatisfied){
                //3
                performPriority(creep, creep.memory.jobOrder.priority[prioIndex]);
            }
        }
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
function generate_militia(lvl, spawnerID, targetRoomID){
    /*
    #####################################################################
    ## THEY SHOULD SAY ABOVE THEM PERIODICALLY WHAT TYPE OF UNIT THEY ARE 
    ## e.g Skull&CrossBones for militia, ...
    #####################################################################

    This can be called at any time to queue up a militia squad;
    -From a given spawner, spawnerID
    -Attacking a given room, markID
    -Of a given power level, lvl

    Militia work as follows;
    (0) Wait for other 'squad members'
    (1) Move to the target room (soft-like)
    (2) Attempt to kill any hostile creeps in that room
    (3) Attempt to destroy any hostile towers
    (4) Attempt to destroy any "Invader Cores" or similar
    */
    var creepNumber = 1*lvl;
    for(var i=0; i<creepNumber; i++){
        var jobOrder = null;        //#### FIGURE THIS OUT ####
        var parts    = null;        //#### FIGURE THIS OUT ####
        var squadID  = null;    //Used to group squads
        //###################################
        //MAKE A PART OF THEIR NAME #########
        //###################################
        military_tasks.queue(spawnerRoomID, null, parts, jobOrder);
    }
}
//...

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
        checkPrioritySatisfied_moveToTargetSoft(creep, priority);}
    else if (priority.name == "..."){
        //pass
    }
    //...
    return isSatisfied; //null OR true => ignore and move onto next priority
}
function performPriority(creep, priority){
    /*
    Complete the given priority (/take a step towards completing)

    As more priority types are added, extend this list
    */
    var isSatisfied = null;
    if      (priority.name == "moveToTargetSoft"){
        performPriority_moveToTargetSoft(creep, priority);}
    else if (priority.name == "..."){
        //...
    }
    //...
    return isSatisfied; //null OR true => ignore and move onto next priority
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

module.exports = military_tasks;