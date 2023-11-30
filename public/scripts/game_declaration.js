// ----------------------- Map Declaration ---------------------- //
// "a":"lightblue", "b":"lightpink", "c":"lightgreen", "d":"purple" 
const reward = {"a": 5, "b":10, "c":15, "d":20}
const costPerMove = -0.1; 

const agent_ability ={
    "1":{"str":5,"dex":9},
    "2":{"str":8,"dex":4}
}

//Declare information to be used throughout the experiment for the robot. //
const agentLevel = {
    "1" : 0,
    "2" : 0
}
const solo = {
    "1" : false,
    "2" : false
};
let predictLowLevel = false;

let minAmbiguityFlag = true;

// this is the level 1 model
let robot_model = {
    "1" : {"str":[agent_ability["1"]["str"],agent_ability["1"]["str"]],
            "dex":[agent_ability["1"]["dex"], agent_ability["1"]["dex"]]}, //initial value
    "2" : {"str":[agent_ability["2"]["str"],agent_ability["2"]["str"]],
            "dex":[agent_ability["2"]["dex"],agent_ability["2"]["dex"]]}
}

// this is the level 2 model (not used currently)
let robot_human_model = {
    "1" : {"str":[1,10],"dex":[1,10]}, //initial value
    "2" : {"str":[1,10],"dex":[1,10]}, //initial value
}

const timeBetweenTurn = 10; //ms
const replanLowLevelAlways = true;


// ------------------------------------------------------------ //

function isObject(str){
    let firstStr = str[0]; //assuming only one char here 
    return(firstStr in reward && firstStr.toLowerCase() === firstStr)
}

function isLocation(str){
    let firstStr = str[0]; //assuming only one char here
    return(firstStr.toLowerCase() in reward && firstStr.toUpperCase() === firstStr)
}

// A game stage includes a map, obj list, player, location, goal condition, collected
class GameStage {

    map;       // The layout of the game.
    objs;      // A list of objects 
    agents;    // A lit of agents
    locs;       
    goal;      //How many objects to collect
    collected; //how many objects collected so far.
    policy;    // manually specified robot policies
    done;      //keep track of what agents (both human and robot have done)
    reward;

    //can be extended later if you want agent to be different between map
    constructor(map, goal = 1, policy = null){
        this.map = map;
        this.agents = {};
        this.objs = {};
        this.locs  = {};
        this.goal = goal;
        this.collected = [];
        this.policy = policy;
        this.done = [];
        this.reward = reward;
        
        //generate obj, agent, loc from the map.
        //Rules:
        // obstacle = @, deliver objects = lower alphabet, location = upper alphabet
        for(let i =0;i< map.length;i++){
            for(let j=0;j< map[i].length;j++){
                //obstacle case
                if(map[i][j][0]==="@" || isObject(map[i][j])){
                    var temp = map[i][j].split(":"); //format type:str:dex:extra_id
                    this.objs[map[i][j]] = new GameObject(map[i][j], temp[0], Number(temp[1]), Number(temp[2]), [i,j]);
                }else if(isLocation(map[i][j])){
                    //location
                    this.locs[map[i][j]] = new Location(map[i][j], map[i][j][0].toLowerCase(), [i,j]);
                }else if(map[i][j][0] in playerType){
                    //agents
                    this.agents[map[i][j]] = new Player(map[i][j], playerType[map[i][j]], playerColor[map[i][j]],
                                                        agent_ability[map[i][j]]["str"], agent_ability[map[i][j]]["dex"], [i,j], 
                                                        agentLevel[map[i][j]]);
                    
                }
            }
        }
    }
}

/// Tutorial (Alone) //


let map_tutorial1 = [[" "," "," ","#","#","#"  ,"#","#"," "," "," "],
                     [" "," "," ","#",".","a:1:1",".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#",".","1"  ,".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#",".","."  ,".","#"," "," "," "],
                     [" "," "," ","#","#","A1" ,"#","#"," "," "," "]];
