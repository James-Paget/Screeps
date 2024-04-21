//Import modules
//...

var manager_autoStructures = {
    /*
    - Manipulates values stored in Memory.spawnerRooms[i].autoStructures
    - Each element in the .autoStructures list is stored as;

    {STRUCTURE_TYPE, [X,Y] Location, RCL, Priority}
    {type, pos, RCL, priority}

    - High priority is a larger number (can be decimal)
    - Equal priority items will just be executed in order of occurance (if RCL {Room Control Level} is matched)
    */
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
                    else{       //As soon as doesnt match, ignore remaining buildings
                        break;}
                }
            }
            //Else, nothing needs to be placed
        }
    },
    otherFuncName : function(){
        //pass
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

module.exports = {
    manager_autoStructures
}