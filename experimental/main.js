module.exports.loop = function () {
    var creeps  = Game.creeps;
    
    //Clean dead dudes
    for(var memoryName in Memory.creeps){
        if(!Game.creeps[memoryName]){
            delete Memory.creeps[memoryName];
        }
    }
    
    //...
}