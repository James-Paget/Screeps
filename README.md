# Screeps
Code to be run for a JavaScript programming game called Screeps <br />

TODO list; <br />
 0.) Militia setup to attack detected enemy creeps and hostile cores nearby
 1.) Make larger creeps more prioritised <br />

 2.) Auto lay roads over useful spaces <br />
 3.) Power energy and commodities from dividing land <br />
 4.) Extend miner & mineral collectors to be the same thing, just doing work on a thing and delivering to a given place <br />
 5.) Make extractors wait for cooldown when mining <br />
 6.) Expand military types <br />
 7.) Do labs system <br />


Auto-kill energy cores

--> This will be an issue for multi-spawners in a single room
 ...return(structure.structureType == STRUCTURE_SPAWN)}})[0].id;

 Auto structures only place most important at once -> then progress to next tier of importance + have builders innately not over-consume energy (only take excess)

Make creeps try to heal themselves where possible to reduce operating costs
Setup militia spawns when being attacked (localy at least, then defend energy sites + claimer sites)
Remove the 'gen-creep-parts' within each class -> legacy now

If a claimerRoom gets RCL level 3 or more, make sure it is set as (1) a spawnerRoom, (2) Its own energyRoom and (3) Removed as a claimer room --> will be self sufficient by this point

Do labs -> Worker (1) to ferry materials from storage to labs and vice versa -> trigger reactions when ready separately maybe OR by them?
    Do scientist behaviour



e.g.
set_labSpecification(
    "W7S14",
    labTypes = [
        {ID: "65a3a9dbdb25a66404f518ea", storedType: "oxygen"},
        {ID: "65a417062dbeec16e9be18a1", storedType: "hydrogen"},
        {ID: "6586a0a206dc475f2963c9cc", storedType: "hydroxide"},
    ],
    groups = [
        {reactantA: "65a3a9dbdb25a66404f518ea", reactantB: "65a417062dbeec16e9be18a1", product: "6586a0a206dc475f2963c9cc"},
    ]
);