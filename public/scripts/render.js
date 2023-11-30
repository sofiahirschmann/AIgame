// Rendering and Camera
const typeToColor = {
    "a":"lightblue",
    "b":"lightpink",
    "c":"lightgreen",
    "d":"purple",
    "@": "brown"    //@ = obstacle
}

const typeToWord = {
    "a":"Blue",
    "b":"Pink",
    "c":"Green",
    "d":"Purple"
}

const typeToShape = {
    "a":"square",
    "b":"square",
    "c":"square",
    "d":"square",
    "@":"circle"
}

//Special Symbol
const stringToObject = {
    ".":"floor",
    "#":"wall",
    " ":"outside"
}

function genMapArray(strMap){
    //A function to get a 2d array from string

    //TODO: check map format

    //Remove \n and use \r to indicate new line
    let temp = strMap.substring(1,strMap.length-1);
    temp = temp.split("\n");

    let mapArray = [];
    for(let s of temp){
        s = s.split("");
        mapArray.push(s);
    }
    return(mapArray);
}

function arrayMapToString(arrMap){
    strMap = "";
    for(let i =0;i<arrMap.length;i++){
        for(let j =0;j<arrMap[i].length;j++){
            strMap += arrMap[i][j];
        }
        if(i != arrMap.length-1) strMap += "\n";
    }
    return(strMap);
}

//////////////////////////////////////////////////////////////////////

const tileColor = {
    background:"black",
    floor:"darkgray",
    wall:"gray",
    player:"yellow",
    robot:"orange",
    objecta:"green",
    objectb:"blue"
}


const grid_size = 48;

function findLocation(id, map){
    for(let i = 0; i < map.length; i++){
        for(let j = 0; j < map[i].length; j++){
            if(map[i][j]===id) return([i,j]);
        }
    }
    console.error("Couldn't find the object: id " + id);
    return([]);
}

//TODO: change the map (array) to actually hold the ref of the obj instead.
function findObjectbyID(id, stage){
    //Check objects, agents, location
    //We need to use id to find because an object within the same class could have diff stats
    if(id in stage.objs) return stage.objs[id];
    if(id in stage.agents) return stage.agents[id];
    if(id in stage.locs) return stage.locs[id];
    return(id);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function renderObject(ctx, i, j, obj){
    //Draw an object 
    if(obj.shape === "square"){
        //border
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.fillRect(grid_size*j+3,grid_size*i+3, grid_size-6,grid_size-6);
        ctx.fillStyle = obj.color;
        ctx.fillRect(grid_size*j+5,grid_size*i+5,grid_size-10,grid_size-10);
        
        ctx.moveTo(grid_size*(j+1)-5, grid_size*i+5);
        ctx.lineTo(grid_size*j+5, grid_size*(i+1)-5);
        ctx.stroke();

        //Write down the attributes
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(obj.weight,grid_size*j + 0.45*grid_size/2, grid_size*i + 0.9*grid_size/2 );

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(obj.fragility,grid_size*j + 0.6*grid_size, grid_size*i + 0.8*grid_size );
    } else if(obj.shape === "circle"){
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(grid_size*j+23, grid_size*i+23, 20, degToRad(0), degToRad(360), false);
        ctx.fill();
        
        ctx.moveTo(grid_size*(j+1)-10, grid_size*i+10);
        ctx.lineTo(grid_size*j+10, grid_size*(i+1)-10);
        ctx.stroke();
        
        //Write down the attributes
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(obj.weight,grid_size*j + 0.45*grid_size/2, grid_size*i + 0.9*grid_size/2 );

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(obj.fragility,grid_size*j + 0.55*grid_size, grid_size*i + 0.75*grid_size );
    }
    ///
}

//TODO: Make render works on any grid size //depends on grid_size
//TODO: render for holding an circle object
function renderPlayer(ctx, i, j, player){
    ctx.fillStyle = player.color;
    const x = grid_size*j; 
    const y = grid_size*i;
    ctx.beginPath();

    if(player.id==="1"){
        if(player.direction === directions.up){
            ctx.arc(x + 0.475*grid_size, y +0.65*grid_size, 10, degToRad(0), degToRad(360), false);
            ctx.fillRect(x+5, y+10, 8,grid_size*0.65);
            ctx.fillRect(x+grid_size-15, y+10, 8,grid_size*0.65);
            ctx.fill();
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+0.25*grid_size, y+4,22,14);
            }
        } else if(player.direction === directions.down){
            ctx.arc(grid_size*j + 0.475*grid_size, grid_size*i+0.3*grid_size, 10, degToRad(0), degToRad(360), false);
            ctx.fillRect(x+5, y+5, 8,grid_size*0.65);
            ctx.fillRect(x+grid_size-15, y+5, 8,grid_size*0.65);
            ctx.fill();
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+0.25*grid_size, y+27,22,14);
            }
        } else if(player.direction === directions.right){
            ctx.arc(grid_size*j + 0.3*grid_size, grid_size*i+0.475*grid_size, 10, degToRad(0), degToRad(360), false);
            ctx.fillRect(x+5, y+5, grid_size*0.65,8);
            ctx.fillRect(x+5, y+grid_size -15, grid_size*0.65,8);
            ctx.fill();
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+27, y+0.25*grid_size,14,22);
            }
        } else if(player.direction === directions.left){
            ctx.arc(grid_size*j + 0.65*grid_size, grid_size*i+0.475*grid_size, 10, degToRad(0), degToRad(360), false);
            ctx.fillRect(x+10, y+5, grid_size*0.65,8);
            ctx.fillRect(x+10, y+grid_size -15, grid_size*0.65,8);
            ctx.fill();
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+4, y+0.25*grid_size,14,22);
            }
        }        
    }else{
        if(player.direction === directions.up){
            ctx.fillRect(x+0.25*grid_size, y+26, 22,17);
            ctx.fillRect(x+5, y+10, 8,grid_size*0.65);
            ctx.fillRect(x+grid_size-15, y+10, 8,grid_size*0.65);
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+0.25*grid_size, y+4,22,14);
            }
        } else if(player.direction === directions.down){
            ctx.fillRect(x+0.25*grid_size, y+4, 22, 17);
            ctx.fillRect(x+5, y+5, 8,grid_size*0.65);
            ctx.fillRect(x+grid_size-15, y+5, 8,grid_size*0.65);
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+0.25*grid_size, y+27,22,14);
            }
        } else if(player.direction === directions.right){
            ctx.fillRect(x+4, y+0.25*grid_size, 17,22);
            ctx.fillRect(x+5, y+5, grid_size*0.65,8);
            ctx.fillRect(x+5, y+grid_size -15, grid_size*0.65,8);
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+27, y+0.25*grid_size,14,22);
            }
        } else if(player.direction === directions.left){
            ctx.fillRect(x+26, y+0.25*grid_size, 17,22);
            ctx.fillRect(x+10, y+5, grid_size*0.65,8);
            ctx.fillRect(x+10, y+grid_size -15, grid_size*0.65,8);
            if(player.action === actions.holding){
                ctx.fillStyle = player.hold_object.color;
                ctx.fillRect(x+4, y+0.25*grid_size,14,22);
            }
        }
    }

    //ctx.fill();
}

