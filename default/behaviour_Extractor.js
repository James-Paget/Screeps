var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        /*
        Note; Mention of material here can be minerals or energy
        */
        if(creep.memory.jobOrders.length){                                                  //If you have any jobs to do
            creepState = creep.memory.jobOrders[0];                                         //Do the first job in the queue
            targetSpec = getTargetSpec_extractor(creep, creepState);       //Target found based on creepState
            if(targetSpec){
                var target       = Game.getObjectById(targetSpec.ID);
                var resourceType = targetSpec.resourceType;
                if(target){
                    //#############
                    //## GIVE SPECIFICS IN THE JOB ORDER
                    //#############
                    if(creepState.name == "mine_minerals"){
                        //Mine minerals
                        if(creep.harvest(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    if(creepState.name == "unload_storeToTarget"){
                        //Unload inventory into main storage
                        if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    if(creepState.name == "load_storeFromTarget"){
                        //Retrieve [material] from main storage
                        if(creep.withdraw(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);}
                    }
                    //...
                }
            }
        }
        /*
        if(creep.memory.sourceID != "null"){      //If an extractor exists --> source here referes to mineral instead
            var resourceType = Game.getObjectById(creep.memory.houseKey.sourceID).mineralType;
            var target = Game.getObjectById(creep.memory.houseKey.sourceID);
            if(target.mineralAmount > 0){   //State; Mining Mineral
                if(creep.memory.isExtracting){
                    //####################################################
                    //## MAKE IT WAIT FOR THE COOLDOWN BETWEEN HARVESTS ##
                    //####################################################
                    if(creep.harvest(target, resourceType) == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                }
                else{
                    var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
                    if(mineralStorage_available.length > 0){
                        target = Game.getObjectById(mineralStorage_available[0]);
                        if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                            creep.moveTo(target);
                        }
                    }
                }
            }
            else{                           //State; Fill up terminal
                var terminals_available      = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {return( (structure.structureType == STRUCTURE_TERMINAL) && (structure.progress == null) )}});
                var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
                if( (terminals_available.length > 0) && (mineralStorage_available.length > 0) ){
                    var mineralLimitSatisfied = Game.getObjectById(mineralStorage_available[0]).store.getUsedCapacity(resourceType) > Game.getObjectById(mineralStorage_available[0]).store.getCapacity()/3.0;
                    if(!mineralLimitSatisfied){
                        if(creep.memory.isExtracting){
                            target = Game.getObjectById(mineralStorage_available[0]);
                            if(creep.withdraw(target, resourceType) == ERR_NOT_IN_RANGE){
                                creep.moveTo(target);
                            }
                        }
                        else{
                            target = terminals_available[0];
                            if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE){
                                creep.moveTo(target);
                            }
                        }
                    }
                }
            }
            if(creep.store.getFreeCapacity(resourceType) == 0){
                creep.memory.isExtracting = false;
            }
            if(creep.store.getUsedCapacity(resourceType) == 0){
                creep.memory.isExtracting = true;
            }
        }
        */
    },
    generateCreepParts : function(spawnerRoomID){
        /*
        Looks at the state of the spawner and determines what modules to build on this creep
        
        Only consider making extractor creeps if;
        (1) You have any extractor constructs
        (2) You have a mineral with quantity > 0
        (3) OR You have BOTH a mineral with 0 quantity & storage with non-zero quantity it is tethered to
        */
        var creepParts  = null;
        var extractors_available     = Game.rooms[spawnerRoomID].find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_EXTRACTOR && structure.progress == null)}});    //If you need to mine minerals
        var mineralStorage_available = Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].mineralStorage;
        var ableToExtract = (extractors_available.length > 0) && (mineralStorage_available.length > 0);
        if(ableToExtract){
            var minerals_available    = Game.rooms[spawnerRoomID].find(FIND_MINERALS);
            var harvestingNeeded      = minerals_available[0].mineralAmount > 0;
            var terminalFillingNeeded = (minerals_available[0].mineralAmount == 0) && (Game.getObjectById(mineralStorage_available[0]).store.getUsedCapacity(minerals_available[0].mineralType) > 0);
            if(harvestingNeeded || terminalFillingNeeded){  //If extractor requires creeps now
                var creepsOwned  = _.filter(Game.creeps, function(creep) {return (creep.memory.spawnKey.roomID == spawnerRoomID && creep.memory.role == "Extractor")});         //Owned by this spawner, of this type
                var creepNumberRequired = 2 -creepsOwned.length;    //<-- Specify the number of creeps wanted here
                if(creepNumberRequired > 0){    //If actually need any more workers
                    var workPerCreep = 3;       //A rough Guess at an upper bound/ideal value --> Can make it more sophisticated
                    var energyMax = Game.rooms[spawnerRoomID].energyCapacityAvailable;
                    var partSet = [WORK,CARRY,CARRY,MOVE];            //Base line body parts required
                    for(var i=0; i<workPerCreep; i++){  //Attempts to spawn the most expensive (but not overkill) miner it can afford
                        partSet.unshift(WORK);
                        partSet.unshift(MOVE);
                        var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
                        if(energyCost > energyMax){
                            partSet.shift();
                            partSet.shift();
                            break;}
                    }
                    creepParts = partSet;
                }
            }
        }
        return creepParts;
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Extractor", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isExtracting:true}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists

        1. ...
        */
    }
}