const pi_tutorial1 = {
    0:[],
    0.5:[],
    1:[],
    F:[]
}
let stage_tutorial1 = new GameStage(map_tutorial1, goal= 1, policy = pi_tutorial1);
let tutorial1_subtask1 = new SubTaskAssignment(stage_tutorial1, ["a"], [new SubTask("a:1:1","A1")]);
let tutorial1_subtasks = genAllAssignments([tutorial1_subtask1], ["1"]);


let map_tutorial2 = [["#","#","#","#","#","#","#","#","#","#","#"],
                     ["#",".",".","a:2:2",".",".",".","b:8:3",".",".","#"],
                     ["#",".",".",".",".",".",".",".",".",".","#"],
                     ["#",".",".",".",".",".",".",".",".",".","#"],
                     ["#",".",".",".",".",".",".",".",".",".","#"],
                     ["#",".",".",".",".","1",".",".",".",".","#"],
                     ["#",".",".",".",".",".",".",".",".",".","#"],
                     ["#",".",".",".",".",".",".",".",".",".","#"],
                     ["#",".",".",".",".",".",".",".",".",".","#"],
                     ["#",".",".","@:1:1",".",".",".","@:2:2",".",".","#"],
                     ["#","#","#","A1","#","#","#","B1","#","#","#"]];

let stage_tutorial2 = new GameStage(map_tutorial2, goal= 1, policy = pi_tutorial1);
let tutorial2_subtask1 = new SubTaskAssignment(stage_tutorial2, ["a"], 
                                               [new SubTask("@:1:1"), new SubTask("a:2:2","A1","@:1:1")]);
let tutorial2_subtask2 = new SubTaskAssignment(stage_tutorial2, ["b"], 
                                                [new SubTask("@:2:2"), new SubTask("b:8:3","B1","@:2:2")]);
let tutorial2_subtasks = genAllAssignments([tutorial2_subtask1, tutorial2_subtask2], ["1"]);

// -------- Training Maps -------- //

let map_training1 =     [["#","#","#","#"  ,"#","#","#","#"  ,"#","#","#"],
                         ["#",".",".","a:1:1",".","#",".","b:2:2",".",".","#"],
                         ["#",".",".","."  ,".","#",".","."  ,".",".","#"],
                         ["#",".",".","."  ,".","#",".","."  ,".",".","#"],
                         ["#",".",".","."  ,".","#",".","."  ,".",".","#"],
                         ["#",".",".","1"  ,".","#",".","2"  ,".",".","#"],
                         ["#",".",".","."  ,".","#",".","."  ,".",".","#"],
                         ["#",".",".","."  ,".","#",".","."  ,".",".","#"],
                         ["#",".",".","."  ,".","#",".","."  ,".",".","#"],
                         ["#",".",".","@:1:1",".","#",".","@:2:2",".",".","#"],
                         ["#","#","#","A1" ,"#","#","#","B1" ,"#","#","#"]];
const pi_training1 = {
    "0":["@:2:2","b:2:2","B1"],
    "0.5":["@:2:2","b:2:2","B1"],
    "1":["@:2:2","b:2:2","B1"],
    "F":["@:2:2","b:2:2","B1"]
}
let stage_training1 = new GameStage(map_training1, goal= 2, policy = pi_training1);
let training1_subtask1 = new SubTaskAssignment(stage_training1, ["b"], 
                                               [new SubTask("@:2:2"),new SubTask("b:2:2","B1","@:2:2")]); 
let training1_subtasks = genAllAssignments([training1_subtask1], ["2"]);
stage_training1.subtasks = training1_subtasks;

let map_training2 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#","b:6:9",".",".","a:5:9","#","a:8:4",".",".","b:8:5","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".","1",".",".","#",".",".","2",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#","@:4:5",".",".","@:6:5","#","@:5:5",".",".","@:5:4","#"],
                         ["#","A1","#","#","B1","#","B2","#","#","A2","#"]];
const pi_training2 = {
    "0":["@:5:4","a:8:4","A2"],
    "0.5":["@:5:4","a:8:4","A2"],
    "1":["@:5:4","a:8:4","A2"],
    "F":["@:5:4","a:8:4","A2"]
}
let stage_training2 = new GameStage(map_training2, goal= 2, policy = pi_training2);
let training2_subtask1 = new SubTaskAssignment(stage_training2, ["a"], 
                                               [new SubTask("@:5:4"),new SubTask("a:8:4","A2","@:5:4")]);
