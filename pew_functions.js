/*
 pew functions - Nick Booth 2013
 */

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
    this.owner = "";
   
}

function fighter(a_name, a_loc, a_head)
{
    this.name = a_name;
    this.location = new point(a_loc.x, a_loc.y);
    this.heading = a_head;
    this.kills = 0;
    this.alive = true;
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

function checkPlayerCollision(laser,to)
{
    //simply check if the distance between to and player < 10 (kill radius)
    for(var i=0;i<world.fighters.length;i++)
    {
        if(world.fighters[i].alive && laser.life > 10 && getDist(world.fighters[i].location,to) < 10 )
        {
            world.fighters[i].alive = false;
            console.log("Player: "+world.fighters[i].name+" dies.");
            
            //award kill to owner (unless it was self-kill, in which case punish)
            if(world.fighters[i].name == laser.owner)
            {
                world.fighters[i].kills--;
            }
            else
            {
                for(var j=0;j<world.fighters.length;j++)
                {
                    if(world.fighters[j].name == laser.owner)
                    {
                        world.fighters[j].kills++;
                    }
                }
            }
        }
    }
}

function addLaser(source,heading) {
    
    var sourceCopy = jQuery.extend(true, {}, source);
    
    return world.lasers.push(new laser(heading, sourceCopy)); 
}

function  calculateLasers() {
    for(var i=0;i<world.lasers.length;i++)
    {
        var laser = world.lasers[i];
        var nextHeadLoc;
        
        //remove laser if off screen or (end of lifespan ?).
        if((laser.tail.x > world.width || laser.tail.x < 0) && (laser.tail.y > world.height || laser.tail.y < 0))
        {
            world.lasers.splice(i,1);
        }
        
        //move laser head towards target
        nextHeadLoc = getMoveCoords(world.laserSpeed,laser.head,laser.heading);  

        if(!laser.inCollision)
        {
            //check if a collision occurs between old and new head loc
            var collision = checkWallCollission(laser.head, nextHeadLoc);
            if(collision && laser.movement > 0)
            {
                var x = collision.points[0].x;
                var y = collision.points[0].y;
                
                laser.inCollision = true;
                laser.head = collision.points[0];
                world.blasts.push(new blast(x,y,20));
            
                //calculate incident angle
                newHeading = getReflectAngle(laser.tail, collision.wallRef.from, collision.points[0]);
                
                //spawn new laser if old one not too old
                if(laser.life < 1000)
                {
                    var n = addLaser(collision.points[0], newHeading);
                    world.lasers[n - 1].life = laser.life;
                    world.lasers[n - 1].owner = laser.owner;
                }
            }
            
            //check if it collided with a fighter
            collision = checkPlayerCollision(laser,nextHeadLoc);
            
        }
        
        //need a seperate check incase it collided this move.
        if(!laser.inCollision)
        {
            //only move head if not colliding
            laser.head = nextHeadLoc;
            laser.life++;
            laser.movement++;
            //if dist between head & tail < laserlength, only move head of laser, otherwise move tail too.
            if(getDist(laser.head, laser.tail) >= world.laserLength)
            {
                laser.tail = getMoveCoords(world.laserSpeed, laser.tail, laser.heading);
            }
        }
        else
        {
            //check if laser length is small enough to remove laser
            if(getDist(laser.head, laser.tail) <= 5)
            {
                world.lasers.splice(i,1);
            }
            
            laser.tail = getMoveCoords(world.laserSpeed, laser.tail, laser.heading);
        }
    }
}