function determine_automaticJobOrder_extractor(creep){
    /*
    This is called whenever the excavator runs out of jobs and automatically determines what to do next.

    The job chosen is based on a job priority, where the 1st unsatisified found is assigned.

    Jobs are defined as follows;
    {name, ...} <-- All jobs have a 'name', the rest is specific to the name given and the job itself
    */
    var storage_available   = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
    var minerals_available  = creep.room.find(FIND_MINERALS);
    var factories_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_FACTORY)}});
    var terminals_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_TERMINAL)}});
    
    //####
    //## REMEMBER TO SUBTRACT FROM ORDER
    //##
    //## MAYBE MERGE SOME OF THESE --> HAVE A JOB FOR MINE & DELIVER ]]]] MAKES PROCESS A BIT SMOOTHER
    //####
    jobOrder_mineAndDeposit_minerals = {name:"mineAndDeposit_minerals", deliverTo_id:"CONTAINER_ID", patch_id:"MINERAL_PATCH_ID", patch_type:"MATERIAL_TYPE", patch_amount:"MATERIAL_AMOUNT"};
    jobOrder_process_minerals        = {name:"processed_minerals", deliverFrom_id:"CONTAINER_ID", deliverTo_id:"CONTAINER_ID", factory_id:"FACTORY_ID", mineral_type:"MINERAL_TYPE", mineral_amount:"MINERAL_AMOUNT"};
    jobOrder_sellProcessed_minerals  = {name:"sellProcessed_minerals", deliverFrom_id:"CONTAINER_ID", terminal_id:"TERMINAL_ID", mineral_type:"MINERAL_TYPE", mineral_amount:"MINERAL_AMOUNT"};
    jobOrder_sell_minerals           = {name:"sell_minerals", deliverFrom_id:"CONTAINER_ID", terminal_id:"TERMINAL_ID", mineral_type:"MINERAL_TYPE", mineral_amount:"MINERAL_AMOUNT"};
    
    priority_order = [jobOrder_mineAndDeposit_minerals, jobOrder_process_minerals, jobOrder_sellProcessed_minerals, jobOrder_sell_minerals];

    for(var i=0; i<priority_order.length; i++){
        priority_satisfied = checkJobOrder_automatic_satisfied(creep, priority_order[i]);
        if(!priority_satisfied){    //if not satisfied, add to the list of jobs to be done and leave
            //## ADD TO CREEPS JOBORDER ---> NOT SETUP YET
            creep.memory.jobOrder.push(priority_order[i]);  //<--- MAKE SURE NOT BY REFERENCE, SO THE AMOUNT OF MATERIAL TO MOVE IS A COPY EACH TIME, SO IT CAN BE SUBTRACTED FROM
            //## ADD TO CREEPS JOBORDER ---> NOT SETUP YET
            break;
        }
    }

    var creepState = creepStateDict.paramDesc;
    return creepState;
}
function checkJobOrder_automatic_satisfied(creep, jobOrder){
    /*
    Checks if an automatic job order needs to be completed or not
    
    False => The job needs to be done
    True  => The job is already done
    */
    orderFulfilled = true;  //Default to handing no jobs out --> only hand out if actually required
    if(     jobOrder.name == "mineAndDeposit_minerals"){
        //If any minerals, mine them straight away
        var areStructuresPresent = ;    //Mineral patch, To
        if(areStructuresPresent){
            var isRemainingMinerals = ;
            if(isRemainingMinerals){
                orderFulfilled = false;
            }
        }
    }
    else if(jobOrder.name == "process_minerals"){
        //If you can process minerals, do so
        var areStructuresPresent = ;    //Factory, From, To
        if(areStructuresPresent){
            var areMineralsPresent = ;
            if(areMineralsPresent){
                orderFulfilled = false;
            }
        }
    }
    else if(jobOrder.name == "sellProcessed_minerals"){
        var areStructuresPresent = ;    //Terminal, From
        if(areStructuresPresent){
            var areProcessedMineralsPresent = ;
            if(areProcessedMineralsPresent){
                var isTerminalFull = ;  //Only for the amount of space needed left over
                if(!isTerminalFull){
                    orderFulfilled = false;
                }
            }
        }
    }
    else if(jobOrder.name == "sell_minerals"){
        var areStructuresPresent = ;    //Terminal, From
        if(areStructuresPresent){
            var areMineralsPresent = ;
            if(areMineralsPresent){
                var isTerminalFull = ;  //Only for the amount of space needed left over
                if(!isTerminalFull){
                    orderFulfilled = false;
                }
            }
        }
    }
}
function getTargetSpec_extractor(creep, creepState){
    /*
    . Determines the target that is required for the given creepState

    #################################################################################
    ## MAY NOT EVEN USE IDs HERE, JUST PARSE RESOURCE TYPE + OTHER SPECIFICS MAYBE ## ----> both not used currently ---> maybe reconsider a bunch
    #################################################################################
    */
    var targetSpec = null;
    if(creepState.name == "mine_minerals"){
        //Mine minerals
        var mineralPatches = creep.room.find(FIND_MINERALS);    //Mineral Object
        if(mineralPatches.length > 0){
            if(mineralPatches[0].mineralAmount > 0){            //If there is anything to be mined, go mine it
                targetSpec = {ID:mineralPatches[0].id, resourceType:mineralPatches[0].resourceType};
            }
        }
    }
    else if(creepState.name == "unload_storeToTarget"){
        //Unload inventory into main storage
        targetSpec = {ID:creepState.targetID, resourceType:creepState.resourceType}
    }
    else if(creepState.name == "load_storeFromTarget"){
        //Retrieve [material] from main storage
        targetSpec = {ID:creepState.targetID, resourceType:creepState.resourceType}
    }
    //...
    return targetSpec;
}

function getExtractionID(roomID){
    /*
    . Looks in the room they are spawned for the 1 extractor present
    . Records its ID
    */
    var sourceID = null;
    var extractorsInRoom = Game.rooms[roomID].find(FIND_MINERALS);
    if(extractorsInRoom.length > 0){
        sourceID = extractorsInRoom[0].id;}
    return sourceID;
}

module.exports = {
    getExtractionID,
    extractor_tasks};