function renderMapLocation(ctx, x, y, obj){
    ctx.fillStyle = tileColor.floor; //First fill out the outside
    ctx.fillRect(grid_size*y, grid_size*x, grid_size-1, grid_size-1);
    if(obj instanceof GameObject ){
        renderObject(ctx, x, y, obj);
    } else if(obj instanceof Player) {
        renderPlayer(ctx, x, y, obj);
    } else if(obj === "#") {
        ctx.fillStyle = tileColor.wall;
        ctx.fillRect(grid_size*y, grid_size*x,grid_size-1,grid_size-1);
    } else if(obj instanceof Location) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(grid_size*y, grid_size*x, grid_size-1,grid_size-1);
    } else if(obj == " "){
        ctx.fillStyle = tileColor.background;
        ctx.fillRect(grid_size*y, grid_size*x,grid_size-1,grid_size-1);
    }
}


function renderMap(stage, center = false){    
    //render Canvas from map (array)
    //center on the player
    let map = stage.map;

    const canvas = document.querySelector(".canvas");
    const width = canvas.width;
    const height = canvas.height;
    const ctxWidthGrid = width/grid_size;
    const ctxHeightGrid = height/grid_size;
    const ctx = canvas.getContext("2d");

    //Three layers: 1) background, 2) floors and 3) objects
    ctx.fillStyle = tileColor.background;
    ctx.fillRect(0, 0, width, height);

    //Deciding the starting and ending points
    //Centering the player
    if(center){
        //centering self
        
        let xCen = Math.floor((width/grid_size)/2);
        let xMin = Math.max(xCen - playerLoc[0], 0);
        let xMax = Math.min(xCen + (map.length - playerLoc[0]), ctxWidthGrid);
        let xBegin = Math.max(0, playerLoc[0] - xCen);

        for(let i = xMin; i < xMax; i++){
            let yCen = Math.floor((width/grid_size)/2);
            let yMin = Math.max(yCen - playerLoc[1], 0);
            let yMax = Math.min(yCen + (map[xBegin+i-xMin].length - playerLoc[1]), ctxHeightGrid);
            let yBegin = Math.max(0, playerLoc[1]-yCen);
            for(let j = yMin; j < yMax; j++){
                let temp_obj = findObjectbyID(map[xBegin+i-xMin][yBegin+j-yMin], stage);
                renderMapLocation(ctx, i, j, temp_obj);
            }
        }        
    }else {
        //Match the top right corner of the map to the top right conner of the screen
        for(let i =0; i < map.length;i ++){
            for(let j=0; j < map[i].length; j++){
                let temp_obj = findObjectbyID(map[i][j], stage);
                renderMapLocation(ctx, i, j, temp_obj);
            }
        }
    }
}

function renderTransition(){
    const canvas = document.querySelector(".canvas");
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = tileColor.background;
    ctx.fillRect(0, 0, width, height);

    ctx.font = '48px serif';
    ctx.fillText('Preparing the next stage', 10 , 50);
}
