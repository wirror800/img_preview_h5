/*
 * jQuery File Upload Preview Plugin 1.0
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2015, Wirror Yin
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/* jshint nomen:false */
/* global define, window, document, location, Blob, FormData */

;(function ($) {
  "use strict";
  $.support.localPreview = !!(window.FileReader && window.Image && document.createElement('canvas').getContext);

  var defaults = {
     uploadFile: null,
     uploadData: null,
     width: null,
     height: null,
     resizable: false,
     selectable: false,
     avatarParams: {},
     padding:0,
     afterOpen: function(modal) {
      //do your stuff
     },
     afterClose: function(modal) {
      //do your suff
     }
  };
  var config = {};
  var jcrop = null;
  var $this = new Object();
  var methods = {
    init : function(options) {
        return this.each(function() {
            $this.uploader = $(this);
            $this =  $.extend({}, $this, methods);
            config = $.extend({}, defaults, options);

            var reader = new FileReader();
            var file = config.uploadFile;
            if(file == null){
              $.error( 'uploadFile is not setted!' );
            }
            reader.onload = function(e) {
                $this.compress(e.target.result, 100, "image/jpeg", function(compressedSrc){
                  var $img = $('<img>').attr("src", compressedSrc);
                  $img.attr('id', 'bigPreviewImg');

                  $('#smallPreviewImg').attr("src", compressedSrc);
                  $('#smallPreviewImg').css({
                    width: $('#preview-pane .preview-container').width() + 'px',
                    height: $('#preview-pane .preview-container').height() + 'px',
                    marginLeft: '0px',
                    marginTop: '0px'
                  });
                  $('#preview-big').empty().append($img);
                });                
            }
            reader.readAsDataURL(file);
            $this.showModal();
        });
    },
    showModal: function(){
      var dlg = $('<div class="modal fade" id="img_dlg" tabindex="-1" role="dialog">'+
        '<div class="modal-dialog modal-lg" role="document">'+
          '<div class="modal-content">'+
            '<div class="modal-header">'+
              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'+
              '<h4>图片处理</h4>'+
            '</div>'+
            '<div class="modal-body">'+
              '<div id="img-container" style="height:auto;">'+
                '<div id="preview-big" style="display:inline-block;"></div>'+
                '<div id="preview-pane">'+
                  '<div class="preview-container">'+
                    '<img id="smallPreviewImg" src="" class="jcrop-preview" alt="Preview" />'+
                  '</div>'+
                '</div>'+
                '<div id="preview-buttons">'+
                  '<button type="button" class="btn btn-success btn-turn-left"><i class="glyphicon glyphicon-chevron-left"></i> 左转</button>&nbsp;&nbsp;'+
                  '<button type="button" class="btn btn-warning btn-turn-right">右转 <i class="glyphicon glyphicon-chevron-right"></i></button>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="modal-footer">'+
              '<button type="button" class="btn bt-info" data-dismiss="modal">取消</button>'+
              '<button type="button" class="btn btn-primary">确定</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>');
      
      if($('#img_dlg').size() > 0){
        $('#img_dlg').remove();
      }
      $('body').append(dlg);

      $this.initImgDlg();
      $('#img_dlg').modal('show');
    },
    initImgDlg: function(){
      $('#img_dlg').on('shown.bs.modal', function(){
        $this.initJcrop();
      });
      $('#img_dlg').on('hidden.bs.modal', function(){
        if(jcrop != null){
          jcrop.destroy();
        }
      });
      $('#img_dlg .btn-primary').click($this.confirmPreview);

      $('#img_dlg .btn-turn-left').click(function(){
        jcrop.destroy();
        $this.rotateLeft('bigPreviewImg');
        $this.initJcrop();
      });
      $('#img_dlg .btn-turn-right').click(function(){
        jcrop.destroy();
        $this.rotateRight('bigPreviewImg');
        $this.initJcrop();
      });
    },
    initJcrop: function(){
      var origWidth = $('#bigPreviewImg').width();
      var origHeight = $('#bigPreviewImg').height();
      var targetWidth = config.width;
      var targetHeight = config.height;
      var ratio = (origWidth/origHeight).toFixed(2);
      if(config.width !== null && config.height !== null){
        ratio = (config.width/config.height).toFixed(2);

        if(origWidth<=config.width){
          targetWidth = origWidth;
          targetHeight = Math.floor(targetWidth / ratio);
        }else if(origHeight<=config.height){
          targetHeight = origHeight;
          targetWidth = Math.floor(targetHeight * ratio);
        }
      }

      var imgWidth = (config.width == null) ?  origWidth : targetWidth;
      var imgHeight = (config.height == null) ? origHeight : targetHeight;
      var allowResize = config.resizable ? config.resizable : ((config.width == null && config.height == null) ? true : false);

      var cropOptions = {
          bgColor: 'black',
          bgOpacity: .6,
          minSize: [ 80, 80 ],
          allowResize: allowResize,
          allowSelect: config.selectable,
          //minSize: [ imgWidth, imgHeight ],
          //aspectRatio: imgWidth / imgHeight,
          onChange: $this.updatePreview,
          onSelect: $this.updatePreview,
          onDblClick: $this.confirmPreview
      };

      $('#bigPreviewImg').Jcrop(cropOptions, function(){
        jcrop = this;

        config.avatarParams['s_width'] = imgWidth;
        config.avatarParams['s_height'] = imgHeight;
        config.avatarParams['n_width'] = imgWidth;
        config.avatarParams['n_height'] = imgHeight;
        config.avatarParams['n_x'] = 0;
        config.avatarParams['n_y'] = 0;
        jcrop.animateTo([config.padding, config.padding, imgWidth-config.padding, imgHeight-config.padding]);
      });
    },
    updatePreview: function(c)
    {
      var imgWidth = $('#bigPreviewImg').width();
      var imgHeight = $('#bigPreviewImg').height();
      var previewWidth = $('#preview-pane .preview-container').width();
      var previewHeight = $('#preview-pane .preview-container').height();

      config.avatarParams['s_width'] = imgWidth;
      config.avatarParams['s_height'] = imgHeight;
      config.avatarParams['n_width'] = c.w;
      config.avatarParams['n_height'] = c.h;
      config.avatarParams['n_x'] = c.x;
      config.avatarParams['n_y'] = c.y;

      if (parseInt(c.w) > 0)
      {
        var bounds = jcrop.getBounds();
        var boundx = bounds[0], boundy = bounds[1];
        var rx = previewWidth / c.w;
        var ry = previewHeight / c.h;
        $('#smallPreviewImg').css({
          width: Math.round(rx * imgWidth) + 'px',
          height: Math.round(ry * imgHeight) + 'px',
          marginLeft: '-' + Math.round(rx * c.x) + 'px',
          marginTop: '-' + Math.round(ry * c.y) + 'px'
        });
      }
    },
    rotateRight: function(id, angle) {
        var p = $this.rotate(id, angle == undefined ? 90 : angle);
        $('#smallPreviewImg').attr("src", p.src);
    },
    rotateLeft: function(id, angle) {
        var p = $this.rotate(id, angle == undefined ? -90 : -angle);
        $('#smallPreviewImg').attr("src", p.src);
    },
    confirmPreview: function (){
      if(config.uploadData != null){
        config.avatarParams['preview'] = encodeURIComponent($('#bigPreviewImg').attr('src'));
        $this.uploader.fileupload({
          formData: function (form) {
            var postData = [];
            $.each(config.avatarParams, function(idx, item){
              postData.push({
                'name' : idx,
                'value': item
              });
            })
            
            return postData;//form.serializeArray();
          }
        });
        config.uploadData.process().done(function () {
          config.uploadData.submit();
        });
      }else{
        $.error( 'uploadData is not setted!' );
      }
      $('#img_dlg').modal('hide');
    },
    compress: function(src, quality, mime_type, callback){
      var image = new Image();
      image.src = src; 

      image.onload = function () { // binding onload event  
        var imgWidth = image.naturalWidth;
        var imgHeight = image.naturalHeight;

        var canvas = document.createElement('canvas');
        if(imgHeight > 400) { 
          imgWidth *= 400 / imgHeight; 
          imgHeight = 400; 
        } 
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        ctx.drawImage(image, 0, 0, imgWidth, imgHeight);

        mime_type = (undefined==mime_type) ? "image/jpeg" : mime_type;
        var newImageData = canvas.toDataURL(mime_type, quality/100);

        if(undefined !== callback){
          callback(newImageData);
        }
      };
    },
    rotate: function(id, angle, whence) {
      var p = document.getElementById(id);
      if (!whence) {
          p.angle = ((p.angle == undefined ? 0 : p.angle) + angle) % 360;
      }
      else {
          p.angle = angle;
      }
      if (p.angle >= 0) {
          var rotation = Math.PI * p.angle / 180;
      }
      else {
          var rotation = Math.PI * (360 + p.angle) / 180;
      }
      var costheta = Math.cos(rotation);
      var sintheta = Math.sin(rotation);
      if (document.all && !window.opera) {
          var canvas = document.createElement('img');
          canvas.src = p.src;
          canvas.height = p.height;
          canvas.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11=" + costheta + ",M12=" + (-sintheta) + ",M21=" + sintheta + ",M22=" + costheta + ",SizingMethod='auto expand')";
      }
      else {
          var canvas = document.createElement('canvas');
          if (!p.oImage) {
              canvas.oImage = new Image();
              canvas.oImage.src = p.src;
          }
          else {
              canvas.oImage = p.oImage;
          }
          
          canvas.style.width = canvas.width = Math.abs(costheta * canvas.oImage.width) + Math.abs(sintheta * canvas.oImage.height);
          canvas.style.height = canvas.height = Math.abs(costheta * canvas.oImage.height) + Math.abs(sintheta * canvas.oImage.width);
          var context = canvas.getContext('2d');
          context.save();
          if (rotation <= Math.PI / 2) {
              context.translate(sintheta * canvas.oImage.height, 0);
          }
          else if (rotation <= Math.PI) {
              context.translate(canvas.width, -costheta * canvas.oImage.height);
          }
          else if (rotation <= 1.5 * Math.PI) {
              context.translate(-costheta * canvas.oImage.width, canvas.height);
          }
          else {
              context.translate(0, -sintheta * canvas.oImage.width);
          }
          context.rotate(rotation);
          context.drawImage(canvas.oImage, 0, 0, canvas.oImage.width, canvas.oImage.height);
          context.restore();
      }
      canvas.id = p.id;
      canvas.angle = p.angle;
      //p.parentNode.replaceChild(canvas, p);
      p.style.width = canvas.width + 'px';
      p.style.height = canvas.height + 'px';
      p.src = canvas.toDataURL("image/jpeg", 1);
      p.oImage = canvas.oImage;

      return p;
    } 
  };

  $.fn.previewImg = function(method) {
    if ( methods[method] ) {  
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));  
    } else if ( typeof method === 'object' || ! method ) {  
      return methods.init.apply( this, arguments );  
    } else {  
      $.error( 'Method ' +  method + ' does not exist' );  
    }
  };
})(jQuery);

