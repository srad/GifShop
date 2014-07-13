define(function () {
    'use strict';

    function LZW() {
        this.dict = {};
        this.indexToChar = {};

        for (var i = 0; i < 127; i += 1) {
            this.dict[String.fromCharCode(i)] = i;
            this.indexToChar[i] = String.fromCharCode(i);
        }
    }

    LZW.prototype.compress = function (word) {
        this.code = [];
        this.word = word;
        this.chars = this.word.split('');
        this.wordCode = this.word.split('').map(function (char) {
            return char.charCodeAt(0);
        });

        var lastChar = '';
        for (var i = 0; i <= this.chars.length; i += 1) {
            var currWord = lastChar + (this.chars[i] || '');
            var charCode = this.dict[currWord];

            if (charCode === undefined) {
                var newIndex = Object.keys(dict).length;
                this.dict[currWord] = newIndex;
                this.indexToChar[newIndex] = currWord;
                this.code.push(this.dict[lastChar]);
                lastChar = this.chars[i];
            }
            else {
                lastChar += this.chars[i];
            }
        }
        this.code.push(this.dict[this.chars[this.chars.length - 1]]);
        return this.code;
    };

    LZW.prototype.decompress = function () {
        var word = '';
        this.code.forEach(function (dictValue) {
            word += this.indexToChar[dictValue];
        }.bind(this));
        return word;
    };

    LZW.prototype.rate = function () {
        return (this.code.length / this.wordCode.length * 100);
    };

    return LZW;
});