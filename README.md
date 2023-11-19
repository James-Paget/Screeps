# Screeps
Code to be run for a JavaScript programming game called Screeps

TODO list;
------> SPAWNED WITH MEMORY "Undefined" --> LOOKS LIKE A SIM BUG POSSIBLY

 0.) REASSEMBLY OST
 1.) Change all "spawnQueues" to work with multi-room spawnQueue now
 2.) Make sure all "Spawn1"s used are generalise for multi-rooms
 2.5.) [[Make other creep types SCALE with energy capacity properly]]
 3.) Have a periodic function, that checks for containers (& others) that have been destroyed, and removes them from lists
 3.5.) Periodic function that assigns containers to sources automatically (TO WORK WITH NEXT STEP)
 3.75.) Refine the miners and gatherers into LARGER creeps, also try to reduce wastage (especially with gatherers) a bit more --> Mainly just huge carriers for the energy
 4.) Create containers & extensions & roads & walls auto-placer (manager_Structure REMADE)
 5.) Generalise so useful commands like "findNearestEnergySource_inRoom()", ...
 6.) Clean-up some of the vars used, brinf functions out that are general, make required modules more split up (not bunched in main)
 6.5.) Reorganise files names and function names, some files are just a real mess to read/inconsistent
 7.) Reduce memory usage; (a)Make creeps larger, (b)store paths in memory so not recalculated
 8.) Make larger military, more organised, make sit still more so they dont waste CPU
 9.) Figure out some trading stuff with allies
 10.) Start harvesting minerals, commodities in highways, power banks in highways, ...

 --> MAKE QUEUE FUNCTION FOR MINERS ANF HARVESTERS TO HOMOGENISE SYSTEM
 --> CHANGE OTHER CREEP NAMES TO ..._tasks