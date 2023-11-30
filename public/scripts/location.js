class Location{
    id; 
    type;
    color;
    location;

    constructor(id, type, location){
        this.id = id;
        this.type = type;
        this.color = typeToColor[this.type];
        this.location = location;
    }
}