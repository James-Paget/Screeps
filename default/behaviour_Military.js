var military_tasks = {
    task : function(){
        //pass
    }
}
var tower_tasks = {
    task : function(tower){
        var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(target){
            tower.attack(target);
        }
    }
}

module.exports = {
    military_tasks,
    tower_tasks
};