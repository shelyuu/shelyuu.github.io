/**
 * multiscroll.js 0.1.5 Beta / Madeon08 Edit
 * https://github.com/alvarotrigo/multiscroll.js
 * MIT licensed
 *
 * Copyright (C) 2013 alvarotrigo.com - A project by Alvaro Trigo
 */

(function($) {
	$.fn.multiscroll = function(options) {
		// Create some defaults, extending them with any options that were provided
		options = $.extend({
			'verticalCentered' : true,
			'scrollingSpeed': 700,
			'easing': 'easeInQuart',
			'menu': false,
			'sectionsColor': [],
			'anchors':[],
			'navigation': false,
			'navigationPosition': 'right', // Non-used
			'navigationColor': '#000',
			'navigationTooltips': [],
			'loopBottom': false,
			'loopTop': false,
			'css3': false,
			'paddingTop': 0,
			'paddingBottom': 0,
			'fixedElements': null,
			'normalScrollElements': null,
			'keyboardScrolling': true,
			'touchSensitivity': 5,

			// Custom selectors
			'sectionSelector': '.ms-section',
			'leftSelector': '.ms-left',
			'rightSelector': '.ms-right',

			//events
			'afterLoad': null,
			'onLeave': null,
			'afterRender': null,
			'afterResize': null
		}, options);


		//Defines the delay to take place before being able to scroll to the next section
		//BE CAREFUL! Not recommened to change it under 400 for a good behavior in laptops and
		//Apple devices (laptops, mouses...)
		var scrollDelay = 450;

		var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));

		// adding class name for right and left blocks
		if (options.rightSelector !== '.ms-right') {
			$(options.rightSelector).addClass('ms-right');
		}

		if (options.leftSelector !== '.ms-left') {
			$(options.leftSelector).addClass('ms-left');
		}

		var numberSections = $('.ms-left').find('.ms-section').length;
		var isMoving = false;
		var nav;
		var windowHeight = $(window).height();


		addMouseWheelHandler();
		// addTouchHandler(); Commented by Madeon

		//if css3 is not supported, it will use jQuery animations
		if(options.css3){
			options.css3 = support3d();
		}

		$('html, body').css({
			'overflow' : 'hidden',
			'height' : '100%'
		});

		//adding class names to each sections
		if (options.sectionSelector !== '.ms-section') {
			$(options.sectionSelector).each(function(){
				$(this).addClass('ms-section');
			});
		}

		//creating the navigation dots
		if (options.navigation) {
			$('body').append('<div id="multiscroll-nav"><ul></ul></div>');
			nav = $('#multiscroll-nav');

			nav.css('color', options.navigationColor);
			nav.addClass(options.navigationPosition);

			for (var i = 0; i < $('.ms-left .ms-section').length; i++) {
				var link = '';
				if (options.anchors.length) {
					link = options.anchors[i];
				}

				var tooltip = options.navigationTooltips[i];
				tooltip = tooltip != undefined && tooltip != '' ? tooltip : '';

				var li = '<li>'
							+ '<a class="link-nav" href="#' + link + '">' + '<span>' + (tooltip != '' ? '<div class="multiscroll-tooltip ' + options.navigationPosition + '">' + tooltip + '</div>' : '') + '</span></a>'
							
						+ '</li>';

				nav.find('ul').append(li);
			}
		}

		$('.ms-right, .ms-left').css({
			'width': '50%',
			'position': 'absolute',
			'height': '100%'
		});

		$('.ms-right').css({
			'right': '0', //https://stackoverflow.com/questions/23675457/chrome-and-opera-creating-small-padding-when-using-displaytable
			'top': '0'
		});

		$('.ms-left').css({
			'left': '0',
			'top': '0'
		});


		$('.ms-left .ms-section, .ms-right .ms-section').each(function(){
			var sectionIndex = $(this).index();

			if(options.paddingTop || options.paddingBottom){
				$(this).css('padding', options.paddingTop  + ' 0 ' + options.paddingBottom + ' 0');
			}

			if (typeof options.sectionsColor[sectionIndex] !==  'undefined') {
				$(this).css('background-color', options.sectionsColor[sectionIndex]);
			}

			if (typeof options.anchors[sectionIndex] !== 'undefined') {
				$(this).attr('data-anchor', options.anchors[sectionIndex]);
			}

			if(options.verticalCentered){
				addTableClass($(this));
			}

			//only for the left panel
			if($(this).closest('.ms-left').length && options.navigation) {
				var link = '';
				if(options.anchors.length){
					link = options.anchors[sectionIndex];
				}
				var tooltip = options.navigationTooltips[sectionIndex];
				if(typeof tooltip === 'undefined'){
					tooltip = '';
				}
				// if (options.navigation) {
				// 	nav.find('ul').append('<li data-tooltip="' + tooltip + '"><a href="#' + link + '"><span></span></a></li>');
				// }
			}
		});

		//inverting the right panel
		$('.ms-right').html( $('.ms-right').find('.ms-section').get().reverse());

		$('.ms-left .ms-section, .ms-right .ms-section').each(function(){
			var sectionIndex = $(this).index();

			$(this).css({
				'height': '100%'
			});


			if(!sectionIndex && options.navigation ){
				//activating the navigation bullet
				nav.find('li').eq(sectionIndex).find('a').addClass('active');
			}
		}).promise().done(function(){

			//if no active section is defined, the 1st one will be the default one
			if(!$('.ms-left .ms-section.active').length){
				$('.ms-right').find('.ms-section').last().addClass('active');
				$('.ms-left').find('.ms-section').first().addClass('active');
			}

			$.isFunction( options.afterRender ) && options.afterRender.call( this);

			//scrolling to the defined active section and adjusting right and left panels
			silentScroll();

			$(window).on('load', function() {
				scrollToAnchor();
			});
		});


		//detecting any change on the URL to scroll to the given anchor link
		//(a way to detect back history button as we play with the hashes on the URL)
		$(window).on('hashchange', hashChangeHandler);

		function hashChangeHandler(){
			var value =  window.location.hash.replace('#', '');
			var sectionAnchor = value;

			if(sectionAnchor.length){
				var section = $('.ms-left').find('[data-anchor="'+sectionAnchor+'"]');

				var isFirstScrollMove = (typeof lastScrolledDestiny === 'undefined' );

				if (isFirstScrollMove || sectionAnchor !== lastScrolledDestiny){
					scrollPage(section);
				}
			}
		};


		/**
		 * Sliding with arrow keys, both, vertical and horizontal
		 */
		$(document).keydown(function(e) {
			if(e.which == 40 || e.which == 38){
				e.preventDefault();
			}

			//Moving the main page with the keyboard arrows if keyboard scrolling is enabled
			if (options.keyboardScrolling && !isMoving) {
				switch (e.which) {
					//up
					case 38:
					case 33:
						$.fn.multiscroll.moveSectionUp();
						break;

					//down
					case 40:
					case 34:
						$.fn.multiscroll.moveSectionDown();
						break;

					//Home
					case 36:
						$.fn.multiscroll.moveTo(1);
						break;

					//End
					case 35:
						$.fn.multiscroll.moveTo( $('.ms-left .ms-section').length );
						break;

					default:
						return; // exit this handler for other keys
				}
			}
		});


		/**
		 * Disabling any action when pressing of the mouse wheel (Chrome, IE, Opera, Safari)
		 */
		$(document).mousedown(function(e) {
			if(e.button == 1){
				e.preventDefault();
				return false;
			}
		});

		//navigation action
		$(document).on('click', '#multiscroll-nav a', function(e){
			e.preventDefault();
			var index = $(this).parent().index();
			scrollPage($('.ms-left .ms-section').eq(index));
		});

		$(document).on('click', '#button-more , #indicator-scroll', function(e){
            e.preventDefault();
            var index = $(this).index();
            scrollPage($('.ms-left .ms-section').eq(1));

            // What you have to do here? The value to change is only the eq(X) just above.
            // Home      = 0
            // About     = 1
            // Services  = 2
            // Portfolio = 3
            // Contact   = 4
            // And so on...

            // Here is set the anchor to send user from home to about.
        });

		//navigation tooltips
		// $(document).on({
		// 	mouseenter: function(){
		// 		var tooltip = $(this).data('tooltip');
		// 		$('<div class="multiscroll-tooltip ' + options.navigationPosition +'">' + tooltip + '</div>').hide().appendTo($(this)).fadeIn(200);
		// 	},

		// 	mouseleave: function(){
		// 		$(this).find('.multiscroll-tooltip').fadeOut(200, function() {
		// 			$(this).remove();
		// 		});
		// 	}
		// }, '#multiscroll-nav li');

		if(options.normalScrollElements){
			$(document).on('mouseenter', options.normalScrollElements, function () {
				$.fn.multiscroll.setMouseWheelScrolling(false);
			});

			$(document).on('mouseleave', options.normalScrollElements, function(){
				$.fn.multiscroll.setMouseWheelScrolling(true);
			});
		}


		//when resizing the site, we adjust the heights of the sections
		$(window).on('resize', doneResizing);

		/**
		 * When resizing is finished, we adjust the slides sizes and positions
		 */
		function doneResizing() {
			windowHeight = $(window).height();
			$('.ms-tableCell').each(function() {
				$(this).css({ height: getTableHeight($(this).parent()) });
			});
			silentScroll();
			$.isFunction( options.afterResize ) && options.afterResize.call( this);
		}

		function silentScroll(){
			//moving the right section to the bottom
			if(options.css3){
				transformContainer($('.ms-left'), 'translate3d(0px, -' + $('.ms-left').find('.ms-section.active').position().top + 'px, 0px)', false);
				transformContainer($('.ms-right'), 'translate3d(0px, -' + $('.ms-right').find('.ms-section.active').position().top + 'px, 0px)', false);
			}else if ($(window).width() >= 1024) {
				$('.ms-left').css('top', -$('.ms-left').find('.ms-section.active').position().top );
				$('.ms-right').css('top', -$('.ms-right').find('.ms-section.active').position().top );
			}
		}

		$.fn.multiscroll.moveSectionUp = function(){
			var prev = $('.ms-left .ms-section.active').prev('.ms-section');

			if(!prev.length && options.loopTop){
				prev = $('.ms-left .ms-section').last();
			}

			if (prev.length) {
				scrollPage(prev);
			}
		};

		$.fn.multiscroll.moveSectionDown = function (){
			var next = $('.ms-left .ms-section.active').next('.ms-section');

			if(!next.length && options.loopBottom ){
				next = $('.ms-left .ms-section').first();
			}

			if(next.length){
				scrollPage(next);
			}
		};

		$.fn.multiscroll.moveTo = function (section){
			var destiny = '';

			if(isNaN(section)){
				destiny = $('.ms-left [data-anchor="'+section+'"]');
			}else{
				destiny = $('.ms-left .ms-section').eq( (section -1) );
			}

			scrollPage(destiny);
		};

		function scrollPage(leftDestination){
			var leftDestinationIndex = leftDestination.index();
			var rightDestination = $('.ms-right').find('.ms-section').eq( numberSections -1 - leftDestinationIndex);
			var rightDestinationIndex = numberSections - 1 - leftDestinationIndex;
			var anchorLink  = leftDestination.data('anchor');
			var activeSection = $('.ms-left .ms-section.active');
			var leavingSection = activeSection.index() + 1;
			var yMovement = getYmovement(leftDestination);

			//preventing from activating the MouseWheelHandler event
			//more than once if the page is scrolling
			isMoving = true;

			setURLHash(anchorLink);

			var topPos = {
				'left' : leftDestination.position().top,
				'right': rightDestination.position().top
			};

			rightDestination.addClass('active').siblings().removeClass('active');
			leftDestination.addClass('active').siblings().removeClass('active');

			// Use CSS3 translate functionality or...
			if (options.css3){
				//callback (onLeave)
				$.isFunction(options.onLeave) && options.onLeave.call(this, leavingSection, (leftDestinationIndex + 1), yMovement);

				var translate3dLeft = 'translate3d(0px, -' + topPos['left'] + 'px, 0px)';
				var translate3dRight = 'translate3d(0px, -' + topPos['right'] + 'px, 0px)';

				transformContainer($('.ms-left'), translate3dLeft, true);
				transformContainer($('.ms-right'), translate3dRight, true);

				setTimeout(function () {
					//callback (afterLoad)
					$.isFunction(options.afterLoad) && options.afterLoad.call(this, anchorLink, (leftDestinationIndex + 1));

					setTimeout(function () {
						isMoving = false;
					}, scrollDelay);
				}, options.scrollingSpeed);
			}else{
				//callback (onLeave)
				$.isFunction(options.onLeave) && options.onLeave.call(this, leavingSection, (leftDestinationIndex + 1), yMovement);

				$('.ms-left').animate({
					'top': -topPos['left']
				}, options.scrollingSpeed, options.easing, function(){
					$.isFunction(options.afterLoad) && options.afterLoad.call(this, anchorLink, (leftDestinationIndex + 1));

					setTimeout(function () {
						isMoving = false;
					}, scrollDelay);
				});

				$('.ms-right').animate({
					'top': -topPos['right']
				}, options.scrollingSpeed, options.easing);
			}

			//flag to avoid callingn `scrollPage()` twice in case of using anchor links
			lastScrolledDestiny = anchorLink;

			activateMenuElement(anchorLink);
			activateNavDots(anchorLink, leftDestinationIndex);
		}

		/**
		* Removes the auto scrolling action fired by the mouse wheel and tackpad.
		* After this function is called, the mousewheel and trackpad movements won't scroll through sections.
		*/
		function removeMouseWheelHandler(){
			if (document.addEventListener) {
				document.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
				document.removeEventListener('wheel', MouseWheelHandler, false); //Firefox
			} else {
				document.detachEvent("onmousewheel", MouseWheelHandler); //IE 6/7/8
			}
		}

		/**
		* Adds the auto scrolling action for the mouse wheel and tackpad.
		* After this function is called, the mousewheel and trackpad movements will scroll through sections
		*/
		function addMouseWheelHandler(){
			if (document.addEventListener) {
				document.addEventListener("mousewheel", MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
				document.addEventListener("wheel", MouseWheelHandler, false); //Firefox
			} else {
				document.attachEvent("onmousewheel", MouseWheelHandler); //IE 6/7/8
			}
		}

		/**
		 * Detecting mousewheel scrolling
		 *
		 * https://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
		 * https://www.sitepoint.com/html5-javascript-mouse-wheel/
		 */
		function MouseWheelHandler(e) {
			// cross-browser wheel delta
			e = window.event || e;
			var delta = Math.max(-1, Math.min(1,
					(e.wheelDelta || -e.deltaY || -e.detail)));

			if (!isMoving) { //if theres any #

				//scrolling down?
				if (delta < 0) {
					$.fn.multiscroll.moveSectionDown();
				}

				//scrolling up?
				else {
					$.fn.multiscroll.moveSectionUp();
				}
			}


			return false;
		}

		/**
		* Adds a css3 transform property to the container class with or without animation depending on the animated param.
		*/
		function transformContainer(container, translate3d, animated){
			container.toggleClass('ms-easing', animated);

			container.css(getTransforms(translate3d));
		}


		/**
		* Returns the transform styles for all browsers
		*/
		function getTransforms(translate3d){
			return {
				'-webkit-transform': translate3d,
				'-moz-transform': translate3d,
				'-ms-transform':translate3d,
				'transform': translate3d
			};
		}

		/**
		 * Activating the website navigation dots according to the given slide name.
		 */
		function activateNavDots(name, sectionIndex){
			if(options.navigation){
				$('#multiscroll-nav').find('.active').removeClass('active');
				if(name){
					$('#multiscroll-nav').find('a[href="#' + name + '"]').addClass('active');
				}else{
					$('#multiscroll-nav').find('li').eq(sectionIndex).find('a').addClass('active');
				}
			}
		}

		/**
		 * Activating the website main menu elements according to the given slide name.
		 */
		function activateMenuElement(name){
			if(options.menu){
				$(options.menu).find('.active').removeClass('active');
				$(options.menu).find('[data-menuanchor="'+name+'"]').addClass('active');
			}
		}

		/**
		* Retuns `up` or `down` depending on the scrolling movement to reach its destination
		* from the current section.
		*/
		function getYmovement(destiny){
			var fromIndex = $('.ms-left .ms-section.active').index();
			var toIndex = destiny.index();

			if(fromIndex > toIndex){
				return 'up';
			}
			return 'down';
		}


		/**
		* Sets the URL hash for a section with slides
		*/
		function setURLHash(anchorLink){
			if(options.anchors.length){
				location.hash = anchorLink;
			}

		}


		/**
		* Checks for translate3d support
		* @return boolean
		* https://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
		*/
		function support3d() {
			var el = document.createElement('p'),
				has3d,
				transforms = {
					'webkitTransform':'-webkit-transform',
					'OTransform':'-o-transform',
					'msTransform':'-ms-transform',
					'MozTransform':'-moz-transform',
					'transform':'transform'
				};

			// Add it to the body to get the computed style.
			document.body.insertBefore(el, null);

			for (var t in transforms) {
				if (el.style[t] !== undefined) {
					el.style[t] = "translate3d(1px,1px,1px)";
					has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
				}
			}

			document.body.removeChild(el);

			return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
		}

		/**
		* Wraps an element in order to center it vertically by using a class style.
		*/
		function addTableClass(element){
			element.addClass('ms-table').wrapInner('<div class="ms-tableCell" style="height: ' + getTableHeight(element) + 'px" />');
		}

		/**
		* Gets the height of the section after removing the paddings.
		*/
		function getTableHeight(section){
			var sectionHeight = windowHeight;

			if(options.paddingTop || options.paddingBottom){
				var paddings = parseInt(section.css('padding-top')) + parseInt(section.css('padding-bottom'));
				sectionHeight = (windowHeight - paddings);
			}

			return sectionHeight;
		}


		/**
		* Scrolls the page to the existent anchor in the URL
		*/
		function scrollToAnchor(){
			//getting the anchor link in the URL and deleting the `#`
			var sectionAnchor =  window.location.hash.replace('#', '');
			var section = $('.ms-left .ms-section[data-anchor="'+sectionAnchor+'"]');

			if(sectionAnchor.length){  //if theres any #
				scrollPage(section);
			}
		}

		/**
		* Adds or remove the possiblity of scrolling through sections by using the keyboard arrow keys
		*/
		$.fn.multiscroll.setKeyboardScrolling = function (value){
			options.keyboardScrolling = value;
		};

		/**
		* Adds or remove the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
		*/
		$.fn.multiscroll.setMouseWheelScrolling = function (value){
			if(value){
				addMouseWheelHandler();
			}else{
				removeMouseWheelHandler();
			}
		};

		/**
		* Defines the scrolling speed
		*/
		$.fn.multiscroll.setScrollingSpeed = function(value){
			options.scrollingSpeed = value;
		};



		var touchStartY = 0;
		var touchStartX = 0;
		var touchEndY = 0;
		var touchEndX = 0;

		/* Detecting touch events

		* As we are changing the top property of the page on scrolling, we can not use the traditional way to detect it.
		* This way, the touchstart and the touch moves shows an small difference between them which is the
		* used one to determine the direction.
		*/
		// function touchMoveHandler(event){
		// 	var e = event.originalEvent;

		// 	//preventing the easing on iOS devices
		// 	event.preventDefault();

		// 	var activeSection = $('.ms-left .ms-section.active');

		// 	if (!isMoving) { //if theres any #
		// 		var touchEvents = getEventsPage(e);
		// 		touchEndY = touchEvents['y'];
		// 		touchEndX = touchEvents['x'];


		// 		//is the movement greater than the minimum resistance to scroll?
		// 		if (Math.abs(touchStartY - touchEndY) > ($(window).height() / 100 * options.touchSensitivity)) {

		// 			if (touchStartY > touchEndY) {
		// 				$.fn.multiscroll.moveSectionDown();

		// 			} else if (touchEndY > touchStartY) {
		// 				$.fn.multiscroll.moveSectionUp();
		// 			}
		// 		}
		// 	}
		// } // Commented by Madeon


		/**
		* Handler to get he coordinates of the starting touch
		*/
		function touchStartHandler(event){
			var e = event.originalEvent;
			var touchEvents = getEventsPage(e);
			touchStartY = touchEvents['y'];
			touchStartX = touchEvents['x'];
		}


		/**
		* Adds the possibility to auto scroll through sections on touch devices.
		*/
		// function addTouchHandler(){
		// 	if(isTouch){
		// 		//Microsoft pointers
		// 		MSPointer = getMSPointer();

		// 		$(document).off('touchstart ' +  MSPointer.down).on('touchstart ' + MSPointer.down, touchStartHandler);
		// 		$(document).off('touchmove ' + MSPointer.move).on('touchmove ' + MSPointer.move, touchMoveHandler);
		// 	}
		// }  Commented by Madeon

		/**
		* Removes the auto scrolling for touch devices.
		*/
		// function removeTouchHandler(){
		// 	if(isTouch){
		// 		//Microsoft pointers
		// 		MSPointer = getMSPointer();

		// 		$(document).off('touchstart ' + MSPointer.down);
		// 		$(document).off('touchmove ' + MSPointer.move);
		// 	}
		// }

		/*
		* Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
		* https://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
		*/
		function getMSPointer(){
			var pointer;

			//IE >= 11
			if(window.PointerEvent){
				pointer = { down: "pointerdown", move: "pointermove"};
			}

			//IE < 11
			else{
				pointer = { down: "MSPointerDown", move: "MSPointerMove"};
			}

			return pointer;
		}

		/**
		* Gets the pageX and pageY properties depending on the browser.
		* https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
		*/
		function getEventsPage(e){
			var events = new Array();
			if (window.navigator.msPointerEnabled){
				events['y'] = e.pageY;
				events['x'] = e.pageX;
			}else{
				events['y'] = e.touches[0].pageY;
				events['x'] =  e.touches[0].pageX;
			}

			return events;
		}

		/**
		* Destroy multiscroll.js plugin's events
		*/
		$.fn.multiscroll.destroy = function() {
			$.fn.multiscroll.setKeyboardScrolling(false);
			$.fn.multiscroll.setMouseWheelScrolling(false);

			$("#right1").insertAfter("#left1");
		    $("#right2").insertAfter("#left1");
		    $("#right3").insertAfter("#left3");
		    $("#right4").insertAfter("#left4");
		    $("#right5").insertAfter("#left5");
		    // $("#right6").insertAfter("#left6");
		    // $("#right7").insertAfter("#left7");
		    // $("#right8").insertAfter("#left8");

			$(window)
				.off('hashchange', hashChangeHandler)
				.off('resize', doneResizing);
		};

		/**
		* Build multiscroll.js plugin's events after destroy
		*/
		$.fn.multiscroll.build = function() {
			$.fn.multiscroll.setKeyboardScrolling(true);
			$.fn.multiscroll.setMouseWheelScrolling(true);

			$("#right1").prependTo("#right-part");
		    $("#right2").prependTo("#right-part");
		    $("#right3").prependTo("#right-part");
		    $("#right4").prependTo("#right-part");
		    $("#right5").prependTo("#right-part");
		    // $("#right6").prependTo("#right-part");
		    // $("#right7").prependTo("#right-part");
		    // $("#right8").prependTo("#right-part");

			$(window)
				.on('hashchange', hashChangeHandler)
				.on('resize', doneResizing);
		};

	};
})(jQuery);