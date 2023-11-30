const dirToMovement = {
    up: [-1,0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1]
}

const keyToInd = {
    id: 0,
    loc: 1,
    dir: 2,
    holding: 3 // not used yet
}

//Keep track of the current subtask and the low level planning
//This should be inside the agent class tbh.
let curHighPlan = [];
let curLowPlan = [];

//this is used for manually specificed policy
function setHighPlan(playerID, gameState){
    if(!(playerID in gameState.agents)) return;

    curHighPlan = gameState.policy[agentLevel["2"]];
}

const theOtherAgent = {
    "1" : "2",
    "2" : "1"
}

// TODO: return the holding obj.
// Not blocking the way
function decideHighPlan(agent="2", level=0, gameState){
    if(level == 0){
        for(let i =0;i<gameState.subtasks.length;i++){
            gameState.subtasks[i].calTotalReward();
        }
        // solo only applies at level 0
        let bestAssignment = findBestAssignment(gameState.subtasks, robot_model, agent, solo[agent], predictLowLevel, theOtherAgent[agent]);
        return bestAssignment;
    }

    const theOtherDecision = decideHighPlan(theOtherAgent[agent], level-1, gameState);
    let bestAssignment = findBestAssignment(gameState.subtasks, robot_model, agent, false, predictLowLevel, theOtherAgent[agent], theOtherDecision);
    return bestAssignment
}



function nextAction(playerID, gameState){

    let goalAdjacent = true;
    let interact = true; //don't use it yet

    //Check if the high level plan would be the same, if not update.
    let tempHighPlan = nextLocationSubTasks(playerID, decideHighPlan(playerID, agentLevel[playerID], gameState));
    console.log("Next High Plan = " +tempHighPlan);

    // Special cases: when next high plan != nextLocationSubTasks due to various reasons
    // Maybe this should be inside nextLocationSubTasks??
    let holdObj = gameState.agents[playerID].hold_object; 

    //if done, wait or move out of the way
    if(tempHighPlan.length==0) {
        // if empty, decide if you are blocking the path or not.
        tempHighPlan = [findNonBlockLocation(theOtherAgent[playerID], playerID, gameState)];
        goalAdjacent = false;
        // if same loc (not in the path), just wait
        if(compareLoc(tempHighPlan[0], gameState.agents[playerID].location)) { 
            return control.wait; 
        }
    }
    //if holding & the high goal is not a valid destination that you can deliver, then set the high goal to return 
    else if(holdObj!==null && isLocation(tempHighPlan[0]) && (tempHighPlan[0][0].toLowerCase() !== holdObj.id[0])){
        tempHighPlan[0] = holdObj.id;    
    }

    if(curLowPlan.length == 0 || tempHighPlan[0] !== curHighPlan[0] || replanLowLevelAlways){
        curHighPlan = tempHighPlan;
        //TODO: a function to find a location of a given string by searching through lists of objects and locations instead
        let nextTarLoc = (typeof curHighPlan[0] === 'string') ? findLocation(curHighPlan[0], gameState.map) : curHighPlan[0];
        
        curLowPlan = bfsLowLevel(playerID, gameState, nextTarLoc, minAmbiguityFlag, false, goalAdjacent, interact);

        //if not found, simply wait: 
        if(curLowPlan===null) { 
            curLowPlan = [];
            return control.wait;
        }
    }
    
    let next_action = control.wait;
    if(curLowPlan[0]===control.interact){
        next_action = curLowPlan.shift();
    }else{
        //Check that you can actually move to the next location else just wait
        let tempNext = nextLocation(gameState.agents[playerID], curLowPlan[0]);
        if(gameState.map[tempNext[0]][tempNext[1]]==="." || gameState.map[tempNext[0]][tempNext[1]]===playerID){
            next_action = curLowPlan.shift();
        }
    } 
    return next_action;
}

//Predict what locations the agent is heading toward 
function predictObjsDir(agentID, gameState){
    var predicted_targets = [];
    var temp_agent = gameState.agents[agentID];
    //Two cases: holding or not holding 
    let target = (temp_agent.hold_object !== null) ? gameState.locs : gameState.objs;
    for( const id in target){
        
        if(gameState.map[target[id].location[0]][target[id].location[1]] === id && checkDirection(temp_agent, target[id])){
            predicted_targets.push(id);
        }
    }
    return predicted_targets;
}

