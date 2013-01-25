/*
 * pew.js
 * Nick Booth 2013
*/
var canvas;
var ctx;
var world = new Object;
var connection;
var connected = false;
var loaded = false;
var player_name;

$(document).ready(function() {
    canvas=document.getElementById('pew_canvas');
    ctx=canvas.getContext('2d');
    
    /* */
    setInterval(drawLoop,10);
    
    //input - change these to requests to move to server
    $(document).keypress(function(event){
        var request = {};    
        
        switch(event.charCode) {
            case 119: //up
                request = {name: player_name, request: {type: 'move', dir: '1'}}
            break;
            case 115: //down
                request = {name: player_name, request: {type: 'move', dir: '2'}}
            break;
            case 97: //left
                request = {name: player_name, request: {type: 'move', dir: '3'}}
            break;
            case 100: //right
                request = {name: player_name, request: {type: 'move', dir: '4'}}
            break;
        }  
        
        if(connected && loaded)
        {
            connection.send(JSON.stringify(request));
        }
    });
    
    $('#pew_canvas').mouseup(function(event){
        
        if(event.button == 0) //lmb down
        {
            var x = event.offsetX;
            var y = event.offsetY;
            var target = new point(x,y);
            var heading = getHeading(world.fighters[0].location, target);
            
            //addLaser(world.fighters[0].location, heading, 1000);
            var request = {name: player_name, request: {type: 'fire',target: target}};
            
            if(connected && loaded)
            {
                connection.send(JSON.stringify(request));
            }
        }
    });
    
    $('#pew_connect').click(function(){
        //connect to server
        // if user is running mozilla then use it's built-in WebSocket
        window.WebSocket = window.WebSocket || window.MozWebSocket;
    
        connection = new WebSocket('ws://127.0.0.1:1337');
        connection.onopen = function () {
            // connection is opened and ready to use
            connected = true;
            player_name = $('.pew_playername').val();
            log("Connection established...");
            var request = {
                name: player_name,
                request: {type: 'init'}
            }
            
            connection.send(JSON.stringify(request));
        };
        
        connection.onerror = function (error) {
            // an error occurred when sending/receiving data
            connected = false;
            log("Connection error: "+error)
        };
        
        connection.onmessage = function (message) {
            // try to decode json (I assume that each message from server is json)
            try {
                var json = JSON.parse(message.data);
                
                if(json.error)
                {
                    log(json.error);
                }
                else
                {
                    switch(json.type)
                    {
                        case 'sync':
                            if(json.world)
                            {
                                world = json.world;
                                loaded = true;
                            }
                            else
                            {
                                log("Sync contained no world data.");
                            }
                        break;
                        
                    }
                }
            } catch (e) {
                log('JSON error: '+message.data);
                return;
            }
            // handle incoming message
        };
        
        connection.onclose = function (e) {
            connected = false;
            log("Connection dropped: "+e);
        }
    });
});

function drawLoop() {
    //todo, add keycheck into draw loop
    if(connected && loaded)
    {
        //draw the floor
        ctx.fillRect(0,0,world.width, world.height);
        
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#040';
        
        for(var x=0; x<world.width;x+=20)
        {
            ctx.beginPath();
            ctx.moveTo(x+.5, 0);
            ctx.lineTo(x+.5, world.height);
            ctx.stroke();
            
        }
        
        for(var y=0; y<world.height;y+=20)
        {
            ctx.beginPath();
            ctx.moveTo(0, y+.5);
            ctx.lineTo(world.width, y+.5);
            ctx.stroke();
        }
        
        ctx.lineWidth = 2;
        
        drawWalls();
        drawFighters();
        calculateLasers();
        drawLasers();
        drawBlasts();
        //once every 10 frames request a sync from server
        
    }
}

function drawWalls() {
    
    for(var x=0;x<world.walls.length;x++)
    {
        var currentWall = world.walls[x];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(currentWall.from.x, currentWall.from.y);
        ctx.lineTo(currentWall.to.x, currentWall.to.y);
        ctx.strokeStyle="#CCC";
        ctx.stroke();
        ctx.strokeStyle="#000";
    }
}

function drawFighters() {
    for(var x=0;x<world.fighters.length;x++)
    {
        var fighter = world.fighters[x];
        var imageObj = new Image();
        imageObj.src = 'art/player.png';

        ctx.translate(fighter.location.x, fighter.location.y);
        ctx.rotate(fighter.heading -(3.14/2));
        ctx.drawImage(imageObj, -16, -16);
        ctx.rotate(-(fighter.heading-(3.14/2)));
        ctx.translate(-fighter.location.x, -fighter.location.y);
    }
}

function drawLasers()
{
    for(var i=0;i<world.lasers.length;i++)
    {
        var laser = world.lasers[i];
        //does the draw
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(laser.tail.x, laser.tail.y);
        ctx.lineTo(laser.head.x, laser.head.y);
        ctx.lineJoin = "miter";
        
        var gradient=ctx.createLinearGradient(laser.tail.x,laser.tail.y,laser.head.x,laser.head.y);
        gradient.addColorStop("0","rgba(0,0,0,0)");
        gradient.addColorStop("1.0","yellow");
        
        ctx.strokeStyle=gradient;
        ctx.stroke();
        ctx.strokeStyle="#000";
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
            ctx.strokeStyle="#FF3300";
            ctx.stroke();
            ctx.strokeStyle="#000";
            blast.size--;
        }
        else
        {
            world.blasts.splice(i,1);
        }
    }
}

function log(text) {
    var console = $('#pew_console');
    
    $('#pew_console').append(text+"\r\n");    
    $('#pew_console').scrollTop(console[0].scrollHeight);
}




