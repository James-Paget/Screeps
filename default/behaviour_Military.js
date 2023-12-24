var military_tasks = {
    task : function(){
        //pass
    }
}
/*
Maybe split into multiple var sections;
- Army Guard
- Post Guard
- Army Attack
- Post Attack
- Militia Attack

--> So different behaviours can be switched between and triggered at an instant

WHAT I WANT;
- NEED a function to let me call an [arbitrary attack] of [arbitrary size] to 
an [arbitrary map], with [arbitrary targets] maybe
- Their brains should work the same, but just follow their given priorities
- Call a function from miltary tasks to queue up a set number of creeps 
from a given spawner, that will head towards a given map , an attack enemies 
in that area
    --> This attacking should occur in a given priority, parsed into the creeps memory, 
    so they can each remember their own orders (e.g attack creeps, then core, then ... 
    OR heal this unit, then this unit, then ...)
- Each function should queue up a different set of fighters to do different roles
- Each should be very reactive
- There should be functions to auto-spawn militia if invader cores OR enemies are detected 
at the spawnerRoom or linked energyRooms
*/
module.exports = military_tasks;