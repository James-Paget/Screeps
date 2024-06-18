
var distributor_tasks = {
    task : function(creep){
        /*
        . Distributors move energy from storage to extensions/spawners, and to the trade terminal
        . Gatherers and sole miners should therefore be bringing their energy to main storage if available, and straight to spawners/extensions if not
        
        Not on duty => has no target location to deliver to

        (1) Look at energy situation (how much space left in main and terminal
        (2) Decide on where to deliver to
        (3) If not delivering to null, go collect energy (if not maxed out on what is being held)
        (4) Then travel to required location
        (5) After delivering, re-evaluate what to do
        */
        if(creep.memory.deliverTargetID){
            if(creep.store.getFreeCapacity() > 0){  //If you have spare space
                var storageSet = Memory.spawnerRooms[...].storage;  //################### <----- LOOK AT ITS HOUSEKEY ####################
                if(storageSet.length > 0){
                    var storageTarget = find_fullestStorage(storageSet, materialType);    //Find the MOST full storage and YOUR resource you need
                    if(storageTarget != null){      //If there is a storage container, but no required resource inside, then do nothing
                        if(creep.withdraw(storageTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(storageTarget);
                        }
                    }
                    else{
                        //Do nothing dont find the resource or container
                        //pass
                    }
                    
                }
                else{
                    //pass
                }
            }
            else{                                   //If no spare space, then go deliver it all
                //If on duty, travel to specified location to deliver all of inventory
                var target = Game.getObjectById(creep.memory.deliverTargetID);
                if(creep.transfer(target) == ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }
        }
        else{
            if(Game.time.toString().slice(-1) % 3 == 0){    //Periodically check for new 
                //If not on duty, then look for a place thats needs to be delivered to
                var mainRequiresRefill = ...;
                if(mainRequiresRefill){
                    creep.memory.deliverTargetID = ...;             //Look for close, non-full extensions/spawners
                }
                else{
                    var terminalRequiresRefill = ...;
                    if(terminalRequiresRefill){
                        creep.memory.deliverTargetID = ...;         //Just the one and only terminal, if even has been placed
                    }
                }
            }
        }
    },
    generateCreepParts : function(spawnerRoomID){
        /*
        Looks at the state of the spawner and determines what modules to build on this creep
        
        Only consider making distributor creeps if;
        (1) You have any storage bins
        (2) There are <X other distributors
        */
        var creepParts  = null;
        var storage_available      = Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].mineralStorage;        //Mineral storage holds minerals AND energy
        if(storage_available.length > 0){
            var creepsOwned  = _.filter(Game.creeps, function(creep) {return (creep.memory.spawnKey.roomID == spawnerRoomID && creep.memory.role == "Distributor")});   //Owned by this spawner, of this type
            var creepNumberRequired = 2 -creepsOwned.length;    //<-- Specify the number of creeps wanted here
            if(creepNumberRequired > 0){    //If actually need any more workers
                var workPerCreep = 3        //Roughly max number of sets of carry/move
                var energyMax = Game.rooms[spawnerRoomID].energyCapacityAvailable;
                var partSet = [CARRY,MOVE];             //Base line body parts required
                for(var i=0; i<workPerCreep; i++){      //Attempts to spawn the most expensive (but not overkill) miner it can afford
                    partSet.unshift(MOVE);
                    partSet.unshift(CARRY);
                    var energyCost = _.sum(partSet, part => BODYPART_COST[part]);
                    if(energyCost > energyMax){
                        partSet.shift();
                        partSet.shift();
                        break;}
                }
                creepParts = partSet;
            }
        }
        return creepParts;
    },
    queue : function(roomID, sourceID, parts){
        //Note; Have null for houseKey information as this is irrelevent to them
        var creepSpec = {roomID:roomID, sourceID:sourceID, parts:parts, role:"Distributor", time:Game.time};
        Memory.spawnerRooms[getSpawnerRoomIndex(roomID)].queue.push(creepSpec);
    },
    respawn : function(creepName, spawnerID, creepSpec){
        var spawner   = Game.getObjectById(spawnerID);
        var houseKey  = {roomID:creepSpec.roomID , sourceID:creepSpec.sourceID};
        var spawnKey  = {roomID:spawner.room.name, spawnID:spawnerID};
        spawner.spawnCreep(creepSpec.parts, creepName, {memory:{role:creepSpec.role, spawnKey:spawnKey, houseKey:houseKey, deliverTargetID:null}});
    },
    death : function(){
        /*
        . Death task to perform
        . Removes itself from relevent lists
        */
    }
}

function find_fullestStorage(storageSet, materialType){
    /*
    Looks through list of storage IDs in storageSet, and returns the ID storage container which 
    has (1) enough of your resource (or the most if not enough in either), and (2) has the least 
    amount of free space (in order to clear it as much as possible).

    Return null if no containers OR none of the required resource anywhere
    */
    //pass
}

module.exports = distributor_tasks;