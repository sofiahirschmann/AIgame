import { uploadToFirebase } from "./firebase-storage.js"; 

const canDropEverywhere = false;

let logString = "";

let speed = 1;
let curStage;
let totalScore = 0;
let currentScore = 0;
let currentStageNum = 0;

function updateSideInfo(firstTime = false){
   let mapCount = document.querySelector("#mapcount");
   let totalScoreText = document.querySelector("#total-score");
   let currentScoreText = document.querySelector("#current-score");
   let objectiveText = document.querySelector("#objective");
   let currentCollectedText = document.querySelector("#collected");
   let humanStat = document.querySelector("#humanstat");
   let robotStat = document.querySelector("#robotstat");
   let rewards = document.querySelector("#rewards");

   humanStat.innerHTML = "<b><font color='blue'>You</font></b>: <b>Str</b> = "+ agent_ability["1"]["str"] +", <b>Dex</b> = " + agent_ability["1"]["dex"];
   robotStat.innerHTML = "<b><font color='red'>Robot</font></b>: <b>Str</b> = "+ agent_ability["2"]["str"] +", <b>Dex</b> = " + agent_ability["2"]["dex"];
   mapCount.innerHTML = "<b>Map</b>: " + (currentStageNum+1) + "/" + stages.length;
   totalScoreText.innerHTML = "<b>Total Score</b>: " + totalScore.toFixed(2);
   currentScoreText.innerHTML = "<b>Current Score</b>: " + currentScore.toFixed(2);
   if(curStage.goal === 1){
      objectiveText.innerHTML = "<b>Objective</b>: Collect " + curStage.goal + " object";
   }else{
      objectiveText.innerHTML = "<b>Objective</b>: Collect " + curStage.goal + " objects";
   }
   currentCollectedText.innerHTML = "<b>Collect</b>: " + curStage.collected.length;

   if(firstTime){
      // Populate rewards
      var rewardKey = Object.keys(reward).sort();
      for(let i=0;i<rewardKey.length;i++){
         var temp = document.createElement('li');
         temp.innerHTML = "<b><font color='" + typeToColor[rewardKey[i]]+ "'>" + typeToWord[rewardKey[i]] + " object </font><b> = " + reward[rewardKey[i]];
         rewards.appendChild(temp);
      }
   }
}

function updateScore(){
   let currentScoreText = document.querySelector("#current-score");
   currentScoreText.innerHTML = "<b>Current Score</b>: " + currentScore.toFixed(2);
}

//Set up Conditions:
function setCondition(){
   const urlParams = new URLSearchParams(location.search);
   const cond = urlParams.get("COND");
   if(cond === "1"){
      agentLevel["2"] = 0;
      solo["2"] = true;
      minAmbiguityFlag = true;
   }else if(cond === "2"){
      agentLevel["2"] = 1;
      solo["2"] = true;
      minAmbiguityFlag = true;
   }else if(cond === "3"){
      agentLevel["2"] = 0;
      solo["2"] = false;
      minAmbiguityFlag = true;
   }else if(cond === "4"){
      agentLevel["2"] = 0;
      solo["2"] = true;
      minAmbiguityFlag = false;
   }else if(cond === "5"){
      agentLevel["2"] = 1;
      solo["2"] = true;
      minAmbiguityFlag = false;
   }else if(cond === "6"){
      agentLevel["2"] = 1;
      solo["2"] = false;
      minAmbiguityFlag = false;
   }else if (cond === "7"){
      agentLevel["2"] = 0;
      solo["2"] = false;
      minAmbiguityFlag = false;
   }else if (cond === "8"){
         agentLevel["2"] = 1;
         solo["2"] = false;
         minAmbiguityFlag = true;
   }
   
   console.log("Cond = " + cond);
   console.log(agentLevel);
   console.log(solo);
   console.log(minAmbiguityFlag);
}
setCondition();


//Set up the game loop
//Don't need this anymore since you only update when you receive an action from player
const step = () => {
    renderMap(curStage);
    window.requestAnimationFrame(() => {
       step();
    })
 }

