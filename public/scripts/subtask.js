class SubTask{
    //TODO: dependency from from and to (or a more robust way)
    from;
    to;
    dependency;  //right now you can only have one dependency but can be extened to a list. Also, only dependency on 'to' and not 'from'
    agent;       //agent to do this subtask
    constructor(from, to=undefined, dependency=undefined, agent=undefined){
        this.from = from;
        this.to = to;
        this.dependency = dependency;
        this.agent = agent;
    }
}

class SubTaskAssignment {
    gameState;
    task;        // a list of colors or names of the task 
    locations;   // an object maintaining all locations 
    reward;      // rewards from the goal
    totalReward; // total reward including the -distance
    assignment;  // a list of ordered assignment of agents to each subsubtask
    
    //map if emptry (""), don't need to infer the structure
    constructor(gamestate, task, assignment = []){
        this.gameState = gamestate; //pass a gamestate object
        this.task = task;
        this.assignment = assignment; 
        this.locations = {};
        for(let i =0;i<assignment.length;i++){
            if(assignment[i].from!=undefined && !(assignment[i].from in this.locations)){
                
                this.locations[assignment[i].from] = findObjectbyID(assignment[i].from, gamestate).location; 
            }
            if(assignment[i].to!=undefined && !(assignment[i].to in this.locations)){
                this.locations[assignment[i].to] = findObjectbyID(assignment[i].to, gamestate).location;
            }
        }

        this.reward = task.reduce((partialSum, a) => partialSum + gamestate.reward[a],0); //reward is declared in game_declaration.js. future probably wants to call it from GameState.
        this.totalReward = this.reward; 
    }

    // calculate the total reward: reward - distance
    // Logic: 
    //  - maintain distance so far for each agent
    //  - maintain distance so far for each obstacle
    //  - if remove an obstacle (@), add manhattan distance to that agent
    //  - if deliver, max(required obstacle, the agent + distance from pickup to deliver)
    // Many things to check: 
    //  - each calculation needs to reflect the current stage of the game (i.e., some subtasks have been done.)
    //  - need to check that the agent can actually do the task (I want this to be outside since you can just zero out). 
    calTotalReward(){
        //pre-computed things
        let dist_agents = {}; 
        let dist_obj = {};
        let agent_loc = {};
        let done_temp = [];

        //initialize
        for(let i=0; i< this.assignment.length;i++){
            var agent_temp = this.assignment[i].agent;
            if(!(agent_temp in agent_loc)){
                dist_agents[agent_temp] = 0;
                agent_loc[agent_temp] = this.gameState.agents[agent_temp].location;
            }
        }
        for(let i=0; i < this.gameState.done;i++) {
            done_temp.push(this.gameState.done[i]);
        }
        
        for(let i=0;i< this.assignment.length;i++){
            var agent_temp = this.assignment[i].agent;
            var subtask = this.assignment[i]; 

            var dist = manhattanDist(agent_loc[agent_temp], this.locations[subtask.from]);
            //Checking done case
            if(subtask.from in done_temp){ 
                dist = 0; 
                done_temp.splice(done_temp.findIndex(subtask.from),1);
                //then the location of subtask.from has to be this agent location.
            }

            if(subtask.to != undefined ){ 
                if(subtask.to in done_temp){
                    done_temp.splice(done_temp.findIndex(subtask.to),1);
                }else{
                    //check if the agent is holding the object to be delivered (this is not robust to other types)
                    var temp_from_loc = this.locations[subtask.from]
                    if(this.gameState.agents[agent_temp].hold_object != null &&  this.gameState.agents[agent_temp].hold_object.id === subtask.from){
                        dist = 0;
                        temp_from_loc = agent_loc[agent_temp];    
                    }
                    dist += manhattanDist(temp_from_loc, this.locations[subtask.to]);
                }
            }

            dist = Math.max(dist, ((subtask.dependency===undefined) ? 0 : dist_obj[subtask.dependency]));
            dist_agents[agent_temp] += dist;
            //only record the destination right now.
            dist_obj[(subtask.to === undefined) ? subtask.from : subtask.to] = dist_agents[agent_temp];
            agent_loc[agent_temp] = this.locations[(subtask.to === undefined) ? subtask.from : subtask.to];
        }
        // totalDist = the max distance between the two agents 
        // costPerMove is already negative
        this.totalReward = this.reward + costPerMove*Math.max(...Object.values(dist_agents));
        return Math.max(...Object.values(dist_agents));
    }

}

