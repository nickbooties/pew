/*
 * pew.js
 * Nick Booth 2012
*/
var canvas;
var ctx;
var world = new Object;

$(document).ready(function() {
    canvas=document.getElementById('pew_canvas');
    ctx=canvas.getContext('2d');
    
    world.walls = Array();
    world.walls.push(new wall(new point(100,100), new point(400,400)), //walls
                     new wall(new point(200,400), new point(200,600)), //
                     new wall(new point(0,0), new point(0,canvas.height)), // box boundry
                     new wall(new point(0,canvas.height), new point(canvas.width,canvas.height)), 
                     new wall(new point(canvas.width,canvas.height), new point(canvas.width,0)),
                     new wall(new point(canvas.width,0), new point(0,0))
                     );

    world.fighters = Array();
    world.fighters.push(new Object({name: 'Schroder', location: new point(200,100), heading: 0}));
    world.lasers = Array();
    world.blasts = Array();
    
    world.laserSpeed = 10;
    world.laserLength = 200;
    setInterval(drawLoop,10);
    
    //input
    $(document).keypress(function(event){
        switch(event.charCode) {
            case 119: //up
                world.fighters[0].location.y -= 10;
            break;
            case 115: //down
                world.fighters[0].location.y += 10;
            break;
            case 97: //left
                world.fighters[0].location.x -= 10;
            break;
            case 100: //right
                world.fighters[0].location.x += 10;
            break;
            
        }
    });
    
    $('#pew_canvas').mouseup(function(event){
        
        
        if(event.button == 0) //lmb down
        {
            var x = event.offsetX;
            var y = event.offsetY;
            var target = new point(x,y);
            var heading = getHeading(world.fighters[0].location, target);
            
            addLaser(world.fighters[0].location, heading, 1000);
        }
    });
});

function drawLoop() {
    //todo, add keycheck into draw loop
    
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.lineWidth = 2;
    
    drawWalls();
    drawFighters();
    drawLasers();
    drawBlasts();
    
    //console.log(world.lasers.length);
}

function drawWalls() {
    
    for(var x=0;x<world.walls.length;x++)
    {
        var currentWall = world.walls[x];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(currentWall.from.x, currentWall.from.y);
        ctx.lineTo(currentWall.to.x, currentWall.to.y);
        ctx.stroke();
    }
}

function drawFighters() {
    for(var x=0;x<world.fighters.length;x++)
    {
        var fighter = world.fighters[x];
        
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(fighter.location.x - 5, fighter.location.y + 5);
        ctx.lineTo(fighter.location.x, fighter.location.y - 5);
        ctx.lineTo(fighter.location.x + 5, fighter.location.y + 5);
        ctx.lineJoin = "miter";
        ctx.stroke();
        
    }
}

function  drawLasers() {
    for(var i=0;i<world.lasers.length;i++)
    {
        var laser = world.lasers[i];
        var nextHeadLoc;
        
        
        
        //remove laser if off screen or (end of lifespan ?).
        if((laser.tail.x > ctx.canvas.clientWidth || laser.tail.x < 0) && (laser.tail.y > ctx.canvas.clientHeight || laser.tail.y < 0))
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
                }
            }
        }
        
        //need a seperat check incase it collided this move.
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
        
        
        //does the draw
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(laser.tail.x, laser.tail.y);
        ctx.lineTo(laser.head.x, laser.head.y);
        ctx.lineJoin = "miter";
        ctx.stroke();
    }
}

function drawBlasts() {
    for(var i=0;i<world.blasts.length;i++)
    {
        var blast = world.blasts[i];
        
        if(blast.size > 0)
        {
            ctx.beginPath();
            ctx.arc(blast.location.x,blast.location.y,blast.size,0,2*Math.PI);
            ctx.stroke();
            blast.size--;
        }
        else
        {
            world.blasts.splice(i,1);
        }
    }
}

function addLaser(source,heading) {
    
    var sourceCopy = jQuery.extend(true, {}, source);
    
    return world.lasers.push(new laser(heading, sourceCopy)); 
}





