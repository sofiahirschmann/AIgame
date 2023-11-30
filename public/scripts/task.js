// This is a place to define a subtask as a goal function 
// A goal function should take in the searchState and return true if the goal is reached, false otherwise.

function goalDeliver(searchState, id){
    let collected = searchState.collected;
    for(let i = 0; i < collected.length; i++){
        if(collected[i].id === id) {
            return true;
        }
    }
    return false;
}

function goalDelivera1(searchState){
    return goalDeliver(searchState, "a1");
}

function goalDeliverb1(searchState){
    return goalDeliver(searchState, "b1");
}

function testFunction(){
    console.log("working!");
}