// ref is the one to avoid, tar = to move
// return a location to move too
function findNonBlockLocation(refID, tarID, gameState){
    // 1) Find the human path based on prediction that is best assignment
    //   (This method assume that any paths return are equivalent in human eyes)
    //   The prediction can be quite accurate if we also assume one that max reward
    // 2) Then bfs out of the robot 
    
    // remove tarID from gameState 
    const tarLoc = gameState.agents[tarID].location;
    gameState.map[tarLoc[0]][tarLoc[1]] = ".";
    // Gen predictions 
    const predictLocs = predictObjsDir(refID, gameState);
    const locs = [];
    for(let i =0;i<predictLocs.length;i++){
        // Only consider the location that is in the best assignment
        // (Do I need to check that the assignment is actually the agent?)
        if( checkLocinAss(predictLocs[i], gameState.best_assignment.assignment) === refID){
            //return loc
            let tempPath = bfsLowLevel(refID, gameState, findLocation(predictLocs[i], gameState.map), minAmbiguityFlag, true);
            if(tempPath!==null) locs.push(...tempPath); // there should only be one and valid.
        }
    }
    gameState.map[tarLoc[0]][tarLoc[1]] = tarID;

    //incase of can't find prediction just wait
    if(locs.length===0) return tarLoc; 

    // BFS out
    let q = [tarLoc];
    let dir = [[0,1],[0,-1],[1,0],[-1,0]];
    let curLoc = null;
    while(q.length > 0){
        curLoc = q.shift();
        //check goal
        let isGoal = true;
        for(let i =0;i<locs.length;i++){
            if(compareLoc(locs[i],curLoc)) isGoal = false;
        }
        if(isGoal){
            console.log("Found stop loc: "+curLoc);
            return curLoc;
        } 
        //Expanding
        for(let i =0;i<dir.length;i++){
            let nextLoc = [curLoc[0] + dir[i][0],curLoc[1] + dir[i][1]];
            if(gameState.map[nextLoc[0]][nextLoc[1]]===".") q.push(nextLoc);
        }
    }

    return tarLoc; //not found return initial === wait
}


function manhattanDist(loc1, loc2){
    return Math.abs(loc1[0] - loc2[0]) + Math.abs(loc1[1] - loc2[1]);
}

//TODO: shortestPathDist(loc1, loc2, map) <- best to precompute all pair shortest paths for each map



// -------- Low Level Movement -------- //

function nextLocation(agent, action){
    let newLoc = [agent.location[0], agent.location[1]];
    if(agent.direction != action) return newLoc;
    newLoc[0] = newLoc[0] + dirToMovement[action][0];
    newLoc[1] = newLoc[1] + dirToMovement[action][1];
    return(newLoc);
}

function nextState(state, action, qInd, target_id, gameState){
    //Generate the next search state
    //Only care about the next location(s)
    //TODO: generalize to multiple agents
    
    //TODO: create a class
    const newState = {
        "location": [state.location[0],state.location[1]],
        "direction": state.direction,
        "hist": qInd
    };
    
    if(action === state.direction){
        //Move to the next location if possible 
        let new_loc = nextLocation(state, action);

        const new_loc_ele = gameState.map[new_loc[0]][new_loc[1]];
        if(new_loc_ele === "." || new_loc_ele === target_id){
            newState.location = new_loc;
        }
    }
    else if(action === control.wait){
        //do nothing
    }
    else if(action === control.interact){
        //place holder for now
    }else{
        //if action != current direction
        newState.direction = action;
    }
    
    return(newState);
}

//same location and direction = dupe
//this can be speed up.
function checkDupedSimpState(states, newState){
    for(let i =0;i< states.length;i++){
        if(states[i].location[0] === newState.location[0] && states[i].location[1] === newState.location[1] && 
            states[i].direction === newState.direction) return true;
    }
    return false;
}

function checkGoalAdjacent(state, tarLoc){
    //If adjacent and dir = point to the target, true
    const temp_dir = dirToMovement[state.direction];
    return (state.location[0] + temp_dir[0]) === tarLoc[0] && (state.location[1] + temp_dir[1]) === tarLoc[1];
}

function checkGoalSameLoc(state, tarLoc){
    return compareLoc(state.location, tarLoc);
}

const actions_list = [control.up, control.down, control.left, control.right, control.wait];

