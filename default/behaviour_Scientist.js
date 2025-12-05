var {getSpawnerRoomIndex} = require("manager_Memory");

var scientist_tasks = {
    task : function(creep){
        /*
        . Required tasks are to;
            (A) Fill each of the all labs (even products) low on resources up to a threshold amount
            (B) Empty labs that are above another threshold
            (C) Trigger reactions when enough reactants present AND product total is too low

            ### 
            ### LOOK AT JOB ORDERS AGAIN TO SEE WHERE APPLICABLE HERE -> Extractors used this exact system basically
            ###     --> Hence remove 'isResearching' to approporiate alternative
            ###
        */
        if(creep.memory.spawnKey!=null) {                       // If have bare minimum of spawnKey
            if(creep.memory.spawnKey.roomID!=null) {            // And have a spawnerRoom
                const spawnerRoomIndex = getSpawnerRoomIndex(creep.memory.spawnKey.roomID);
                if(spawnerRoomIndex) {
                    if(Memory.spawnerRooms[spawnerRoomIndex].labSpecification!=null) {   // Check you have the correct labSpecification for a scientist to follow
                        if(creep.memory.jobOrder.length > 0){       //If you have any jobs to do
                            this.execute_next_jobOrder(creep);           //Do the first job in the queue
                        }
                        else{
                            //If no job orders, look for a new (automatic) one periodically
                            if(Game.time.toString().slice(-1) % 2 == 0){
                                this.determine_automaticJobOrder(creep);
                            }
                        }
                    }
                }
            }
        }
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Scientist", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        /*
        . Occurs when creep reaches the front of the queue and spawner is not busy
        . Creates specified creep
        . Unique qualities for a given role => each role has its own respawn functionality ########### THIS CAN DEFINATELY BE GENERALISED ############
        */
        var spawner  = Game.getObjectById(spawnerID);
        var houseKey = {roomID:creepSpec.roomID , sourceID:null};
        var spawnKey = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isResearching:false}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    },

    determine_automaticJobOrder : function(creep) {
        /*
        . This is called whenever the scientist runs out of jobs and automatically determines what to do next.
        . The job chosen is based on a job priority, where the 1st unsatisified found is assigned.

        . Jobs are defined as follows;
        {name, ...} <-- All jobs have a 'name', the rest is specific to the name given and the job itself

        . resourceMinThreshold = Minimum number of resources needed in the labs before marked as 're-filled'
        . resourceMaxThreshold = Maximum number of resources allowed in labs before requiring to be removed
        */
        const storage_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return ( (structure.structureType == STRUCTURE_STORAGE) && (structure.progress==null) )}});
        const labs_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return ( (structure.structureType == STRUCTURE_LAB) && (structure.progress==null) )}});

        // ** Note; Most info about scientist jobOrders can just be found in the spawnerRoom.labSpecification, hence little needs to be parsed in here
        const jobOrder_fillLabs  = {name: "fillLabs", storage_available: storage_available, labs_available: labs_available, resourceMinThreshold: 2000}
        const jobOrder_emptyLabs = {name: "emptyLabs", storage_available: storage_available, labs_available: labs_available, resourceMaxThreshold: 1000}
        const jobOrder_triggerReactions = {name: "triggerReactions"}

        var priorityOrder = [jobOrder_triggerReactions, jobOrder_fillLabs, jobOrder_emptyLabs];    // Most important at start

        for(priorityIndex in priorityOrder){
            var prioritySatisfied = checkJobOrder_satisfied(creep, priorityOrder[priorityIndex]);
            if(!prioritySatisfied){    // If not satisfied, add to the list of jobs to be done and leave
                creep.memory.jobOrder.push(priorityOrder[priorityIndex]);
                break;
            }                           // If is satisfied, move onto next order
        }
    },
    checkJobOrder_satisfied : function(creep, jobOrder) {
        /*
        Checks if an automatic job order needs to be completed or not
        
        False => The job needs to be done
        True  => The job is already done
        */
        var orderFulfilled = true;  //Default to handing no jobs out --> only hand out if actually required
        switch(jobOrderName) {
            case "fillLabs":
                // If any of the labs are low on a resource, and the resource is available to collect, then try to fill them up
                for(labIndex in jobOrder.labs_available) {
                    const lab = jobOrder.labs_available[labIndex];
                    if( (lab.store.MINERAL_TYPE == REQUIRED_MINERAL_TYPE) || (lab.store.MINERAL_TYPE == null) ) {
                        if( (lab.store.USED_AMOUNT < jobOrder.resourceMinThreshold) && (jobOrder.storage_available[0].store.CORRECT_MINERAL > 0) ) { // If too little of the resource, needs to be filled up
                            orderFulfilled = false;
                            break;
                        }   // If you meet the threshold, ignore it and check the remaining
                    }       // If the mineral type is wrong, then it needs to be emptied (emptyLabs) => ignore the fill 
                }
                break;
            case "emptyLabs":
                // If any labs have an excess of their resource, then remove resources down to the given value (put into storage)
                for(labIndex in jobOrder.labs_available) {
                    const lab = jobOrder.labs_available[labIndex];
                    if(lab.store.MINERAL_TYPE == REQUIRED_MINERAL_TYPE) {   // If correct mineral, see if over threshold
                        if( (lab.store.USED_AMOUNT > jobOrder.resourceMaxThreshold) && (jobOrder.storage_available[0].store.FREE_SPACE > 0) ) {  //
                            orderFulfilled = false;
                            break;
                        }   // If you haven't reached the threshold, there's no need to remove resources
                    } else {    // If wrong mineral, then will require emptying no matter what
                        orderFulfilled = false;
                        break;
                    }
                }
                break;
            case "triggerReactions":
                // Look through all groups. If any of the groups can perform a reaction then trigger it
                const spawnerRoomIndex = getSpawnerRoomIndex(creep.memory.spawnKey.roomID);
                if(spawnerRoomIndex) {
                    for(groupIndex in Memory.spawnerRooms[spawnerRoomIndex].labSpecification.groups) {
                        const group = Memory.spawnerRooms[spawnerRoomIndex].labSpecification.groups[groupIndex];
                        const lab_A = getObjectById(group.reactantA);
                        const lab_B = getObjectById(group.reactantB);
                        const lab_P = getObjectById(group.product);
                        if(lab_P.cooldown <= 0) {   // If off cooldown
                            if( (lab_A.store.CORRECT_MINERAL_TYPE >= 10) && (lab_B.store.CORRECT_MINERAL_TYPE >= 10) && (lab_P.store.FREE_SPACE >= 10) ) {
                                orderFulfilled = false;
                                break;
                            }
                        }
                    }
                }
                break;
        }
        return orderFulfilled
    },
    execute_next_jobOrder : function(creep, jobOrder){
        /*
        . Performs an action for the next jobOrder (0th in queue)
        . This assumes an order does exist
        */
        switch(jobOrder.name) {
            case "fillLabs":
                // If any of the labs are low on a resource, and the resource is available to collect, then try to fill them up
                var spawnerRoomIndex = getSpawnerRoomIndex(creep.memory.spawnKey.roomID);
                if(spawnerRoomIndex) {
                    const labs = Memory.spawnerRooms[spawnerRoomIndex].labSpecification.labs;
                    for(labIndex in labs) {
                        const lab = getObjectById(labs[labIndex].ID);
                        // ###
                        // ### IF IT HAS NULL TYPE, OR IF IT IS BELOW THE THRESHOLD
                        // ###
                        if(LAB_REQUIRES_FILLING) {  // If this lab requires filling, do so
                        
                            if(creep.store.USED_AMOUNT == 0) {  // If not holding anything, collect from the storage
                                const storage = jobOrder.storage_available[0];
                                if(storage.store.CORRECT_MINERAL_CAPACITY > 0) {    // If you have the minerals, move them
                                    if(creep.withdraw(storage, labs[labIndex].storedType) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(storage);
                                    }
                                    break;
                                }   // If don't have enough, skip this section for now until you have the minerals to move
                            } else {                            // If holding something, drop it into the storage
                                if(lab.store.CORRECT_MINERAL_CAPACITY > 0) {  // If there are minerals, take them out
                                    if(creep.withdraw(lab, labs[labIndex].storedType) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(lab);
                                    }
                                    break;
                                }   // If no minerals, skip this section for now
                            }

                        }
                    }
                }
                break;
            case "emptyLabs":
                var spawnerRoomIndex = getSpawnerRoomIndex(creep.memory.spawnKey.roomID);
                if(spawnerRoomIndex) {
                    const labs = Memory.spawnerRooms[spawnerRoomIndex].labSpecification.labs;
                    for(labIndex in labs) {
                        const lab = getObjectById(labs[labIndex].ID);
                        //##
                        //## CHECK IF THERE IS A WRONG MINERAL TYPE OR MORE THAN THRESHOLD
                        //##
                        if(LAB_REQUIRES_EMPTYING) {

                            if(creep.store.USED_AMOUNT == 0) {  // If not holding anything, collect from the lab
                                if(creep.withdraw(lab, labs[labIndex].storedType) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(lab);
                                }
                            } else {                            // If holding something, drop it into the storage
                                const storage = jobOrder.storage_available[0];
                                if(creep.transfer(storage, labs[labIndex].storedType) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(storage);
                                }
                            }
                            break;  // Perform this for the first lab that encounters this problem. Others will be helped on future loops

                        }
                    }
                }
                break;
            case "triggerReaction":
                var spawnerRoomIndex = getSpawnerRoomIndex(creep.memory.spawnKey.roomID);
                if(spawnerRoomIndex) {
                    const groups = Memory.spawnerRooms[spawnerRoomIndex].labSpecification.groups;
                    for(groupIndex in groups) {
                        const group = groups[groupIndex];
                        const lab_A = getObjectById(group.reactantA);
                        const lab_B = getObjectById(group.reactantB);
                        const lab_P = getObjectById(group.product);
                        if(lab_P.cooldown <= 0) {   // If off cooldown
                            if( (lab_A.store.CORRECT_MINERAL_TYPE >= 10) && (lab_B.store.CORRECT_MINERAL_TYPE >= 10) && (lab_P.store.FREE_SPACE >= 10) ) {
                                lab_P.runReaction(lab_A, lab_B);
                            }
                        }
                    }
                }
                break;
        }
       
        //Determine if task is complete
        var jobOrder_complete = checkJobOrder_satisfied(creep, jobOrder);
        if(jobOrder_complete){
            //If so, remove it from the queue
            creep.memory.jobOrder.shift();
        }
    }
}

// ###
// ### COMPLETE THE UNFILLED SECTIONS HERE
// ###

module.exports = scientist_tasks;