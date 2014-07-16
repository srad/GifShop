require([], function () {
    'use strict';

    var canvas = document.getElementById('c'),
        context = canvas.getContext('2d'),
        colorSpaceContext = document.getElementById('colorspace').getContext('2d'),
        reducedContext = document.getElementById('reduced').getContext('2d'),
        imageObj = new Image();

    function Vec2d(x, y) {
        this.x = x;
        this.y = y;
    }

    Vec2d.prototype.toString = function () {
        return '(' + x + ',' + y + ')';
    };

    Vec2d.prototype.hash = function () {
        return this.x + '_' + this.y;
    };

    Vec2d.prototype.distanceTo = function (vec2d) {
        if (!(vec2d instanceof  Vec2d)) {
            throw new Error('Fehler');
        }
        return Math.sqrt(Math.pow(vec2d.x - this.x, 2) + Math.pow(vec2d.y - this.y, 2));
    };

    function findClosestVector(colorPalette, vec2d) {
        var distances = [];
        for (var i = 0; i < colorPalette.length; i++) {
            var color = colorPalette[i],
                distance = vec2d.distanceTo(color.vec2d);

            distances.push({vec2d: color.vec2d, distance: distance});
        }
        distances.sort(function (a, b) {
            return a.distance - b.distance;
        });
        return distances[0].vec2d;
    }

    var read = function () {
        var pixels = context.getImageData(0, 0, imageObj.width, imageObj.height).data,
            colorMapImage = colorSpaceContext.createImageData(256, 256),
            colorCount = {};

        function setPixel(imageData, x, y, r, g, b, a) {
            var index = (x + y * imageData.width) * 4;
            imageData.data[index + 0] = r;
            imageData.data[index + 1] = g;
            imageData.data[index + 2] = b;
            imageData.data[index + 3] = a;
        }

        for (var i = 0; i < pixels.length; i += 4) {
            var red = pixels[i],
                green = pixels[i + 1],
                vec2d = new Vec2d(red, green);

            if (colorCount[vec2d.hash()] === undefined) {
                colorCount[vec2d.hash()] = 1;
            } else {
                colorCount[vec2d.hash()] += 1;
            }
            setPixel(colorMapImage, red, 255 - green, red, green, 0, 255);
        }

        // Alle Farben sind jetzt in der Tabelle
        var colorArray = [];
        for (var hash in colorCount) {
            var vector = hash.split('_'),
                x = parseInt(vector[0], 10),
                y = parseInt(vector[1], 10),
                vec2d = new Vec2d(x, y);

            colorArray.push({count: colorCount[hash], vec2d: vec2d});
        }
        colorArray.sort(function (a, b) {
            return a.count - b.count;
        });

        // Frame
        for (var x = 0; x < 256; x++) {
            for (var y = 0; y < 256; y++) {
                if (y === 255 || x === 0) {
                    setPixel(colorMapImage, x, y, 0, 0, 0, 255);
                }
            }
        }

        colorSpaceContext.scale(3, 3);
        colorSpaceContext.putImageData(colorMapImage, 0, 0);

        // Reduced color
        var colors256 = colorArray.reverse().splice(0, 256),
            reducedImage = reducedContext.createImageData(300, 225);

        for (var i = 0; i < pixels.length; i += 4) {
            var red = pixels[i],
                green = pixels[i + 1],
                vec2d = new Vec2d(red, green);

            var closestVector = findClosestVector(colors256, vec2d);

            reducedImage.data[i + 0] = closestVector.x;
            reducedImage.data[i + 1] = closestVector.y;
            reducedImage.data[i + 2] = 0;
            reducedImage.data[i + 3] = 255;
        }

        reducedContext.putImageData(reducedImage, 0, 0);
    };

    imageObj.onload = function () {
        context.width = imageObj.width;
        context.height = imageObj.height;
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;
        context.drawImage(imageObj, 0, 0);
        read();
    };
    imageObj.src = 'img/red_green.png';
});