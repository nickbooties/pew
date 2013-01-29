/*
    server.js - Nick Booth 2013
*/

var WebSocketServer = require('websocket').server;
var http = require('http');
var $ = require('jquery');
var jQuery = $;
var fs = require('fs');
eval(fs.readFileSync('../intersection.js')+'');
eval(fs.readFileSync('../pew_functions.js')+'');

var world = new Object;

loadWorld();
setInterval(syncLoop,100);
setInterval(laserLoop,10);

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});

server.listen(1337, function() { });
// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    console.log('Recieved connection from: '+request.remoteAddress);
    
    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message
            var m_req = JSON.parse(message.utf8Data);
            var reply = {};
            
            
            if(m_req.name != '')
            {
                //console.log(message.utf8Data);
                try
                {
                    switch(m_req.request.type)
                    {
                        case 'init':
                            //check if name already exists
                            if(validPlayer(m_req.name) == -1)
                            {
                                world.fighters.push(new fighter(m_req.name,new point(200,100), 0));
                                reply = {type: 'sync', world: world}
                                this.pew_playerName = m_req.name;
                                console.log("There are now "+wsServer.connections.length+" connections.");
                            }
                            else
                            {
                                reply = {error: 'Player already exists.'}
                                this.close();
                            }
                        break;
                        case 'sync':
                            reply = { type: 'sync', world: world}
                        break;
                        case 'move':
                            //validate move,player
                            var x = validPlayer(m_req.name)
                            if(x >= 0 && world.fighters[x].alive)
                            {
                                switch(m_req.request.dir)
                                {
                                    case '1':
                                        world.fighters[x].location.y -= 10;
                                    break;
                                    case '2':
                                        world.fighters[x].location.y += 10;
                                    break;
                                    case '3':
                                        world.fighters[x].location.x -= 10;
                                    break;
                                    case '4':
                                        world.fighters[x].location.x += 10;
                                    break;
                                }
                            }
                            //update player
                            //send sync
                            reply = {type: 'sync', world: world}
                        break;
                    
                        case 'fire':
                            var x = validPlayer(m_req.name)
                            
                            if(world.fighters[x].alive && x >= 0)
                            {
                                var heading = getHeading(world.fighters[x].location, m_req.request.target);
                                
                                //turn the player
                                world.fighters[x].heading = heading;
                                
                                //send it!
                                var i = addLaser(world.fighters[x].location, heading);
                                world.lasers[i-1].owner = world.fighters[x].name;
                                console.log('added laser');
                            }
                        break;
                    }
                }
                catch (err)
                {
                    
                }
            }
            else
            {
                reply =  {error: 'Invalid Callsign.'}
            }
            
            connection.send(JSON.stringify(reply));
        }
    });

    connection.on('close', function(reasonCode, description) {
        //remove player from world
        console.log('Player: '+this.pew_playerName+" disconnected.");
        for(var i=0;i<world.fighters.length;i++)
        {
            var fighter = world.fighters[i];
            if(fighter.name == this.pew_playerName)
            {
                world.fighters.splice(i,1);
            }
        }
    });
    
    connection.on('error',function(e){
        console.log(e);
    });
});

function loadWorld() {
    world.width = 800;
    world.height = 600;
    
    world.walls = Array();
    world.walls.push(new wall(new point(100,100), new point(400,400)), //walls
                     new wall(new point(200,400), new point(200,600)), //
                     new wall(new point(0,0), new point(0,world.height)), // box boundry
                     new wall(new point(0,world.height), new point(world.width,world.height)), 
                     new wall(new point(world.width,world.height), new point(world.width,0)),
                     new wall(new point(world.width,0), new point(0,0))
                     );

    world.fighters = Array();
    // fighters get loaded upon connection    
    //world.fighters.push(new Object({name: 'Schroder', location: new point(200,100), heading: 0}));
    world.lasers = Array();
    world.blasts = Array();
    
    world.laserSpeed = 10;
    world.laserLength = 200;
}

function validPlayer(name)
{
    for(i in world.fighters)
    {
        if(world.fighters[i].name == name)
        {//name hit
            return i;
        }
    }
    
    return -1;
}

function syncLoop()
{
    //broadcast the sync to all players
    wsServer.broadcast(JSON.stringify(msg={type: 'sync',world: world}));
}

function laserLoop()
{
    calculateLasers();
    cullBlasts();
}

function cullBlasts()
{
    for(var i=0;i<world.blasts.length;i++)
    {
        var blast = world.blasts[i];
        
        if(blast.size > 0)
        {
            blast.size--;
        }
        else
        {
            world.blasts.splice(i,1);
        }
    }
}