let training2_subtask2 = new SubTaskAssignment(stage_training2, ["b"], 
                                               [new SubTask("@:5:5"),new SubTask("b:8:5","B1","@:5:5")]);
let training2_subtasks = genAllAssignments([training2_subtask1, training2_subtask2], ["2"]);
stage_training2.subtasks = training2_subtasks;

let map_training3 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","b:1:1",".",".",".",".",".","a:3:3",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:1:1",".",".",".",".",".","@:1:2",".","#"],
                         ["#","#","B1","#","#","#","#","#","A1","#","#"]];
const pi_training3 = {
    "0":["@:1:1","b:1:1","B1"],
    "0.5":["b:1:1","B1"],
    "1":["b:1:1","B1"],
    "F":["@:1:1","b:1:1","B1"]
}
let stage_training3 = new GameStage(map_training3, goal= 1, policy = pi_training3);
let training3_subtask1 = new SubTaskAssignment(stage_training3, ["a"], 
                                               [new SubTask("@:1:2"),new SubTask("a:3:3","A1","@:1:2")]);
let training3_subtask2 = new SubTaskAssignment(stage_training3, ["b"], 
                                               [new SubTask("@:1:1"),new SubTask("b:1:1","B1","@:1:1")]);
let training3_subtasks = genAllAssignments([training3_subtask1, training3_subtask2], ["1","2"]);
stage_training3.subtasks = training3_subtasks;

let map_training4 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","b:3:3",".",".",".",".",".","c:3:2",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:2:2",".",".",".",".",".","@:3:8",".","#"],
                         ["#","#","B1","#","#","#","#","#","C1","#","#"]];
const pi_training4 = {
    "0":["@:2:2","b:3:3","B1"],
    "0.5":["b:3:3","B1"],
    "1":["c:3:2","A1"],
    "F":["c:3:2","A1"]
}
let stage_training4 = new GameStage(map_training4, goal= 1, policy = pi_training4);
let training4_subtask1 = new SubTaskAssignment(stage_training4, ["b"], 
                                              [new SubTask("@:2:2"),new SubTask("b:3:3","B1","@:2:2")]);
let training4_subtask2 = new SubTaskAssignment(stage_training4, ["c"], 
                                              [new SubTask("@:3:8"),new SubTask("c:3:2","C1","@:3:8")]);
let training4_subtasks = genAllAssignments([training4_subtask1, training4_subtask2],["1","2"]);
stage_training4.subtasks = training4_subtasks;

let map_training5 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","b:3:2",".",".","c:4:4",".",".","d:4:7",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:2:2",".",".","@:4:6",".",".","@:8:3",".","#"],
                         ["#","#","B1","#","#","C1","#","#","D1","#","#"]];
const pi_training5 = {
    "0":["@:2:2","b:3:2","B1"],
    "0.5":["b:3:2","B1"],
    "1":["c:4:4","C1"],
    "F":["d:4:7","D1"]
}
let stage_training5 = new GameStage(map_training5, goal= 1, policy = pi_training5);
let training5_subtask1 = new SubTaskAssignment(stage_training5, ["b"],
                                              [new SubTask("@:2:2"), new SubTask("b:3:2","B1","@:2:2")]);
let training5_subtask2 = new SubTaskAssignment(stage_training5, ["c"],
                                              [new SubTask("@:4:6"), new SubTask("c:4:4","C1","@:4:6")]);
let training5_subtask3 = new SubTaskAssignment(stage_training5, ["d"], 
                                              [new SubTask("@:8:3"), new SubTask("d:4:7","D1","@:8:3")]);
let training5_subtasks = genAllAssignments([training5_subtask1, training5_subtask2, training5_subtask3],["1","2"]);
stage_training5.subtasks = training5_subtasks;

let map_training6 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","a:2:2",".","b:4:6",".","c:4:3",".","d:5:7",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:1:1",".","@:1:2",".","@:8:3",".","@:7:2",".","#"],
                         ["#","#","A1","#","B1","#","C1","#","D1","#","#"]];
