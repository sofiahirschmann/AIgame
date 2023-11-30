class GameObject {

    id;
     
    type; //Type of object.
    isObstacle;
    color;
    shape;
    location;

    //Attribute
    weight;     //[1,10] corresponding to str
    fragility;  //[1,10] corresponding to dex

    constructor(id, type, weight, fragility, location) {
        this.id = id;
        this.type = type;
        this.isObstacle = type === "@";
        this.color = typeToColor[this.type];
        this.shape = typeToShape[this.type]; 
        this.weight = weight;
        this.fragility = fragility;
        this.location = location;
    }

}