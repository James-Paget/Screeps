//Import modules
//...

var manager_periodics = {
    compute_periodicAction : function(){
        /*
        - Considers a set of actions to be performed, and spaces out the computation of each
        - Distribution is determined through its "urgency" parameter (e.g low, mid, high)
        - Distribution can also be overwritten with a fixed time at which the event MUST occur

        This function is to be called every frame, but will decide when given actions occur, to spread CPU cost
        */
        //pass
    },
    otherFunc: function(){
        //pass
    }
    //...
}

module.exports = {
    manager_periodics
}