function checkEndGame(stage){
   if(stage.goal === stage.collected.length) {
      console.log(stage.collected.length);
      return true;
   }
   return false;
}

//Need to reset players because of pass by ref
function resetPlayers(stage){

   for(let i = 0; i < stage.agents.length;i++){
      stage.agents[i].direction = directions.up;
      stage.agents[i].hold_object = null;
      stage.agents[i].action = actions.notHolding;
      stage.agents[i].location = findLocation(stage.agents[i].id, stage.map);
   }
}

function displayEndGameMessage() {
   // Create or show a "Game Over" message on the screen
   alert("Game Over! Thank you for playing. Please return to the survey window.");
}

function clearStage(){
   //Display Clear Message and reset or stop
   console.log("clear");
   //Move to the next stage if possible
   currentStageNum +=1;
   if(currentStageNum < stages.length){
      curStage = stages[currentStageNum];
      logString += "Score = " + currentScore + "\n";

      logString += "Map " + currentStageNum + "\n";
      logString += arrayMapToString(curStage.map);
      logString += "ENDOFMAP\n";

      totalScore += currentScore;
      currentScore = 0;
      curStage.collected = [];
      updateSideInfo();  
      //setHighPlan(playerID.robot, curStage);

   }else {
      logString += "Score = " + currentScore + "\n" + "\n";
      logString += "Total Score = " + totalScore + "\n" + "\n";
      try {
         logString += "Condition = " + cond + "\n";
         logString += "AgentLevel: " + JSON.stringify(agentLevel) + "\n";
         logString += "Solo: " + JSON.stringify(solo) + "\n";
         logString += "MinAmbiguityFlag: " + minAmbiguityFlag + "\n";
         }
      catch (e) {
         console.error("Error");
         }
      try {
         // Save the log with the filename = PROLIFICID if exists else current time (Date.now)
         const urlParams = new URLSearchParams(window.location.search);
         let PROLIFICID = urlParams.get("PROLIFICID");
         if (PROLIFICID === null) PROLIFICID = Date.now();
         uploadToFirebase(PROLIFICID + ".txt", logString)
         } 
      catch (e) {
         console.error("Error");
         }
      displayEndGameMessage();
   }
}

function startGame(stages){
   curStage = stages[currentStageNum];
   updateSideInfo(true);
   renderTransition();
   renderMap(curStage);
   //setHighPlan(playerID.robot, curStage);
   logString += "Map " + currentStageNum + "\n";
   logString += arrayMapToString(curStage.map);
   logString += "ENDOFMAP\n";
}

startGame(stages);

// ----- controller ----- //

/* Direction key state */

const keys = {
    "ArrowUp": directions.up,
    "ArrowLeft": directions.left,
    "ArrowRight": directions.right,
    "ArrowDown": directions.down,
    " " : actions.interact,
    "Enter": actions.wait,
    "w": directions.up,
    "s": directions.down,
    "a": directions.left,
    "d": directions.right
}

