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
            }
        }
    },



    queue_creepGeneric : function(roomID, creepRole, creepParts, additionalInfo=null) {
        /*
        . Queues up any creep independent of their role
        . Additional arguements needed can be parsed in as an object for 'additionalInfo={...}'

        . roomID = Room name which creep will be queued to spawn into (spawnerRoom)
        . energyRoomID = Only required for miners and gatherers. The name of the room they will work in (roomID in 'houseKey')
        . creepRole = Role of creep to be queued
        . creepParts = All parts of creep to be spawned
        . additionalInfo = Extra information in object form {..., ...} that can be parsed in if required; defaults to null
        */
        switch(creepRole) {
            // **NOTE; Miner and Gatherer require sourceID
            case "Miner":
                if( (additionalInfo["energyRoomID"] != null) && (additionalInfo["SourceID"] != null) ) {
                    miner_tasks.queue(roomID, additionalInfo["energyRoomID"], additionalInfo["SourceID"], creepParts);
                }
                break;
            case "Gatherer":
                if( (additionalInfo["energyRoomID"] != null) && (additionalInfo["SourceID"] != null) ) {
                    gatherer_tasks.queue(roomID, additionalInfo["energyRoomID"], additionalInfo["SourceID"], creepParts);
                }
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
            case "Claimer":
                // ** Note; Here sourceID refers to the ID of the roomController to be claimed -> can be left as null if unknown
                if(additionalInfo["claimRoomID"] != null) { // sourceID is allowed to be null here -> claimer will determine it once it has entered the room
                    claimer_tasks.queue(roomID, additionalInfo["claimRoomID"], null, creepParts);   //additionalInfo["sourceID"]
                }
                break;
            // If role not specified above, ignore it and do not queue anything
        }
    },
    fetch_creepValueMaximum : function(roomID, role) {
        /*
        . Maximum target energy to allocate to all creeps (linked to the spawnerRoom) across the role collectively
        . Scales with the available energy of the spawnerRoom to ensure the satisfaction is relative to the current progression of the spawnerRoom

        . Note; Max(300, X) so maximum is at least 1 creep (300 is max energy of a sole spawner)
        */
       const maximumRoomEnergy = Game.rooms[roomID].energyCapacityAvailable
        switch(role) {
            case "Miner":
                return Math.max(300, 0.5*maximumRoomEnergy);
            case "Gatherer":
                return Math.max(300, 0.5*maximumRoomEnergy);
            case "Repairer":
                return Math.max(300, 0.05*maximumRoomEnergy);    // Min() in place to prevent over-spending on repairers
            case "Builder":
                return Math.max(300, 0.05*maximumRoomEnergy);    // "" ""
            case "Upgrader":
                return Math.max(300, 0.15*maximumRoomEnergy);
            case "Extractor":
                return Math.max(300, 0.15*maximumRoomEnergy);
            case "Claimer":
                return Math.max(300, 0.3*maximumRoomEnergy);
            default:
                return 0;
        }
    },
    fetch_creepNumberMaximum : function(role) {
        /*
        . Maximum number of creeps of a given role that are tied to the specific spawnerRoom
        . For energy creeps, an energyRoom match is also required (unless it is null, in which case all creeps will be included with just matching spawnerRoom) 
        */
        switch(role) {
            case "Miner":       // Per source
                return 3;
            case "Gatherer":    // "" ""
                return 2;
            case "Repairer":    // Per spawner room
                return 2;
            case "Builder":     // "" ""
                return 2;
            case "Upgrader":
                return 2;
            case "Extractor":
                return 2;
            case "Claimer":
                return 2;
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
                        totalValue += _.sum(creep.body, part => BODYPART_COST[part.type]);
                    }
                }
            }
        }
        // Check creeps being spawned
        const roomSpawners = Game.rooms[roomID].find(FIND_STRUCTURES, {filter:(structure) => {return (structure.structureType == STRUCTURE_SPAWN)}});
        for(spawner in roomSpawners) {
            if(spawner.spawning) {
                if(spawner.spawning.role == role) {
                    totalValue += _.sum(spawner.spawning.body, part => BODYPART_COST[part.type]);
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
                    segmentParts = [MOVE, MOVE, WORK, CARRY];
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
                case "Claimer":
                    baseParts = [MOVE, CLAIM];
                    segmentParts = [MOVE, CLAIM];
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

            // Do a check for maximum creep numbers
            const creepNumberMaximum = this.fetch_creepNumberMaximum(role);
            var creepNumberCurrent = this.fetch_creepNumber(role, roomID);
            if(additionalInfo != null) {
                if( (additionalInfo["energyRoomID"]!=null) && (additionalInfo["sourceID"]!=null) ) { // If is an energyRoom creep, calculate for energy rooms instead (checks correct sourceID AS WELL AS spawnerRoom => signifcantly reduced matches found here)
                    creepNumberCurrent = this.fetch_creepNumber(role, roomID, energyRoomID=energyRoomID, sourceID=sourceID);
                }   // If is a regular spawnerRoom creep, leave as previously found value
            }

            if(creepNumberCurrent >= creepNumberMaximum) {
                creepParts = null
            }

            // Do check at the end for atypical role conditions
            switch(role) {
                case "Miner":
                    if( (additionalInfo["minerNumber"]!=null) && (additionalInfo["freeSpace"]!=null) ) {
                        if(additionalInfo["minerNumber"]>=additionalInfo["freeSpace"]) {
                            creepParts = null;
                        }
                    }
                    break;
                case "Gatherer":
                    if( (additionalInfo["containerNumber"]!=null) && (additionalInfo["gathererNumber"]!=null) && (additionalInfo["minerNumber"]!=null) ) {
                        if( (additionalInfo["containerNumber"]<=0) || (additionalInfo["gathererNumber"]>=additionalInfo["minerNumber"]) ) {
                            creepParts = null;
                        }
                    }
                    break;
                case "Claimer":
                    // ###
                    // ### ADD THIS: If no claim targets, don't spawn a claimer --> look in territory tab
                    // ###
                    if(additionalInfo["claimerTargetNumber"]!=null) {
                        if(additionalInfo["claimerTargetNumber"]<=0) {
                            creepParts = null;
                        }
                    }
                    break;
            }
        }
        return creepParts
    },
    fetch_creepNumber : function(role, spawnerRoomID, energyRoomID=null, sourceID=null) {
        var totalNumber = 0
        for(creepName in Game.creeps) {
            var creep = Game.creeps[creepName]
            if(creep.role == role) {
                if(creep.memory.spawnKey!=null) {
                    if(creep.memory.spawnKey.roomID == spawnerRoomID) {     // SpawnerRoom match
                        if( (energyRoomID!=null) && (sourceID!=null) ) {        // If you want to check energy rooms instead, follow this branch
                            if(creep.memory.houseKey!=null) {
                                if( (creep.memory.houseKey.roomID == energyRoomID) && (creep.memory.houseKey.sourceID == sourceID) ) {
                                    totalNumber++
                                }
                            }   // If cannot find key, just ignore creep
                        } else {                                                // If you are just checking the spawnerRoom, match already found therefore increment
                            totalNumber++
                        }
                    }
                }   // If cannot find key, just ignore creep
            }
        }
        return totalNumber
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
            {role: "Repairer", satisfaction: 0.15},     // Get X% of required to get started
            {role: "Builder", satisfaction: 0.10}, 
            {role: "Upgrader", satisfaction: 0.15}, 
            {role: "Extractor", satisfaction: 0.15}, 
            {role: "Repairer", satisfaction: 0.9},      // Once established, increase to Y% of each (trying to reach close to 100% satisfaction)
            {role: "Builder", satisfaction: 0.9}, 
            {role: "Upgrader", satisfaction: 0.9}, 
            {role: "Extractor", satisfaction: 0.9},
            {role: "Claimer", satisfaction: 0.9}        // Only high priority spawn for claimer since it should only be attempted once very established
        ]
        for(conditionIndex in creepQueuePriority) {
            var condition = creepQueuePriority[conditionIndex]
            var creepParts = this.fetch_creepParts(
                roomID, 
                condition.role, 
                condition.satisfaction,
                additionalInfo = {
                    // ###
                    // ### REPLACE THIS WILL A PULLED VALUE FROM TERRITORY
                    // ###
                    "claimerTargetNumber": 0
                }
            );
            if(creepParts!=null) {
                var additionalInfo = {}
                switch(condition.role) {
                    case "Claimer":
                        additionalInfo = {
                            // ###
                            // ### PULL ROOM ID FROM TERRITORY HERE
                            // ###
                            "claimRoomID": null
                        }
                        break
                }

                this.queue_creepGeneric(
                    roomID, 
                    condition.role, 
                    creepParts,
                    additionalInfo=additionalInfo
                )
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
                                gathererNumber: Memory.energyRooms[energyRoomIndex].sources[sourceIndex].gatherers.length,
                                freeSpace: Memory.energyRooms[energyRoomIndex].sources[sourceIndex].free,
                            }
                        );
                        if(creepParts!=null) {
                            this.queue_creepGeneric(
                                roomID, 
                                condition.role, 
                                creepParts, 
                                additionalInfo = {
                                    "energyRoomID": Memory.energyRooms[energyRoomIndex].ID,
                                    "SourceID": Memory.energyRooms[energyRoomIndex].sources[sourceIndex].ID
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
    },
}

module.exports = respawnManager;