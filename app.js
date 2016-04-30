(function() {
    function createCanvas(width, height) {
      var canvas = document.createElement('canvas');
      canvas.setAttribute('width', width || 200);
      canvas.setAttribute('height', height || 200);
      canvas.setAttribute('style', 'background-color: white; border: 1px solid black;');
      document.body.appendChild(canvas);
      return [canvas,canvas.getContext('2d')];
    }

    var canvasArray = createCanvas(300,500);
    var cnvs = canvasArray[0], ctx = canvasArray[1];
    game = init();

    //spawns blocks
    function cubePush(size, range) {
        var j = rand(size, range);
        for(var i = 0; i < j; i++) {
            game.cubeArray.push(cubeObj());
        }
    }

    function cubeObj() {
        return {x: rand(cnvs.width * 2, -cnvs.width / 2), y: cnvs.height/2 + cnvs.height / 100, side: cnvs.width / 100, color: 'black'};
    }

    //instead of just moving once on keydown,
    //keydown fires interval that moves blocks,
    //interval is killed on keyup
    /*(leftCnt and rightCnt are used to prevent
            multiple keydown events from having an effect)*/

    function playerListen() {
        addEventListener('keydown', function(evt) {
            if (evt.keyCode === 37 && game.leftCnt === 0) {
                game.leftIntvl = intervalFunc(move,1,game);
                if (game.rightCnt)
                    game.user.turn = 'straight';
                else
                    game.user.turn = 'left';
                game.leftCnt++;
            }
            if (evt.keyCode === 39 && game.rightCnt === 0) {
                game.rightIntvl = intervalFunc(move,-1,game);
                if (game.leftCnt)
                    game.user.turn = 'straight';
                else
                    game.user.turn = 'right';
                game.rightCnt++;
            }
        },false);

        addEventListener('keyup', function(evt) {
            if (evt.keyCode === 37) {
                clearInterval(game.leftIntvl);
                if (game.rightCnt)
                    game.user.turn = 'right';
                else
                    game.user.turn = 'straight';
                game.leftCnt = 0;
            }
            if (evt.keyCode === 39) {
                clearInterval(game.rightIntvl);
                if (game.leftCnt)
                    game.user.turn = 'left';
                else
                    game.user.turn = 'straight';
                game.rightCnt = 0;
            }
        },false);
    }
    //add change: make it so that the direction of user depends on speedCount (speedCount * direction)
    //speedCount makes it so that you aren't immediately at max move speed
    function intervalFunc(func,sign,g) {
        var speedCount = 0;
        return setInterval(function() {
            if (speedCount > 1)
                speedCount = 1;
            func(sign, speedCount);
            speedCount += .2;
            g.user.amp = speedCount;
        },25,false);
    }


    //moves blocks when user keys in left or right arrow
    function move(sign, speedCount) {
        game.cubeArray.forEach(function(AE) {
            AE.x += speedCount * sign * game.moveSpd * AE.y / cnvs.width;
        });
    }

    //determines distance from center x of an elem and
    //uses that and distance from bottom to calculate xSpd relative to position
    //cent means centered, a 2 comes in if centered, a 1 if not
    function xSpdByPos(elem,multiplier,cent) {
        var xPos = cnvs.width / 2 - (elem.x + elem.side/2);
        var yPos = elem.y + elem.side / cent;
        return -(multiplier / 6 + yPos / cnvs.height) * xPos / cnvs.width / 2 * 5;
    }

    //Clear screen, draw sky, then grass, then shadows, then user, then blocks, then score.
    //While going through blocks, position/speed is also updated, then splice expired blocks out
    function update() {
        var expired = [], shadowSize;

        ctx.clearRect(0, 0, cnvs.width, cnvs.height);
        draw.sky();
        draw.grass();
        
        game.cubeArray.forEach(function(AE) {
            shadowSize = -xSpdByPos(AE, 6, 1) * AE.side/2;
            draw.shadow(game.speed, AE, shadowSize);
        });

        draw.user(game.user,game.user.turn);
        game.cubeArray.forEach(function(AE,i) {
            AE.y += game.speed;
            //they get bigger as they approach





            //figure out how to scale this
            AE.side = cnvs.height/125 + Math.pow(AE.y / (cnvs.height/2), 3.5);






            //xSpd determined by
            AE.x += xSpdByPos(AE, game.speed, 2);
            draw.block(AE);
            //splice if below bottom



            //scale this too maybe
            if (AE.y > cnvs.height + Math.pow(game.speed,4))




                expired.push(i);
        });

        draw.score(game.score);

        expired.forEach(function(AE) {
            game.cubeArray.splice(AE,1);
        });

        if (collisions(game.returnUserDir(),game.cubeArray)) {
            clearInterval(game.intervalCubes);
            clearInterval(game.intervalUpdate);
            console.log(game.score);
        }
    }
    
    function collisions(U,array) {
        if (array.some(function(AE) {
            if (AE.x < U.x && AE.x + AE.side > U.x &&
                AE.y + AE.side/2 < U.y && AE.y + AE.side > U.y)
                return true;
        }))
            return true;
        else
            return false;
    }

    var draw = {
        lines: function(points) {
            points.forEach(function(AE) {
                ctx.lineTo(AE[0], AE[1]);
            });
        },
        score: function(s) {
            var num = cnvs.width / 15
            ctx.font = num + "px Verdana";
            ctx.fillText(s, cnvs.width/10, cnvs.height/10);
        },
        sky: function() {
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(0, 0, cnvs.width, cnvs.height / 2 + cnvs.height / 50);
        },
        grass: function() {
            ctx.fillStyle = 'green';
            ctx.fillRect(0, cnvs.height/2 + cnvs.height / 50, cnvs.width, cnvs.height / 2 - cnvs.height / 50);
        },
        user: function(u,turn) {
            ctx.fillStyle = 'blue';
            ctx.beginPath();

            if (turn === 'straight'){
                ctx.moveTo(u.x, u.y);
                u.amp = 0;
            }
            else if (turn === 'right')
                ctx.moveTo(u.x + u.amp * cnvs.width / 30, u.y);
            else
                ctx.moveTo(u.x - u.amp * cnvs.width / 30, u.y);
            draw.lines([[u.x + cnvs.width / 75, cnvs.height], [u.x - cnvs.width / 75, cnvs.height]]);
            ctx.fill();
        },
        block: function(e) {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.side, e.side);
        },
        shadow: function(g,e,size) {
            var sign = 1, points;
            if (size < 0) {
                sign = 0;
            }
            ctx.fillStyle = '#004d00';
            ctx.beginPath();
            //+g is because shadows weren't getting draw where they should be
            if (sign){
                ctx.moveTo(e.x, e.y + e.side + g);
                points = [[e.x + e.side, e.y + e.side +g],
                          [e.x + size + e.side, e.y + e.side/3 + g],
                          [e.x + size, e.y + e.side/3 + g]];
            }
            else{
                ctx.moveTo(e.x + e.side, e.y + e.side + g);
                points = [[e.x, e.y + e.side + g],
                          [e.x + size, e.y + e.side/3 + g],
                          [e.x + size + e.side, e.y + e.side/3 + g]];
            }
            draw.lines(points);
            ctx.fill();
        }
    }

    function init() {
        values = {cubeArray: [],
                  score: 0,
                  speed: 1.5 * cnvs.height / 500,
                  moveSpd: 2 * cnvs.width / 300,
                  user: {x: cnvs.width/2, y: cnvs.height - cnvs.height/25, turn: 'straight', amp: 0},
                  returnUserDir: function() {
                    var u = values.user;
                    if (u.turn === 'straight')
                        return {x: u.x, y: u.y};
                    else if (u.turn === 'right')
                        return {x: u.x + u.amp * cnvs.width / 30, y: u.y};
                    else
                        return {x: u.x - u.amp * cnvs.width / 30, y: u.y}
                  },
                  density: {size: 6, range: 13},
                  intervalCubes: setInterval(function()
                    { cubePush(values.density.size, 
                               values.density.range );
                    },250,false),
                  intervalUpdate: setInterval(update,20,false),
                  //v The below are for user input handling v
                  intervalSpeed: setInterval(function() {
                    values.speed += .025 * cnvs.width / 300 ;
                    values.moveSpd += .005 * cnvs.width / 300;
                    values.score +=1;
                  },1000,false),
                  leftIntvl: null,
                  rightIntvl: null,
                  leftCnt: 0,
                  rightCnt: 0
        }
        playerListen();
        return values;
    }

    function rand(size,start) {
        return Math.floor(Math.random() * size + start);
    }
})();