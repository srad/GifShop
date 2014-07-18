require(['domReady'], function (domReady) {
    'use strict';

    domReady(function () {
        var urlArgs = window.location.href.split('#'),
            params = (urlArgs[1] !== undefined) ? urlArgs[1].split(';') : [256],
            paramColor = params[0],
            paramImage = (params[1] !== undefined) ? decodeURI(params[1]) : 'img/sweets.png',
            btn = document.getElementById('btn'),
            colorTitle = document.getElementById('colorTitle'),
            paletteSize = document.getElementById('paletteSize'),
            colors = parseInt(paramColor, 10) || 256,
            imageUrl = document.getElementById('imageUrl');

        colorTitle.innerHTML = colorTitle.innerHTML.replace('!x!', colors);
        imageUrl.value = paramImage;

        btn.onclick = function (event) {
            window.location = window.location.href.split('#')[0] + '#' + paletteSize.value + ';' + encodeURI(imageUrl.value);
            window.location.reload();
        };

        paletteSize.value = colors;

        var canvas = document.getElementById('c'),
            context = canvas.getContext('2d'),
            colorSpaceContext = document.getElementById('colorspace').getContext('2d'),
            reducedElement = document.getElementById('reduced'),
            reducedContext = document.getElementById('reduced').getContext('2d'),
            palette = document.getElementById('palette'),
            paletteContext = palette.getContext('2d'),
            paletteSpaceContext = document.getElementById('paletteSpace'),
            paletteSpaceContext = paletteSpaceContext.getContext('2d'),
            imageObj = new Image(),
            PALETTE_SIZE = colors;

        imageObj.onload = function () {
            context.width = imageObj.width;
            context.height = imageObj.height;
            canvas.width = imageObj.width;
            canvas.height = imageObj.height;

            reducedContext.height = imageObj.height;
            reducedContext.width = imageObj.width;
            reducedElement.height = imageObj.height;
            reducedElement.width = imageObj.width;

            context.drawImage(imageObj, 0, 0);
            read();
        };

        imageObj.src = paramImage;

        function Vec3d(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        Vec3d.prototype.toString = function () {
            return '(' + this.x + ',' + this.y + ',' + this.z + ')';
        };

        Vec3d.prototype.hash = function () {
            return this.x + '_' + this.y + '_' + this.z;
        };

        Vec3d.hashToVector = function (hash) {
            var components = hash.split('_').map(function (val) {
                return parseInt(val, 10);
            });

            return new Vec3d(components[0], components[1], components[2]);
        };

        Vec3d.prototype.distanceTo = function (vec3d) {
            if (!(vec3d instanceof  Vec3d)) {
                throw new Error('Fehler');
            }
            return Math.sqrt(Math.pow(vec3d.x - this.x, 2) + Math.pow(vec3d.y - this.y, 2) + Math.pow(vec3d.z - this.z, 2));
        };

        var cache = {};

        function findClosestVector(colorPalette, vec3d) {
            if (cache[vec3d.hash()] !== undefined) {
                return cache[vec3d.hash()];
            }

            var distances = [],
                distance = 99999999999999999999,
                closestVec;

            for (var i = 0; i < colorPalette.length; i++) {
                var color = colorPalette[i],
                    currentDistance = vec3d.distanceTo(color.vec3d);

                if (currentDistance < distance) {
                    distance = currentDistance;
                    closestVec = color.vec3d;
                }
            }

            cache[vec3d.hash()] = closestVec;

            return closestVec;
        }

        function drawFrame(image) {
            // Frame
            for (var x = 0; x < 256; x++) {
                for (var y = 0; y < 256; y++) {
                    if (y === 255 || x === 0) {
                        setPixel(image, x, y, 0, 0, 0, 255);
                    }
                }
            }
        }

        function drawColorDistribution(context, pixels) {
            var colorMapImage = context.createImageData(256, 256),
                colorCount = {};

            for (var i = 0; i < pixels.length; i += 4) {
                var red = pixels[i],
                    green = pixels[i + 1],
                    blue = pixels[i + 2],
                    vec3d = new Vec3d(red, green, blue);

                if (colorCount[vec3d.hash()] === undefined) {
                    colorCount[vec3d.hash()] = 1;
                } else {
                    colorCount[vec3d.hash()] += 1;
                }
                setPixel(colorMapImage, red, 255 - green, red, green, 0, 255);
            }
        }

        function drawPalette(context, colors) {
            var size = 24,
                xOffset = 0,
                yOffset = 0,
                colorsPerRow = 20,
                gapBetweenColors = 2;

            palette.width = size * colorsPerRow;
            palette.height = Math.max(size, (size * Math.ceil(colors.length / colorsPerRow)) - gapBetweenColors);

            for (var i = 0; i < colors.length; i++) {
                var color = colors[i];

                context.fillStyle = "rgb(" + color.vec3d.x + "," + color.vec3d.y + "," + color.vec3d.z + ")";
                context.fillRect(xOffset, yOffset, size - gapBetweenColors, size - gapBetweenColors);

                xOffset += size;

                if ((i + 1) % colorsPerRow === 0) {
                    yOffset += size;
                    xOffset = 0;
                }
            }
        }

        function setPixel(imageData, x, y, r, g, b, a) {
            var index = (x + y * imageData.width) * 4;
            imageData.data[index + 0] = r;
            imageData.data[index + 1] = g;
            imageData.data[index + 2] = b;
            imageData.data[index + 3] = a;
        }

        var read = function () {
            var pixels = context.getImageData(0, 0, imageObj.width, imageObj.height).data,
                colorMapImage = colorSpaceContext.createImageData(256, 256),
                colorCount = {};

            for (var i = 0; i < pixels.length; i += 4) {
                var red = pixels[i],
                    green = pixels[i + 1],
                    blue = pixels[i + 2],
                    vec3d = new Vec3d(red, green, blue);

                if (colorCount[vec3d.hash()] === undefined) {
                    colorCount[vec3d.hash()] = 1;
                } else {
                    colorCount[vec3d.hash()] += 1;
                }
                setPixel(colorMapImage, red, 255 - green, red, green, 0, 255);
            }

            // Alle Farben sind jetzt in der Tabelle
            var colorArray = [];
            for (var hash in colorCount) {
                var vector = Vec3d.hashToVector(hash);

                colorArray.push({count: colorCount[hash], vec3d: vector});
            }
            colorArray.sort(function (a, b) {
                return a.count - b.count;
            });
            drawFrame(colorMapImage);

            colorSpaceContext.scale(3, 3);
            colorSpaceContext.putImageData(colorMapImage, 0, 0);

            // Reduced color
            var colors256 = colorArray.reverse().splice(0, PALETTE_SIZE),
                reducedImage = reducedContext.createImageData(imageObj.width, imageObj.height);

            for (var i = 0; i < pixels.length; i += 4) {
                var red = pixels[i],
                    green = pixels[i + 1],
                    blue = pixels[i + 2],
                    vec3d = new Vec3d(red, green, blue);

                var closestVector = findClosestVector(colors256, vec3d);

                reducedImage.data[i + 0] = closestVector.x;
                reducedImage.data[i + 1] = closestVector.y;
                reducedImage.data[i + 2] = closestVector.z;
                reducedImage.data[i + 3] = 255;
            }
            reducedContext.putImageData(reducedImage, 0, 0);

            drawPalette(paletteContext, colors256);
            var paletteImage = paletteSpaceContext.createImageData(256, 256);
            for (var i = 0; i < colors256.length; i++) {
                var color = colors256[i];
                // invert y axis
                setPixel(paletteImage, color.vec3d.x, 255 - color.vec3d.y, color.vec3d.x, color.vec3d.y, 0, 255);
            }
            drawFrame(paletteImage);
            paletteSpaceContext.putImageData(paletteImage, 0, 0);

        };
    });
});