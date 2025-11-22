/*
Miscellaneous functions to be called
*/

var miscManager = {
    /*
    ### SPLIT THIS INTO; 
        (1) REMOVE SPAWNER_ROOM, 
        (2) REMOVE ENERGY_ROOM (E ROOM X FROM SPAWNER ROOM Y), 
        (3) ADD SPAWNER ROMM / ENERGY ROOM
        + ADD A FULL RESTART FUNCTION (BASICALLY JUST DELETE ALL AND MAKE SURE IT REASSEMBLES STRUCTURE)
    ### TEST WORKS
    */
    restartMemory: function() {
        /*
        . Restarts the spawnerRooms and energyRooms functionality from memory
        . This is useful for restarting a colony from scratch
        */
        delete Memory.energyRooms;
        delete Memory.spawnerRooms;
        // Memory.spawnerRooms[...].towers = [];
        // + CHANGE E ROOM INIT NAME
        // + CHANGE SPAWNER ROOM INIT NAME

        //init_spawnerRooms("ID_NAME")
        //init_energyRoom(Game.spawns["Spawn1"].room, "E51N21");    //### MOVE THIS OUT ### ---> HAVE A PERIODIC CHECK FOR E_ROOMS, CONTAAINERS LOST, ETC --> e.g every 5/10/20 frames
    }
}

module.exports = miscManager;