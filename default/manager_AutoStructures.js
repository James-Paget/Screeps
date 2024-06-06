var {getSpawnerRoomIndex} = require("manager_Memory");

var manager_autoStructures = {
    /*
    - Manipulates values stored in Memory.spawnerRooms[i].autoStructures[i].structures
        -> E.g X rooms are under the control of a spawner room (e.g maintained by that spawner)
        -> Those rooms each have their own set of structures to be made (although, for non-spawner rooms this will likely be a boring set of containers and possibly walls)
    - Memory.spawnerRooms[i].autoStructures = [{roomID, structures}]
    - Each element in the .autoStructures list is stored as;

    {STRUCTURE_TYPE, [X,Y] Location, RCL, Priority}
    {type, pos, RCL, priority}

    - High priority is a larger number (can be decimal)
    - Equal priority items will just be executed in order of occurance (if RCL {Room Control Level} is matched)
    */
    init_autostructures : function(spawnerRoomID){
        /*
        Clears out and setups up a fresh directory for autostructures

        spawnerRoomID = spawnerRoom name (e.g W14S17)

        (1) Remove an old setup if there is one
        (2) Create a new setup with just the spawnerRoom as a room
        */
        //(1)
        if(Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].autostructures){
            delete Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].autostructures;
        }
        //(2)
        Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].autostructures = [{roomID:spawnerRoomID, structures:[]}]
    },
    populate_autostructures : function(spawnerRoomID, roomID){
        /*
        ###########################################################################################################
        ###########################################################################################################
        ## NEED TO MAKE THE AUTO RCL AND AUTO PRIO WORK --> CURRENTLY DIFFICULTY IN HOW THIS PROCESS SHOULD WORK ##
        ###########################################################################################################
        ###########################################################################################################
        
        Fills the autostructure list for a given room, associated to a given spawnerRoom (which will be its parent)

        (1) Check if an autostructure space exists in Memory to store the structures currently present 
            (2) If not create one then recall the function
        (3) Go through all structures present in the room and add them to the autostructures
        */
        var autostructureAreaExists = false;    //If space in the Memory is already set aside
        //(1)
        for(var i=0; i<Memory.spawnerRooms.length; i++){
            if(Memory.spawnerRooms[i].roomID == spawnerRoomID){
                for(var j=0; j<Memory.spawnerRooms[i].autostructures.length; j++){
                    if(Memory.spawnerRooms[i].autostructures[j].roomID == roomID){
                        autostructureAreaExists = true;
                        break;
                    }
                }
                break;  //If get to here, either found it or will never find it, => break to save some time
            }
        }
        if(autostructureAreaExists){
            //(3)
            var haveVision = check_roomVision(roomID);     //Have vision if within Game.rooms
            if(haveVision){
                var structures = Game.rooms[roomID].find(FIND_MY_STRUCTURES);
                Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].autostructures[getRoomAutostructureIndex(spawnerRoomID, roomID)].structures = [];   //Reset any existsing entries
                for(var i=0; i<structures.length; i++){
                    autostruct = {type:structures[i].structureType, pos:[structures[i].pos.x, structures[i].pos.y], RCL:getRCL_auto(structures, i), priority:getPriority_auto(structures, i)}
                    Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].autostructures[getRoomAutostructureIndex(spawnerRoomID, roomID)].structures.push(autostruct);
                }

            }
        }
        else{
            //(2)
            autostructureArea = {roomID:roomID, structures:[]};
            Memory.spawnerRooms[getSpawnerRoomIndex(spawnerRoomID)].autostructures.push(autostructureArea);
            this.populate_autostructures;   //Should now definately find the correct area --> **** CAREFUL OF GOING INFINITE THOUGH FROM PURE BUGS
        }
    },
    check_autoPlace : function(){
        /*
        - Goes through the list and places the next required 1 or more structures
        to be built
        - This can occur periodically, quite infrequently
        - Checking if buildings are placed could be quite CPU costly

        (0) For each spawnerRoom
        (1) Look through all buildings, see if already placed
        (2) Consider only the lowest level RCL buildings that HAVE NOT been placed (including blueprinted there)
        (3) Go through this subset and order from highest to lowest prio
        (4) Place all of highest priorities buildings (if multiple of same priority, place all of them)
        */
        //(0)
        for(var i=0; i<Memory.spawnerRooms.length; i++){
            //(1)
            var unplaced_buildings = [];    //Indices of unplaced buildings
            for(var j=0; j<Memory.spawnerRooms[i].autoStructures.length; j++){
                var buildingPlaced = check_buildingPlaced(Memory.spawnerRooms[i].roomID, Memory.spawnerRooms[i].autoStructures[j]);
                if(!buildingPlaced){
                    unplaced_buildings.push(j);
                }
            }
            if(unplaced_buildings.length > 0){  //If any buildings actually need to be placed
                //(2)
                var lowest_RCL = Memory.spawnerRooms[i].autoStructures[unplaced_buildings[0]].RCL;
                for(var j=0; j<unplaced_buildings.length; j++){
                    if(Memory.spawnerRooms[i].autoStructures[unplaced_buildings[j]].RCL < lowest_RCL){
                        lowest_RCL = Memory.spawnerRooms[i].autoStructures[unplaced_buildings[j]].RCL;
                    }
                }
                for(var j=unplaced_buildings.length-1; j>=0; j--){     //Do this 2nd sweep separate to 1st to ensure 0th element is also removed
                    if(Memory.spawnerRooms[i].autoStructures[unplaced_buildings[j]].RCL > lowest_RCL){
                        unplaced_buildings.splice(j,1);
                    }
                }
                //(3) -> Just a bubble sort for largest first (lists should be small so is fine)
                for(var j=0; j<unplaced_buildings.length; j++){
                    var swapMade = false;
                    for(var z=0; z<unplaced_buildings.length-1; z++){
                        if(Memory.spawnerRooms[i].autoStructures[unplaced_buildings[z+1]].priority > Memory.spawnerRooms[i].autoStructures[unplaced_buildings[z]].priority){
                            var buildingIndex = unplaced_buildings[z+1];    //
                            unplaced_buildings.splice(z+1,1);               //Perform swap
                            unplaced_buildings.splice(z,0,buildingIndex);   //
                            swapMade = true;
                        }
                    }
                    if(!swapMade){  //End early if already sorted
                        break;}
                }
                var target_RCL = Memory.spawnerRooms[i].autoStructures[unplaced_buildings[0]].RCL;
                for(var j=0; j<unplaced_buildings.length; j++){
                    if(Memory.spawnerRooms[i].autoStructures[unplaced_buildings[j]].RCL == target_RCL){
                        var details = Memory.spawnerRooms[i].autoStructures[unplaced_buildings[j]];
                        Game.rooms[Memory.spawnerRooms[i].roomID].createConstructionSite(details.pos.x, details.pos.y, details.type);
                    }
                    else{       //As soon as doesnt match, ignore remaining buildings --> Just a precaution as higher RCL already removed
                        break;}
                }
            }
            //Else, nothing needs to be placed
        }
    }
}
function check_buildingPlaced(roomID, autoStructure_details){
    /*
    - Checks and autoStructure formatted object to see if it has been placed/blueprinted
    - Just seeing if the place is empty, NOT whether the building there matches what you expect

    {STRUCTURE_TYPE, [X,Y] Location, RCL, Priority}
    autoStructure_details = {type, pos, RCL, priority}
    */
    var locationObjects = Game.rooms[roomID].lookAt(autoStructure_details.pos.x, autoStructure_details.pos.y);
    var isSpaceEmpty = true;
    locationObjects.forEach(element => {
        if(element.type == "structure" || element.type == "terrain"){
            isSpaceEmpty = false;
            //Can break at this point, now sure how to do this within .forEach()
        }
    });
    return isSpaceEmpty;
}
function getRCL_auto(){
    //## PROBLEM TO SOLVE ANOTHER TIME --> MANUALLY ADD FOR NOW ##
    //pass
    return 0;
}
function getPriority_auto(){
    //## PROBLEM TO SOLVE ANOTHER TIME --> MANUALLY ADD FOR NOW ##
    //pass
    return 0;
}
function check_roomVision(roomID){
    /*
    Returns true if you have vision of the specified room
    roomID = its name
    */
    var hasVision = false;
    for(var i=0; i<Game.rooms.length; i++){
        if(Game.rooms.name == roomID){
            hasVision = true;
            break;
        }
    }
    return hasVision;
}

module.exports = {
    manager_autoStructures
}