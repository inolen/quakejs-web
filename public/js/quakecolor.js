(function (root) {

var quakeColor = root.quakeColor = {};

function isAlphaNum(c) {
    var code = c.charCodeAt(0);
    return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

// last color is white
var colorList = ["black", "red", "green", "yellow", "blue", "cyan", "magenta", ""];

function htmlEscapeWithColor(s) {
  var i = 0;
  var ret = '';
  var color = '';
  var prev = 0;
  function addSpan(start, end) {
    var spanText = s.slice(start, end);
    if (!spanText) return;
    var escapedSpanText = htmlEscape(spanText);
    if (color) {
        ret += '<span style="color:' + color + '">' + escapedSpanText + '</span>';
    } else {
        ret += escapedSpanText;
    }
  }
  while (i < s.length) {
    if (s[i] == '^' && i+1 < s.length && isAlphaNum(s[i+1])) {
      addSpan(prev, i);

      // Update current color
      var colorIndex = (s[i+1].charCodeAt(0) - '0'.charCodeAt(0)) & 0x7;
      color = colorList[colorIndex];
      i += 2;
      prev = i;
    } else {
      i++;
    }
  }
  addSpan(prev, i);
  return ret;
}

quakeColor.htmlEscapeWithColor = htmlEscapeWithColor;

})(this);
