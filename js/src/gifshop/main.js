require([], function () {
    'use strict';

    var canvas = document.getElementById('c'),
        context = canvas.getContext('2d'),
        colorSpaceContext = document.getElementById('colorspace').getContext('2d'),
        imageObj = new Image();

    var read = function () {
        var pixels = context.getImageData(0, 0, imageObj.width, imageObj.height).data,
            colorMapImage = colorSpaceContext.createImageData(256, 256);

        function setPixel(imageData, x, y, r, g, b, a) {
            var index = (x + y * imageData.width) * 4;
            imageData.data[index + 0] = r;
            imageData.data[index + 1] = g;
            imageData.data[index + 2] = b;
            imageData.data[index + 3] = a;
        }

        for (var i = 0; i < pixels.length; i += 4) {
            var red = pixels[i],
                green = pixels[i + 1];

            setPixel(colorMapImage, red, 255 - green, red, green, 0, 255);
        }

        // Rahmen
        for (var x = 0; x < 256; x++) {
            for (var y = 0; y < 256; y++) {
                if (y === 255 || x === 0 ) {
                    setPixel(colorMapImage, x, y, 0, 0, 0, 255);
                }
            }
        }

        colorSpaceContext.scale(3, 3);
        colorSpaceContext.putImageData(colorMapImage, 0, 0);
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