function executeAction(playerID, stage, cmd, guiupdate = true){
   let temp_player = stage.agents[playerID]; 
   let curMap = stage.map;
   let oldLoc = temp_player.location;
   let newLoc = [oldLoc[0], oldLoc[1]];

   //Movement
   if(cmd===directions.up && temp_player.direction===directions.up)  { newLoc[0] -= 1; }
   if(cmd===directions.down && temp_player.direction===directions.down) { newLoc[0] += 1;  }
   if(cmd===directions.left && temp_player.direction===directions.left) { newLoc[1] -= 1; }
   if(cmd===directions.right && temp_player.direction===directions.right) { newLoc[1] += 1; }
   //Check if a new location is empty
   if(curMap[newLoc[0]][newLoc[1]]==="."){
      curMap[newLoc[0]][newLoc[1]] = playerID;
      curMap[oldLoc[0]][oldLoc[1]] = "."; 
      temp_player.location = newLoc;
   }

   //direction
   if((cmd===directions.up || cmd===directions.down || cmd ===directions.left || cmd === directions.right) && 
      cmd !== temp_player.direction)
   temp_player.direction = cmd;
      
   //Interact with an object 
   if(cmd === actions.interact){
      //get the direction 
      let dir = [oldLoc[0], oldLoc[1]];
      if(temp_player.direction===directions.up)  { dir[0] -= 1;}
      if(temp_player.direction===directions.down) { dir[0] += 1;  }
      if(temp_player.direction===directions.left) { dir[1] -= 1; }
      if(temp_player.direction===directions.right) { dir[1] += 1; }

      //Case 1: Pickup
      //if no object and right next to an object in the correct direction 
      //and not holding any object
      //and if str >= weight and dex >= fragility, then pick up. 
      //Pick up results in remove the object from the map
      //TODO: curStage -> generic one? 
      //curStage will maintain the class name to be used later.
      let front = findObjectbyID(curMap[dir[0]][dir[1]], curStage);

      if(front instanceof GameObject && temp_player.action !== actions.holding){
         //check can interact
         if(temp_player.str >= front.weight && temp_player.dex >= front.fragility){
            //if it is obstacle, just remove it.
            if(front.isObstacle){
               stage.done.push(front.id);
               curMap[dir[0]][dir[1]] = ".";
            }else{
               temp_player.action = actions.holding;
               temp_player.hold_object = front;
               //Don't remove so you can return
               //curMap[dir[0]][dir[1]] = ".";
               
               //don't really need this (yet). Need to update every time player moves too.
               //front.loc = player1.loc;
            }
         }
      }
      //Case 2: Drop down
      //If holding object and the space in front is empty or deilver,
      //Then drop down the object
      //Alternative setup: hold spacebar to hold and release to drop. 
      else if(temp_player.action === actions.holding){
         if(front === "." && canDropEverywhere){
            curMap[dir[0]][dir[1]] = temp_player.hold_object;
            temp_player.action = actions.notHolding;
            temp_player.hold_object = null;
            //don't really need this (yet)
            //front.loc = dir;   
         }
         if(front instanceof Location && front.type === temp_player.hold_object.type){
            //deliver at the correct location 
            stage.collected.push(temp_player.hold_object);
            temp_player.action = actions.notHolding;
            temp_player.hold_object = null; 
            stage.done.push(front.id);

            if(guiupdate){
               currentScore += reward[front.type];
               let currentScoreText = document.querySelector("#current-score");
               currentScoreText.innerHTML = "<b>Current Score</b>: " + currentScore;
               let currentCollectedText = document.querySelector("#collected");
               currentCollectedText.innerHTML = "<b>Collected Object</b>:" + stage.collected.length;
            }
         }
         else if(front instanceof Object && front.type === temp_player.hold_object.type && temp_player.hold_object.id === front.id){
            temp_player.action = actions.notHolding;
            temp_player.hold_object = null;
         }
      }
      //TODO: Case 3: Multi agent holding
   }
}

// -------- Event Listener -------- //

let lastTime = 0; 

function movePlayer(cmd){

   //check time
   const curTime = Date.now();
   if(curTime - lastTime > timeBetweenTurn){
      lastTime = curTime;
   }else{
      console.log("Waiting...");
      return;
   }

   executeAction(playerID.human, curStage, cmd);
   
   //do any meaningful command will result in a movement of AI.
   if(typeof cmd !== "undefined"){
      //move AI
      let robotNextAction = nextAction(playerID.robot, curStage);
      executeAction(playerID.robot, curStage, robotNextAction);

      logString += "H " + cmd + "\n";
      logString += "R " + robotNextAction + "\n";

      currentScore += costPerMove;
      updateScore();
   }

   if(checkEndGame(curStage)){
       console.log("Stage Clear!!")
       clearStage();
   }
   renderMap(curStage);

}

document.addEventListener("keydown", (e) => {
   movePlayer(keys[e.key]);
})
 

 
 