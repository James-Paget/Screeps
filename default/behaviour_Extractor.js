var {getSpawnerRoomIndex} = require("manager_Memory");

var extractor_tasks = {
    task : function(creep){
        /*
        Note; Mention of material here can be minerals or energy
        */
        if(creep.memory.jobOrder.length > 0){      //If you have any jobs to do
            execute_next_jobOrder(creep);       //Do the first job in the queue
        }
        else{
            //If no job orders, look for a new (automatic) one periodically
            if(Game.time.toString().slice(-1) % 2 == 0){
                determine_automaticJobOrder_extractor(creep);
            }
        }
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
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, isExtracting:true, jobOrder:[]}});
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
    //#######################################################
    //## HAVE A [null] RETURN IF NONE OF THE OBJECT EXISTS ##
    //#######################################################
    //## CHOOSE STORAGE MORE SOPHISTICATED WAY --> WHICHEVER HAS ROOM, NOT JUST 0TH
    //##########
    var storage_available   = Memory.spawnerRooms[getSpawnerRoomIndex(creep.memory.spawnKey.roomID)].mineralStorage;
    var minerals_available  = creep.room.find(FIND_MINERALS);
    var factories_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_FACTORY)}});
    var terminals_available = creep.room.find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_TERMINAL)}});

    var jobOrder_mineAndDeposit_minerals = {name:"mineAndDeposit_minerals", deliverTo_id:storage_available[0]  , mineral_id:minerals_available[0].id  , mineral_type:minerals_available[0].mineralType, mineral_amount:10000};
    var jobOrder_process_minerals        = {name:"processed_minerals"     , deliverFrom_id:storage_available[0], deliverTo_id:storage_available[0]    , factory_id:factories_available[0].id          , mineral_type:minerals_available[0].mineralType, mineral_amount:10000};
    var jobOrder_sellProcessed_minerals  = {name:"sellProcessed_minerals" , deliverFrom_id:storage_available[0], terminal_id:terminals_available[0].id, mineral_type:"RESOURCE_..._BAR"               , mineral_amount:10000};
    var jobOrder_sell_minerals           = {name:"sell_minerals"          , deliverFrom_id:storage_available[0], terminal_id:terminals_available[0].id, mineral_type:minerals_available[0].mineralType, mineral_amount:10000};
    
    //var priority_order = [jobOrder_mineAndDeposit_minerals, jobOrder_process_minerals, jobOrder_sellProcessed_minerals, jobOrder_sell_minerals];
    var priority_order = [jobOrder_mineAndDeposit_minerals, jobOrder_sell_minerals];

    for(var i=0; i<priority_order.length; i++){
        var priority_satisfied = checkJobOrder_satisfied(creep, priority_order[i]);
        if(!priority_satisfied){    //if not satisfied, add to the list of jobs to be done and leave
            //<--- MAKE SURE NOT BY REFERENCE, SO THE AMOUNT OF MATERIAL TO MOVE IS A COPY EACH TIME, SO IT CAN BE SUBTRACTED FROM
            creep.memory.jobOrder.push(priority_order[i]);
            break;
        }
    }
}
function checkJobOrder_satisfied(creep, jobOrder){
    /*
    Checks if an automatic job order needs to be completed or not
    
    False => The job needs to be done
    True  => The job is already done
    */
    var orderFulfilled = true;  //Default to handing no jobs out --> only hand out if actually required
    if(jobOrder.name == "mineAndDeposit_minerals"){
        //If any minerals, mine them straight away
        var areStructuresPresent = (Game.getObjectById(jobOrder.mineral_id)) && (Game.getObjectById(jobOrder.deliverTo_id));    //Mineral patch, To
        if(areStructuresPresent){
            var isRemainingMinerals = Game.getObjectById(jobOrder.mineral_id).mineralAmount > 0;
            if(isRemainingMinerals){
                var threshold = 0.1;    //Percentage full before switching task
                var storageNotFull = Game.getObjectById(jobOrder.deliverTo_id).store.getFreeCapacity() > threshold*Game.getObjectById(jobOrder.deliverTo_id).store.getCapacity();
                if(storageNotFull){
                    orderFulfilled = false;
                }
            }
        }
    }
    else if(jobOrder.name == "process_minerals"){
        //If you can process minerals, do so
        var areStructuresPresent = (Game.getObjectById(jobOrder.factory_id)) && (Game.getObjectById(jobOrder.deliverFrom_id)) && (Game.getObjectById(jobOrder.deliverTo_id));    //Factory, From, To
        if(areStructuresPresent){
            var areMineralsPresent = Game.getObjectById(jobOrder.deliverFrom_id).store.getUsedCapacity(jobOrder.mineral_type) > 0;
            if(areMineralsPresent){
                orderFulfilled = false;
            }
        }
    }
    else if(jobOrder.name == "sellProcessed_minerals"){
        var areStructuresPresent = (Game.getObjectById(jobOrder.terminal_id)) && (Game.getObjectById(jobOrder.deliverFrom_id));    //Terminal, From
        if(areStructuresPresent){
            var areProcessedMineralsPresent = Game.getObjectById(jobOrder.deliverFrom_id).store.getUsedCapacity(jobOrder.mineral_type) > 0;
            if(areProcessedMineralsPresent){
                //############
                //### WILL WANT TO MAKE THIS ~ HALF FILL THE TERMINAL --> OTHER HALF FOR ENERGY ###
                //############
                var terminalNotFull = Game.getObjectById(jobOrder.terminal_id).store.getFreeCapacity() > 0;  //Only for the amount of space needed left over
                if(terminalNotFull){
                    orderFulfilled = false;
                }
            }
        }
    }
    else if(jobOrder.name == "sell_minerals"){
        var areStructuresPresent = (Game.getObjectById(jobOrder.terminal_id)) && (Game.getObjectById(jobOrder.deliverFrom_id));    //Terminal, From
        if(areStructuresPresent){
            var areMineralsPresent = Game.getObjectById(jobOrder.deliverFrom_id).store.getUsedCapacity(jobOrder.mineral_type) > 0;
            if(areMineralsPresent){
                //############
                //### WILL WANT TO MAKE THIS ~ HALF FILL THE TERMINAL --> OTHER HALF FOR ENERGY ###
                //############
                var terminalNotFull = Game.getObjectById(jobOrder.terminal_id).store.getFreeCapacity() > 0;  //Only for the amount of space needed left over
                if(terminalNotFull){
                    orderFulfilled = false;
                }
            }
        }
    }
    return orderFulfilled;
}
function execute_next_jobOrder(creep, jobOrder){
    /*
    Performs an action for the next jobOrder (0th in queue)
    This assumes an order does exist
    */
    var jobOrder = creep.memory.jobOrder[0];
    if(jobOrder.name == "mineAndDeposit_minerals"){
        var mineralPatch = Game.getObjectById(jobOrder.mineral_id);
        var deliverTo    = Game.getObjectById(jobOrder.deliverTo_id);
        var areStructuresPresent = (mineralPatch) && (deliverTo);
        if(areStructuresPresent){
            if(creep.store.getFreeCapacity() > 0){
                //If remaining free space, go to mine
                //#########################################
                //## SUBTRACT DIFFERENCE IN MINED AMOUNT ##
                //#########################################
                if(creep.harvest(mineralPatch) == ERR_NOT_IN_RANGE){
                    creep.moveTo(mineralPatch);
                }
            }
            else{
                //If completely full, deposit material
                if(creep.transfer(deliverTo, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(deliverTo);
                }
            }
        }
    }
    else if(jobOrder.name == "process_minerals"){
        //#####
        //## NEEDS TO PICK OUT ENERGY AND MINERALS
        //#####
        var deliverFrom = Game.getObjectById(jobOrder.deliverFrom_id);
        var deliverTo   = Game.getObjectById(jobOrder.deliverTo_id);
        var factory     = Game.getObjectById(jobOrder.factory_id);
        var areStructuresPresent = (deliverFrom) && (deliverTo) && (factory);
        if(areStructuresPresent){
            //#######
            //## MAKE THIS PROCESS MORE CAREFUL
            //## EXAMINE WHICH MATERIALS YOU ARE HOLDING e.g DELIVERABLE PROCESSED OR RAW
            //##    --> EACH REQUIRED DIFFERENT TREATMENT
            //#######
            if(creep.store.getFreeCapacity() == 0){
                //If full on materials, then go process them
                if(creep.transfer(factory, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(factory);
                }
                //####
                //## NEED TO GRAB PROCESSED AGAIN AFTERWARDS, and store in deliverTo
                //####
            }
            else{
                //If not full, go grab more
                if(creep.withdraw(deliverFrom, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(deliverFrom);
                }
            }
        }
    }
    else if(jobOrder.name == "sellProcessed_minerals"){
        var terminal    = Game.getObjectById(jobOrder.terminal_id);
        var deliverFrom = Game.getObjectById(jobOrder.deliverFrom_id);
        var areStructuresPresent = (terminal) && (deliverFrom);
        if(areStructuresPresent){
            if(creep.store.getUsedCapacity() > 0){
                //If holding anything, go deliver it to the terminal
                //#####
                //## NEED TO COLLECT BOTH RESOURCE AND ENERGY
                //#####
                if(creep.transfer(terminal, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(terminal);
                }
            }
            else{
                //If holding nothing, go grab some processed minerals
                if(creep.withdraw(deliverFrom, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(deliverFrom);
                }
            }
        }
    }
    else if(jobOrder.name == "sell_minerals"){
        var terminal    = Game.getObjectById(jobOrder.terminal_id);
        var deliverFrom = Game.getObjectById(jobOrder.deliverFrom_id);
        var areStructuresPresent = (terminal) && (deliverFrom);
        if(areStructuresPresent){
            if(creep.store.getUsedCapacity() > 0){
                //If holding anything, go deliver it to the terminal
                //#####
                //## NEED TO COLLECT BOTH RESOURCE AND ENERGY
                //#####
                var previous_stored = terminal.store.getUsedCapacity(jobOrder.mineral_type);
                if(creep.transfer(terminal, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(terminal);
                }
                var post_stored = terminal.store.getUsedCapacity(jobOrder.mineral_type);
                var difference_stored = previous_stored - post_stored;
                creep.memory.jobOrder[0].mineral_amount -= difference_stored;
            }
            else{
                //If holding nothing, go grab some processed minerals
                if(creep.withdraw(deliverFrom, jobOrder.mineral_type) == ERR_NOT_IN_RANGE){
                    creep.moveTo(deliverFrom);
                }
            }
        }
    }

    //################################################################################
    //## NEED TO MAKE MINE AND DEPO CONDIOTION ALSO LOOK AT MINERAL AMOUNT REQUIRED ##
    //################################################################################
    //Determine if task is complete
    var jobOrder_complete = checkJobOrder_satisfied(creep, jobOrder);
    if(jobOrder_complete){
        //If so, remove it from the queue
        creep.memory.jobOrder.shift();
    }
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