const pi_training6 = {
    "0":["@:8:3","c:4:3","C1"],
    "0.5":["c:4:3","C1"],
    "1":["@:1:2","@:1:1"],
    "F":["@:7:2","@:8:3","c:4:3","C1"]
}
let stage_training6 = new GameStage(map_training6, goal= 1, policy = pi_training6);
let training6_subtask1 = new SubTaskAssignment(stage_training6, ["a"], 
                                                [new SubTask("@:1:1"), new SubTask("a:2:2","A1","@:1:1")]);
let training6_subtask2 = new SubTaskAssignment(stage_training6, ["b"], 
                                                [new SubTask("@:1:2"), new SubTask("b:4:6","B1","@:1:2")]);
let training6_subtask3 = new SubTaskAssignment(stage_training6, ["c"],
                                                [new SubTask("@:8:3"), new SubTask("c:4:3","C1","@:8:3")]);
let training6_subtask4 = new SubTaskAssignment(stage_training6, ["d"], 
                                                [new SubTask("@:7:2"), new SubTask("d:5:7","D1","@:7:2")]);
let training6_subtasks = genAllAssignments([training6_subtask1, training6_subtask2, 
                                            training6_subtask3, training6_subtask4],["1","2"]);
stage_training6.subtasks = training6_subtasks;

let map_training7 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","a:1:1",".","b:3:3",".","c:4:7",".","d:3:6",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:2:2",".","@:3:3",".","@:3:4",".","@:8:4",".","#"],
                         ["#","#","A1","#","B1","#","C1","#","D1","#","#"]];
const pi_training7 = {
    "0":["@:3:3","b:3:3","B1","@:2:2","a:1:1","A1"],
    "0.5":["@:3:3","b:3:3","B1","@:2:2","a:1:1","A1"],
    "1":["@:3:4","@:3:3","b:3:3","B1"],
    "F":["@:8:4","@:3:4"]
}
let stage_training7 = new GameStage(map_training7, goal= 1, policy = pi_training7);
let training7_subtask1 = new SubTaskAssignment(stage_training7, ["a"], 
                                            [new SubTask("@:2:2"), new SubTask("a:1:1","A1","@:2:2")]);
let training7_subtask2 = new SubTaskAssignment(stage_training7, ["b"], 
                                            [new SubTask("@:3:3"), new SubTask("b:3:3","B1","@:3:3")]);
let training7_subtask3 = new SubTaskAssignment(stage_training7, ["c"], 
                                            [new SubTask("@:3:4"),new SubTask("c:4:7","C1","@:3:4")]);
let training7_subtask4 = new SubTaskAssignment(stage_training7, ["d"], 
                                            [new SubTask("@:8:4"),new SubTask("d:3:6","D1","@:8:4")]);
let training7_subtasks = genAllAssignments([training7_subtask1, training7_subtask2, 
                                            training7_subtask3, training7_subtask4],["1","2"]);
stage_training7.subtasks = training7_subtasks;

/// Testing Stages ///

let map_testing1 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#","a:4:9",".",".","a:4:10","#","b:6:5",".",".","b:6:4","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".","1",".",".","#",".",".","2",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#",".",".",".",".","#",".",".",".",".","#"],
                         ["#","@:6:7",".",".","@:5:7","#","@:8:3",".",".","@:9:3","#"],
                         ["#","A1","#","#","A1","#","B1","#","#","B2","#"]];
const pi_testing1 = {
    "0":["@:8:3","b:6:4","B1"],
    "0.5":["@:8:3","b:6:4","B1"],
    "1":["@:8:3","b:6:4","B1"],
    "F":["@:8:3","b:6:4","B1"]
}
let stage_testing1 = new GameStage(map_testing1, goal= 2, policy = pi_testing1);
let testing1_subtask1 = new SubTaskAssignment(stage_testing1, ["b"],
                                            [new SubTask("@:8:3"),new SubTask("b:6:5","B1","@:8:3")]);
let testing1_subtask2 = new SubTaskAssignment(stage_testing1, ["b"],
                                            [new SubTask("@:9:3"),new SubTask("b:6:4","B2","@:9:3")]);