function prettyPrintAllAssignments(subtasks){
    let outputs = [];
    for(let i =0;i < subtasks.length;i++){
        let tempStr = "";
        let tempAss = subtasks[i].assignment;
        for(let j =0;j < tempAss.length;j++){
            tempStr += "F: " + tempAss[j].from + " T: " + (tempAss[j].to === "undefined" ? tempAss[j].to : "-") + ", A: " + tempAss[j].agent + "| ";
        }
        outputs.push({"Assignment": tempStr, "TotalReward": subtasks[i].totalReward});
    }
    //sort output
    function compareTotalReward(a,b){
        return a.TotalReward - b.TotalReward;
    }
    outputs.sort(compareTotalReward);
    return outputs;
}

// Generate all assignments for all subtasks
function genAllAssignments(subtasks, agents){
    let outputs = [];
    for(let i = 0;i < subtasks.length; i++){
        var temp = genAssignment(subtasks[i].assignment, agents);
        for(let j = 0;j < temp.length; j++){
            var newsubtask = new SubTaskAssignment(subtasks[i].gameState, subtasks[i].task, temp[j]);
            outputs.push(newsubtask);
        }
    }
    return(outputs);
}

// A function to generate all possible permutation of the assignment
// tasks = a list of sub/tasks
// agents = a list of agents
function genAssignment(tasks, agents){
    let outputs = [];
    let mem = {"output":[]};
    helperAssignment(tasks.length, [], agents, mem);
    for(let i = 0;i<mem["output"].length;i++){
        var temp = [];
        for(let j = 0; j<tasks.length;j++){
            var temp_subtask = new SubTask(tasks[j].from, tasks[j].to, tasks[j].dependency, mem["output"][i][j]);
            temp.push(temp_subtask);
        }
        outputs.push(temp);
    }
    return(outputs);
}

// Helper function to gen all permutations
function helperAssignment(depth, assignment, agents, mem){
    if(depth == 0){
        mem["output"].push(assignment);
        return;
    }
    for(let i = 0;i< agents.length;i++){
        helperAssignment(depth-1, assignment.concat(agents[i]), agents, mem);
    }
}


function compareLoc(loc1, loc2){
    if(loc1 === null || loc2 === null) return false;
    return(loc1[0]===loc2[0] && loc1[1] === loc2[1])
}

function checkLocinAss(loc, ass){
    for(let i =0;i<ass.length;i++){
        if(ass[i].to === loc || ass[i].from === loc){
            return ass[i].agent;
        }
    }
    return false;
}

// ---------------------------------------------------------------------------------------------------- //

// decision = subtask
function checkDecision(assignment, decision){
    if(decision===null) return true;
    return (assignment.from === decision.from && assignment.to === decision.to && assignment.dependency === decision.dependency && assignment.agent===decision.agent);
}

// Model is {"1": {"str":[lower, upper],"dex":[lower,upper]}, ...}
// Check for both agents
function checkModel(assignment, model){
    if(model === null) return true;
    for(let i =0; i<assignment.length;i++){
        //only need to check from since to is always location to drop.
        var subtask = assignment[i].from; 
        var temp_requiement = subtask.split(":");
        var agent = assignment[i].agent;
        //If > upper then not good
        if(model[agent]["str"][1] < temp_requiement[1] || model[agent]["dex"][1] < temp_requiement[2]) return false;
    }
    return true;
}

function checkSolo(assignment, tarAgent){
    if(assignment.length==1 && assignment[i].agent != tarAgent) return false; 

    for(let i =0;i < assignment.length-1;i++){
        if(assignment[i].agent !== assignment[i+1].agent || assignment[i].agent != tarAgent) return false;
    }
    return true;
}


function checkDirection(agent, target){
    if(target.location[0] - agent.location[0] < 0 && agent.direction === directions.up) return true;
    if(target.location[0] - agent.location[0] > 0 && agent.direction === directions.down) return true;
    if(target.location[1] - agent.location[1] > 0 && agent.direction === directions.right) return true;
    if(target.location[1] - agent.location[1] < 0 && agent.direction === directions.left) return true;
    return false;
}

