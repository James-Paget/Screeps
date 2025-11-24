var miner_tasks     = require("behaviour_Miner");
var gatherer_tasks  = require("behaviour_Gatherer");
var upgrading_tasks = require("behaviour_Upgrader");
var building_tasks  = require("behaviour_Builder");
var repairing_tasks = require("behaviour_Repairer");
var defender_tasks  = require("behaviour_Defender");
var {getExtractionID, extractor_tasks} = require("behaviour_Extractor");
var {claimer_tasks}   = require("behaviour_Claimer");
var {getSpawnerRoomIndex} = require("manager_Memory");
var {military_tasks} = require("behaviour_Military");

/*
The current solution for spawning;
. Certain roles (like builders, repairers, etc) spawn up to a fixed quantity -------------> MAKE BUILDERS SCALE WITH # OF CONSTRUCTION SITES IN FUTURE
. Creeps involved in energyRooms (miners and gatherers) are periodically spawned based on saturation needs
-   For example; A function will check whether any new creeps are needed, and if so will output the parts, 
                room and source desired. On another tick, a function will then look through spawned assigned 
                creeps of given roles, and assign them to the location they were intended for. This is separate 
                because the ID of a creep can only be accessed after spawning.
*/

var respawnManager = {
    spawnFromQueue : function(){
        /*
        . Uses to queue to decide next spawn
        . Only attempts to spawn when spawner is finished spawning last and has enough energy
        . Moves certain roles to unassigned list when processed in queue
        */
        for(var spawnerRoomIndex in Memory.spawnerRooms){
            if(Memory.spawnerRooms[spawnerRoomIndex].queue.length > 0){                            //If anything to spawn
                var spawnerID = Game.rooms[Memory.spawnerRooms[spawnerRoomIndex].roomID].find(FIND_STRUCTURES, {filter:(structure) => {return(structure.structureType == STRUCTURE_SPAWN)}})[0].id;
                var spawner   = Game.getObjectById(spawnerID);
                var creepSpec = Memory.spawnerRooms[spawnerRoomIndex].queue[0];
                if(!spawner.spawning){                                                          //And not busy
                    var energyRequired = _.sum(Memory.spawnerRooms[spawnerRoomIndex].queue[0].parts, part => BODYPART_COST[part]);
                    if(energyRequired <= spawner.room.energyAvailable){                         //And have enough energy
                        var creepName = Memory.spawnerRooms[spawnerRoomIndex].queue[0].role+Game.time;
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Miner"){
                            miner_tasks.respawn(creepName, spawnerID, creepSpec);
                            Memory.spawnerRooms[spawnerRoomIndex].unassigned.push(creepName);}     //energyRoom unit, => requires assigning
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Gatherer"){
                            gatherer_tasks.respawn(creepName, spawnerID, creepSpec);
                            Memory.spawnerRooms[spawnerRoomIndex].unassigned.push(creepName);}     //energyRoom unit, => requires assigning
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Repairer"){
                            repairing_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Builder"){
                            building_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Upgrader"){
                            upgrading_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Defender"){
                            defender_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Extractor"){
                            extractor_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Military"){
                            military_tasks.respawn(creepName, spawnerID, creepSpec);}
                        if(Memory.spawnerRooms[spawnerRoomIndex].queue[0].role == "Claimer"){
                            claimer_tasks.respawn(creepName, spawnerID, creepSpec);}
                        //...
                        Memory.spawnerRooms[spawnerRoomIndex].queue.shift();
                    }
                }
            }
        }
    },
    extendQueue : function(){
        /*
        . Manages the turn-taking of the different 'factors' trying to add creeps to the queue
        . Each 'factor' can add 1 creep to the queue each time this function is called (to give them all opportunity to populate their workers)

        For example, some factors are;
        -energyRoom creeps
        -General creeps
        -...
        */
        for(var spawnerRoomIndex in Memory.spawnerRooms){
            if( (Memory.spawnerRooms[spawnerRoomIndex].queue.length == 0) && (Memory.spawnerRooms[spawnerRoomIndex].unassigned.length == 0) ){
                this.queueCreeps_energyRooms(Memory.spawnerRooms[spawnerRoomIndex].roomID);
                this.queueCreeps_spawnerRoom(Memory.spawnerRooms[spawnerRoomIndex].roomID);

                // ### LEGACY ###
                // queueCreeps_energyRooms();  //Can contribute 2 at once, maximum (miner and/or gatherer)
                // this.populateQueue_general(Memory.spawnerRooms[spawnerRoomIndex].roomID);    //Can contribute 1 at once, maximum
                // ### LEGACY ###
            }
        }
    },



    queue_creepGeneric : function(roomID, creepRole, creepParts, additionalInfo=null) {
        /*
        . Queues up any creep independent of their role
        . Additional arguements needed can be parsed in as an object for 'additionalInfo={...}'

        . roomID = Room name which creep will be queued to spawn into
        . creepRole = Role of creep to be queued
        . creepParts = All parts of creep to be spawned
        . additionalInfo = Extra information in object form {..., ...} that can be parsed in if required; defaults to null
        */
        switch(creepRole) {
            // **NOTE; Miner and Gatherer require sourceID
            case "Miner":
                miner_tasks.queue(roomID, additionalInfo["SourceID"], creepParts);
                break;
            case "Gatherer":
                gatherer_tasks.queue(roomID, additionalInfo["SourceID"], creepParts);
                break;
            // SourceID not required
            case "Repairer":
                repairing_tasks.queue(roomID, null, creepParts);
                break;
            case "Builder":
                building_tasks.queue(roomID, null, creepParts);
                break;
            case "Upgrader":
                upgrading_tasks.queue(roomID, null, creepParts);
                break;
            case "Extractor":
                var mineralID = getExtractionID(roomID);
                extractor_tasks.queue(roomID, mineralID, creepParts);
                break;
            // If role not specified above, ignore it and do not queue anything
        }
    },
    fetch_creepValueMaximum : function(roomID, role) {
        /*
        . Maximum target energy to allocate to all creeps (linked to the spawnerRoom) across the role collectively
        . Scales with the available energy of the spawnerRoom to ensure the satisfaction is relative to the current progression of the spawnerRoom
        */
       const maximumRoomEnergy = Game.rooms[roomID].energyCapacityAvailable
        switch(role) {
            case "Miner":
                return 2.0*maximumRoomEnergy;
            case "Gatherer":
                return 2.0*maximumRoomEnergy;
            case "Repairer":
                return 0.5*maximumRoomEnergy;
            case "Builder":
                return 0.6*maximumRoomEnergy;
            case "Upgrader":
                return 1.0*maximumRoomEnergy;
            case "Extractor":
                return 0.75*maximumRoomEnergy;
            default:
                return 0;
        }
    },
    fetch_creepRoleValue : function(roomID, role) {
        var totalValue = 0
        // Check living creeps
        for(creepName in Game.creeps) {
            const creep = Game.creeps[creepName]
            if(creep.memory.role == role) {                         // Role check
                if(creep.memory.spawnKey != null) {             // Null check
                    if(creep.memory.spawnKey.roomID == roomID) {    // Correct spawnerRoom
                        totalValue += _.sum(creep.body, part => BODYPART_COST[part]);
                    }
                }
            }
        }
        // Check creeps being spawned
        const roomSpawners = Game.rooms[roomID].find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_SPAWN)}});
        for(spawner in roomSpawners) {
            if(spawner.spawning) {
                if(spawner.spawning.role == role) {
                    totalValue += _.sum(spawner.spawning.body, part => BODYPART_COST[part]);
                }
            }
        }
        // Check queued creeps
        // for(spawnerRoomIndex in Memory.spawnerRooms) {
        //     if(Memory.spawnerRooms[spawnerRoomIndex].roomID == roomID) {
        //         for(queueIndex in Memory.spawnerRooms[spawnerRoomIndex].queue) {
        //             if(Memory.spawnerRooms[spawnerRoomIndex].queue[queueIndex].role == role) {
        //                 totalValue += _.sum(Memory.spawnerRooms[spawnerRoomIndex].queue[queueIndex].parts, part => BODYPART_COST[part]);
        //             }
        //         }
        //     }
        // }
        return totalValue
    },
    fetch_creepParts : function(roomID, role, satisfaction, additionalInfo=null) {
        /*
        . roomID = SpawnerRoom name
        . role = The role name of the desired creep 
        . satisfaction = Percentage of maximum desired workload for a given role required for this work-order
        . additionalInfo = Extra details like nearby containers and spaces. Defaults to null if irrelevant
        */
        const cushionFactor = 0.75;  // Leave wiggle room for spawnerRoom energy maximum

        var creepParts = null;
        const creepValueMax = this.fetch_creepValueMaximum(roomID, role);
        const creepValueCurrent = this.fetch_creepRoleValue(roomID, role);   // Total value of existing and queued creeps of this role
        if(creepValueCurrent < creepValueMax*satisfaction) {            // If do not meet satisfaction requirement, need to make more creeps
            const requiredValue = creepValueMax*satisfaction-creepValueCurrent;
            const maximumRoomEnergy = Game.rooms[roomID].energyCapacityAvailable;
            const availableRoomEnergy = Game.rooms[roomID].energyAvailable;
            var baseParts = [MOVE];        // One-time body parts (different for each role)
            var segmentParts = [MOVE];     // Repeated segment (different for each role)
            switch(role) {
                case "Miner":
                    baseParts = [MOVE, MOVE, WORK, CARRY];
                    segmentParts = [MOVE, MOVE, WORK, CARRY];
                    break;
                case "Gatherer":
                    baseParts = [MOVE, CARRY];
                    segmentParts = [MOVE, CARRY];
                    break;
                case "Repairer":
                    baseParts = [MOVE, MOVE, WORK, CARRY];
                    segmentParts = [MOVE, CARRY];
                    break;
                case "Builder":
                    baseParts = [MOVE, MOVE, WORK, CARRY];
                    segmentParts = [MOVE, MOVE, WORK, CARRY];
                    break;
                case "Upgrader":
                    baseParts = [MOVE, MOVE, WORK, CARRY];
                    segmentParts = [MOVE, MOVE, WORK, CARRY];
                    break;
                case "Extractor":
                    baseParts = [MOVE, MOVE, WORK, CARRY];
                    segmentParts = [MOVE, WORK, CARRY];
                    break;
            }
            const baseCost    = _.sum(baseParts, part => BODYPART_COST[part]);
            const segmentCost = _.sum(segmentParts, part => BODYPART_COST[part]);
            var segmentRepeats = 0;//Math.floor( (Math.min(cushionFactor*maximumRoomEnergy, requiredValue) -baseCost)/segmentCost );    // Pick to (A) Build only what is required, or (B) build biggest possible creep if can
            
            // idealRepeats = (requiredValue -baseCost)/segmentCost
            // maxRepeats = (cushionFactor*maximumRoomEnergy -baseCost)/segmentCost
            // possibleRepeats = (availableRoomEnergy -baseCost)/segmentCost

            if(availableRoomEnergy >= requiredValue) {  // If can afford the required value, make it
                segmentRepeats = Math.floor( (requiredValue -baseCost)/segmentCost );
            } else {    // If you cannot afford the required value, look for next best option
                segmentRepeats = Math.floor( (availableRoomEnergy -baseCost)/segmentCost );
            }
            
            creepParts = []
            for(partIndex in baseParts) {creepParts.push(baseParts[partIndex])}
            if(segmentRepeats > 0) {
                for(var i=0; i<segmentRepeats; i++) {
                    for(partIndex in segmentParts) {creepParts.push(segmentParts[partIndex])}
                }
            }
            // Do check at the end for atypical role conditions
            switch(role) {
                case "Miner":
                    if( (additionalInfo["minerNumber"]!=null) && (additionalInfo["freeSpace"]!=null) ) {
                        if(additionalInfo["minerNumber"]>=additionalInfo["freeSpace"]) {
                            creepParts = null
                        }
                    }
                    break;
                case "Gatherer":
                    if( additionalInfo["containerNumber"]!=null ) {
                        if(additionalInfo["containerNumber"]<=0) {
                            creepParts = null
                        }
                    }
                    break;
            }
        }
        return creepParts
    },
    queueCreeps_spawnerRoom : function(roomID) {
        /*
        . Decides which creeps to add to the spawnerRoom queue
        . Considers only creeps that either (1) work soley in the spawnerRoom given or (2) temporarily travel outside the spawnerRoom given

        Creeps considered here include;
        . Repairers
        . Builders
        . Upgraders
        . Extractors
        . Militia
        . Scavenger (COLLECT ARBITRARY RESOURCE PARSED IN)
        */
        var creepQueuePriority = [
            {role: "Repairer", satisfaction: 0.35},     // Get X% of required to get started
            {role: "Builder", satisfaction: 0.35}, 
            {role: "Upgrader", satisfaction: 0.35}, 
            {role: "Extractor", satisfaction: 0.35}, 
            {role: "Repairer", satisfaction: 0.9},      // Once established, increase to Y% of each (trying to reach close to 100% satisfaction)
            {role: "Builder", satisfaction: 0.9}, 
            {role: "Upgrader", satisfaction: 0.9}, 
            {role: "Extractor", satisfaction: 0.9}
        ]
        for(conditionIndex in creepQueuePriority) {
            var condition = creepQueuePriority[conditionIndex]
            var creepParts = this.fetch_creepParts(roomID, condition.role, condition.satisfaction);
            if(creepParts!=null) {
                this.queue_creepGeneric(roomID, condition.role, creepParts)
                break;
            }   // If null, skip queuing it and move to next priority
        }
    },

    queueCreeps_energyRooms : function(roomID){
        /*
        . Decides which creeps to spawn that will travel to energyRooms
        . Considers which spawnerRoom and energyRoom pairing is required for each creep

        ** Note; The creeps only need to be put in the unassigned set (then later the removed when assigned) AFTER they 
        have been spawned from the queue, hence this is managed later when spawning from the queue

        Creeps considered here include;
        . Miners
        . Gatherers
        */
        var creepQueuePriority = [
            {role: "Miner", satisfaction: 0.2},     // This will be checked for each source
            {role: "Gatherer", satisfaction: 0.2},  //      Note the smaller miner + gatherer to kick start initial production, with the miner occuring first (for both)
            {role: "Miner", satisfaction: 0.9},     // 
            {role: "Gatherer", satisfaction: 0.9}   //
        ]

        for(energyRoomIndex in Memory.energyRooms) {
            if(Memory.energyRooms[energyRoomIndex].spawnerRoomID == roomID) {       // When you find an energy room linked to this spawnerRoom
                var energyRoomChecked = false
                for(sourceIndex in Memory.energyRooms[energyRoomIndex].sources) {   // Go through each source and try create a miner+gatherer combo for it
                    // Check miner, gatherer, etc, conditions for each source before moving to next source => pair up faster
                    for(conditionIndex in creepQueuePriority) {
                        var condition = creepQueuePriority[conditionIndex]
                        const creepParts = this.fetch_creepParts(
                            roomID, 
                            condition.role, 
                            condition.satisfaction,
                            additionalInfo={
                                containerNumber: Memory.energyRooms[energyRoomIndex].sources[sourceIndex].containers.length,
                                minerNumber: Memory.energyRooms[energyRoomIndex].sources[sourceIndex].miners.length,
                                freeSpace: Memory.energyRooms[energyRoomIndex].sources[sourceIndex].free,
                            }
                        );
                        if(creepParts!=null) {
                            this.queue_creepGeneric(
                                roomID, 
                                condition.role, 
                                creepParts, 
                                additionalInfo={
                                    "SourceID":Memory.energyRooms[energyRoomIndex].sources[sourceIndex].ID
                                }
                            )
                            energyRoomChecked = true;
                            break;
                        }
                    }
                    if(energyRoomChecked) {break;}
                }
            }
        }


        // ### LEGACY ###
        /*
        -- Call this periodically or continually
        . Checks through energyRoom data for unsaturation
        . Calculates the type of creep (role, parts, etc) needed to satisfy this condition
        . Adds required creeps to the spawn queue (Note, when checking, it will add miners before gatherers, which is good behaviour)

        -- This function will only assign the first unit it finds that is required
        -- It is then called often by the respawn manager to populate all required units

        The spawnerRoom.queue      HOLDS [{roomID, sourceID, Parts, Role}, {...}, ...] <-- Specify what creeps to make                 <-*Only THIS list is touched here*
        The spawnerRoom.unassigned HOLDS [creepNames, ...]                             <-- Specify the creeps who have just been made
        */
        //Only do this when all unassigned positions have been resolved -> so when choosing new spawns, only have to consider energyRooms, not spawnerRoom.unassigned
        // var workerQueued = false;
        // for(var roomIndex in Memory.energyRooms){
        //     for(var sourceIndex in Memory.energyRooms[roomIndex].sources){
        //         //Check mining is saturated
        //         var saturationCondition_miners = getSaturationCondition_miners(Memory.energyRooms[roomIndex].spawnerRoomID, Memory.energyRooms[roomIndex].sources[sourceIndex]);    //Check mining is saturated
        //         if(saturationCondition_miners != null){     //Not saturated => put new miners into the queue
        //             //miner_tasks.queue(Memory.energyRooms[roomIndex].ID, Memory.energyRooms[roomIndex].sources[sourceIndex].ID, saturationCondition_miners.parts);         //#### RESULTS IN CIRCULARNESS
        //             var creepSpec = {roomID:Memory.energyRooms[roomIndex].ID, sourceID:Memory.energyRooms[roomIndex].sources[sourceIndex].ID, parts:saturationCondition_miners.parts, role:"Miner", time:Game.time};
        //             Memory.spawnerRooms[getSpawnerRoomIndex(Memory.energyRooms[roomIndex].spawnerRoomID)].queue.push(creepSpec);
        //             workerQueued = true;
        //         }
        //         //Check gathering is saturated
        //         var saturationCondition_gatherers = getSaturationCondition_gatherers(Memory.energyRooms[roomIndex].spawnerRoomID, Memory.energyRooms[roomIndex].sources[sourceIndex]);   //Check gatherers are saturated
        //         if(saturationCondition_gatherers != null){                                                                              //Not saturated => put new gatherers into the queue
        //             //gatherer_tasks.queue(Memory.energyRooms[roomIndex].ID, Memory.energyRooms[roomIndex].sources[sourceIndex].ID, saturationCondition_gatherers.parts);   //#### RESULTS IN CIRCULARNESS
        //             var creepSpec = {roomID:Memory.energyRooms[roomIndex].ID, sourceID:Memory.energyRooms[roomIndex].sources[sourceIndex].ID, parts:saturationCondition_gatherers.parts, role:"Gatherer", time:Game.time};
        //             Memory.spawnerRooms[getSpawnerRoomIndex(Memory.energyRooms[roomIndex].spawnerRoomID)].queue.push(creepSpec);
        //             workerQueued = true;
        //         }
        //         //...

        //         if(workerQueued){
        //             break;}
        //     }
        //     if(workerQueued){
        //         break;}
        // }
        // ### LEGACY ###
    },
    // ### LEGACY ###
    // function getSaturationCondition_miners(roomID, energyRooms_info){
    //     /*
    //     . Checks if the miners are saturated
    //     . If they are NOT, returns what the next miner parts should be in order to fulfil saturation
    //     . If they are, returns null

    //     ---> roomID refers to the ID of the SPAWNER room

    //     The number of parts assigned to the next worker is based on (1)the number of spaces around the source to mine from, 
    //     (2)the amount of WORK already at source, and (3)the largest amount of energy that could be spent on a creep

    //     --> Note; Related to "energyMax", if miners do not deliver to extensions, then there will always be a cap a 300, or else the colony could fail if all gatherers die at once
    //             This is currently fixed by letting miners walk to spawns or ext. when their containers are full, however this means if gathering is not efficient, mining will not 
    //             be either (as they are leaving their post)
    //     */
    //     var condition = null;
    //     //(1) If any spaces free for a worker
    //     if(energyRooms_info.free > energyRooms_info.miners.length){
    //         if( (energyRooms_info.miners.length == 0) && (energyRooms_info.free > 1) ){    //Start off each source (that can hold more than 1 miner) with an always affordable miner
    //             condition = {parts:[WORK,CARRY,MOVE]};  //Cheapest miner
    //         }
    //         else{
    //             //(2) Sum WORK parts assigned to source
    //             var workRequired    = 5+1;                      //Work required to full deplete any source  +1 for extra wiggle room (moving etc)
    //             var total_workParts = 0;
    //             for(var minerIndex in energyRooms_info.miners){
    //                 total_workParts += _.filter(Game.getObjectById(energyRooms_info.miners[minerIndex]).body, function(part){return (part.type==WORK)}).length;}
    //             var workNeeded = workRequired -total_workParts;
    //             if(workNeeded > 0){                             //If actually need any more workers
    //                 //(3) Energy max
    //                 var energyMax = Game.rooms[roomID].energyCapacityAvailable; //#### THIS WILL HAVE TO TAKE A READING FROM THE ROOM, FROM ROOMINDEX, IN MULTI ROOM CASE ####
    //                 //Now make decision
    //                 var workNeeded_perWorker = Math.ceil(workNeeded / (energyRooms_info.free -energyRooms_info.miners.length)); //Spreads work over spaces possible to be mined ==> This is probably not a good way to do this for larger bases, but overall should improve flowrate of energy (e.g no sudden spikes of nothing when they die of old age)
    //                 var partSet = [CARRY,MOVE];
    //                 for(var i=0; i<workNeeded_perWorker; i++){          //Attempts to spawn the most expensive (but not overkill) miner it can => however need to still have cheap miner above as extensions imply unreachable goals GIVEN you have 0 miners, => have to fullly rely on passive income
    //                     partSet.unshift(WORK);
    //                     var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
    //                     if(energyCost > energyMax){
    //                         partSet.shift();
    //                         break;}
    //                 }
    //                 condition = {parts:partSet};    //... Could add more returns for a condition if needed
    //             }
    //         }
    //     }
    //     return condition;
    // }
    // function getSaturationCondition_gatherers(roomID, energyRooms_info){
    //     /*
    //     . Checks if the gatherers are saturated
    //     . If they are NOT, returns what the next gatherer parts should be in order to fulfil saturation
    //     . If they are, returns null

    //     The number of parts assigned to the next worker is based on (1)if containers exist to gather from and (2)the distance to the source

    //     --> Note; Related to "energyMax", make sure a cheap gatherer is spawned if no others are there to ensure some gathering always takes 
    //             place, so miners can work efficiently, and gatherers are never falsely valued too highly so they never spawn (due to extensions)
    //     */
    //     var condition = null;
    //     if(energyRooms_info.containers.length > 0){
    //         if(energyRooms_info.gatherers.length == 0){         //If this is the first gatherer, make them cheap so gathering will occur
    //             condition = {parts:[CARRY,MOVE,CARRY,MOVE]};
    //         }
    //         else{
    //             //(1) Sum CARRY parts assigned to source
    //             /*
    //             var originObj = Game.rooms[roomID].find(FIND_STRUCTURES, {filter:(structure)=>{return ( structure.structureType == STRUCTURE_SPAWN )}})[0].pos;
    //             var goalObj   = {pos:Game.getObjectById(energyRooms_info.ID).pos, range:1};
    //             var travelDistance   = PathFinder.search(originObj, goalObj).path.length +8;   //From spawn to source, actual path +8 to account for getting stuck in motion, increasing time
    //             travelDistance = Math.min(travelDistance, 40);   //--> Caps the total distance a source is imagined to be, prevents 20 gatherers for a spawn 1 room away
    //             var carryRequired    = Math.max(Math.ceil(0.4*travelDistance), 3);             //CARRY required to fully empty whatever a source produces (10 energy tick^-1) --> assumed travelling always at 1 tile tick^-1 --> sets a min so incorrect linear dist is slightly corrected
    //             */
    //             var carryRequired    = 15;  //Fixed amount used here for simplicity in multi-room case --> Vision problems              ###### WAS 15 ######
    //             var total_carryParts = 0;
    //             for(var gathererIndex in energyRooms_info.gatherers){
    //                 //###############################################################################
    //                 //## ISSUE IN SIM --> GETTING NULL HERE FOR      Game.getObjectById(energyRooms_info.gatherers[gathererIndex])     WHEN THE CREEP IS SPAWNING
    //                 //###############################################################################
    //                 total_carryParts += _.filter(Game.getObjectById(energyRooms_info.gatherers[gathererIndex]).body, function(part){return (part.type==CARRY)}).length;}
    //             var carryNeeded = carryRequired -total_carryParts;
    //             if(carryNeeded > 0){          //If actually need any more workers
    //                 //(3) Energy max
    //                 var energyMax = Game.rooms[roomID].energyCapacityAvailable; //#### THIS WILL HAVE TO TAKE A READING FROM THE ROOM, FROM ROOMINDEX, IN MULTI ROOM CASE ####
    //                 //Now make decision
    //                 var carryNeeded_perWorker = Math.ceil(carryNeeded / Math.abs(3.0 -energyRooms_info.gatherers.length));   //Spreads work over multiple gatherers, not all on just one (3 workers used here)
    //                 var partSet = [CARRY,MOVE];
    //                 var partMax = 10;    //Max 3 sets of each => 3+initial = 4 full pairs       ####### WAS 5 ######
    //                 for(var i=0; i<carryNeeded_perWorker; i++){                     //Attempts to spawn the most expensive (but not overkill) miner it can => however need to still have cheap miner above as extensions imply unreachable goals GIVEN you have 0 miners, => have to fullly rely on passive income
    //                     partSet.unshift(MOVE);                                      //MOVES made alongside CARRYs to ensure they stay at max move speed (on regular ground)
    //                     partSet.unshift(CARRY);
    //                     var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
    //                     if(energyCost > energyMax){
    //                         partSet.shift();
    //                         partSet.shift();
    //                         break;}
    //                     if(i >= partMax-1){
    //                         break;}
    //                 }
    //                 condition = {parts:partSet};    //... Could add more returns for a condition if needed
    //             }
    //         }
    //     }
    //     return condition;
    // }
    // ### LEGACY ###

    // ###
    // ### Make it populate each separately -> GO through each spawner room -> DO its own room creeps -> DO energy creeps 
    // ### Both share queue -> 1 each take turns
    // ### Use the list method for prio
    // ###

    populateQueue_general : function(roomID){
        /*
        . Adds creeps NOT related to energy rooms (Miners and Gatherers) to the spawning queue
        . This is performed such that energyRooms are utilised well before excess energy is spent on these other workers

        Priorities are;
        (1) Repairer
        (2) Builders
        (3) Upgraders
        (4) Army
        */
        //#############################################################################################################
        //## REPLACE THIS WITH FUNCTIONAL CONDITION, MAKE IT FAR BETTER, THIS IS A TERRIBLE METRIC FOR WHEN TO SPAWN ##
        //#############################################################################################################
        //## REPLACE WITH SAME SYSTEM AS REPAIR TOWER --> SIMPLE LIST QUEUE ##
        //####################################################################
        var sourceOccupied_miners    = getSummed_potential_role(roomID, "Miner")    >= Game.rooms[roomID].find(FIND_SOURCES).length;
        var sourceOccupied_gatherers = getSummed_potential_role(roomID, "Gatherer") >= Game.rooms[roomID].find(FIND_STRUCTURES, {filter:(structure)=>{return(structure.structureType == STRUCTURE_CONTAINER)}}).length;
        if(sourceOccupied_miners && sourceOccupied_gatherers){
            var repairerFilter = repairing_tasks.generateCreepParts(roomID);//getSummed_potential_role(roomID, "Repairer");
            if(repairerFilter==null){    //<--- Repairers are being phased out, replaced with towers doing repair work alongside miners
                var builderFilter  = building_tasks.generateCreepParts(roomID);
                if(builderFilter==null){
                    var upgraderFilter = upgrading_tasks.generateCreepParts(roomID);
                    if(upgraderFilter==null){
                        var extractorFilter = extractor_tasks.generateCreepParts(roomID);
                        if(extractorFilter==null){
                            var armyFilter     = defender_tasks.generateCreepParts(roomID);
                            if(armyFilter==null){
                                defender_tasks.queue(roomID, null, armyFilter);}
                        }
                        else{
                            var mineralID = getExtractionID(roomID);
                            extractor_tasks.queue(roomID, mineralID, extractorFilter);}
                    }
                    else{
                        upgrading_tasks.queue(roomID, null, upgraderFilter);}
                }
                else{
                    building_tasks.queue(roomID, null, builderFilter);}
            }
            else{
                repairing_tasks.queue(roomID, null, repairerFilter);}
        }
    }
}
function getSummed_potential_role(roomID, role){
    /*
    . Sums all the creeps with the given role
    . Sums creep that are currently alive AND that are queued up

    #####
    ## HOPEFULLY NO PROBLEM IN THE 1 FRAME IT IS IN UNASSIGNED => BUT SHOULD STILL EXIST IN BOARD AT THIS POINT SO SHOULD BE FINE, BUT WORTH TESTING
    #####
    */
    var total = 0;
    for(var creepName in Game.creeps){
        if(Game.creeps[creepName].memory.role == role){
            total++;}
    }
    for(var element in Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue){
        if(Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue[element].role == role){
            total++;}
    }
    return total;
}

module.exports = respawnManager;