let testing1_subtasks = genAllAssignments([testing1_subtask1, testing1_subtask2],["2"]);
stage_testing1.subtasks = testing1_subtasks;


let map_testing2 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".",".","b:3:3:1",".",".",".","b:3:3:2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","@:1:1:1",".",".",".","@:1:1:2",".",".","#"],
                         ["#","#","#","B1","#","#","#","B2","#","#","#"]];
const pi_testing2 = {
    "0":["@:1:1:2","b:3:3:2","B2"],
    "0.5":["b:3:3:1","B1"],
    "1":["b:3:3:1","B1"],
    "F":["@:1:1:1"]
}
let stage_testing2 = new GameStage(map_testing2, goal= 1, policy = pi_testing2);
let testing2_subtask1 = new SubTaskAssignment(stage_testing2, ["b"],
                                            [new SubTask("@:1:1:1"),new SubTask("b:3:3:1","B1","@:1:1:1")]);
let testing2_subtask2 = new SubTaskAssignment(stage_testing2, ["b"], 
                                            [new SubTask("@:1:1:1"),new SubTask("b:3:3:2","B2","@:1:1:1")]);
let testing2_subtasks = genAllAssignments([testing2_subtask1, testing2_subtask2],["1","2"]);
stage_testing2.subtasks = testing2_subtasks;

let map_testing3 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".",".","c:4:4",".",".",".","b:3:3",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","@:4:7",".",".",".","@:2:2",".",".","#"],
                         ["#","#","#","C1","#","#","#","B1","#","#","#"]];
const pi_testing3 = {
    "0":["@:2:2","b:3:3","B1"],
    "0.5":["b:3:3","B1"],
    "1":["c:4:4","C1"],
    "F":["@:4:7"]
}
let stage_testing3 = new GameStage(map_testing3, goal= 1, policy = pi_testing3);
let testing3_subtask1 = new SubTaskAssignment(stage_testing3, ["c"],
                                            [new SubTask("@:4:7"),new SubTask("c:4:4","C1","@:4:7")]);
let testing3_subtask2 = new SubTaskAssignment(stage_testing3, ["b"], 
                                            [new SubTask("@:2:2"),new SubTask("b:3:3","B1","@:2:2")]);
let testing3_subtasks = genAllAssignments([testing3_subtask1, testing3_subtask2],["1","2"]); 
stage_testing3.subtasks = testing3_subtasks;

let map_testing4 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","d:4:8",".",".","c:4:4",".",".","b:3:3",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:8:4",".",".","@:7:3",".",".","@:4:3",".","#"],
                         ["#","#","D1","#","#","C1","#","#","B1","#","#"]];
const pi_testing4 = {
    "0":["@:7:3","c:4:4","C1"],
    "0.5":["c:4:4"],
    "1":["@:b:3:3","B1"],
    "F":["@:8:4"]
}
let stage_testing4 = new GameStage(map_testing4, goal= 1, policy = pi_testing4);
let testing4_subtask1 = new SubTaskAssignment(stage_testing4, ["d"], 
                                            [new SubTask("@:8:4"),new SubTask("d:4:8","D1","@:8:4")]);
let testing4_subtask2 = new SubTaskAssignment(stage_testing4, ["c"], 
                                            [new SubTask("@:7:3"),new SubTask("c:4:4","C1","@:7:3")]);
let testing4_subtask3 = new SubTaskAssignment(stage_testing4, ["b"],
                                            [new SubTask("@:4:3"),new SubTask("b:3:3","B1","@:4:3")]);                                 
let testing4_subtasks = genAllAssignments([testing4_subtask1, testing4_subtask2, testing4_subtask3],["1","2"]); 
stage_testing4.subtasks = testing4_subtasks;

let map_testing5 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","d:2:8",".","c:2:2",".","b:1:1",".","a:1:6",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:7:4",".","@:3:3",".","@:1:1",".","@:3:2",".","#"],
                         ["#","#","D1","#","C1","#","B1","#","A1","#","#"]];
