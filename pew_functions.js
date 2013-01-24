/*
 pew functions */

function point(x,y) {
    this.x = x;
    this.y = y;
}

function wall(to, from) {
    this.from = new point(from.x,from.y);
    this.to = new point(to.x,to.y);
}

function blast(x, y, size) {
    this.location = new point(x,y);
    this.size = size;
    this.life = 10;
}

function laser(heading, source) {
        
    this.heading = heading;
    this.head = source;
    this.tail = source;
    this.life = 0
    this.movement = 0;
    this.inCollision = false;
   
}

function getDist(from, to)
{
    var xs = 0;
    var ys = 0;
    
    xs = to.x - from.x;
    xs = xs * xs;
    
    ys = to.y - from.y;
    ys = ys * ys;
    
    var dist = Math.sqrt( xs + ys );
        
    return dist;
}

function getMoveCoords(moveDist, position, heading)
{
    //check collision in here?
    var x = moveDist * Math.cos(heading);
    var y = moveDist * Math.sin(heading);
    
    return new point(position.x - x, position.y - y);
}

function getHeading(from, to)
{
    var offset_x = from.x - to.x;
    var offset_y = from.y - to.y;
    return Math.atan2(offset_y,offset_x);
}

function getReflectAngle(a, b, intersect)
{
    //clearly not a mathamagician
    var intersectToA = getHeading( a, intersect);
    var intersectToB = getHeading(b, intersect);
    
    var total = ((3.14 - (intersectToA - intersectToB)) + intersectToB) + 3.14;

    return total;
}

function checkWallCollission(from, to) {
   
    for(var i=0;i<world.walls.length;i++)
    {
        var wall = world.walls[i];
        var foo = Intersection.intersectLineLine(from, to, wall.from, wall.to);
        
        if(foo.status == "Intersection")
        {
            //find incident angle
            var opo = getDist(from, foo.points[0]);
            var adj = getDist(to, foo.points[0]);
            
            foo.wallHeading = getHeading(wall.to, wall.from);
            foo.wallRef = wall;
            
            return foo;
        }
        else if(foo.status == "Coincident")
        {
            return false;
        }
    }
    
    return false;
}


