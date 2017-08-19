# HotZone

Versatile plain-js for selecting area of an image.
Can be used to retreive selection coordinates, or content.

## Features
* Looks and feels great :)
* __Plain JavaScript__ with autodetection to install itself as as __jQuery plugin__.
* Ability to modify selected area __by moving__ it or by __single direction resize__.
* Set selection programatically.
* Supports various visual changes via simple __configuration parameters__.
* Pure canvas solution, just one wrapper <div> and a __single <canvas>__ element.

## Live demo
http://rawgit.com/intellexApps/js-HotZone/master/example/index.html

## Usage
### Plain javascript:
```js
var hotzone = new HotZone(params).useOnImage(document.getElementById('Example'));
hotzone.getSelection(); // Get coordinates
hotzone.getImage(); // Get content

hotzone.setSelection(new HotZone.Rect(50, 50, 100, 100)); // Set selection (args: left, right, width, height)
```

### jQuery
```js
$('#Example').HotZone(params);
$('#Example').data('HotZone').getSelection(); // Get coordinates
$('#Example').data('HotZone').getImage(); // Get coordinates

$('#Crop').setSelection(new HotZone.Rect(50, 50, 100, 100)); // Set selection (args: left, right, width, height)
```

## Configuration options

### Initialization params
* __lineWidth__: 3, _// The width of the line around the selection, in pixels._
* __lineGrabZone__: 40, _// The distance around the selected area, where resize options will appear._
* __lineColor__: '#CFFF', _// The color of the line arund the selection, supports alpha channel._
* __overlayColor__: '#D334', _// The overlay color of the unselected area, supports alpha channel._
* __selectedColor__: null, _// The overlay color of the selected area, supports alpha channel._

### Arguments for getImage(format, encoderOptions) method
* __format__ _// A mimetype indicating the image format. The default is image/png._
* __encoderOptions__ _// A number between 0 and 1 indicating image quality for image/jpeg or image/webIf. Default is 0.92._

## TODO
1. Optimize!
2. Blur effect.
3. Tests.
4. Events.
5. Better documentation.


## Credits
Script has been written by the [Intellex](http://intellex.rs/en) team, for novinarnica.net backend system.