const pi_testing5 = {
    "0":["@:3:3","c:2:2","C1"],
    "0.5":["c:2:2","C1"],
    "1":["@:1:1","@:3:3","A1"],
    "F":["@:7:4"]
}
let stage_testing5 = new GameStage(map_testing5, goal= 1, policy = pi_testing5);
let testing5_subtask1 = new SubTaskAssignment(stage_testing5, ["d"], 
                                            [new SubTask("@:7:4"),new SubTask("d:2:8","D1","@:7:4")]);
let testing5_subtask2 = new SubTaskAssignment(stage_testing5, ["c"], 
                                            [new SubTask("@:3:3"),new SubTask("c:2:2","C1","@:3:3")]);
let testing5_subtask3 = new SubTaskAssignment(stage_testing5, ["b"], 
                                            [new SubTask("@:1:1"),new SubTask("b:1:1","B1","@:1:1")]);   
let testing5_subtask4 = new SubTaskAssignment(stage_testing5, ["a"], 
                                            [new SubTask("@:3:2"),new SubTask("a:1:6","B1","@:3:2")]);                                 
let testing5_subtasks = genAllAssignments([testing5_subtask1, testing5_subtask2, 
                                            testing5_subtask3, testing5_subtask4],["1","2"]); 
stage_testing5.subtasks = testing5_subtasks;
                                            
let map_testing6 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","b:1:1",".","d:4:7",".","c:3:9",".","a:7:4",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:2:2",".","@:1:1",".","@:8:2",".","@:3:3",".","#"],
                         ["#","#","B1","#","D1","#","C1","#","A1","#","#"]];
const pi_testing6 = {
    "0":["@:2:2","b:1:1","B1"],
    "0.5":["b:1:1"],
    "1":["@:1:1","@:8:2"],
    "F":["@:1:1","@:8:2"]
}
let stage_testing6 = new GameStage(map_testing6, goal= 1, policy = pi_testing6);
let testing6_subtask1 = new SubTaskAssignment(stage_testing6, ["b"],
                                            [new SubTask("@:2:2"), new SubTask("b:1:1","B1","@:2:2")]);
let testing6_subtask2 = new SubTaskAssignment(stage_testing6, ["d"], 
                                            [new SubTask("@:1:1"), new SubTask("d:4:7","D1","@:1:1")]);
let testing6_subtask3 = new SubTaskAssignment(stage_testing6, ["c"],
                                            [new SubTask("@:1:1"), new SubTask("c:3:9","C1","@:1:1")]);   
let testing6_subtask4 = new SubTaskAssignment(stage_testing6, ["a"], 
                                            [new SubTask("@:3:3"), new SubTask("a:7:4","A1","@:3:3")]);                                 
let testing6_subtasks = genAllAssignments([testing6_subtask1, testing6_subtask2, 
                                            testing6_subtask3, testing6_subtask4],["1","2"]); 
stage_testing6.subtasks = testing6_subtasks;

///////////////////////////////////////////////////////////////////////////////////////////
let map_testing7 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","b:1:2",".","a:4:4",".","d:4:9",".","c:4:1",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:2:1",".","@:3:3",".","@:6:2",".","@:7:4",".","#"],
                         ["#","#","B1","#","A1","#","D1","#","C1","#","#"]];
const pi_testing7 = {
    "0":["@:3:3","a:4:4","A1","@:2:1","b:1:2","B1"],
    "0.5":["@:7:4","c:4:1","C1","@:2:1","b:1:2","B1"],
    "1":["@:3:3","a:4:4","A1","@:2:1","b:1:2","B1"],
    "F":["@:7:4","@:6:2","c:4:1","C1"]
}
let stage_testing7 = new GameStage(map_testing7, goal= 2, policy = pi_testing7);

let map_testing8 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                         ["#",".","c:2:9",".","b:4:1",".","a:5:2",".","d:2:3",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".","1",".",".",".","2",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".",".",".",".",".",".",".",".",".","#"],
                         ["#",".","@:8:1",".","@:1:3",".","@:3:4",".","@:3:7",".","#"],
                         ["#","#","C1","#","B1","#","A1","#","D1","#","#"]];
const pi_testing8 = {
    "0":["@:3:4","a:5:2","A1","@:1:3","b:4:1","B1"],
    "0.5":["@:3:4","a:5:2","A1","@:1:3","b:4:1","B1"],
    "1":["@:1:3","d:2:3","D1"],
    "F":["@:8:1","d:2:3","D1"]
}

