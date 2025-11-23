var tower_tasks = {
    task : function(tower) {
        var isUnderAttack = tower.room.find(FIND_HOSTILE_CREEPS).length > 0;
        if(isUnderAttack){
            towerAttack_hostileCreeps(tower);}
        else{
            if(tower.store.getUsedCapacity(RESOURCE_ENERGY) >= 0.5*tower.store.getCapacity(RESOURCE_ENERGY)){  //Any repair when over half energy, in case of attack
                towerRepair_prioirity(tower);
            }
        }
    }
};

function towerAttack_hostileCreeps(tower){
    /*
    Attacks the closest enemy creep seen
    . Note;#### this is bad method of defense, the tower should target heals and such, this should be changed ####
    */
    var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(target){
        tower.attack(target);
    }
}
function towerRepair_prioirity(tower){
    /*
    Repairs everything in the room the tower is located
    - The priority is as defined below using the codes specified
    - The codes relate to a condition to check, which is then used to repair if any elements exist with the condition applied
    */
    var repairPriority = ["tower_min", "storage_min", "container_min", "rampart_min", "wall_min"]; //*Add more conditions here if required
    for(var condition in repairPriority){
        var target = fetch_priorityCondition(tower, repairPriority[condition]);
        if(target){
            tower.repair(target);   //Do condition
            break;                  //Then leave (only do most urgent condition)
        }
        //If no target, move onto next condition
    }
    //If never find any targets, just do nothing
}

//Priority Conditions
function fetch_priorityCondition(tower, condition){
    var target = null;
    if     (condition == "tower_min"){
        target = find_priorityCondition(tower, STRUCTURE_TOWER    , 1.0);}
    else if(condition == "storage_min"){
        target = find_priorityCondition(tower, STRUCTURE_STORAGE  , 1.0);}
    else if(condition == "container_min"){
        target = find_priorityCondition(tower, STRUCTURE_CONTAINER, 0.8);}
    else if(condition == "rampart_min"){
        target = find_priorityCondition(tower, STRUCTURE_RAMPART  , 0.009);}
    else if(condition == "wall_min"){
        target = find_priorityCondition(tower, STRUCTURE_WALL     , 0.00003);}
    else if(condition == "wall_mid"){
        target = find_priorityCondition(tower, STRUCTURE_WALL     , 0.001);}
    else if(condition == "rampart_mid"){
        target = find_priorityCondition(tower, STRUCTURE_RAMPART  , 0.3);}
    //...
    return target;
}
function find_priorityCondition(tower, structureType, healthPercent_threshold){
    /*
    - Returns the target with the least health in the set found
    - Health less than threshold => Repair required
    */
    var targets = tower.room.find(FIND_STRUCTURES, {filter : (structure) => {return ( (structure.structureType == structureType) && (structure.hits < structure.hitsMax*healthPercent_threshold) )}});
    var target  = null;
    if(targets.length > 0){     //Find lowest health target
        var delta_index = 0;
        for(var index in targets){
            if(targets[index].hitsMax < targets[delta_index].hitsMax){
                delta_index = index;
            }
        }
        target = targets[delta_index];
    }
    return target;
}

module.exports = tower_tasks;