// return a seq of actions from hist 
function recoverActions(currentInd, states){
    const plan = [];
    while(currentInd != 0){
        let nextInd = states[currentInd].hist;
        let nextLoc = states[nextInd].location;
        let currLoc = states[currentInd].location;
        if(nextLoc[0] - currLoc[0] == 1 && nextLoc[1] - currLoc[1] == 0) { plan.unshift(control.up); }
        else if(nextLoc[0] - currLoc[0] == -1 && nextLoc[1] - currLoc[1] == 0) { plan.unshift(control.down); }
        else if(nextLoc[0] - currLoc[0] == 0 && nextLoc[1] - currLoc[1] == 1) { plan.unshift(control.left); }
        else if(nextLoc[0] - currLoc[0] == 0 && nextLoc[1] - currLoc[1] == -1) { plan.unshift(control.right); }
        else if(nextLoc[0] - currLoc[0] == 0 && nextLoc[1] - currLoc[1] ==0) {
            if(states[currentInd].direction == states[nextInd].direction) { plan.unshift(control.wait); }
            else { plan.unshift(states[currentInd].direction); }
        }
        currentInd = nextInd;
    }
    return plan;
}

function recoverLocations(currentInd, states){
    const loc = [];
    while(currentInd != 0){
        loc.unshift(states[currentInd].location);
        currentInd = states[currentInd].hist;
    }
    return loc;
}

// count objects and locations in the direction
// if the target is not in that direction, return max.
function countObjectInDirection(state, gameState, target){
    let found = false;
    let count = 0;
    //loop through objects
    for(const key in gameState.objs){
        //check direction from subtask.js
        if(checkDirection(state, gameState.objs[key])) {
            count++;
            if(gameState.objs[key].location[0] === target[0] && gameState.objs[key].location[1] === target[1]) found=true;
        }
    }
    //loop through location
    for(const key in gameState.locs){
        if(checkDirection(state, gameState.locs[key])){
            count++;
            if(gameState.locs[key].location[0] === target[0] && gameState.locs[key].location[1] === target[1]) found = true;
        }
    }
    return (found) ?  count : 99999;
}

// at most 4 possible 
// this work assuming all objects are reachable 
// TODO: check reachability of each object for a more robust implrementation 
function genSortedAmbiguityAction(states, gameState, target){
    const counts = [];
    const newStates = []
    for(let i =0;i < states.length;i++){
        counts.push(countObjectInDirection(states[i], gameState, target));
    }
    //sort
    while(counts.length>0){
        let minC = 999999; 
        let ind = -1;
        for(let i =0; i < counts.length;i++){
            if(counts[i] < minC) {
                minC = counts[i];
                ind = i;
            }
        }
        newStates.push(states[ind]);
        counts.splice(ind,1);
        states.splice(ind,1);
    }
    return newStates;
}


// BFS for a given agent while holding everything else in place
// return a sequence of actions 
// adjacentGoal is just a flag. For a more robust function, it should just be a function to use to check goal
function bfsLowLevel(agentID, gameState, tarLoc, minAmbiguity = false, returnLoc = false, adjacentGoal = true, interact=true){
    //console.log("BFS: Target = " + tarLoc); 

    let q = [];    
   
    //Manually construct the initial simplified player list
    const searchNode = {
        "location": gameState.agents[agentID].location,
        "direction": gameState.agents[agentID].direction,
        "hist": -1
    };
    q.push(searchNode); 
    
    const checkGoal = (adjacentGoal) ? checkGoalAdjacent : checkGoalSameLoc;

    let ind = 0;
    while(ind < q.length){
        let curSearchNode = q[ind];

        if(checkGoal(curSearchNode, tarLoc) ){
            console.log("found " + tarLoc);
            if(returnLoc) return(recoverLocations(ind,q));
            //else return seq of actions
            let plan = recoverActions(ind,q);
            if(interact) plan.push(control.interact);
            return(plan);
        }
        // use it for ambiguish min actions
        let tempNewStates = []
        for(const ac of actions_list){
            //Generate new state
            let newSearchNode = nextState(curSearchNode, ac, ind, agentID, gameState)
            //check repeat stage somehow
            if(!checkDupedSimpState(q, newSearchNode)){
                tempNewStates.push(newSearchNode);
            }
        }
        if(minAmbiguity) tempNewStates = genSortedAmbiguityAction(tempNewStates, gameState, tarLoc);
        q.push(...tempNewStates);
        ind += 1;
    }    

    console.log("Not Found " + tarLoc);
    return(null);
}