// predict the most likely subtask for the agent based on the direction
function prediction(agentID, assignments){
    var predicted_assigmnets = [];
    var predicted_targets = [];
    var gameState = assignments[0].gameState;
    var temp_agent = gameState.agents[agentID];
    //Two cases: holding or not holding 
    let target = (temp_agent.hold_object !== null) ? gameState.locs : gameState.objs;
    for( const id in target){
        if(checkDirection(temp_agent, target[id])){
            predicted_targets.push(id);
        }
    }

    //Check for edge case: returning the holding object -> if (hold_object), all locs + the gameState.objs[temp_agent.hold_object] 
    if(temp_agent.hold_object !== null){
        let objInDir = false;
        for( const id in gameState.objs){
            if(id === temp_agent.hold_object && checkDecision(temp_agent, gameState.objs[id])) {
                objInDir=true;
            }
        }
        //in the direction of returning -> everything is possible except the returning option
        if(objInDir){
            for(let i=0;i< assignments.length;i++){
                let temp_ass = assignments[i].assignment;
                let temp_flag = true;
                for(let j=0;j < temp_ass.length;j++){
                    if(temp_ass[j].agent === agentID && temp_ass[j].to === temp_agent.hold_object) {
                        temp_flag = false;
                        break;
                    }
                }
                if(temp_flag) predicted_assigmnets.push(assignments[i]);
            }
            return predicted_assigmnets;
        }
    }

    //check for assignment
    // if the assignment includes the agent, then check if the assignment has already been done or the agent is actually heading toward it (in predicated target)
    // if the assignment doesn't include the agent at all then yes
    for(let i =0;i < assignments.length;i++){
        let temp_ass = assignments[i].assignment;
        let temp_flag = true;
        for(let j=0;j< temp_ass.length;j++){
            if(temp_ass[j].agent===agentID){
                var to_compare = (temp_agent.hold_object === null) ? temp_ass[j].from : temp_ass[j].to;
                if(!predicted_targets.includes(to_compare) && !gameState.done.includes(to_compare))  temp_flag = false;
            }
        }
        if(temp_flag) predicted_assigmnets.push(assignments[i]);
        
    }
    return predicted_assigmnets;
}


// Find the best conditions on filtering/Constraint 
// 4 possible constraints/filtering:
//  - Decision   = decision that from the recursive level prediciton. 
//               = a hard constraint -> must include.
//  - prediction = a prediction from low level action 
//               = a soft constraint -> satisfy one of them 
//  - model      = exclude if the agent can't do the given assignment based on the provided model. 
//               = model = {"Agent":["str","dex"]}
//  - solo       = exclude if both assignments are not the same agent.
function findBestAssignment(subTaskAssignments, model=null, tarAgent =null, solo=false, predict = false, predicted_agent=null, decision=null){
    var max_reward = -999999;
    var best_assignment = undefined;
    subTaskAssignments[0].gameState.prediction = prediction(predicted_agent, subTaskAssignments);
    let assignments = (predict) ? subTaskAssignments[0].gameState.prediction : subTaskAssignments;
    
    for(let i = 0;i < assignments.length;i++){
        var temp_ass = assignments[i].assignment;

        //Check the 4 constraints
        if(checkModel(temp_ass, model) && (!solo || checkSolo(temp_ass, tarAgent)) && checkDecision(temp_ass, decision)){
            if(assignments[i].totalReward > max_reward){
                max_reward = assignments[i].totalReward;
                best_assignment = assignments[i];
            }
        }
    }
    subTaskAssignments[0].gameState.best_assignment = best_assignment;
    return best_assignment;
}

//TODO: return whether or not you need to interact with the location or not
function nextLocationSubTasks(agent, subTaskAssignment){
    //find the next not done assignment for this agent 
    let nextLoc = [];
    const assignment = subTaskAssignment.assignment;
    const gameState = subTaskAssignment.gameState;
    //create a copy of done to be used later
    let done_temp = [];
    for(let i=0; i < gameState.done;i++) {
        done_temp.push(gameState.done[i]);
    }

    for(let i =0; i < assignment.length;i++){
        if(assignment[i].agent === agent){
            //obstacle case and not done
            if(assignment[i].from[0]==="@" && !gameState.done.includes(assignment[i].from) ){
                return [assignment[i].from];
            }
            else if(assignment[i].from[0]!=="@" && !gameState.done.includes(assignment[i].to)){
                //deliver type: two cases 
                if(gameState.agents[agent].hold_object == null){
                    return [assignment[i].from];
                }else{
                    if(assignment[i].dependency!==undefined){
                        // if the dependency still exists, then go there and wait there
                        // problem: this can block the way so that the other agent can't get in and remove dependency
                        let dependencyLoc = gameState.objs[assignment[i].dependency].location;
                        if(gameState.map[dependencyLoc[0]][dependencyLoc[1]]===assignment[i].dependency){
                            return [assignment[i].dependency];
                        }               
                    }
                    return [assignment[i].to];
                }
            }
            //remove from temp_done incase of multiple copies of the same subtasks 
        }
    }

    return nextLoc;
}
