/**
 * ELIXON THEATRE
 * Project Homepage: http://www.webdevelopers.eu/jquery/theatre
 *
 * LICENSE
 *   http://www.webdevelopers.eu/jquery/theatre/license
 *   Commons Attribution-NonCommercial 3.0
 *
 *   Get a commercial license at
 *   http://www.webdevelopers.eu/jquery/theatre/buy 
 *
 * DEMO
 *    http://www.webdevelopers.eu/jquery/theatre/demo 
 * 
 * DOCUMENTATION
 *    http://www.webdevelopers.eu/jquery/theatre/documentation
 *    
 * @project    Elixon CMS, http://www.webdevelopers.eu/
 * @package    JQuery
 * @subpackage Theatre
 * @author     Daniel Sevcik <sevcik@webdevelopers.eu>
 * @version    2.5.1
 * @copyright  2010 Daniel Sevcik
 * @since      2010-11-11T22:10:07+0100
 * @revision   $Revision: 5839 $
 * @changed    $Date: 2012-06-26 15:59:33 +0200 (Tue, 26 Jun 2012) $
 * @access     public
 */
(function ($) {
    var effects = {};
    var methods = {};
    var urlBase;

    $.fn.theatre = function () {
        var currArguments = arguments;
        this.css({ "visibility": "visible", "display": "block" }); /* if the initial settings are to hide loading images... */
        (this.length ? this : $(document)).each(function () {
            methods.initAll.apply($(this), currArguments);
        });
        return this;
    };

    // name:string - 'FILE:EFFECT' or 'EFFECT', one file may register EFFECT or multiple effect prefixed by FILE string
    methods.loadEffect = function (name) {
        if (!urlBase) { // Find the locations
            $('script[src*="jquery.theatre-"], link[href*="theatre.css"]').first().each(function () {
                urlBase = (this.href || this.src).replace(/\/[^\/]*(#.*)?$/, '');
            });
        }
        var url = urlBase + '/effect.' + name.split(':')[0] + '.js';
        $('head').append('<script type="text/javascript" src="' + url + '"></script>');
        //$.getScript(url);
        return effects[name];
    };

    // Clean actors removed on-the-fly
    methods.buryDead = function (actors) {
        return actors.filter(function () { return $(this).get(0).parentNode; });
    };

    methods.initAll = function (method) {
        // Init theatre
        if (typeof method == 'object' || !method || method == 'init') {
            return this.is(document) || methods.init.apply(this, arguments); // don't init when this is document @see $.fn.theatre()
        }

        // Register Effect
        if (method == 'effect') {
            // Register new effect
            if (typeof arguments[2] == 'function') {
                return effects[arguments[1]] = arguments[2];
            } else {
                $.error("Elixon Theatre cannot register effect object unless it is a Function.");
            }
        } else if (this.is(document)) {
            return false; // do nothing, document context only for 'effect' function
        }

        var theatre = this.data('theatre');
        if (!theatre) return false; // not initialized yet

        var jumpTo = arguments[1];
        var noStop = false;
        switch (method) {
            case 'iterate':
                noStop = true;
                method = theatre.settings.playDir;
            case 'next':
            case 'prev':
                jumpTo = method;
                // continue with next 'case'
            case 'jump':
                switch (jumpTo) {
                    case 'first': jumpTo = 0; break;
                    case 'last': jumpTo = theatre.actors.length - 1; break;
                    case 'next': jumpTo = (theatre.index + theatre.actors.length + 1) % theatre.actors.length; break;
                    case 'prev': jumpTo = (theatre.index + theatre.actors.length - 1) % theatre.actors.length; break;
                    default:
                        jumpTo = (parseInt(arguments[1]) - 1) % theatre.actors.length;
                        jumpTo = (Math.abs(Math.floor(jumpTo / theatre.actors.length) * theatre.actors.length) + jumpTo) % theatre.actors.length; //normalize
                }
                if (jumpTo == theatre.index) break; // already there
                if (typeof arguments[2] != 'undefined') {
                    if (typeof theatre.settings.speedOrig == 'undefined') theatre.settings.speedOrig = theatre.settings.speed;
                    theatre.settings.speed = arguments[2];
                }
                var lastPos = theatre.index;
                if (!noStop) this.theatre('stop'); // stop previous animation/play if any			
                while (theatre.index != jumpTo) {
                    jumpTo = methods.onMove.apply(this, [jumpTo]);
                    if (jumpTo == -1) break; // cancelled by user callback

                    if (theatre.effect.jump) {
                        theatre.index = jumpTo;
                        theatre.effect.jump.apply(theatre.effect, [lastPos]);
                    } else {
                        // Which direction is closest to cycle ther using next/prev?
                        if (theatre.index < jumpTo) {
                            var dirNext = jumpTo - theatre.index;
                            var dirPrev = (theatre.index + theatre.actors.length) - jumpTo;
                        } else {
                            var dirPrev = theatre.index - jumpTo;
                            var dirNext = (theatre.actors.length + jumpTo) - theatre.index;
                        }
                        theatre.index = (theatre.index + (dirNext < dirPrev ? 1 : -1) + theatre.actors.length) % theatre.actors.length;
                        theatre.effect[dirNext < dirPrev ? 'next' : 'prev'].apply(theatre.effect, [lastPos]);
                    }
                    if (theatre.index == lastPos) break; // movement failed? cancelled by onMove() ? Avoid infinite loop.
                    lastPos = theatre.index;
                    methods.updatePaging.apply(this);
                }
                if (typeof theatre.settings.speedOrig != 'undefined') theatre.settings.speed = theatre.settings.speedOrig;
                break;
            case 'play':
            case 'destroy':
            case 'stop':
                methods[method].apply(this);
                break;
            default: // Unsupported
                $.error('Elixon Theatre method "' + method + '" does not exist on jQuery.theatre!');
        }
    };

    methods.init = function (options) {
        methods.destroy.apply(this); // Reset old if any

        // Default settings
        var settings = {
            selector: '> *:not(".theatre-control")',
            effect: 'horizontal', // 'horizontal'|'vertical'|'fade'|'show'|'slide'|'3d'|CUSTOM EFFECT NAME|OBJECT with constructor implementing the init,next,prev methods
            speed: 1000, // Transition speed
            still: 3000, // Time between transitions
            autoplay: true,
            playDir: 'next', // or 'prev'
            controls: 'horizontal', // display control buttons 'horizontal' or 'vertical' or 'none'
            itemWidth: false, // width of the item or 'max' or false. 
            itemHeight: false, // height of the item or 'max' or false. 
            width: false, // set the height of the container. By default honors the already set size using CSS
            height: false, // set the height of the container. By default honors the already set size using CSS
            onMove: false, // function(index) {}, execution context is the Stage
            onAfterMove: function () { }, // function(index) {}, execution context is the Stage			
            random: false // random order?
        };
        if (options) {
            $.extend(settings, options);
        }

        // Random
        if (settings.random) {
            var children = $('> *', this).get();
            while (children.length) {
                var idx = Math.floor(Math.random() * children.length);
                var child = children[idx];
                children.splice(idx, 1);
                child.parentNode.appendChild(child);
            }
        }

        var actors = $(settings.selector, this);
        var theatre = { paging: settings.paging && $(settings.paging), actors: actors, effect: false, settings: settings, interval: false, index: 0 };

        // Init effect object
        var fxAll;
        switch (typeof settings.effect) {
            case "string":
                fxAll = settings.effect.split(/\s+/);
                break;
            case "function":
                fxAll = [settings.effect];
                break;
        }

        // Try fx + fallbacks
        var effect;
        for (var i = 0; i < fxAll.length && !theatre.effect; i++) {
            settings.effect = fxAll[i];
            if (typeof settings.effect == 'function') {
                effect = settings.effect;
            } else if (effects[settings.effect]) {
                effect = effects[settings.effect];
            } else {
                effect = methods.loadEffect(settings.effect);
            }

            if (!effect) $.error('Elixon Theatre does not support effect "' + settings.effect + '"!');
            theatre.effect = new effects[settings.effect](this, actors, settings, theatre);

            // Capabilities
            if (typeof theatre.effect.capable == 'function') {
                var answer = theatre.effect.capable();
                if (answer !== true) {
                    if (typeof theatre.effect.destroy == 'function') theatre.effect.destroy();
                    theatre.effect = null;
                    if (fxAll.length == 1) { // allow only one automatic fallback otherwise honor only explicitly set fallbacks
                        fxAll.push(answer || settings.effect);
                    }
                }
            }
        }

        // Stage
        this.addClass('theatre').data('theatre', theatre);
        this.addClass('theatre-' + settings.effect.replace(/[^a-z0-9]+/ig, '-'));
        if (settings.width) this.css('width', settings.width);
        if (settings.height) this.css('height', settings.height);

        // Actors - calculate orig width/height
        var idx = 0;
        actors.each(function () {
            var $this = $(this);
            var currIdx = idx++;
            var getSettings = function () { return { width: $this.width(), height: $this.height(), index: currIdx }; };
            if (!$this.data('theatre')) { $this.data('theatre', getSettings()); }
            $this.load(function () { $this.data('theatre', getSettings()); }); // slow image load problem
        });
        if (settings.itemWidth || settings.itemHeight) {
            var thisObj = this;
            actors.each(function () {
                var $this = $(this);
                if (settings.itemWidth) {
                    $this.css('width', settings.itemWidth == 'max' ? (thisObj.width() - $this.outerWidth() + $this.width()) + 'px' : settings.itemWidth);
                }
                if (settings.itemHeight) {
                    $this.css('height', settings.itemHeight == 'max' ? (thisObj.height() - $this.outerHeight() + $this.height()) + 'px' : settings.itemHeight);
                }
            });
        }

        actors.addClass('theatre-actor').stop(true, true);
        theatre.effect.init();

        if (settings.autoplay) {
            methods.play.apply(this, [true]);
        }

        // Controls
        methods.appendControls.apply(this);
        methods.onMove.apply(this, [theatre.index]);
        methods.onAfterMove.apply(this);
        methods.generatePaging.apply(this);

        // Focus the actor if it is outside of the Stage
        // Good for multi-page FORM's TAB movement
        var $this = $(this);
        var mvForward = function () {
            var $actor = $(this)
				.closest('.theatre-actor')
				.add('.theatre-actor', this)
				.add(this)
				.filter('.theatre-actor')
				.first();
            var actor = $actor.data('theatre');
            if (actor && actor.index != theatre.index) {
                // Is visible actor?
                var point = $actor.offset();
                point.left += $actor.width() / 2;
                point.top += $actor.height() / 2;
                var sOffset = $this.offset();
                var inStage;
                inStage = sOffset.left < point.left && point.left < sOffset.left + $this.width();
                inStage = inStage && sOffset.top < point.top && point.top < sOffset.top + $this.height();
                if (!inStage) $this.theatre('jump', actor.index + 1);
            }
        };

        //.click(mvForward); - onclick="...jump('next')" was reversed by this
        // setTimeout is needed because on focus on next invisible page on horizontal/vertical
        // browser scrolls automatically so at that moment it is always visible
        $('a, *:input, .theatre-actor', $this)
			.focus(function () { var thisObj = this; setTimeout(function () { mvForward.apply(thisObj); }, 100); });
    };

    methods.onMove = function (nextIdx) {
        if (isNaN(nextIdx)) return -1;
        var theatre = this.data('theatre');
        if (typeof theatre.settings.onMove != 'function') return nextIdx;
        var retVal = theatre.settings.onMove.apply(this, [nextIdx, theatre.actors[nextIdx], theatre]);

        // Ret val is false
        if (typeof retVal == 'number') {
            retVal = retVal % theatre.actors.length;
        } else if (retVal === false) {
            retVal = -1;
        } else {
            retVal = nextIdx;
        }
        if (retVal >= 0) this.trigger('theatreMove', [retVal, theatre.actors[retVal], theatre]);

        return retVal;
    };

    methods.onAfterMove = function () {
        var theatre = this.data('theatre');
        if (typeof theatre.settings.onAfterMove != 'function') return false;
        theatre.settings.onAfterMove.apply(this, [theatre.index, theatre.actors[theatre.index], theatre]);
        return true;
    };

    methods.generatePaging = function () {
        var stage = this;
        var theatre = this.data('theatre');
        if (!theatre.paging) return;

        theatre.paging.each(function () {
            var $this = $(this);
            var jumpers = [];
            $('> *', $this).each(function () { jumpers.push($('<div></div>').append(this).html()); });
            var template = jumpers[jumpers.length - 1];

            // Re-generate
            for (var i = 0; i < theatre.actors.length; i++) {
                var jumpHTML = jumpers.length < i + 1 ? template : jumpers[i];
                (function (pos) {
                    $this.append(jumpHTML.replace('{#}', pos) + "\n");
                    $this.children().last().click(function () { stage.theatre('jump', pos); });
                })(i + 1);
            }
        });
        methods.updatePaging.apply(this);
    };

    methods.updatePaging = function () {
        var theatre = this.data('theatre');
        if (!theatre.paging) return;

        theatre.paging.each(function () {
            var $this = $(this);
            $('> *', $this).removeClass('active').eq(theatre.index).addClass('active');
        });
    };

    methods.appendControls = function () {
        settings = this.data('theatre').settings;
        // Controls
        if (settings.controls == 'horizontal' || settings.controls == 'vertical') {
            var thisObj = this;
            this.append('<a class="theatre-control theatre-control-' + settings.controls + '-next theatre-next"><span></span></a>');
            this.append('<a class="theatre-control theatre-control-' + settings.controls + '-prev theatre-prev"><span></span></a>');
            this.append('<a class="theatre-control theatre-control-' + settings.controls + '-play theatre-play"><span></span></a>');
            this.append('<a class="theatre-control theatre-control-' + settings.controls + '-stop theatre-stop"><span></span></a>');
            $('.theatre-next', this).click(function () { thisObj.theatre('next'); });
            $('.theatre-prev', this).click(function () { thisObj.theatre('prev'); });
            $('.theatre-play', this).click(function () { thisObj.theatre('play'); });
            $('.theatre-stop', this).click(function () { thisObj.theatre('stop'); });
            this.mouseenter(function () { $('.theatre-control', thisObj).fadeIn(); });
            this.mouseleave(function () { $('.theatre-control', thisObj).fadeOut(); });
            $('.theatre-control', this).fadeOut(0);
        }

        this.append('<a class="theatre-control theatre-sign" rel="copyright license" style="position: absolute !important; display: none !important;" href="http://www.webdevelopers.eu/jquery/theatre" title="jQuery carousel plugin"><span style="display: none !important;">Elixon Theatre jQuery Plugin</span></a>');
    };

    methods.destroy = function () {
        var theatre = this.data('theatre');
        if (theatre) {
            clearInterval(theatre.interval);
            try { // On the fly Actor's removal problem
                //this.theatre('jump', 0);
            } catch (x) {
            }
            if (typeof theatre.effect.destroy == 'function') theatre.effect.destroy();
            this.removeClass('theatre-' + theatre.settings.effect.replace(/[^a-z0-9]+/ig, '-'));
            theatre.actors.each(function () { // Restore original sizes
                var $this = $(this);
                var theatre = $this.data('theatre');
                try { // @patch try-catch by Yotam Hamiel to solve problem with images added/removed on-the-fly to runnin Theatre
                    $this.width(theatre.width);
                    $this.height(theatre.height);
                } catch (x) { }
            });
        }
        $('.theatre-control', this).remove();
    };

    methods.play = function (initDelay) {
        var theatre = this.data('theatre');
        var stage = this;
        //methods.stop.apply(this);
        //stage.theatre('next');
        stage.theatre('stop');
        !initDelay && stage.theatre('iterate');
        theatre.interval = setInterval(function () {
            stage.theatre('iterate');
        }, theatre.settings.speed + theatre.settings.still);
    };

    methods.stop = function () {
        var theatre = this.data('theatre');
        clearInterval(theatre.interval);
        theatre.interval = false;
    };

    effects['fade'] =
	effects['slide'] =
	effects['show'] = function (stage, actors, settings, theatre) {
	    var onAfterMove = function () { methods.onAfterMove.apply(stage); };
	    var x = {
	        fade: { show: 'fadeIn', hide: 'fadeOut', initStyle: { margin: 0, top: 0, left: 0, position: 'absolute', display: 'none' } },
	        slide: { show: 'slideDown', hide: 'slideUp', initStyle: {} },
	        show: { show: 'show', hide: 'hide', initStyle: {} }
	    }[settings.effect];

	    this.init = function () {
	        actors[x.hide](0).css(x.initStyle).first()[x.show](0); // actors.fadeOut(0) - does not hide it if stage has height=0 - assigning 'display:none'
	    };
	    this.next = function () {
	        actors.stop(true, true).css('z-index', 0)[x.hide](settings.speed)
				.eq(theatre.index).css('z-index', 10)[x.show](settings.speed, onAfterMove);
	    };
	    this.prev = function () {
	        actors.stop(true, true).css('z-index', 0)[x.hide](settings.speed)
				.eq(theatre.index).css('z-index', 10)[x.show](settings.speed, onAfterMove);
	    };
	    this.destroy = function () {
	        actors = methods.buryDead(actors);
	        actors.stop(true, true).css({ zIndex: '', top: '', left: '', position: '', margin: '' })[x.show](0);
	    };
	};

    effects['vertical'] =
	effects['horizontal'] = function (stage, actors, settings, theatre) {
	    var onAfterMove = function () { methods.onAfterMove.apply(stage); };
	    var x = {
	        horizontal: { 'size': 'outerWidth', 'direction': 'left' },
	        vertical: { 'size': 'outerHeight', 'direction': 'top' }
	    }[settings.effect];

	    this.init = function () {
	        stage.scroll(function () { stage.scrollTop(0).scrollLeft(0); }); // TAB in forms causes automatic scroll
	        actors.fadeOut(0);
	        this.align(0, 0);
	        actors.fadeIn();
	    };
	    this.prev = function () {
	        var curr = $(settings.selector, stage).last();
	        var blk = curr.parentsUntil('.theatre');
	        (blk.length ? blk : curr).last().prependTo(stage);
	        curr.stop(true, true).css(x.direction, -curr[x.size](true));
	        this.align(0);
	    };
	    this.next = function () {
	        var curr = $(settings.selector, stage).first();
	        var offset = this.align(-curr[x.size](true));
	        var blk = curr.parentsUntil('.theatre');
	        blk = (blk.length ? blk : curr).last();
	        blk.appendTo(stage);
	    };
	    this.destroy = function () {
	        actors = methods.buryDead(actors);
	        actors.stop(true, true).css(x.direction, '').css({ opacity: '', left: '', top: '' });
	        actors.each(function () { $(this).appendTo(stage); }); // restore order
	    };
	    this.align = function (offset, speed) {
	        stage.scrollLeft(0).scrollTop(0); // with forms the TAB adds scroll
	        $(settings.selector, stage).each(function (idx) {
	            var $this = $(this);
	            var usrCallBack = theatre.index == $this.data('theatre').index ? onAfterMove : function () { };
	            var callBack = usrCallBack;
	            if (offset < 0) {
	                callBack = function () { $this.css(x.direction, offset); usrCallBack(); };
	            }
	            var props = {};
	            props[x.direction] = offset;
	            $this.stop(true, true).animate(props, isNaN(speed) ? settings.speed : speed, callBack);
	            offset += $this[x.size](true);
	        });
	        return offset;
	    };
	};

    effects['3d'] = function (stage, actors, settings, theatre) {
        // Override custom/default settings
        var onAfterMove = function () { methods.onAfterMove.apply(stage); };

        settings.resize = false;

        var pivots = [];
        var maxWidth;
        var maxHeight;
        var styleBak = {};

        this.init = function () {
            var thisObj = this;

            styleBak.overflow = stage.css('overflow');
            stage.css('overflow', 'visible');

            maxWidth = stage.width() * 0.5;
            maxHeight = stage.height() * 0.8;
            actors.each(function (pos) {
                var rad = (2 * Math.PI * (-pos) / actors.length) + Math.PI / 2;
                var x = Math.cos(rad);
                var y = Math.sin(rad);

                /* Bias */
                y = 1 - Math.sqrt((1 - y) / 2) * 2;

                var margin = 10;
                var sizeMin = 0.2;
                var size = (y + 1) / 2 * (1 - sizeMin) + sizeMin;
                var x2 = x * (stage.width() - margin) / 2 + stage.width() / 2;
                var y2 = y * (stage.height() - margin) / 2 + stage.height() / 2;

                pivots.push({ left: x2, top: y2, x: x, y: y, size: size, rad: rad });
            });
            this.animate();
        };
        this.next = function () {
            this.animate();
        };
        this.prev = function () {
            this.animate();
        };
        this.destroy = function () {
            actors.stop(true, true).css({ 'z-index': '', opacity: '', left: '', top: '' });
            stage.css('overflow', styleBak.overflow);
        };
        this.animate = function () {
            var thisObj = this;
            actors.stop();
            actors.each(function (pos) {
                try {
                    var pivot = pivots[(pos - theatre.index + actors.length) % actors.length];
                    var dim = thisObj.calcDim($(this), maxWidth, maxHeight, pivot.size);
                    var left = Math.round(pivot.left - pivot.x * dim[0] / 2 - dim[0] / 2);
                    var top = Math.round(pivot.top - pivot.y * dim[1] / 2 - dim[1] / 2);
                    // use transitions where applicable for skew() or scale() http://www.alistapart.com/articles/understanding-css3-transitions/
                    // https://github.com/brandonaaron/jquery-cssHooks/blob/master/boxreflect.js for JQuery 1.4.3
                    $(this).css({ 'z-index': Math.round(pivot.size * 1000) }).animate({ opacity: pivot.size, left: left, top: top, width: dim[0], height: dim[1] }, settings.speed, pos == theatre.index ? onAfterMove : null);
                } catch (x) {
                    // Exceptions when adding/removing items on the fly
                }

            });
        };
        this.calcDim = function (obj, maxWidth, maxHeight, size) {
            var dim = obj.data('theatre');
            var w = maxWidth;
            var h = dim.height / dim.width * w;
            if (h > maxHeight) {
                w = maxWidth * (maxHeight / h);
                h = maxHeight;
            }
            return [Math.round(w * size), Math.round(h * size)];
        };
    };

    // Trial notification
    var sn = "WX-XXXXXX-XXXXXX";
    if (sn.match(/^W3/)) {
        var snMsg = '%45%6C%69%78%6F%6E%20%54%68%65%61%74%72%65%20%74%72%69%61%6C%20%76%65%72%73%69%6F%6E%20%68%61%73%20%65%78%70%69%72%65%64%21%20%43%6C%69%63%6B%20%4F%4B%20%74%6F%20%6F%62%74%61%69%6E%20%74%68%65%20%66%75%6C%6C%20%76%65%72%73%69%6F%6E%2E';
        var expDate = new Date(sn.replace(/^W(\d)-(\d{2})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/, "20$2-$3-$4T$5:$6:$7Z"));
        var expMethod = ["co", "nfi", "rm"];
        expDate.setTime(expDate.getTime() + 30 * 24 * 3600 * 1000);
        if (expDate.getTime() && expDate.getTime() < (new Date).getTime()) {
            if (window[expMethod.join('')](unescape(snMsg))) {
                window.location = "http://www.webdevelopers.eu/jquery/theatre/buy?trial=expired";
            }
        }
    }

})(jQuery);
