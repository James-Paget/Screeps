# Screeps
Code to be run for a JavaScript programming game called Screeps

TODO list;
------> SPAWNED WITH MEMORY "Undefined" --> LOOKS LIKE A SIM BUG POSSIBLY

0.) REASSEMBLY OST
 0.1. ) Make scientist creep, do labs
 0.2. ) Make energyRoom miners repair their own roads and containers (both periodically)
 2.   ) [[Make other creep types SCALE with energy capacity properly]]
 3.   ) Have a periodic function, that checks for containers (& others) that have been destroyed, and removes them from lists
 4.   ) Periodic function that assigns containers to sources automatically (TO WORK WITH NEXT STEP)
 5.   ) Refine the miners and gatherers into LARGER creeps, also try to reduce wastage (especially with gatherers) a bit more --> Mainly just huge carriers for the energy
 6.   ) Create containers & extensions & roads & walls auto-placer (manager_Structure REMADE)
 7.   ) Generalise some useful commands like "findNearestEnergySource_inRoom()", ...
 8.   ) Reduce memory usage; (a)Make creeps larger, (b)store paths in memory so not recalculated
 9.   ) Make larger military, more organised, make sit still more so they dont waste CPU
 10.  ) Figure out some trading stuff with allies
~11.  ) Start harvesting minerals, commodities in highways, power banks in highways, ...
 12.  ) Make extractors wait for cooldown when mining 
 13.  ) Extend miner & mineral collectors to be the same thing, just doing work on a thing and delivering to a given place

 14.  ) Lay roads as you go, to mines
 15.  ) Make workers repair their stuff too --> containers, roads