let stage_testing8 = new GameStage(map_testing8, goal= 2, policy = pi_testing8);
                                    
let map_testing_ex1 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                           ["#",".","c:2:9",".","b:4:1","#","a:5:2",".","d:2:3",".","#"],
                           ["#",".",".",".",".",".",".",".",".",".","#"],
                           ["#",".","#",".","#","#","#",".","#",".","#"],
                           ["#",".",".",".",".","#",".",".",".",".","#"],
                           ["#",".","#","1",".","#",".","2","#",".","#"],
                           ["#",".",".",".",".","#",".",".",".",".","#"],
                           ["#",".","#",".","#","#","#",".","#",".","#"],
                           ["#",".",".",".",".",".",".",".",".",".","#"],
                           ["#",".","@:8:1",".","@:1:3","#","@:3:4",".","@:3:7",".","#"],
                           ["#","#","C1","#","B1","#","A1","#","D1","#","#"]];
const pi_testing_ex1 = {
               "0":["@:3:4","a:5:2","A1","@:1:3","b:4:1","B1"],
               "0.5":["@:3:4","a:5:2","A1","@:1:3","b:4:1","B1"],
               "1":["@:1:3","d:2:3","D1"],
               "F":["@:8:1","d:2:3","D1"]
}
let stage_testing_ex1 = new GameStage(map_testing_ex1, goal= 2,  policy = pi_testing_ex1);
           
let map_testing_ex2 =     [["#","#","#","#","#","#","#","#","#","#","#"],
                           ["#","c:2:9",".",".","b:4:1",".","a:5:2",".",".","d:2:3","#"],
                           ["#",".",".",".",".",".",".",".",".",".","#"],
                           ["#","#","#","#","#","#","#","#","#",".","#"],
                           ["#",".",".",".",".","#",".",".",".",".","#"],
                           ["#",".","#","1",".","#",".","2","#",".","#"],
                           ["#",".","#",".",".",".",".",".","#",".","#"],
                           ["#",".","#","#","#","#","#","#","#","#","#"],
                           ["#",".",".",".",".",".",".",".",".",".","#"],
                           ["#",".","@:8:1",".","@:1:3",".","@:3:4",".","@:3:7",".","#"],
                           ["#","#","C1","#","B1","#","A1","#","D1","#","#"]];
const pi_testing_ex2 = {
                        "0":["@:3:4","a:5:2","A1","@:1:3","b:4:1","B1"],
                                      "0.5":["@:3:4","a:5:2","A1","@:1:3","b:4:1","B1"],
                                      "1":["@:1:3","d:2:3","D1"],
                                      "F":["@:8:1","d:2:3","D1"]
                       }
let stage_testing_ex2 = new GameStage(map_testing_ex2, goal= 2, policy = pi_testing_ex2);


//TODO: function to check that the gameStage and all declaration is valid. 
//      This includes checking unique id of obj.


// the list of all states in order to appear in the experiment
const tutorial_stages = [stage_tutorial1, stage_tutorial2];
const training_stages = [stage_training1, stage_training3, stage_training4, stage_training5,
                         stage_training6, stage_training7];
const testing_stages = [stage_testing2,stage_testing3,stage_testing4,stage_testing5,stage_testing6];

let stages = [...tutorial_stages, ...training_stages, ...testing_stages];

stages = [...training_stages, ...testing_stages];

///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Default 11 x 11 map but 9 x 9 space
let map00 = [["#","#","#","#","#","#","#","#","#","#","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#",".",".",".",".",".",".",".",".",".","#"],
            ["#","#","#","#","#","#","#","#","#","#","#"]];

// Default 11 x 11 map but 7 x 7 space
let map01 = [[" "," "," "," "," "," "," "," "," "," "," "],
            [" ","#","#","#","#","#","#","#","#","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#",".",".",".",".",".",".",".","#"," "],
            [" ","#","#","#","#","#","#","#","#","#"," "],
            [" "," "," "," "," "," "," "," "," "," "," "]];
