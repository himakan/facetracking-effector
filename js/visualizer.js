/**
 * The Visualizer object, after being instantiated, must be initialized with the init() method,
 * which takes an options object specifying the element to append the canvases to and the audiosource which will
 * provide the data to be visualized.
 */
var Visualizer = function() {
    var tileSize;
    var tiles = [];
    var stars = [];
    // canvas vars
    var fgCanvas;
    var fgCtx;
    var fgRotation = 0.001;
    var bgCanvas;
    var bgCtx;
    var sfCanvas;
    var sfCtx;
    var audioSource;

    var POLYGON_SIDES = 6;
    var FACETRACKING_RATE = 30;

    function ownRandom() {
        return 0.5;
        // return Math.random();
    }

    function Polygon(sides, x, y, tileSize, ctx, num) {
        this.sides = sides;
        this.tileSize = tileSize;
        this.ctx = ctx;
        this.num = num; // the number of the tile, starting at 0
        this.high = 0; // the highest colour value, which then fades out
        this.decay = this.num > 42 ? 1.5 : 2; // increase this value to fade out faster.
        this.highlight = 0; // for highlighted stroke effect;
        // figure out the x and y coordinates of the center of the polygon based on the
        // 60 degree XY axis coordinates passed in
        var step = Math.round(Math.cos(Math.PI/6)*tileSize*2);
        this.y = Math.round(step * Math.sin(Math.PI/3) * -y  );
        this.x = Math.round(x * step + y * step/2 );
        this.angle = 0;

        // calculate the vertices of the polygon
        this.vertices = [];
        for (var i = 1; i <= this.sides;i += 1) {
            x = this.x + this.tileSize * Math.cos(i * 2 * Math.PI / this.sides + Math.PI/6);
            y = this.y + this.tileSize * Math.sin(i * 2 * Math.PI / this.sides + Math.PI/6);
            this.vertices.push([x, y]);
        }
    }
    Polygon.prototype.rotateVertices = function(angle) {
        // rotate all the vertices to achieve the overall rotational effect
        // var rotation = fgRotation;
        var rotation = angle * 10;
        rotation -= audioSource.volume > 10000 ? Math.sin(audioSource.volume/800000) : 0;
        for (var i = 0; i <= this.sides-1;i += 1) {
            this.vertices[i][0] = this.vertices[i][0] -  this.vertices[i][1] * Math.sin(rotation);
            this.vertices[i][1] = this.vertices[i][1] +  this.vertices[i][0] * Math.sin(rotation);
        }
    };
    var minMental = 0, maxMental = 0;
    Polygon.prototype.calculateOffset = function(coords) {
        var angle = Math.atan(coords[1]/coords[0]);
        var distance = Math.sqrt(Math.pow(coords[0], 2) + Math.pow(coords[1], 2)); // a bit of pythagoras
        var mentalFactor = Math.min(Math.max((Math.tan(audioSource.volume/6000) * 0.5), -20), 2); // this factor makes the visualization go crazy wild
        /*
        // debug
        minMental = mentalFactor < minMental ? mentalFactor : minMental;
         maxMental = mentalFactor > maxMental ? mentalFactor : maxMental;*/
        var offsetFactor = Math.pow(distance/3, 2) * (audioSource.volume/2000000) * (Math.pow(this.high, 1.3)/300) * mentalFactor;
        var offsetX = Math.cos(angle) * offsetFactor;
        var offsetY = Math.sin(angle) * offsetFactor;
        offsetX *= (coords[0] < 0) ? -1 : 1;
        offsetY *= (coords[0] < 0) ? -1 : 1;
        return [offsetX, offsetY];
    };
    Polygon.prototype.drawPolygon = function() {
        var bucket = Math.ceil(audioSource.streamData.length/tiles.length*this.num);
        var val = Math.pow((audioSource.streamData[bucket]/255),2)*255;
        val *= this.num > 42 ? 1.1 : 1;
        // establish the value for this tile
        if (val > this.high) {
            this.high = val;
        } else {
            this.high -= this.decay;
            val = this.high;
        }

        // figure out what colour to fill it and then draw the polygon
        var r, g, b, a;
        if (val > 0) {

            this.ctx.beginPath();
            var offset = this.calculateOffset(this.vertices[0]);
            if (false) {
                var radius = Math.abs(this.vertices[1][0] - this.vertices[0][0]);
                this.ctx.arc(this.x, this.y,
                             radius / 1.5, 0, 2 * Math.PI, true);
            } else {
                this.ctx.moveTo(this.vertices[0][0] + offset[0], this.vertices[0][1] + offset[1]);
                // draw the polygon
                for (var i = 1; i <= this.sides-1;i += 1) {
                    offset = this.calculateOffset(this.vertices[i]);
                    this.ctx.lineTo (this.vertices[i][0] + offset[0], this.vertices[i][1] + offset[1]);
                }
            }
            this.ctx.closePath();

            if (val > 128) {
                r = (val-128)*2;
                g = ((Math.cos((2*val/128*Math.PI/2)- 4*Math.PI/3)+1)*128);
                b = (val-105)*3;
            }
            else if (val > 175) {
                r = (val-128)*2;
                g = 255;
                b = (val-105)*3;
            }
            else {
                r = ((Math.cos((2*val/128*Math.PI/2))+1)*128);
                g = ((Math.cos((2*val/128*Math.PI/2)- 4*Math.PI/3)+1)*128);
                b = ((Math.cos((2.4*val/128*Math.PI/2)- 2*Math.PI/3)+1)*128);
            }
            if (val > 210) {
                this.cubed = val; // add the cube effect if it's really loud
            }
            if (val > 120) {
                this.highlight = 100; // add the highlight effect if it's pretty loud
            }
            // set the alpha
            var e = 2.7182;
            a = (0.5/(1 + 40 * Math.pow(e, -val/8))) + (0.5/(1 + 40 * Math.pow(e, -val/20)));

            this.ctx.fillStyle = "rgba(" +
                Math.round(r) + ", " +
                Math.round(g) + ", " +
                Math.round(b) + ", " +
                a + ")";
            this.ctx.fill();
            // stroke
            if (val > 20) {
                var strokeVal = 20;
                this.ctx.strokeStyle =  "rgba(" + strokeVal + ", " + strokeVal + ", " + strokeVal + ", 0.5)";
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
        // display the tile number for debug purposes
        /*this.ctx.font = "bold 12px sans-serif";
         this.ctx.fillStyle = 'grey';
         this.ctx.fillText(this.num, this.vertices[0][0], this.vertices[0][1]);*/
    };
    Polygon.prototype.drawHighlight = function() {
        this.ctx.beginPath();
        // draw the highlight
        if (false) {
            var radius = Math.abs(this.vertices[1][0] - this.vertices[0][0]);
            this.ctx.arc(this.x, this.y,
                         radius / 1.5, 0, 2 * Math.PI, true);
        } else {
            var offset = this.calculateOffset(this.vertices[0]);
            this.ctx.moveTo(this.vertices[0][0] + offset[0], this.vertices[0][1] + offset[1]);
            // draw the polygon
            for (var i = 0; i <= this.sides-1;i += 1) {
                offset = this.calculateOffset(this.vertices[i]);
                this.ctx.lineTo (this.vertices[i][0] + offset[0], this.vertices[i][1] + offset[1]);
            }
        }
        this.ctx.closePath();
        var a = this.highlight/100;
        this.ctx.strokeStyle =  "rgba(255, 255, 255, " + a + ")";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.highlight -= 0.5;
    };

    var makePolygonArray = function() {
        tiles = [];
        /**
         * Arrange into a grid x, y, with the y axis at 60 degrees to the x, rather than
         * the usual 90.
         * @type {number}
         */
        var i = 0; // unique number for each tile
        tiles.push(new Polygon(POLYGON_SIDES, 0, 0, tileSize, fgCtx, i)); // the centre tile
        i++;
        for (var layer = 1; layer < 7; layer++) {
            tiles.push(new Polygon(POLYGON_SIDES, 0, layer, tileSize, fgCtx, i)); i++;
            tiles.push(new Polygon(POLYGON_SIDES, 0, -layer, tileSize, fgCtx, i)); i++;
            for(var x = 1; x < layer; x++) {
                tiles.push(new Polygon(POLYGON_SIDES, x, -layer, tileSize, fgCtx, i)); i++;
                tiles.push(new Polygon(POLYGON_SIDES, -x, layer, tileSize, fgCtx, i)); i++;
                tiles.push(new Polygon(POLYGON_SIDES, x, layer-x, tileSize, fgCtx, i)); i++;
                tiles.push(new Polygon(POLYGON_SIDES, -x, -layer+x, tileSize, fgCtx, i)); i++;
            }
            for(var y = -layer; y <= 0; y++) {
                tiles.push(new Polygon(POLYGON_SIDES, layer, y, tileSize, fgCtx, i)); i++;
                tiles.push(new Polygon(POLYGON_SIDES, -layer, -y, tileSize, fgCtx, i)); i++;
            }
        }
    };

    function Star(x, y, starSize, ctx) {
        this.x = x;
        this.y = y;
        this.angle = Math.atan(Math.abs(y)/Math.abs(x));
        this.starSize = starSize;
        this.ctx = ctx;
        this.high = 0;
    }
    Star.prototype.drawStar = function() {
        var distanceFromCentre = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

        // stars as lines
        var brightness = 200 + Math.min(Math.round(this.high * 5), 55);
        this.ctx.lineWidth= 0.5 + distanceFromCentre/2000 * Math.max(this.starSize/2, 1);
        this.ctx.strokeStyle='rgba(' + brightness + ', ' + brightness + ', ' + brightness + ', 1)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.x,this.y);
        var lengthFactor = 1 + Math.min(Math.pow(distanceFromCentre,2)/30000 * Math.pow(audioSource.volume, 2)/6000000, distanceFromCentre);
        var toX = Math.cos(this.angle) * -lengthFactor;
        var toY = Math.sin(this.angle) * -lengthFactor;
        toX *= this.x > 0 ? 1 : -1;
        toY *= this.y > 0 ? 1 : -1;
        this.ctx.lineTo(this.x + toX, this.y + toY);
        this.ctx.stroke();
        this.ctx.closePath();

        // starfield movement coming towards the camera
        var speed = lengthFactor/20 * this.starSize;
        this.high -= Math.max(this.high - 0.0001, 0);
        if (speed > this.high) {
            this.high = speed;
        }
        var dX = Math.cos(this.angle) * this.high;
        var dY = Math.sin(this.angle) * this.high;
        this.x += this.x > 0 ? dX : -dX;
        this.y += this.y > 0 ? dY : -dY;

        var limitY = fgCanvas.height/2 + 500;
        var limitX = fgCanvas.width/2 + 500;
        if ((this.y > limitY || this.y < -limitY) || (this.x > limitX || this.x < -limitX)) {
            // it has gone off the edge so respawn it somewhere near the middle.
            this.x = (ownRandom() - 0.5) * fgCanvas.width/3;
            this.y = (ownRandom() - 0.5) * fgCanvas.height/3;
            this.angle = Math.atan(Math.abs(this.y)/Math.abs(this.x));
        }
    };

    var makeStarArray = function() {
        var x, y, starSize;
        stars = [];
        var limit = fgCanvas.width / 15; // how many stars?
        for (var i = 0; i < limit; i ++) {
            x = (ownRandom() - 0.5) * fgCanvas.width;
            y = (ownRandom() - 0.5) * fgCanvas.height;
            starSize = (ownRandom()+0.1)*3;
            stars.push(new Star(x, y, starSize, sfCtx));
        }
    };


    var drawBg = function() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        var r, g, b, a;
        var val = audioSource.volume/1000;
        r = 200 + (Math.sin(val) + 1) * 28;
        g = val * 2;
        b = val * 8;
        a = Math.sin(val+3*Math.PI/2) + 1;
        bgCtx.beginPath();
        bgCtx.rect(0, 0, bgCanvas.width, bgCanvas.height);
        // create radial gradient
        var grd = bgCtx.createRadialGradient(bgCanvas.width/2, bgCanvas.height/2, val, bgCanvas.width/2, bgCanvas.height/2, bgCanvas.width-Math.min(Math.pow(val, 2.7), bgCanvas.width - 20));
        grd.addColorStop(0, 'rgba(0,0,0,0)');// centre is transparent black
        grd.addColorStop(0.8, "rgba(" +
            Math.round(r) + ", " +
            Math.round(g) + ", " +
            Math.round(b) + ", 0.4)"); // edges are reddish

        bgCtx.fillStyle = grd;
        bgCtx.fill();
        /*
         // debug data
         bgCtx.font = "bold 30px sans-serif";
         bgCtx.fillStyle = 'grey';
         bgCtx.fillText("val: " + val, 30, 30);
         bgCtx.fillText("r: " + r , 30, 60);
         bgCtx.fillText("g: " + g , 30, 90);
         bgCtx.fillText("b: " + b , 30, 120);
         bgCtx.fillText("a: " + a , 30, 150);*/
    };

    this.resizeCanvas = function() {
        if (fgCanvas) {
            // resize the foreground canvas
            fgCanvas.width = window.innerWidth;
            fgCanvas.height = window.innerHeight;
            fgCtx.translate(fgCanvas.width/2,fgCanvas.height/2);

            // resize the bg canvas
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
            // resize the starfield canvas
            sfCanvas.width = window.innerWidth;
            sfCanvas.height = window.innerHeight;
            sfCtx.translate(fgCanvas.width/2,fgCanvas.height/2);

            tileSize = fgCanvas.width > fgCanvas.height ? fgCanvas.width / 25 : fgCanvas.height / 25;

            drawBg();
            makePolygonArray();
            makeStarArray()
        }
    };

    var rotateForeground = function(angle) {
        tiles.forEach(function(tile) {
            tile.rotateVertices(angle);
        });
    };

    var draw = function() {
        fgCtx.clearRect(-fgCanvas.width, -fgCanvas.height, fgCanvas.width*2, fgCanvas.height *2);
        sfCtx.clearRect(-fgCanvas.width/2, -fgCanvas.height/2, fgCanvas.width, fgCanvas.height);

        stars.forEach(function(star) {
            star.drawStar();
        });
        tiles.forEach(function(tile) {
            tile.drawPolygon();
        });
        tiles.forEach(function(tile) {
            if (tile.highlight > 0) {
                tile.drawHighlight();
            }
        });

        // debug
        /* fgCtx.font = "bold 24px sans-serif";
         fgCtx.fillStyle = 'grey';
         fgCtx.fillText("minMental:" + minMental, 10, 10);
         fgCtx.fillText("maxMental:" + maxMental, 10, 40);*/
        requestAnimationFrame(draw);
    };

    this.init = function(options) {
        audioSource = options.audioSource;
        var container = document.getElementById(options.containerId);

        // foreground hexagons layer
        fgCanvas = document.createElement('canvas');
        fgCanvas.setAttribute('style', 'position: absolute; z-index: 10');
        fgCtx = fgCanvas.getContext("2d");
        container.appendChild(fgCanvas);

        // middle starfield layer
        sfCanvas = document.createElement('canvas');
        sfCtx = sfCanvas.getContext("2d");
        sfCanvas.setAttribute('style', 'position: absolute; z-index: 5');
        container.appendChild(sfCanvas);

        // background image layer
        bgCanvas = document.createElement('canvas');
        bgCtx = bgCanvas.getContext("2d");
        container.appendChild(bgCanvas);

        makePolygonArray();
        makeStarArray();

        this.resizeCanvas();
        draw();


        setInterval(drawBg, 100);
        // setInterval(rotateForeground, 20);
        // resize the canvas to fill browser window dynamically
        window.addEventListener('resize', this.resizeCanvas, false);
    };

    this.initCanvas = function() {
        if (fgCanvas) {
            // resize the foreground canvas
            fgCanvas.width = CANVAS_WIDTH;
            fgCanvas.height = CANVAS_HEIGHT;
            fgCtx.translate(fgCanvas.width/2,fgCanvas.height/2);

            sfCanvas.width = CANVAS_WIDTH;
            sfCanvas.height = CANVAS_HEIGHT;
            sfCtx.translate(fgCanvas.width/2,fgCanvas.height/2);
        }
    }

    this.setAngle = function(angle) {
        // rotateForeground(angle);
    }

    this.setPosition = function(x, y, z) {
        // -100 ... 0 ... 100
        z = 1.7 - z / 50;
        if (fgCanvas) {
            // resize the foreground canvas
            fgCanvas.width = window.innerWidth;
            fgCanvas.height = window.innerHeight;
            fgCtx.translate(fgCanvas.width / 2 + x * FACETRACKING_RATE,
                            fgCanvas.height / 2 + y * -FACETRACKING_RATE)

            fgCtx.scale(z, z);

            // resize the bg canvas
            // bgCanvas.width = window.innerWidth;
            // bgCanvas.height = window.innerHeight;
            // resize the starfield canvas
            sfCanvas.width = window.innerWidth;
            sfCanvas.height = window.innerHeight;
            sfCtx.translate(sfCanvas.width / 2 + x * FACETRACKING_RATE,
                            sfCanvas.height / 2 + y * -FACETRACKING_RATE)

            tileSize = fgCanvas.width > fgCanvas.height ? fgCanvas.width / 25 : fgCanvas.height / 25;

            drawBg();
            makePolygonArray();
            makeStarArray()
        }
    }
};
