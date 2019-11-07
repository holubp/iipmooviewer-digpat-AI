/*
   IIPMooViewer 2.0 - Annotation Editing Extensions
   IIPImage Javascript Viewer <http://iipimage.sourceforge.net>

   Copyright (c) 2007-2012 Ruven Pillay <ruven@users.sourceforge.net>

   ---------------------------------------------------------------------------

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   ---------------------------------------------------------------------------

*/


/* Extend IIPMooViewer to handle annotations
 */
var first_annotation = true;
var doc ;
var ASAP_annot ;
var xml_annotations;
IIPMooViewer.implement({

  /* Create a new annotation, add it to our list and edit it
   */
  newAnnotation: function(new_x,new_y){

    // Create new ID for annotation
    var id = String.uniqueID();

    // Create default annotation and insert into our annotation array
   /* var a = {
      id: id,
      x: (this.wid<this.view.w) ? 0.25 : (this.view.x+this.view.w/4)/this.wid,
      y: (this.hei<this.view.h) ? 0.25 : (this.view.y+this.view.h/4)/this.hei,
      w: (this.wid<this.view.w) ? 0.5 : (this.view.w/(2*this.wid)),
      h: (this.hei<this.view.h) ? 0.5 : (this.view.h/(2*this.hei)),
      category: '',
      title: '',
      text: ''
    }; */


// new annotation will be created around click position(new_x, new_y)
// this.view.w * 0.1 this is pixel height/width of an annotation
 var a = {
      id: id,
      x: (new_x - this.view.w * 0.1/2)/this.wid,
      y: (new_y - this.view.w * 0.1/2)/this.hei,
      w: 0.1,
      h: 0.1,
      category: '',
      title: '',
      text: '',
      treshold: probabilityThreshold
    };

    // Create an array if we don't have one and push a new annotation to it
    if( !this.annotations ) this.annotations = {};
    this.annotations[id] = a;

    var _this = this;

    // Now draw the annotation
    var annotation = new Element('div', {
      'id': 'annotation-' + id,
      'class': 'annotation edit',
      'styles': {
        left: Math.round( a.x * this.wid ),
        top: Math.round( a.y * this.hei ),
       // Keep dimension of w,h in relation to current view not whole canvas
      // we are using 2x value of view width to create a square
        width: Math.round(a.w * this.view.w),
        height: Math.round(a.h * this.view.w)
      }
    }).inject( this.canvas );

    this.updateShape(annotation);
    this.editAnnotation( annotation );

  },



  /* Edit an existing annotation
   */
  editAnnotation: function(annotation){

    // Disable key bindings on container
    if( this.annotationTip ){
      this.annotationTip.hide();
      this.annotationTip.detach('div.annotation');
    }

    // Get our annotation ID
    var id = annotation.get('id').substr('annotation-'.length),
        annotation_item = this.annotations[id];

    // Remove the edit class from other annotations divs and assign to this one
    this.canvas.getChildren('div.annotation.edit').removeClass('edit');

    this.canvas.getChildren('div.annotation form').destroy();
    this.canvas.getChildren('div.annotation div.handle').destroy();

    annotation.addClass('edit');
    for( var a in this.annotations ){
      delete this.annotations[a].edit;
    }
    annotation_item.edit = true;

    // Create our edit infrastructure
    var handle = new Element('div', {
      'class': 'annotation handle',
      'title': 'resize annotation'
    }).inject( annotation );

    var form = new Element('form', {
      'class': 'annotation form',
      'styles':{
        'top': annotation.getSize().y
      }
    }).inject( annotation );

    // Create our input fields
     var html = '<table><tr><td>title</td><td>' +
        '<input type="text" name="title" tabindex="1" autofocus value="{title}">'+
        '</td></tr>' +
        '<tr><td>category</td><td>' +
        '<select tabindex="2" name="category"> <option value="0" selected>0</option>  <option value="1">1</option>  </select>' +
        '</td></tr>' +
        '<tr><td>treshold</td><td>'+annotation_item.treshold+'</td></tr>' +
        '<tr><td colspan="2">' +
        '<textarea placeholder="Add a comment..." name="text" rows="5" tabindex="3">{text}</textarea>' +
        '</td></tr></table>';

    form.set('html', html.substitute({
        title: annotation_item.title || '',
        category: annotation_item.category || '',
        text: annotation_item.text || ''
    }));

    new Element('input', {
      'type': 'submit',
      'class': 'button',
      'value': 'ok'
    }).inject( form );

    new Element('input', {
      'type': 'reset',
      'class': 'button',
      'value': 'cancel'
    }).inject( form );

    var del = new Element( 'input', {
      'type': 'button',
      'class': 'button',
      'value': 'delete'
    }).inject( form );


    // Add update event for our list of annotations
    var _this = this;
    form.addEvents({
      'submit': function(e){
        e.stop();
	_this.updateShape(this.getParent());
	annotation_item.category = e.target['category'].value;
	annotation_item.title = e.target['title'].value;
	annotation_item.text = e.target['text'].value;
	delete annotation_item.edit;
	_this.updateAnnotations();
	_this.fireEvent('annotationChange', ['updated', id]);
        if(!first_annotation){
	 _this.delete_annotation(annotation_item);
	}
       _this.save_annotation(annotation_item);
      },
      'reset': function(){
	delete annotation_item.edit;
	_this.updateAnnotations();
	},
      'keydown': function(e){ e.stopPropagation(); }
    });

    // Add a delete event to our annotation
    del.addEvent('click', function() {
	if (!first_annotation){
       _this.delete_annotation(annotation_item);
        };
      delete _this.annotations[id];
      _this.updateAnnotations();
      _this.fireEvent('annotationChange', ['deleted', id]);
    });


    // Make it draggable and resizable, but prevent this interfering with our canvas drag
    // Update on completion of movement
    var draggable = annotation.makeDraggable({
      stopPropagation: true,
      preventDefault: true,
      container: this.canvas
    });

    var resizable = annotation.makeResizable({
      handle: handle,
      stopPropagation: true,
      preventDefault: true,
      // Keep our form attached to the annotation
      onDrag: function(){ form.setStyle('top', this.element.getSize().y ); }
    });


    // Set default focus on textarea
    annotation.addEvent('mouseenter', function() {
      form.getElement('textarea').focus();
      form.getElement('textarea').value = form.getElement('textarea').value;
    });

    // Add focus events and reset values to deactivate text selection
    form.getElements('input,textarea').addEvents({
      'click': function(){
        this.focus();
        this.value = this.value;
       },
      'dblclick': function(e){ e.stopPropagation(); },
      'mousedown': function(e){ e.stopPropagation(); },
      'mousemove': function(e){ e.stopPropagation(); },
      'mouseup': function(e){ e.stopPropagation(); }
    });

  },



  /* Update the coordinates of the annotation
   */
  updateShape: function(el){

    var id = el.get('id').substr('annotation-'.length);

    // Update our list entry
    var parent = el.getParent();
    this.annotations[id].x = el.getPosition(parent).x / this.wid;
    this.annotations[id].y = el.getPosition(parent).y / this.hei;
    this.annotations[id].w = (el.getSize(parent).x-2) / this.wid;
    this.annotations[id].h = (el.getSize(parent).y-2) / this.hei;
  },


  updateAnnotations: function(){
    this.destroyAnnotations();
    this.createAnnotationsArray();
    this.drawAnnotations();
    if( this.annotationTip ) this.annotationTip.attach( 'div.annotation' );
  },


  toggleEditFlat: function(id){

  },

  //Create xml Dom in ASAP format and saves annotation info.
  save_annotation: function(annotation){
  var  _this = this;
 // for first created annotation, create DOM
 if (first_annotation){
  doc = document.implementation.createDocument("", "", null);
  ASAP_annot = doc.createElement("ASAP_Annotations");
  xml_annotations = doc.createElement("Annotations");
  ASAP_annot.appendChild(xml_annotations);
  doc.appendChild(ASAP_annot);
  var file_name = 'A-'+this.images[0].src.substring(2, this.images[0].src.length-4)+'.xml';
  // create save button
  var save_button = document.createElement("button");
  save_button.setAttribute("id","save_button");
  save_button.appendChild(document.createTextNode("Download annotations"));
  document.getElementById("viewer").appendChild(save_button);
  document.getElementById("save_button").addEventListener("click", function(){
  _this.download(file_name);
        });
 };
 first_annotation = false;
 // calculate 4 coordinates of square annotation in relation with maximum resolution (original scan resolution)
  var max_w = _this.max_size.w;
  var max_h = _this.max_size.h;
  var coordinates = [];
  coordinates[0] = [annotation.x * max_w, annotation.y * max_h ];
  coordinates[1] = [annotation.x * max_w + annotation.w *max_w ,annotation.y * max_h];
  coordinates[2] = [annotation.x * max_w + annotation.w *max_w, annotation.y * max_h + annotation.h *max_h];
  coordinates[3] = [annotation.x * max_w,annotation.y * max_h + annotation.h *max_h ];

  // create new annotation element for DOM
  var xml_annotation = doc.createElement("Annotation");
  xml_annotation.setAttribute("Name", "Annotation "+annotation.id);
  xml_annotation.setAttribute("Type", "Rectangle");
  xml_annotation.setAttribute("PartOfGroup", "None");
  xml_annotation.setAttribute("Color", "#F4FA58");
  var xml_coordinates = doc.createElement("Coordinates");

// create new coordinate element for each coordinate
 for (var i = 0; i < 4; i++) {
  var xml_coordinate = doc.createElement("Coordinate");
  xml_coordinate.setAttribute("Order", i);
  xml_coordinate.setAttribute("X", coordinates[i][0]);
  xml_coordinate.setAttribute("Y", coordinates[i][1]);
  xml_coordinates.appendChild(xml_coordinate);
}
  // append coordinates to annotation
  xml_annotation.appendChild(xml_coordinates);
  // append whole annotation to annotations
  xml_annotations.appendChild(xml_annotation);
  console.dirxml(doc);


 },

// Locally download xml doc  as filename
download: function(filename) {
 // convert xml to string
  var xmlString = new XMLSerializer().serializeToString(doc);
  var doc_text = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>'+ xmlString;
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(doc_text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
},



// If annotation exists, delete it
delete_annotation: function(annotation){
 	for (var i = 0; i < xml_annotations.childNodes.length; i++) {
  	if(xml_annotations.childNodes[i].attributes[0].nodeValue.includes(annotation.id)){
  		xml_annotations.children[i].remove();
		break;
  	}
  };
  console.dirxml(doc);
 }

});