/* Extend IIPMooViewer to handle blending

   Copyright (c) 2007-2019 Ruven Pillay <ruven@users.sourceforge.net>
   IIPImage: http://iipimage.sourceforge.net

   --------------------------------------------------------------------
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   --------------------------------------------------------------------
*/

'use strict';

var probabilityThreshold = 0;

IIPMooViewer.implement({

  /* Take a list of images and add a control panel for blending
   */
  blend: function(images) {

    // We build this only after the viewer has fully loaded
    this.addEvent('load', function(){



      // Build our controls
      this.createBlendingInterface();



      // Go through our list of images and inject them into our menus
     // each image in separate option
      images.each( function(item){
	var o = new Element('option', {
	  'value': item[0],
	  'html': item[1]
	 });
	if(item[1] == 'slide'){
		o.inject( document.id('baselayer') );}
	else if(item[1] == 'probabilities'){
		o.inject( document.id('overlay') );}
	else if(item[1] == 'annotation'){
        	o.inject( document.id('overlay_2')); }
      });
    // Create images and layers for blending sliders to work
    this.images[1] = {src: document.id('overlay').value, opacity: 0};
    this.canvas.getChildren('img.layer1').destroy();
   this.images[2] = {src: document.id('overlay_2').value, opacity: 0};
   this.canvas.getChildren('img.layer2').destroy();
    this.requestImages();


      var _this = this;

    });
   },


  /* Create our control panel and add events
   */
  createBlendingInterface: function() {

    var _this = this;

    // Create our control panel and inject it into our container
    new Element( 'div', {
      'class': 'blending',
      'html': '<h2 title="<h2>Image Comparison</h2>Select the pair of images you wish<br/>to compare from the menus below.<br/>Use the slider to blend smoothly<br/>between them">Image Comparison</h2> <span>Image 1</span> <select id="baselayer"></select> <br /> <br /> <span>Move slider to blend between images:</span> <br /> <div id="area"> <div id="knob"></div> </div> <br /> <span>Image 2</span> <select id="overlay"></select> <br /> <br /> <span>Threshold: <span id="probabilityThreshold"></span> </span> <br /> <div id="area-t"> <div id="knob-t"></div> </div> <br /> <span>Image 3</span> <select id="overlay_2"></select> <br /> <br /> <span>Move slider to blend between images:</span> <br /> <div id="area_2"> <div id="knob_2"></div> </div> '
    }).inject( this.navigation.navcontainer );

    document.getElementById("probabilityThreshold").innerHTML = probabilityThreshold;

    // Add a tooltip
    new Tips( 'div.blending h2', {
      className: 'tip',
      onShow: function(t){ t.setStyle('opacity',0); t.fade(0.7); },
      onHide: function(t){ t.fade(0); }
    });

    // Create our blending slider
    var slider = new Slider( document.id('area'), document.id('knob'), {
      range: [0,100],
      onChange: function(pos){
         if( _this.images[1] ){
           _this.images[1].opacity = pos/100.0;
           _this.canvas.getChildren('img.layer1').setStyle( 'opacity', _this.images[1].opacity );
         }
      }
    });
    // Make sure the slider takes into account window resize events
    window.addEvent('resize', function(){ slider.autosize(); });

    // Create our thresholding slider2
    var sliderT = new Slider( document.id('area-t'), document.id('knob-t'), {
      range: [0,100],
      onChange: function(pos){
         document.getElementById("probabilityThreshold").innerHTML = probabilityThreshold;
         probabilityThreshold = pos;
        // need to destroy previous layers before requestImage otherwise they will append on each other
         _this.canvas.getChildren('img.layer1').destroy();
	_this.canvas.getChildren('img.layer0').destroy();
        _this.canvas.getChildren('img.layer2').destroy();
         _this.tiles.empty();
         _this.requestImages();
      }
    });
    // Make sure the slider takes into account window resize events
    window.addEvent('resize', function(){ sliderT.autosize(); });

    // Create our second  blending slider
    var slider_2 = new Slider( document.id('area_2'), document.id('knob_2'), {
      range: [0,100],
      onChange: function(pos){
         if( _this.images[2] ){
           _this.images[2].opacity = pos/100.0;
           _this.canvas.getChildren('img.layer2').setStyle( 'opacity', _this.images[2].opacity );
         }
      }
    });
    // Make sure the slider takes into account window resize events
    window.addEvent('resize', function(){ slider_2.autosize(); });

/*

    // Add on change events to our select menus
    document.id('baselayer').addEvent('change', function(){
      _this.images[0].src = document.id('baselayer').value;
      _this.canvas.getChildren('img.layer0').destroy();
      _this.tiles.empty();
      _this.requestImages();
    });

    document.id('overlay').addEvent('change', function(){
      var opacity = 0;
      if( _this.images[1] ) opacity = _this.images[1].opacity;
      _this.images[1] = {src: document.id('overlay').value, opacity: opacity};
      _this.canvas.getChildren('img.layer1').destroy();
      _this.tiles.empty();
      _this.requestImages();
    });




   document.id('overlay_2').addEvent('change', function(){
      var opacity = 0;
      if( _this.images[2] ) opacity = _this.images[2].opacity;
      _this.images[2] = {src: document.id('overlay_2').value, opacity: opacity};
      _this.canvas.getChildren('img.layer2').destroy();
      _this.tiles.empty();
      _this.requestImages();
    });

*/




  },




  /* Take a list of images and add a slider for continous blending
   */
  multiblend: function(images) {

    this.blend_list = images;
    this.blend_index = 0;
    this.images[1] = {src: images[1][0], sds: '0,90', opacity: 0};


    // We build this only after the viewer has fully loaded
    this.addEvent('load', function(){
      // Build our controls
      this.createMultiBlendInterface();
    });
   },


  /* Create our control panel and add events
   */
  createMultiBlendInterface: function() {

    var _this = this;

    // Create our control panel and inject it into our container
    var multiblend = new Element( 'div', {
      'class': 'blending multiblend',
      'html': '<h2 title="<h2>Image Comparison</h2>Move the slider to blend through<br/>the different images">Image Comparison</h2><div id="area"><div id="knob"></div></div><div class="caption"></div>'
    }).inject( this.container );


    // Add a tooltip
    new Tips( 'div.blending h2', {
      className: 'tip',
      onShow: function(t){ t.setStyle('opacity',0); t.fade(0.7); },
      onHide: function(t){ t.fade(0); }
    });


    // Create our blending slider - unlike with a menu-driven interface, we
    // need to track our current 2 visible images and update our main list
    // appropriately
    var slider = new Slider( document.id('area'), document.id('knob'), {
      range: [0,99],
      mode: "horizontal",
      wheel: true,
      onChange: function(pos){
	if( _this.images[1] ){

          var transition = 100/(_this.blend_list.length-1);

	  // Calculate the index for our base layer and clamp to zero if necessary
          var layer0 = Math.floor((_this.blend_list.length-1)*pos/100);
	  if( layer0 < 0 ) layer0 = 0;

	  // Our overlay must be the next one - limit to the last in the list
          var layer1 = layer0 + 1;
	  if( layer1 >= _this.blend_list.length ) layer1 = _this.blend_list.length-1;

	  // Calculate opacity of the overlay
	  _this.images[1].opacity = (pos % transition) / transition;

	  if( layer0 == layer1 ) alert( "layers are equal" ); // should never trigger
	  if( layer0 != _this.blend_index ){

            _this.images[0].src = _this.blend_list[layer0][0];
	    _this.images[1].src = _this.blend_list[layer1][0];

	    var layers_0 = _this.canvas.getChildren('img.layer0');
	    var layers_1 = _this.canvas.getChildren('img.layer1')

	    var index2 = _this.blend_index+1;
	    if( index2 > _this.blend_list.length-1 ) index2 = _this.blend_list.length-1;

	    // Slider moved to next image on the right
	    if( layer0 == _this.blend_index + 1 ){
	      _this.nTilesLoaded -= layers_0.length;
	      // Update the image URLs for this layer
	      layers_0.each( function(t){
		var regex = new RegExp( _this.blend_list[_this.blend_index][0] );
		var url = t.get('src' ).replace( regex, _this.images[1].src );
		t.set( 'src', url );
	      });
	      // Invert our layer classes
	      layers_0.addClass('layer1').removeClass('layer0');
	      layers_1.addClass('layer0').removeClass('layer1').setStyle('opacity',null);
	    }
	    // Slider moved back to previous image on left
	    else if( layer0 == this.blend_index - 1 ){
	      _this.nTilesLoaded -= layers_1.length;
	      // Update the image URLs for this layer
	      layers_1.each( function(t){
		var regex = new RegExp( _this.blend_list[index2][0] );
		var url = t.get('src' ).replace( regex, _this.images[0].src );
		t.set( 'src', url );
	      });
	      // Invert our layer classes - do layer 1 first to avoid flashing effect
	      layers_1.addClass('layer0').setStyle('opacity',null).removeClass('layer1');
	      layers_0.addClass('layer1').removeClass('layer0');
	    }
	    // Movements of more than 1, so reload both layers - no swapping of class labels
	    else{
	      _this.nTilesLoaded = 0;
	      layers_0.each( function(t){
                var regex = new RegExp( _this.blend_list[_this.blend_index][0] );
                var url = t.get('src' ).replace( regex, _this.images[0].src );
                t.set( 'src', url );
              });
	      layers_1.each( function(t){
                var regex = new RegExp( _this.blend_list[index2][0] );
                var url = t.get('src' ).replace( regex, _this.images[1].src );
                t.set( 'src', url );
              });
	      layers_0.setStyle('opacity',null);
	    }

	    _this.blend_index = layer0;
	  }

	  _this.canvas.getChildren('img.layer1').setStyle( 'opacity', _this.images[1].opacity );
	}
      }
    });


    var el = multiblend.getElement('div.caption');
    for( var n=0; n<this.blend_list.length; n++ ){
      new Element( 'span',{
	'html': this.blend_list[n][1],
	'styles':{
	  'left': n*90/(this.blend_list.length-1) + "%"
	}
      }).inject(el);
    }

    // Make sure the slider takes into account window resize events
    window.addEvent('resize', function(){ slider.autosize(); });

  }

});