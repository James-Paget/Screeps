# Screeps
Code to be run for a JavaScript programming game called Screeps <br />

TODO list; <br />
 0.) Militia setup to attack detected enemy creeps and hostile cores nearby
 1.) Make larger creeps more prioritised <br />
 1.5.)      Reduce memory usage; (a)Make creeps larger, (b)store paths in memory so not recalculated <br />
 2.) Expand all systems to properly work from multi spawner setup (most done, some are not) <br />
 3.) Create important structure replacer (coords given for each spawner room -> it then replaces then if they are destroyed) <br />
 4.) Make creeps try to refill rather than just spawn again -> add this on top of existing spawn mechanics (part of their behaviour loop to run back for refill)

 4.) Auto lay roads over useful spaces <br />
 5.) Power energy and commodities from dividing land <br />
 6.) Extend miner & mineral collectors to be the same thing, just doing work on a thing and delivering to a given place <br />
 7.) Make extractors wait for cooldown when mining <br />
 8.) Expand military types <br />
 9.) Do labs system <br />

Focus on making the energyRoom creeps less fragile -> perform an early error check on their memory to ensure creeps will faulted memory are quickly found and dealt with -> suicide (or just reclaim into spawn again) them or try re-add memory (if can be determined)

Multiple rooms
Auto-kill energy cores
Auto-claim nearby rooms of interest / [[energyRooms]]
Remove generate creep parts from EACH CREEP MANAGER

--> This will be an issue for multi-spawners in a single room
 ...return(structure.structureType == STRUCTURE_SPAWN)}})[0].id;

 Auto structures only place most important at once -> then progress to next tier of importance + have builders innately not over-consume energy (only take excess)

// ### ALSO NEED TO MAKE CREEPS GET HEALED WHEN LOW TOO -> Possibly less expensive ###
// ###
// ### ADDED SUICIDE + UNSHIFT LINE TO CYCLE ENERGY ASSIGNING CREEPS ON NULLS
// ### LOWERING VALUES ALL AROUND --> MIN(SINGLE VALUE, LOW PERCENT)
// ### NULL CHECK ON SOURCE ID CREEP QUEUE
// ###
// ### LOTS OF MINERS ARE BEING SPAWNED FOR NON-SPAWNER ENERGY ROOMS BUT NOT BEING ASSIGNED
// ### FOR ENERGY ROOM CREEPS, ROOMID == ROOM THEY WORK IN NOT SPAWNER ROOM --> NEED TO ADD SPAWNER ROOMID INTO QUEUE -> THATS WHY IT WAS PERFORMED MANUALLY BEFORE
// ###