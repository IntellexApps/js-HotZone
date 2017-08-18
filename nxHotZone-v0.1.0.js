/**
 * Library for slecting a portion of an image.
 * @class
 * @classdesc Used to select an area from the image and to retreive its coordinates anr/or content.
 *
 * @author	Ivan Sabo
 */
nxHotZone = function(config) {
	var This = this;

	/** A reference to the HTML canvas element which renders the selection. */
	this.canvas = null;

	/** A reference to the context of the canvas. */
	this.context = null;

	/** The current bounds of the canvas on the viewport. */
	this.bounds = null;

	/** The image which is currently printed onto the canvas. */
	this.image = null;

	/** The origin of the click. */
	this.origin = null;

	/** Rectangle which is a current selection. */
	this.selection = null;

	/** The original image. */
	this.original = null;

	/** Configuration. */
	this.config = typeof config == 'object' ? config : {};

	/** Default configuration. */
	this.defaults = {

		/** The width of the line around the selection, in pixels. */
		lineWidth: 3,

		/** The distance around the selected area, where resize options will appear. */
		lineGrabZone: 40,

		/** The color of the line arund the selection, supports alpha channel. */
		lineColor: '#CFFF',

		/** The overlay color of the unselected area, supports alpha channel. */
		overlayColor: '#D334',

		/** The overlay color of the selected area, supports alpha channel. */
		selectedColor: null,

		/** INCOMPLETE */
		blur: 0 // INCOMPLETE
	};

	/** The method that is handling  the movement of the mouse over the canvas. @see handlers */
	this.handler = null;

	/** Cache used for parsing user supplied colors from configuration to pixels. */
	this.colorCache = {};

	/**
	 * Apply the canvas on an image DOM element and initialize everything.
	 *
	 * @param	{DOMElement}	image - The image to use.
	 *
	 * @return	{nxHotZone}	The instance of initialized class.
	 */
	this.useOnImage = function(img) {

		// Create wrapper
		var wrapper = document.createElement('div');
		wrapper.style.position = 'relative';
		wrapper.className = 'nxHotZone'

		// Put image in wrapper
		img.style.visibility = 'hidden';
		img.dataset.nxHotZone = this;
		img.parentNode.insertBefore(wrapper, img.nextSibling);
		wrapper.appendChild(img);
		bounds = wrapper.getBoundingClientRect();

		// Set the canvas up
		canvas = document.createElement('canvas');
		canvas.style.position = "absolute";
		canvas.style.top = 0;
		canvas.style.left = 0;
		canvas.width = bounds.width;
		canvas.height = bounds.height;
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
		wrapper.appendChild(canvas);

		// Load image
		return this.useOnCanvas(canvas, img.src);
	};

	/**
	 * Load the image from the supplied URL and initialize.
	 *
	 * @param	{DOMElement}	canvas - The canvas on which to use.
	 * @param	{string}		url - The URL from where to get the image.
	 */
	this.useOnCanvas = function(canvas, url) {

		// Set the canvas and load
		this.setCanvas(canvas);
		this.loadFromURL(url);

		return this;
	};

	/**
	 * Load the image from the supplied URL and initialize.
	 *
	 * @param	{string}	url - The URL from where to get the image.
	 */
	this.loadFromURL = function(url) {
		var img = new Image;
		img.onload = function() {
			This.context.drawImage(img, 0, 0);
			This.image = This.context.getImageData(0, 0, This.canvas.offsetWidth, This.canvas.offsetHeight);
			This.init();
		};
		img.src = url;
	};

	/**
	 * Set the canvas and set the context.
	 *
	 * @param	{DOMElement}	canvas	The canvas to set.
	 *
	 * @return	{DOMElement}	The canvas that is just set.
	 */
	this.setCanvas = function(canvas) {
		this.canvas = canvas;
		this.bounds = this.canvas.getBoundingClientRect();
		this.context = this.canvas.getContext("2d");
		this.canvas.dataset.nxHotZone = this;

		return this.canvas;
	};

	/**
	 * Initialize.
	 */
	this.init = function() {

		// Merge user config with default ones
		this.config = this.appendDefaultValues(this.config, this.defaults);

		// Initialize
		this.image = this.context.createImageData(this.canvas.width, this.canvas.height);
		this.original = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

		// Initial handler is select
		this.handler = this.handlers.select;

		// Set the mouse events
		this.canvas.onmousedown		= this.mouse.down;
		this.canvas.onmousemove		= this.mouse.move;
		this.canvas.onmouseup		= this.mouse.up;
		this.canvas.onmouseleave	= this.mouse.leave;
	};

	/**
	 * Get the currently selected rectangle, or null if nothing is selected.
	 *
	 * @returns	{nxHotZone#Rect}	The selected rectangle;
	 */
	this.getSelection = function() {
		return this.selection;
	};

	/**
	 * Get the selected image.
	 *
	 * @param	{string}	type - A DOMString indicating the image format. The default format type is image/png.
	 * @param	{float}		encoderOptions - A Number between 0 and 1 indicating image quality for image/jpeg or image/webIf. Default is 0.92.
	 *
	 * @return	{string}	A DOMString containing the requested data URI, or null if there is no selection.
	 */
	this.getImage = function(format, encoderOptions) {
		if(this.selection) {
			var canvas = document.createElement('canvas');
			var box = this.selection;
			canvas.width = box.width;
			canvas.height = box.height;
			canvas.getContext('2d').drawImage(this.canvas, box.left, box.top, box.width, box.height, 0, 0, box.width, box.height);
			return canvas.toDataURL(format, encoderOptions)
		}

		return null;
	};

	/**
	 * Stop active modification of the selection by the user.
	 */
	this.stop = function() {
		this.handler = null;
		this.origin = null;
	};

	/**
	 * {object} Wrapper for all mouse related events.
	 */
	this.mouse = {

		/**
		 * Mouse has been pressed, intiate dragging.
		 *
		 * @param	{object}	event - The event that trigerred this method.
		 */
		down: function(event) {

			// Set where the user clicked
			This.bounds = This.canvas.getBoundingClientRect();
			This.origin = {
				x: event.x - This.bounds.left,
				y: event.y - This.bounds.top,
				selection: This.selection
			};

			// Activate and execute handler, and update origin
			if(This.handler) {
				This.handler(This.origin.x, This.origin.y, 0, 0, This.origin.selection);
				This.origin.selection = This.selection;
			}
		},

		/**
		 * Handle the moving of the mouse as hovering or dragging.
		 *
		 * @param	{object}	event - The event that trigerred this method.
		 */
		move: function(event) {
			var cursor = 'crosshair';
			var cursorPosition = null;

			// Handle the movement as modification of current selection
			if(This.isActive()) {
				var x = event.x - This.bounds.left - This.origin.x;
				var y = event.y - This.bounds.top  - This.origin.y;

				if(This.handler != null) {
					var rect = This.handler(This.origin.x, This.origin.y, x, y, This.origin.selection);
					This.setSelection(rect);
				}

			// Do not modify selection, just check the position of the cursor
			} else if(This.selection) {
				var x = event.x - This.bounds.left - This.selection.left;
				var y = event.y - This.bounds.top  - This.selection.top;
				var grabZone = This.config.lineGrabZone + This.config.lineWidth;

				// Outside of the selection
				if(
					x <                       - grabZone ||
					x > This.selection.width  + grabZone ||
					y <                       - grabZone ||
					y > This.selection.height + grabZone
				) {
					cursorPosition = 'out';

				// Inside of the selection
				} else if(
					x >                       + grabZone &&
					x < This.selection.width  - grabZone &&
					y >                       + grabZone &&
					y < This.selection.height - grabZone
				) {
					cursorPosition = 'in';

				// On the line
				} else {

					// Get angle
					var a = Math.round(x - This.selection.width / 2);
					var b = Math.round(y - This.selection.height / 2);
					var angle = Math.atan2(a, b) / Math.PI * 180 + 180;

					// Find direction
					cursorPosition = This.getDirection(angle);
				}

				// Set cursor and handler, based on the current position of the mouse
				switch(cursorPosition) {
					case 'in':
						This.handler = This.handlers.move;
						This.canvas.style.cursor = 'move';
						break;

					case 'out':
						This.handler = This.handlers.select;
						This.canvas.style.cursor = 'default';
						break;

					case 'n': case 'nw': case 'w': case 'sw':
					case 's': case 'se': case 'e': case 'ne':
						This.handler = This.handlers['resize' + cursorPosition.toUpperCase()];
						This.canvas.style.cursor = cursorPosition + '-resize';
						break;
				}
			}
		},

		/**
		 * Mouse released, stop dragging.
		 *
		 * @param	{object}	event - The event that trigerred this method.
		 */
		up: function(event) {
			This.stop();
		},

		/**
		 * Mouse left the area, stop dragging.
		 *
		 * @param	{object}	event - The event that trigerred this method.
		 */
		leave: function(event) {
			This.stop();
		},
	};

	/**
	 * Check if the user is actively modifying the selection at this time.
	 */
	this.isActive = function() {
		return this.origin != null;
	};

	/**
	 * List of all handlers fot mouse movement.
	 * Each  all  receive x, y, dx, dy and current selection.
	 *
	 * @returns They return the array of coordinates representing x, y, width and height.
	 */
	this.handlers = {

		/**
		 * Move selection on mouse movement.
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		move: function(x, y, dx, dy, start) {
			return new this.Rect(start.left + dx, start.top + dy, start.width, start.height);
		},

		/**
		 * Handle the initial selection from the origin to any direction.
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		select: function(x, y, dx, dy, start) {
			return new this.Rect(x, y, dx, dy);
		},

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeN:  function(x, y, dx, dy, start) { return this.handlers.resize.call(this, 0 , dy,   0, -dy, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeNW: function(x, y, dx, dy, start) { return this.handlers.resize.call(this, dx, dy, -dx, -dy, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeW:  function(x, y, dx, dy, start) { return this.handlers.resize.call(this, dx,  0, -dx,   0, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeSW: function(x, y, dx, dy, start) { return this.handlers.resize.call(this, dx,  0, -dx,  dy, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeS:  function(x, y, dx, dy, start) { return this.handlers.resize.call(this, 0 ,  0,   0,  dy, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeSE: function(x, y, dx, dy, start) { return this.handlers.resize.call(this, 0 ,  0,  dx,  dy, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeE:  function(x, y, dx, dy, start) { return this.handlers.resize.call(this, 0 ,  0,  dx,   0, start); },

		/**
		 * Resize the selection by only moving the top edge (north).
		 *
		 * @param	{int}			x 	The starting x coordinate of the move, in pixels.
		 * @param	{int}			y	The starting y coordinate of the move, in pixels.
		 * @param	{int}			dx	The amount of total movement on the x coordinate, in pixels.
		 * @param	{int}			dy	The amount of total movement on the y coordinate, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resizeNE: function(x, y, dx, dy, start) { return this.handlers.resize.call(this, 0 , dy,  dx, -dy, start); },


		/**
		 * Handle the change to any edge.
		 *
		 * @param	{int}			dx 	The amount to move the left edge, in pixels.
		 * @param	{int}			dy	The amount to move the top edge, in pixels.
		 * @param	{int}			dw	The amount to change the width of the selection, in pixels.
		 * @param	{int}			dh	The amount to change the height of the selection, in pixels.
		 * @param	{nxHotZone#Rect}	start	The original rectangle.
		 *
		 * @returns	{nxHotZone#Rect}	The resulting rectangle of the modification.
		 */
		resize: function(dx, dy, dw, dh, start) {
			return new this.Rect(
				start.left + dx,
				start.top + dy,
				start.width + dw,
				start.height + dh
			);
		}
	};

	/**
	 * Clear the current selection.
	 */
	this.clear = function() {
		this.setSelection(null);
	},

	/**
	 * Set and draw the selected zone.
	 *
	 * @param	{object}	An instance of the rectangle created by nxHotZone.rect.
	 */
	this.setSelection = function(selection) {
		this.image.data = this.loadOriginalData();
		this.selection = selection;

		// If something is selected
		if(this.selection) {

			// Set the selection
			this.selection = this.selection.restrictToBoundary(0, 0, this.canvas.width, this.canvas.height);

			// Precalcualte
			var border = {
				out: {
					l: this.selection.left   - this.config.lineWidth,
					r: this.selection.right  + this.config.lineWidth,
					t: this.selection.top    - this.config.lineWidth,
					b: this.selection.bottom + this.config.lineWidth },
				in: {
					l: this.selection.left,
					r: this.selection.right,
					t: this.selection.top,
					b: this.selection.bottom }
			};

			// Process
			for(var i = 0, len = this.image.data.length; i < len; i += 4) {

				// Get coordinates
				var x = i / 4 % this.canvas.width;
				var y = Math.floor(i / 4 / this.canvas.width);

				// Outside the selection
				if(
					x < border.out.l ||
					x > border.out.r ||
					y < border.out.t ||
					y > border.out.b ) {

					this.pixel(x, y, i, this.config.overlayColor, true);

				// Inside the selection
				} else if(
					x >= border.in.l &&
					x <= border.in.r &&
					y >= border.in.t &&
					y <= border.in.b ) {

					this.pixel(x, y, i, this.config.selectedColor);

				// Line
				} else {
					this.pixel(x, y, i, this.config.lineColor);
				}
			}
		} else {
			this.handler = this.handlers.select;
		}

		this.context.putImageData(this.image, 0, 0);
	};

	/**
	 * Handle a color for a single pixel.
	 *
	 * @param	{int}	x - The x coordinate of the pixel.
	 * @param	{int}	y - The x coordinate of the pixel.
	 * @param	{mixed}	color - The color to add to the original pixel.
	 * @param	{mixed}	blur - The blue radius to use, or 0 to disable (INCOMPLETE).
	 */
	this.pixel = function(x, y, index, color, blur) {
		var pixel = this.getColor(color);

		// Set all trhee channels (RGB), with respecto to alpha
		for(var i = 0; i < 3; i++) {
			this.image.data[index + i] = Math.min(255, Math.round(this.image.data[index + i] * (1 - pixel[3]) + pixel[i] * pixel[3]));
		}

		// Blur INCOMPLETE
		if(blur && this.config.blur) {
			var half = this.config.blur / 2;
			for(var n = x - half; n < x + half; n++) {
				for(var m = y - half; m < y + half; m++) {

					// Get index of the pixel to blend with
					var b = 4 * (n + m * this.canvas.width);

					// Set all trhee channels (RGB)
					for(var c = 0; c < 3; c++) {
						this.image.data[index + c] = Math.min(255, Math.round((this.image.data[index + c] + this.image.data[b + c]) / 2));
					}
				}
			}
		}
	};

	/**
	 * Restore the original image data to `this.image`.
	 *
	 * @return	{Uint8ClampedArray}	The image data of the original image.
	 */
	this.loadOriginalData = function() {
		this.image.data = new Uint8ClampedArray(this.original.data.length);
		this.image.data.set(this.original.data);

		return this.image.data;
	};

	/**
	 * Get the direction of the resize, based on the angle at which cursor position is looking at the center of selection.
	 *
	 * @param	{float}	angle - The angle, where 0 is right above the center and increases anti-clockwise.
	 */
	this.getDirection = function(angle) {
		var directions = [ 'n', 'nw', 'w', 'sw', 's', 'se', 'e', 'ne' ];
		var index = 0;

		for(var i = 0; i < 8; i++) {
			if(angle < i * 45 + 22.5) {
				index = i;
				break;
			}
		}

		return directions[index];
	};

	/**
	 * Get a color from a string representation
	 *
	 * @param	{string}	color - A string representation of a color.
	 * @param	{array}		A color suitable to use with raw image data.
	 */
	this.getColor = function(color) {

		// Check cache
		if(typeof this.colorCache[color] == 'undefined') {

			// Set alpha value
			var pixel = new this.Color(color).toPixel();
			pixel[3] /= 255;

			this.colorCache[color] = pixel;
		}

		return this.colorCache[color];
	};

	/**
	 * Safe foreach implementation for JSON objects.
	 *
	 * @param	{Object}	obj	- The object iterate through.
	 * @param	{Object}	handler - The handler for each item; receives two parameters, first is the value and the second is the key.
	 */
	this.foreach = function(obj, handler) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key)) {
				handler.call(this, obj[key], key);
			}
		}
	};

	/**
	 * Fill in existing JSON object with default values, if those values are missing.
	 *
	 * @param	{Object}	obj	- The object to fill with default values.
	 * @param	{Object}	defaults - The default values to fill in.
	 *
	 * @returns	{Object}	The obj parameter with additinal keys that do in `defaults` parameter but do not exist in `obj`.
	 */
	this.appendDefaultValues = function(obj, defaults) {
		this.foreach(this.defaults, function(value, key) {
			if(typeof obj[key] == 'undefined') {
				obj[key] = value;
			}
		});

		return obj;
	};

	/**
	 * Basic rectangle which handle negative widths and heights to create properly oriented rectangle.
	 * @class
	 *
	 * @param	{int}	l - The x coordinate of the left edge, in pixels.
	 * @param	{int}	t - The y coordinate of the top edge, in pixels.
	 * @param	{int}	w - The desired width of the rectange, in pixels.
	 * @param	{int}	h - The desired heigth of the rectange, in pixels.
	 *
	 * @return	{object}	The resulting rectangle.
	 */
	this.Rect = function(l, t, w, h) {

		// Handle negative width and height
		if(w < 0) { l-=w=-w; }
		if(h < 0) { t-=h=-h; }

		// Set the values
		this.left	= l;
		this.top	= t;
		this.width	= w;
		this.height	= h;
		this.right	= l + w;
		this.bottom	= t + h;

		/**
		 * Restrict this rectangle to a predefined boundary.
		 *
		 * @param	{int}	l - The minimal x coordinate of the left edge, in pixels.
		 * @param	{int}	t - The minimal y coordinate of the top edge, in pixels.
		 * @param	{int}	r - The maximal x coordinate of the right edge, in pixels.
		 * @param	{int}	b - The maximal y coordinate of the bottom edge, in pixels.
		 *
		 * @return	{object}	The restricted rectangle.
		 */
		this.restrictToBoundary = function(l, t, r, b) {
			this.left = Math.min(r - this.width,  Math.max(this.left, l));
			this.top  = Math.min(b - this.height, Math.max(this.top,  t));

			return this;
		}
	};

	/**
	 * A color suitable to use with raw image data.
	 * @class
	 *
	 * @param	{string}	color - A string representation of a color.
	 */
	this.Color = function(color) {

		// Default value is transparent black
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 0;

		/**
		 * Parse a most common representation of the color: '#AARRGGBB', with optional '#' and 'AA'.
		 *
		 * @param	{string}	color - A string representation of a color.
		 *
		 * @return	{nxZone#Color}	The parsed color, or undefined if unable to parse.
		 */
		this.parseStandard16M = function(color) {
			if(match = color.match(/^\s*#?([0-9A-F][0-9A-F])?([0-9A-F][0-9A-F])([0-9A-F][0-9A-F])([0-9A-F][0-9A-F])\s*$/i)) {
				return this.load(
					parseInt(match[2], 16),
					parseInt(match[3], 16),
					parseInt(match[4], 16),
					typeof match[1] != 'undefined' ? parseInt(match[1], 16) : null
				);
			}
		};

		/**
		 * Parse a common representation of the color: '#ARGB', with optional '#' and 'A'.
		 *
		 * @param	{string}	A string representation of a color.
		 *
		 * @return	{nxZone#Color}	The parsed color, or undefined if unable to parse.
		 */
		this.parseStandard512 = function(color) {
			if(match = color.match(/^\s*#?([0-9A-F])?([0-9A-F])([0-9A-F])([0-9A-F])\s*$/i)) {
				return this.load(
					parseInt("" + match[2] + match[2], 16),
					parseInt("" + match[3] + match[2], 16),
					parseInt("" + match[4] + match[2], 16),
					typeof match[1] != 'undefined' ? parseInt("" + match[1] + match[1], 16) : null
				);
			}
		};

		/**
		 * Parse a CSS rbga representation of the color: 'rgba(r, g, b, a)', with optional 'a'.
		 *
		 * @param	{string}	A string representation of a color.
		 *
		 * @return	{nxZone#Color}	The parsed color, or null if unable to parse.
		 */
		this.parseCSSrgba = function(color) {
			if(match = color.match(/^\s*rgba?\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*(,\s*([0-9]+(\.[0-9])?)\s*)?\)\s*$/)) {
				return this.load(
					parseInt(match[1], 10),
					parseInt(match[2], 10),
					parseInt(match[3], 10),
					typeof match[1] != 'undefined' ? parseFloat(match[1], 10) * 255 : null
				);
			}
		};

		/**
		 * Helper for loading unchecked values.
		 *
		 * @param	{int}	r - Red component of the color.
		 * @param	{int}	g - Green component of the color.
		 * @param	{int}	b - Blue component of the color.
		 * @param	{float}	a - Alpha component of the color.
		 *
		 * @return	{nxZone#Color}	The standardized color.
		 */
		this.load = function(r, g, b, a) {

			// RGB
			this.r = Math.min(255, Math.max(0, Math.round(r)));
			this.g = Math.min(255, Math.max(0, Math.round(g)));
			this.b = Math.min(255, Math.max(0, Math.round(b)));

			// Alpha
			if(typeof a == 'undefined' || a == null) {
				a = 255;
			}
			this.a = Math.min(255, Math.max(0, Math.round(a)));

			return this;
		};

		// Parse
		if(color) {
			var methods = [ 'parseStandard512', 'parseStandard16M', 'parseCSSrgba' ];
			var length = methods.length;
			for(var i = 0; i < length; i++) {
				if(this[methods[i]](color) != null) {
					break;
				}
			}
		}

		/**
		 * Get pixel representation of this color.
		 *
		 * @return	{array}	Array in form of [ R, G, B, A ];
		 */
		this.toPixel = function() {
			return [ this.r, this.g, this.b, this.a ];
		};
	};

}

// Auto-load as jQuery plugin
if(typeof jQuery === 'function') {
	$.fn.nxHotZone = function(params) {
		for(var i = 0; i < this.length; i++) {
			var hotzone = new nxHotZone(params).useOnImage(this[i]);
			$(this).data('nxHotZone', hotzone);
		}
	};
}
