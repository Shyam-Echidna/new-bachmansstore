; (function ($, window, document, undefined) {


    // Create the defaults once
    var pluginName = 'tilesGallery2',
        defaults = {
            margin: 10,
            keepArea: true,
            enableTwitter: false,
            enableFacebook: false,
            enableGplus: false,
            enablePinterest: false,
            captionEffect: 'fade',
            captionEasing: 'swing',
            captionEffectDuration: 250,
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.$itemsCnt = this.$element.find(".items");
        this.$items = this.$itemsCnt.find(".item");

        this.options = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;

        this.tiles = [];
        this.$tilesCnt = null;
        this.completed = false;
        this.lastWidth = 0;
        this.resizeTO = 0;
        this.init();
    }

    Plugin.prototype.createGrid = function () {
        var plugin = this;
        
        for (var i = 0; i < this.$items.not(".jtg-hidden").length; i++)
            this.tiles.push(plugin.getSlot());
        
        this.tiles.sort(function (x, y) {
            return x.position - y.position;
        });

        this.$items.not(".jtg-hidden").each(function (i, item) {
            var slot = plugin.tiles[i];
            
            $(item)
    	   		.data('size', slot)
		   		.addClass('tiled')
		   		.addClass(slot.width > slot.height ? 'tile-h' : 'tile-v')
                .data('position');
        });

        //apply css
        this.$items.each(function (i, item) {
            $(item).css($(item).data('size'));
        });

        setTimeout(function () {
            plugin.$items.css({
                transition: 'all .5s'
            });
        }, 1000);
        this.completed = true;
    }

    Plugin.prototype.getSlot = function () {

        if (this.tiles.length == 0) {
            var tile = {
                top: 0,
                left: 0,
                width: this.$itemsCnt.width(),
                height: this.$itemsCnt.height(),
                area: this.$itemsCnt.width() * this.$itemsCnt.height(),
                position: 0
            };            
            return tile;
        }

        var maxTileIdx = 0;
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.area > this.tiles[maxTileIdx].area) {
                maxTileIdx = i;
            }
        }

        var tile = {};

        var maxTileData = this.tiles[maxTileIdx];

        if (maxTileData.width > maxTileData.height) {
            maxTileData.prevWidth = maxTileData.width;
            maxTileData.width = Math.floor((maxTileData.width / 2) + ((maxTileData.width / 3) * (Math.random() - .5)));

            tile = {
                top: maxTileData.top,
                left: maxTileData.left + maxTileData.width + this.options.margin,
                width: maxTileData.prevWidth - maxTileData.width - this.options.margin,
                height: maxTileData.height
            }

        } else {
            maxTileData.prevHeight = maxTileData.height;
            maxTileData.height = Math.floor((maxTileData.height / 2) + ((maxTileData.height / 3) * (Math.random() - .5)));

            tile = {
                left: maxTileData.left,
                top: maxTileData.top + maxTileData.height + this.options.margin,
                width: maxTileData.width,
                height: maxTileData.prevHeight - maxTileData.height - this.options.margin
            }
        }

        tile.area = tile.width * tile.height;
        tile.position = tile.top * 1000 + tile.left;

        maxTileData.position = maxTileData.top * 1000 + maxTileData.left;

        this.tiles[maxTileIdx] = maxTileData;
        this.tiles[maxTileIdx].area = maxTileData.width * maxTileData.height;
        
        return tile;
    }

    Plugin.prototype.reset = function () {
        var instance = this;
        instance.tiles = [];
        instance.createGrid();
        instance.$itemsCnt.find('.pic').each(function (i, o) {
            instance.placeImage(i);
        });
        instance.lastWidth = instance.$itemsCnt.width();
    }

    Plugin.prototype.onResize = function (instance) {
        if (instance.lastWidth == instance.$itemsCnt.width())
            return;

        clearTimeout(instance.resizeTO);
        instance.resizeTO = setTimeout(function () {

            if (instance.options.keepArea) {
                var area = instance.$itemsCnt.data('area');
                instance.$itemsCnt.height(area / instance.$itemsCnt.width());
            }

            instance.reset();

        }, 100);
    }

    Plugin.prototype.placeImage = function (index) {

        var $tile = this.$items.eq(index);
        var $image = $tile.find('.pic');

        var tSize = $tile.data('size');
        var iSize = $image.data('size');


        var tRatio = tSize.width / tSize.height;
        var iRatio = iSize.width / iSize.height;

        var valign = $image.data('valign') ? $image.data('valign') : 'middle';
        var halign = $image.data('halign') ? $image.data('halign') : 'center';

        var cssProps = {
            top: 'auto',
            bottom: 'auto',
            left: 'auto',
            right: 'auto',
            width: 'auto',
            height: 'auto',
            margin: '0',
            maxWidth: '999em'
        };
        if (tRatio > iRatio) {
            cssProps.width = tSize.width;
            cssProps.left = 0;

            switch (valign) {
                case 'top':
                    cssProps.top = 0;
                    break;
                case 'middle':
                    console.log($image);
                    console.log(tRatio+ " "+ iRatio);
                    console.log(tSize.width+ " "+ tSize.height);
                    console.log("top "+(tSize.width * (1 / iRatio) - tSize.height) / 2);
                    var top = (tSize.width * (1 / iRatio) - tSize.height) / 2;
                    console.log(top+tSize.height);
                    if(tSize.height-top >= tSize.height){
                        cssProps.top = 0 - top;
                    }else{
                        cssProps.top = 0;
                    }
                    
                    break;
                case 'bottom':
                    cssProps.bottom = 0;
                    break;
            }

        } else {

            cssProps.height = tSize.height;
            cssProps.top = 0;

            switch (halign) {
                case 'left':
                    cssProps.left = 0;
                    break;
                case 'center':
                    console.log($image);
                    console.log(tRatio+ " "+ iRatio);
                    console.log(tSize.width+ " "+ tSize.height);
                    console.log("left "+(tSize.height * iRatio - tSize.width) / 2);
                    var left = (tSize.height * iRatio - tSize.width) / 2;
                    console.log(left+tSize.width);
                    if(tSize.width-left >= tSize.width){
                        cssProps.left = 0 - left;
                    }else{
                        cssProps.left = 0;
                    }
                    
                    break;
                case 'right':
                    cssProps.right = 0;
                    break;
            }
        }

        $image.css(cssProps).fadeIn();
    }

    Plugin.prototype.loadImage = function (index) {
        var instance = this;
        var source = instance.$items.eq(index).find('.pic');
        var img = new Image();
        img.onerror = function () {
            console.log("error loading image [" + index + "] : " + this.src);   
            if (index + 1 < instance.$items.length)
                instance.loadImage(index + 1);
        }
        img.onload = function () {
            source.data('size', { width: this.width, height: this.height });
            instance.placeImage(index);

            if (index + 1 < instance.$items.length)
                instance.loadImage(index + 1);
        }
        img.src = source.attr('src');
    }

    Plugin.prototype.setupFilters = function () {
        var instance = this;
        instance.$element.delegate(".filters a", "click", function (e) {
            e.preventDefault();
			
			if($(this).hasClass("selected"))
				return;
				
			instance.$element.find(".filters a").removeClass("selected");
			$(this).addClass("selected");
			
            var filter = $(this).attr("href").substr(1);
            if (filter) {
                instance.$items.removeClass('jtg-hidden');
                instance.$items.show();
                instance.$items.not("." + filter).addClass("jtg-hidden").hide();                
            } else {
                instance.$items.removeClass('jtg-hidden');
                instance.$items.show();
            }

            instance.reset();
        });
    };

    Plugin.prototype.init = function () {
        var instance = this;

        this.$itemsCnt.css({
            position: 'relative',
            zIndex: 1
        });
                        
        this.$items.addClass("tile");

        if (this.options.width) {
            this.$itemsCnt.width(this.options.width);
        }

        if (this.options.height) {
            this.$itemsCnt.height(this.options.height);
        }

        this.$itemsCnt.data('area', this.$itemsCnt.width() * this.$itemsCnt.height());

        this.lastWidth = this.$itemsCnt.width();
        this.createGrid();

        this.loadImage(0);

        var instance = this;
        $(window).resize(function () {
            instance.onResize(instance);
        });

        this.setupFilters();
        this.setupHover();
        
        if(this.options.onComplete)
        	this.options.onComplete();
    };

    Plugin.prototype.setupHover = function () {
        var instance = this;
        instance.$items.each(function (i, tile) {
            var $tile = $(tile);
            var $caption = $tile.find(".caption");

            if ($caption.length > 0) {
                $caption.css({
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: 0
                });
                var props = {
                    enter: {},
                    leave: {}
                };
                switch (instance.options.captionEffect) {
                    default:
                    case "fade":
                        $caption.css({
                            left: 0,
                            top: 0
                        });
                        props.enter.opacity = 1;
                        props.leave.opacity = 0;
                        break;
                    case "slide-top":
                        $caption.css({
                            left: 0,
                            top: 0 - $tile.data('size').height
                        });
                        props.enter.top = 0;
                        props.leave.top = 0 - $tile.data('size').height;
                        props.enter.opacity = 1;
                        props.leave.opacity = 0;
                        break;
                    case "slide-bottom":
                        $caption.css({
                            left: 0,
                            bottom: 0 - $tile.data('size').height
                        });
                        props.enter.bottom = 0;
                        props.leave.bottom = 0 - $tile.data('size').height;
                        props.enter.opacity = 1;
                        props.leave.opacity = 0;
                        break;
                    case "slide-left":
                        $caption.css({
                            left: 0 - $tile.data('size').width,
                            top: 0
                        });
                        props.enter.left = 0;
                        props.leave.left = 0 - $tile.data('size').width;
                        props.enter.opacity = 1;
                        props.leave.opacity = 0;
                        break;
                    case "slide-right":
                        $caption.css({
                            right: 0 - $tile.data('size').width,
                            top: 0
                        });
                        props.enter.right = 0;
                        props.leave.right = 0 - $tile.data('size').width;
                        props.enter.opacity = 1;
                        props.leave.opacity = 0;
                        break;
                }
                $tile.mouseenter(function () {
                    $caption.css('display', 'block');
                    $caption.animate(props.enter,
                            instance.options.captionEffectDuration,
                            instance.options.captionEasing,
                            function () { });
                });
                $tile.mouseleave(function () {
                    $caption.animate(props.leave,
                            instance.options.captionEffectDuration,
                            instance.options.captionEasing,
                            function () { });
                });
            }
        });

    }

    
    //credits James Padolsey http://james.padolsey.com/
    var qualifyURL = function (url) {
        var img = document.createElement('img');
        img.src = url; // set string url
        url = img.src; // get qualified url
        img.src = null; // no server request
        return url;
    }

    

    $.fn[pluginName] = function (options) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });

        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);

                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(this, 'plugin_' + pluginName, null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };

}(jQuery, window, document));