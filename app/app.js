// jshint browser:true, devel:true
// global $

$(function() {

//'use strict';

var LabeledRect = fabric.util.createClass(fabric.Rect, {
  type: 'labeledRect',
  initialize: function(options) {
    if (!options) options = { };
    this.callSuper('initialize', options);
    this.set('label', options.label || '');
  },
  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      label: this.get('label')
    });
  },

  _render: function(ctx) {
    this.callSuper('_render', ctx);

    if (this.camera_direction >= 0 && this.camera_range >= 1)
    {
      var direction = (this.camera_direction - 90) * (Math.PI / 180);
      var range = (this.camera_range * (Math.PI / 180)) / 2;
      var radius = (this.height < this.width ? this.height : this.width) / 2.0 - 3.0;

      ctx.beginPath();
      ctx.fillStyle = 'red';
      ctx.moveTo(0, 0);
      ctx.arc(0,
              0,
              radius,
              direction - range,
              direction + range);
      ctx.fill();
    }

    ctx.font = app.adjustFontSize(this.label.length);
    ctx.fillStyle = this.stroke;
    ctx.fillText(this.label, -this.width/2 + 4, -this.height/2 + 13);
  }
});

var LabeledCircle = fabric.util.createClass(fabric.Circle, {
  type: 'labeledCircle',
  initialize: function(options) {
    if (!options) options = { };
    this.callSuper('initialize', options);
    this.set('label', options.label || '');
  },
  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      label: this.get('label')
    });
  },
  _render: function(ctx) {
    this.callSuper('_render', ctx);

    if (this.camera_direction >= 0 && this.camera_range >= 1)
    {
      var direction = (this.camera_direction - 90) * (Math.PI / 180);
      var range = (this.camera_range * (Math.PI / 180)) / 2;
      var radius = (this.height < this.width ? this.height : this.width) / 2.0 - 3.0;

      ctx.beginPath();
      ctx.fillStyle = 'red';
      ctx.moveTo(0, 0);
      ctx.arc(0,
              0,
              radius,
              direction - range,
              direction + range);
      ctx.fill();
    }

    ctx.font = app.adjustFontSize(this.label.length);
    ctx.fillStyle = this.stroke;
    ctx.fillText(this.label, -this.width/2 + 4, -this.height/2 + 18);
  }
});

var app = {
  window: null,
  gui: require('nw.gui'),
  os: require('os'),
  fs: require('fs'),
  path: require('path'),
  mapFilename: 'maps.json',
  defaultBackgroundColor: "#2e3436ff",
  defaultLineColor: "#ffffff",
  defaultFillColor: "#2e343640",
  tmpDir: null,
  requestTemporaryDir: function() {
    var osTmp = this.os.tmpdir();
    var count = 65535;
    while (true) {
      var r1 = Math.floor(Math.random() * 65535);
      var r2 = Math.floor(Math.random() * 65535);
      var dir = this.path.join(osTmp, "emap-" + r1 + "-" + r2);
      if (!app.fs.existsSync(dir))
        {
          app.fs.mkdirSync(dir);
          this.tmpDir = dir;
          return dir;
        }

      count--;
      if (count <= 0)
        break;
    }

    console.log("failed to get temporary directory");
    return "emap-unknown-" + Math.floor(Math.random() * 65535);
  },
  rmdir: function(dir) {
    var files = this.fs.readdirSync(dir);
    for(var i = 0; i < files.length; i++) {
      var filename = this.path.join(dir, files[i]);
      var stat = this.fs.statSync(filename);

      if(filename == "." || filename == "..") {
        // nothing to do
      } else if(stat.isDirectory()) {
        // rmdir recursively
        this.rmdir(filename);
      } else {
        // remove file
        this.fs.unlinkSync(filename);
      }
    }
    this.fs.rmdirSync(dir);
  },
  releaseTemporaryDir: function(tmpDir) {
    this.rmdir(tmpDir);
  },
  adjustFontSize: function(str_len) {
    var font;
    var font_size = 14;

    if (str_len > 9)
      font =  '4px Sans Mono';
    else {
      if (str_len > 4)
        font_size -= 1;
      font = (font_size - str_len).toString() + 'px Sans Mono';
    }

    return font;
  }
};

app.Diagram = function(diagram_id, setting) {
  var diagram = this;
  var rootContainer = $('#' + diagram_id);
  var diaList = [];
  var curDiaId = '';

  function lookupDia(dia_id) {
    var dia = null;

    for (var i = 0; i < diaList.length; i++)
      {
        var d = diaList[i];

        if (d.c_id && d.c_id == dia_id)
          {
            dia = d;
            break;
          }
      }

    return dia;
  }

  function diaForeach(callback) {
    for (var i = 0; i < diaList.length; i++)
      callback(diaList[i]);
  }

  function findCenter(x1, y1, x2, y2) {
    return {x: (x1 + x2) / 2, y: (y1 + y2) / 2};
  }

  function colorCSS(hexString) {  // #ffffffff
    var color;
    var hr;
    var hg;
    var hb;
    var ha;
    if (hexString && hexString[0] == '#')
      {
        if (hexString.length == 9) // rgba
          {
            hr = hexString.substring(1, 3);
            hg = hexString.substring(3, 5);
            hb = hexString.substring(5, 7);
            ha = hexString.substring(7, 9);
            color  = 'rgba(';
            color += parseInt(hr, 16) + ',';
            color += parseInt(hg, 16) + ',';
            color += parseInt(hb, 16) + ',';
            color += (parseInt(ha, 16) / 255).toFixed(2) + ')';
          }
        else if (hexString.length == 7) // rgb
          {
            hr = hexString.substring(1, 3);
            hg = hexString.substring(3, 5);
            hb = hexString.substring(5, 7);
            color  = 'rgb(';
            color += parseInt(hr, 16) + ',';
            color += parseInt(hg, 16) + ',';
            color += parseInt(hb, 16) + ')';
          }
      }
    else
      {
        color = app.defaultBackgroundColor;
      }

    return color;
  }

  diagram.reflectSizeChaged = function() {
    diaForeach(function(dia) {
      if (dia.canvas)
        dia.canvas.calcOffset();
    });
  };

  function init() {
    diaForeach(function(dia) {
      if (dia.canvas)
        dia.canvas.clear();
    });

    diaList = [];
    setting.currentScale = 1;
    setting.map_idx = 0;
    rootContainer.empty();
  }

  function addMap(map) {
    var dia = {
      c_id   : 'app-dia-' + map.id.split('-')[1],
      width  : map.width,
      height : map.height
    };
    var canvasID = dia.c_id + '-canvas';

    rootContainer.append("<div id='" + dia.c_id + "'></div>");
    $('#' + dia.c_id).append("<canvas id='" + canvasID + "' class='app-canvas'></canvas>");
    $('#' + canvasID).attr('width', dia.width);
    $('#' + canvasID).attr('height', dia.height);

    dia.currentObject = null;
    dia.previousObject = null;

    var canvas;
    canvas = new fabric.Canvas(canvasID, {
      perPixelTargetFind: true,
      c_scaleValue: setting.currentScale,
      c_scale: function(value) {
        var self = this;
        var restoreIt = function(prop) {
          return parseFloat(prop, 10) / self.c_scaleValue;
        };
        var scaleIt = function(prop) {
          return parseFloat(prop, 10) * value;
        };

        // Resize selected group object.
        var scaleGroup = function() {
          var obj = setting.groupObject;
          if (!obj)
            return;

          obj.set({
            top: scaleIt(restoreIt(obj.top)),
            left: scaleIt(restoreIt(obj.left)),
            scaleX: scaleIt(restoreIt(obj.scaleX)),
            scaleY: scaleIt(restoreIt(obj.scaleY))
          });

          obj.setCoords();
        };

        // Except object in group for scale value
        var checkGroupObject = function(obj) {
          if (!setting.groupSelectedID.length)
            return;
          var itemID = setting.groupSelectedID;

          for (var i = 0; i < itemID.length; i++) {
            if (obj.c_id == itemID[i]) {
              return true;
            }
          }

          return false;
        };

        scaleGroup();

        self.setHeight(self.getHeight() / self.c_scaleValue);
        self.setWidth(self.getWidth() / self.c_scaleValue);
        self.forEachObject(function(obj) {
          if (checkGroupObject(obj))
            return;

          var currentObjTop = obj.get('top'),
              currentObjLeft = obj.get('left'),
              currentObjScaleX = obj.get('scaleX'),
              currentObjScaleY = obj.get('scaleY'),
              scaledObjTop = restoreIt(currentObjTop),
              scaledObjLeft = restoreIt(currentObjLeft),
              scaledObjScaleX = restoreIt(currentObjScaleX),
              scaledObjScaleY = restoreIt(currentObjScaleY);

          obj.set({
            top: scaledObjTop,
            left: scaledObjLeft,
            scaleX: scaledObjScaleX,
            scaleY: scaledObjScaleY
          });
          obj.setCoords();
        });

        self.setHeight(self.getHeight() * value);
        self.setWidth(self.getWidth() * value);
        self.forEachObject(function(obj) {
          if (checkGroupObject(obj))
            return;

          var currentObjTop = obj.get('top'),
              currentObjLeft = obj.get('left'),
              currentObjScaleX = obj.get('scaleX'),
              currentObjScaleY = obj.get('scaleY'),
              scaledObjTop = scaleIt(currentObjTop),
              scaledObjLeft = scaleIt(currentObjLeft),
              scaledObjScaleX = scaleIt(currentObjScaleX),
              scaledObjScaleY = scaleIt(currentObjScaleY);

          obj.set({
            top: scaledObjTop,
            left: scaledObjLeft,
            scaleX: scaledObjScaleX,
            scaleY: scaledObjScaleY
          });
          obj.setCoords();
        });

        self.c_scaleValue = value;
        self.renderAll();
      },
      c_backgrounds: [],
      c_addBackground: function(obj) {
        var self = this;

        self.c_backgrounds.push(obj);
        self.add(obj);

        self.c_backgrounds.sort(function(a, b) {
          return b.c_id - a.c_id;
        });
        for (var i = self.c_backgrounds.length - 1; i >= 0; i--)
          self.sendToBack(self.c_backgrounds[i]);

        self.renderAll();
      },
      c_removeBackground: function(obj) {
        var self = this;

        for (var i = 0; i < self.c_backgrounds.length; i++)
          {
            if (self.c_backgrounds[i] == obj)
              {
                self.c_backgrounds.splice(i, 1);
                break;
              }
          }
        self.remove(obj);
        self.renderAll();
      },
      c_getObjectById: function(c_id) {
        var f = null;
        var objects = this.getObjects();
        var i = objects.length;
        while (i--) {
          var obj = objects[i];
          if (obj.c_id && obj.c_id == c_id) {
            f = obj;
            break;
          }
        }
        return f;
      }
    });

    // Remove rendering of add and remove function to fabric.js
    canvas.renderOnAddRemove = false;

    if (map.background_color)
      canvas.backgroundColor = colorCSS(map.background_color);
    else
      canvas.backgroundColor = colorCSS(app.defaultBackgroundColor);

    canvas.on('mouse:down', function(e) {
      if (e.target) {

        // Initial to selected group ID.
        if (e.target.type !== 'group')
          setting.groupSelectedID = '';
        return;
      }

      setting.groupSelectedID = '';
      setting.select(null);
    });

    // Event of group to canvas
    canvas.on('selection:created', function (e) {
      if (e.target.type === 'group') {
        setting.select(null);
        setting.groupSelect(e.target);

        $('#app-sidebar-item-info-fill-zero').prop('disabled', false);
        $('#app-sidebar-item-info-fill-zero-button').prop('disabled', false);
        $('#app-sidebar-item-info-direction').prop('disabled', false);
      }
    });

    canvas.on('object:selected', function(e) {
      var obj = e.target;

      if (!obj)
        return;

      if (obj.c_id) {
        setting.select(obj.c_id);
        return;
      }
    });

    canvas.on('object:moving', function(e) {
      var obj = e.target;

      if (!obj)
        return;

      // Prevent leave to item to map.
      obj.setCoords();
      var scaledWidth = dia.canvas.c_scaleValue * map.width;
      if (obj.oCoords.tl.x < 0) {
        obj.left -= obj.oCoords.tl.x;
      } else if (obj.oCoords.tr.x > scaledWidth) {
        obj.left -= (obj.oCoords.tr.x - scaledWidth);
      }
      var scaledHeight = dia.canvas.c_scaleValue * map.height;
      if (obj.oCoords.tl.y < 0) {
        obj.top -= obj.oCoords.tl.y;
      } else if (obj.oCoords.bl.y > scaledHeight) {
        obj.top -= (obj.oCoords.bl.y - scaledHeight);
      }

      // Snap to grid.
      var scale = setting.currentScale;
      var left = Math.round(obj.left / scale) * scale;
      if (obj.left != left) {
        obj.setLeft(left);
      }
      var top = Math.round(obj.top / scale) * scale;
      if (obj.top != top) {
        obj.setTop(top);
      }
    });

    canvas.on('object:scaling', function(e) {
      var obj = e.target;
      var height;
      var width;
      var snap;
      var dist;
      var attrs;
      var grid;

      if (!obj)
        return;

      width = obj.getWidth();
      height = obj.getHeight();
      grid = setting.currentScale;

      snap = {   // Closest snapping points
        top: Math.round(obj.top / grid) * grid,
        left: Math.round(obj.left / grid) * grid,
        bottom: Math.round((obj.top + height) / grid) * grid,
        right: Math.round((obj.left + width) / grid) * grid
      };
      dist = {   // Distance from snapping points
        top: Math.abs(snap.top - obj.top),
        left: Math.abs(snap.left - obj.left),
        bottom: Math.abs(snap.bottom - obj.top - height),
        right: Math.abs(snap.right - obj.left - width)
      };
      attrs = {
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        top: obj.top,
        left: obj.left
      };

      switch(obj.__corner)
        {
        case 'tl':
          if (dist.left < dist.top) {
            attrs.scaleX = (width - (snap.left - obj.left)) / obj.width;
            attrs.scaleY = (attrs.scaleX / obj.scaleX) * obj.scaleY;
            attrs.top = obj.top + (height - obj.height * attrs.scaleY);
            attrs.left = snap.left;
          }
          else {
            attrs.scaleY = (height - (snap.top - obj.top)) / obj.height;
            attrs.scaleX = (attrs.scaleY / obj.scaleY) * obj.scaleX;
            attrs.left = attrs.left + (width - obj.width * attrs.scaleX);
            attrs.top = snap.top;
          }
          break;
        case 'mt':
          attrs.scaleY = (height - (snap.top - obj.top)) / obj.height;
          attrs.top = snap.top;
          break;
        case 'tr':
          if (dist.right < dist.top) {
            attrs.scaleX = (snap.right - obj.left) / obj.width;
            attrs.scaleY = (attrs.scaleX / obj.scaleX) * obj.scaleY;
            attrs.top = obj.top + (height - obj.height * attrs.scaleY);
          }
          else {
            attrs.scaleY = (height - (snap.top - obj.top)) / obj.height;
            attrs.scaleX = (attrs.scaleY / obj.scaleY) * obj.scaleX;
            attrs.top = snap.top;
          }
          break;
        case 'ml':
          attrs.scaleX = (width - (snap.left - obj.left)) / obj.width;
          attrs.left = snap.left;
          break;
        case 'mr':
          attrs.scaleX = (snap.right - obj.left) / obj.width;
          break;
        case 'bl':
          if (dist.left < dist.bottom) {
            attrs.scaleX = (width - (snap.left - obj.left)) / obj.width;
            attrs.scaleY = (attrs.scaleX / obj.scaleX) * obj.scaleY;
            attrs.left = snap.left;
          }
          else {
            attrs.scaleY = (snap.bottom - obj.top) / obj.height;
            attrs.scaleX = (attrs.scaleY / obj.scaleY) * obj.scaleX;
            attrs.left = attrs.left + (width - obj.width * attrs.scaleX);
          }
          break;
        case 'mb':
          attrs.scaleY = (snap.bottom - obj.top) / obj.height;
          break;
        case 'br':
          if (dist.right < dist.bottom) {
            attrs.scaleX = (snap.right - obj.left) / obj.width;
            attrs.scaleY = (attrs.scaleX / obj.scaleX) * obj.scaleY;
          }
          else {
            attrs.scaleY = (snap.bottom - obj.top) / obj.height;
            attrs.scaleX = (attrs.scaleY / obj.scaleY) * obj.scaleX;
          }
          break;
        }

      obj.set(attrs);
    });

    canvas.on('object:modified', function(e) {
      var obj = e.target;

      if (!obj)
        return;

      obj.setLeft(Math.round(obj.left / setting.currentScale) * setting.currentScale);
      obj.setTop(Math.round(obj.top / setting.currentScale) * setting.currentScale);
      obj.setCoords();

      if (obj.type !== 'group') {
        if (obj.c_id) {
          var points = [];

          points.push(Math.floor(obj.oCoords.tl.x / dia.canvas.c_scaleValue));
          points.push(Math.floor(obj.oCoords.tl.y / dia.canvas.c_scaleValue));
          points.push(Math.floor(obj.oCoords.br.x / dia.canvas.c_scaleValue));
          points.push(Math.floor(obj.oCoords.br.y / dia.canvas.c_scaleValue));

          $('#app-sidebar-item-info-coordinate').val(points.join(','));
        }
      }
    });

    dia.canvas = canvas;
    diaList.push(dia);

    $('#' + dia.c_id).hide();
  }

  $('#app-diagram').on('mousewheel', function(e) {
    setting.mousePointX = e.clientX - $('#app-sidebar').width();
    setting.mousePointY = e.clientY;
    var delta = e.originalEvent.wheelDelta / 120;
    switch (delta) {
    case 1:
      setting.zoomIn(setting.currentScale);
      break;
    case -1:
      setting.zoomOut(setting.currentScale);
      break;
    }
  });

  function removeMap(dia) {
    var idx = -1;

    for (var i = 0; i < diaList.length; i++)
      {
        if (diaList[i].c_id == dia.c_id)
          {
            idx = i;
            break;
          }
      }
    if (idx >= 0)
      {
        $('#' + dia.c_id).remove();
        diaList.splice(i, 1);
      }
  }

  function addItem(dia, c_id, item) {
    if (!dia.canvas)
      return;

    var obj = null;

    var left = item.x1 * dia.canvas.c_scaleValue;
    var top = item.y1 * dia.canvas.c_scaleValue;

    var baseWidth;
    var baseHeight;
    var width;
    var height;
    var scaleX;
    var scaleY;
    var baseRadius;
    switch (item.type)
      {
      case 0: // DAI_BOX
        baseWidth = 30;
        baseHeight = 20;
        width = (item.x2 - item.x1) * dia.canvas.c_scaleValue;
        height = (item.y2 - item.y1) * dia.canvas.c_scaleValue;
        scaleX = width / baseWidth;
        scaleY = height / baseHeight;

        obj = new LabeledRect({
          left: left,
          top: top,
          width: baseWidth,
          height: baseHeight,
          scaleX: scaleX,
          scaleY: scaleY,
          fill: colorCSS(app.defaultFillColor),
          stroke: colorCSS(app.defaultLineColor),
          strokeWidth: 1,
          label: item.name,
          direction: item.camera_direction,
          range: item.camera_range
        });
        obj.c_type = item.type;
        obj.c_changePoints = function(points) {
          var elms = points.split(',');
          var x1 = parseInt(elms[0]);
          var y1 = parseInt(elms[1]);
          var x2 = parseInt(elms[2]);
          var y2 = parseInt(elms[3]);

          this.setLeft(Math.floor(x1 * dia.canvas.c_scaleValue));
          this.setTop(Math.floor(y1 * dia.canvas.c_scaleValue));
          this.setWidth(Math.floor((x2 - x1) * dia.canvas.c_scaleValue / this.scaleX));
          this.setHeight(Math.floor((y2 - y1) * dia.canvas.c_scaleValue / this.scaleY));
          this.setCoords();
        };
        break;
      case 1: // DAI_CIRCLE
        baseWidth = 30;
        baseHeight = 30;
        width = (item.x2 - item.x1) * dia.canvas.c_scaleValue;
        height = (item.y2 - item.y1) * dia.canvas.c_scaleValue;
        scaleX = width / baseWidth;
        scaleY = height / baseHeight;
        baseRadius = 15;

        obj = new LabeledCircle({
          left: left,
          top: top,
          radius: baseRadius,
          scaleX: scaleX,
          scaleY: scaleY,
          fill: colorCSS(app.defaultFillColor),
          stroke: colorCSS(app.defaultLineColor),
          strokeWidth: 1,
          label: item.name,
          direction: item.camera_direction,
          range: item.camera_range
        });
        obj.c_type = item.type;
        obj.c_changePoints = function(points) {
          var elms = points.split(',');
          var x1 = parseInt(elms[0]);
          var y1 = parseInt(elms[1]);
          var x2 = parseInt(elms[2]);
          var y2 = parseInt(elms[3]);

          this.setLeft(Math.floor(x1 * dia.canvas.c_scaleValue));
          this.setTop(Math.floor(y1 * dia.canvas.c_scaleValue));
          this.setRadius(Math.floor((x2 - x1) * dia.canvas.c_scaleValue / 2 / this.scaleX));
          this.setCoords();
        };
        break;
      }

    if (!obj)
      return;

    obj.c_id = c_id;
    obj.camera_direction = item.camera_direction;
    if (!obj.camera_direction && obj.camera_direction !== 0)
      obj.camera_direction = -1;
    obj.camera_range = item.camera_range;
    if (!obj.camera_range && obj.camera_range !== 0)
      obj.camera_range = -1;
    obj.set({
      hasRotatingPoint: false,
      hasControls: true,
      hasBorders: true,
      borderColor: 'red',
      cornerColor: 'green',
      cornerSize: 6,
      transparentCorners: false,
      lockRotation: true
    });

    dia.canvas.add(obj);
  }

  function removeItem(dia, c_id) {
    if (!dia.canvas)
      return;

    var obj = dia.canvas.c_getObjectById(c_id);
    if (!obj)
      return;

    dia.canvas.remove(obj);
  }

  function addBackgroundImage(dia, c_id, filename) {
    if (!dia.canvas)
      return;

    var iObj = dia.canvas.c_getObjectById(c_id);
    if (iObj)
      {
        dia.canvas.c_removeBackground(iObj);
      }

    var path = setting.imageDir + '/' + filename;
    fabric.util.loadImage(path, function(img) {
      var obj = new fabric.Image(img);

      obj.c_id = c_id;

      obj.set('hasRotatingPoint', false);
      obj.set('hasControls', false);
      obj.set('hasBorders', false);
      obj.set('lockUniScaling', true);
      obj.set('lockScalingX', true);
      obj.set('lockScalingY', true);
      obj.set('lockMovementX', true);
      obj.set('lockMovementY', true);
      obj.set('lockRotation', true);
      obj.set('disableHover', true);
      obj.set('selectable', false);
      obj.set('evented', false);

      dia.canvas.c_addBackground(obj);
    });
  }

  function removeBackgroundImage(dia, c_id) {
    var obj = dia.canvas.c_getObjectById(c_id);
    if (obj)
      dia.canvas.c_removeBackground(obj);
  }

  function selectItem(dia, c_id) {
    if (!dia.canvas)
      return;

    var obj = null;
    if (c_id)
      obj = dia.canvas.c_getObjectById(c_id);

    if (obj == dia.currentObject)
      return;

    dia.previousObject = dia.currentObject;
    dia.currentObject = obj;
    if (dia.currentObject)
      {
        dia.canvas.setActiveObject(dia.currentObject);
        dia.canvas.bringToFront(dia.currentObject);
        setting.currentObject = dia.currentObject;
        return;
      }
    else
      {
        dia.canvas.discardActiveObject();
        setting.currentObject = '';
      }
  }

  function modifyItem(dia, c_id, key, value) {
    if (!dia.canvas)
      return;

    obj = dia.canvas.c_getObjectById(c_id);
    if (!obj)
      return;

    switch (key)
      {
      case 'points':
        obj.c_changePoints(value);
        break;
      case 'name':
        obj.set('label', value);
        break;
      case 'direction':
        obj.camera_direction = Number(value[0]);
        obj.camera_range = Number(value[1]);
        break;
      }
    if (!setting.groupSelectedID.length)
      dia.canvas.renderAll();
  }

  // Save items data for save file
  function saveItemData() {
    var dia = null;

    diaList.forEach(function (dia, i) {
      if (dia.c_id) {
        dia.canvas.forEachObject(function(item) {
          if (!item.c_id)
            return;

          var elms = item.c_id.split('-');
          if (elms[2] !== 'item')
            return;

          var obj = setting.config.maps[elms[1]].items[elms[3]];
          if (obj.id) {
            obj.name = item.get('label');
            obj.x1 = Math.floor(item.oCoords.tl.x / dia.canvas.c_scaleValue);
            obj.y1 = Math.floor(item.oCoords.tl.y / dia.canvas.c_scaleValue);
            obj.x2 = Math.floor(item.oCoords.br.x / dia.canvas.c_scaleValue);
            obj.y2 = Math.floor(item.oCoords.br.y / dia.canvas.c_scaleValue);
            obj.camera_direction = Number(item.camera_direction);
            obj.camera_range = Number(item.camera_range);
          }
        });
      }
    });
  }

  setting.callbacks.add(function(data) {
    var elms;
    var dia_id;
    var dia;
    switch(data.cmd)
      {
      case 'setting.init':
        init();
        break;
      case 'setting.zoom':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia && dia.canvas)
          {
            var value = parseFloat (data.value, 10);
            if (dia.canvas.c_scaleValue != value) {
              var pointX;
              var pointY;
              var scrollX;
              var scrollY;
              if (setting.mousePointX && setting.mousePointY) {
                pointX = setting.mousePointX;
                pointY = setting.mousePointY;
                setting.mousePointX = null;
                setting.mousePointY = null;
              } else {
                // Center points
                pointX = ($('#app-diagram').width() / 2);
                pointY = ($('#app-diagram').height() / 2);
              }
              scrollX = parseFloat (pointX + $('#app-diagram').scrollLeft(), 10);
              scrollY = parseFloat (pointY + $('#app-diagram').scrollTop(), 10);

              dia.canvas.c_scale(value);

              scrollX = (scrollX / setting.currentScale) * dia.canvas.c_scaleValue;
              scrollY = (scrollY / setting.currentScale) * dia.canvas.c_scaleValue;

              scrollX = scrollX - pointX;
              if (scrollX < 0)
                scrollX = 0;
              scrollY = scrollY - pointY;
              if (scrollY < 0)
                scrollY = 0;
              $('#app-diagram').scrollLeft(scrollX).scrollTop(scrollY);
            }
            setting.currentScale = dia.canvas.c_scaleValue;
          }
        break;
      case 'setting.saveData':
        saveItemData();
        break;
      case 'item.addBackground':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia)
          addBackgroundImage(dia, data.id, data.file);
        break;
      case 'item.removeBackground':
        $('#app-sidebar-' + data.id).text('empty');
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia)
          removeBackgroundImage(dia, data.id);
        break;
      case 'item.add':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia)
          addItem(dia, data.id, data.item);
        break;
      case 'item.selected':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia)
          selectItem(dia, data.id);
        break;
      case 'item.modified':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia) {
          modifyItem(dia, data.id, data.key, data.value);
        }
        break;
      // Use for avoid overlapping rendering.
      case 'canvas.rendering':
        elms = setting.selectedID.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia && dia.canvas)
          dia.canvas.renderAll();
        break;
      case 'item.removed':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia)
          removeItem(dia, data.id);
        break;
      // Remove the active group on canvas.
      case 'group.removed':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia && dia.canvas)
          dia.canvas.discardActiveGroup();
        break;
      case 'map.draw':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia && dia.canvas)
          dia.canvas.renderAll();
        break;
      case 'map.added':
        addMap(data.map);
        break;
      case 'map.modified':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia && dia.canvas)
          {
            dia.canvas.backgroundColor = colorCSS(data.value);
            dia.canvas.renderAll();
          }
        break;
      case 'map.removed':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];
        dia = lookupDia(dia_id);
        if (dia)
          removeMap(dia);
        break;
      case 'map.selected':
        elms = data.id.split('-');
        dia_id = 'app-dia-' + elms[1];

        $('#app-diagram').scrollTop(0).scrollLeft(0);
        diaForeach(function(dia) {
          if (dia.c_id == dia_id)
            {
              $('#' + dia.c_id).show("slow");
              if (dia.canvas)
                {
                  if (dia.canvas.c_scaleValue != setting.currentScale)
                    dia.canvas.c_scale(setting.currentScale);
                  dia.canvas.calcOffset();
                  dia.canvas._hoveredTarget = null;
                  dia.canvas.deactivateAll();
                  dia.canvas.renderAll();
                }
            }
          else
            {
              $('#' + dia.c_id).hide();
            }
        });
        break;
      }
  });
};

app.Sidebar = function(sidebar_id, setting) {
  var sidebar = this;
  var selectedMap = '';

  setting.callbacks.add(function(data) {
    var elms;
    var item;
    var typeObj;
    var coord;
    var direction;

    switch(data.cmd)
      {
      case 'setting.init':
        $('#app-sidebar-map-pivot').siblings().remove();
        sidebar.setItemEditible(false);
        viewMenu.items.forEach(function (item) {
          if (item.type == 'checkbox') {
            if (item.label == '100%')
              item.checked = true;
            else
              item.checked = false;
          }
        });
        break;
      case 'map.selected':
        if (selectedMap == data.id)
          break;

        selectedMap = data.id;
        $('a[data-target="#app-sidebar-' + data.id + '"]').click();
        break;
      case 'map.added':
        createMapEntry(data.map, $('#app-sidebar-map-pivot'));
        break;
      case 'map.removed':
        removeMapEntry(data.id);
        break;
      case 'map.modified':
        switch(data.key)
          {
          case 'name':
            $('#app-sidebar-' + data.id + '-toggle-name').text(data.value);
            break;
          case 'background_color':
            $('#app-sidebar-' + data.id + '-' + data.key).val(data.value);
            break;
          }
        break;
      case 'item.modified':
        if (setting.groupSelectedID.length)
          return;
        elms = data.id.split('-');
        if (elms[3] == 'null')
          {
            sidebar.setItemEditible(false);
            break;
          }
        item = setting.currentObject;
        $('#app-sidebar-item-info-name').val(item.get('label'));

        typeObj = $('#app-sidebar-item-info-type');
        if (setting.setObjectType(item.type) === 0)
          typeObj.val('DAI Box');
        else if (setting.setObjectType(item.type) == 1)
          typeObj.val('DAI Circle');
        else
          typeObj.val('Unknown');

        coord = [Math.floor(item.oCoords.tl.x / setting.currentScale),
                     Math.floor(item.oCoords.tl.y / setting.currentScale),
                     Math.floor(item.oCoords.br.x / setting.currentScale),
                     Math.floor(item.oCoords.br.y / setting.currentScale)
                    ].join(',');
        $('#app-sidebar-item-info-coordinate').val(coord);

        direction = item.camera_direction + ',' + item.camera_range;
        $('#app-sidebar-item-info-direction').val(direction);
        break;
      case 'item.selected':
        elms = data.id.split('-');
        if (elms[3] == 'null')
          {
            sidebar.setItemEditible(false);
            break;
          }
        item = setting.currentObject;

        sidebar.setItemEditible(true);
        $('#app-sidebar-item-info-name').val(item.get('label'));

        typeObj = $('#app-sidebar-item-info-type');
        if (setting.setObjectType(item.type) === 0)
          typeObj.val('DAI Box');
        else if (setting.setObjectType(item.type) == 1)
          typeObj.val('DAI Circle');
        else
          typeObj.val('Unknown');

        coord = [Math.floor(item.oCoords.tl.x / setting.currentScale),
                     Math.floor(item.oCoords.tl.y / setting.currentScale),
                     Math.floor(item.oCoords.br.x / setting.currentScale),
                     Math.floor(item.oCoords.br.y / setting.currentScale)
                    ].join(',');
        $('#app-sidebar-item-info-coordinate').val(coord);

        direction = item.camera_direction + ',' + item.camera_range;
        $('#app-sidebar-item-info-direction').val(direction);
        break;
      case 'item.addBackground':
        $('#app-sidebar-' + data.id).text(data.file);
        break;
      case 'item.removeBackground':
        $('#app-sidebar-' + data.id).text('empty');
        break;
      }
  });

  this.setItemEditible = function (enable) {
    if (enable)
      {
        $('#app-sidebar-item-info-name').prop('disabled', false);
        $('#app-sidebar-item-info-coordinate').prop('disabled', false);
        $('#app-sidebar-item-info-direction').prop('disabled', false);

        $('#app-sidebar-repeat-count').prop('disabled', false);
        $('#app-sidebar-repeat-add-left').prop('disabled', false);
        $('#app-sidebar-repeat-add-right').prop('disabled', false);
        $('#app-sidebar-repeat-add-up').prop('disabled', false);
        $('#app-sidebar-repeat-add-down').prop('disabled', false);
      }
    else
      {
        $('#app-sidebar-item-info-name').val("").prop('disabled', true);
        $('#app-sidebar-item-info-type').val("").prop('disabled', true);
        $('#app-sidebar-item-info-coordinate').val("").prop('disabled', true);
        $('#app-sidebar-item-info-direction').val("").prop('disabled', true);
        $('#app-sidebar-item-info-fill-zero').prop('disabled', true);
        $('#app-sidebar-item-info-fill-zero-button').prop('disabled', true);

        $('#app-sidebar-repeat-count').prop('disabled', true);
        $('#app-sidebar-repeat-add-left').prop('disabled', true);
        $('#app-sidebar-repeat-add-right').prop('disabled', true);
        $('#app-sidebar-repeat-add-up').prop('disabled', true);
        $('#app-sidebar-repeat-add-down').prop('disabled', true);
      }
  };

  function createMapEntry(map, sibling) {
    var i;

    var c_id = "app-sidebar-" + map.id;

    var html  = "<div class='accordion-group app-sidebar-accordion-group'>";
        html +=   "<div class='accordion-heading'>";
        html +=     "<button type='button' class='btn btn-mini btn-link btn-group' rel='tooltip' title='Remove this map' id='" + c_id + "-remove'>";
        html +=       "<i class='icon-trash'></i>";
        html +=     "</button>";
        html +=     "<a class='accordion-toggle' data-toggle='collapse' data-target='#" + c_id + "'";
        html +=        "data-parent='#app-sidebar-map-group'>";
        html +=        "<span id='" + c_id + "-toggle-name'>" + map.name + "</span>";
        html +=     "</a>";
        html +=   "</div> <!-- accordion-heading -->";
        html +=   "<div id='" + c_id + "' class='accordion-body collapse app-sidebar-accordion-group-body'>";
        html +=     "<div class='accordion-inner'>";
        html +=       "<table class='table-striped'>";
        html +=         "<tbody id='" + c_id + "-content'>";
        html +=           "<tr>";
        html +=             "<th>";
        html +=               "<label for='" + c_id + "-name'>Name</label>";
        html +=             "</th>";
        html +=             "<td>";
        html +=               "<input id='" + c_id + "-name' type='text' value='" + map.name + "' class='input-medium'>";
        html +=             "</td>";
        html +=           "</tr>";
        html +=           "<tr>";
        html +=             "<th>";
        html +=               "<label>Size</label>";
        html +=             "</th>";
        html +=             "<td>";
        html +=               "<label>" + map.width + "x" + map.height +"</label>";
        html +=             "</td>";
        html +=           "</tr>";
        html +=           "<tr>";
        html +=             "<th>";
        html +=               "<label for='" + c_id + "-background_color'>Color</label>";
        html +=             "</th>";
        html +=             "<td>";
        html +=               "<input id='" + c_id + "-background_color' type='text' value='" + map.background_color + "' class='input-medium'>";
        html +=             "</td>";
        html +=           "</tr>";
        html +=         "</tbody>";
        html +=       "</table>";
        html +=       "<label>Background Images</label>";
        html +=       "<div class='app-sidebar-bg-container'>";
        html +=         "<ul>";
        for (i = 0; i < map.backgrounds.length; i++) {
          html +=         "<li>";
          html +=           "<div id='" + c_id + "-bg-" + i + "'>empty</div>";
          html +=           "<button type='button' class='btn btn-mini btn-link'";
          html +=                    "rel='tooltip' title='Remove this background' id='" + c_id + "-bg-" + i + "-remove'>";
          html +=           "<i class='icon-trash'></i>";
          html +=           "</button>";
          html +=         "</li>";
        }
        html +=         "</ul>";
        html +=       "<div>";
        html +=     "</div>";
        html +=   "</div>";
        html += "</div>";

    $(html).insertBefore(sibling);

    var c = $('#' + c_id);

    c.on('hide', function() {
      $(this).css({ 'overflow': 'hidden' });
      var id = $(this).attr('id');
      $('a[data-target="#' + id + '"]').parent().removeClass('app-sidebar-entry-selected');
    });

    c.on('show', function() {
      var id = $(this).attr('id');
      $('a[data-target="#' + id + '"]').parent().addClass('app-sidebar-entry-selected');
      var elms = id.split('-'); // 'app-sidebar-map-0'
      var obj_id = 'map-' + elms[3];
      setting.selectMap(obj_id);
    });

    c.on('shown', function() {
      $(this).css({ 'overflow': 'visible' });
    });

    $('#' + c_id + '-name').change(function(e) {
      var name = $.trim($(this).val());
      if (name === '')
        return;

      var map_idx = $(this).attr('id').split('-')[3];
      var oid = 'map-' + map_idx;
      setting.modify(oid, 'name', name);
    });

    $('#' + c_id + '-background_color').change(function(e) {
      var color = $.trim($(this).val());
      if (color === '')
        return;

      var map_idx = $(this).attr('id').split('-')[3];
      var oid = 'map-' + map_idx;
      setting.modify(oid, 'background_color', color);
    });

    $('#' + c_id + '-remove').click(function(e) {
      var elms = $(this).attr('id').split('-');
      var mapID = [elms[2], elms[3]].join('-');
      setting.removeMap(mapID);
    });

    for (i = 0; i < map.backgrounds.length; i++) {
      if (map.backgrounds[i] === "")
        {
          $('#' + c_id + "-bg-" + i).text("empty");
        }
      else
        {
          $('#' + c_id + "-bg-" + i).text(map.backgrounds[i]);
        }
    }

    map.backgrounds.forEach(function (bg, i) {
      $('#' + c_id + "-bg-" + i).click(function(e) {
        app.curBgTarget=$(this).attr('id');
        $('#app-sidebar-bg-file').trigger('click');
      });
      $('#' + c_id + "-bg-" + i + "-remove").click(function(e) {
        var elms = $(this).attr('id').split('-');
        setting.removeBackground(elms[5]);
      });
    });
  }

  function removeMapEntry(mapID) {
    var obj = $('#app-sidebar-' + mapID);
    if (obj)
      obj.parent().remove();
  }
};

app.Setting = function() {
  var setting = this;
  var inited = false;

  this.config = null;
  this.zipPath = null;
  this.tmpDir = null;
  this.imageDir = null;
  this.originMapFile = null;

  this.map_idx = 0;
  this.callbacks = $.Callbacks();
  this.selectedID = '';
  this.groupSelectedID = '';
  this.groupObject = '';
  this.currentObject = '';
  this.currentScale = 1;
  this.mousePointX = null;
  this.mousePointY = null;

  this.init = function(config, zipPath, tmpDir) {
    this.config = config;
    this.zipPath = zipPath;

    if (this.tmpDir)
      app.releaseTemporaryDir(this.tmpDir);

    this.tmpDir = tmpDir;
    this.imageDir = app.path.join(tmpDir, 'images');

    $('#app-overlay').hide();

    var i;
    for (var m = 0; m < config.maps.length; m++)
      {
        config.maps[m].valid = true;
        for (i = 0; i < config.maps[m].items.length; i++)
          config.maps[m].items[i].valid = true;

        config.maps[m].backgrounds = [];
        for (i = 0; i < 5; i++)
          config.maps[m].backgrounds.push("empty");

        for (i = 0; i < config.maps[m].background_images.length && i < 5; i++)
          config.maps[m].backgrounds[i] = config.maps[m].background_images[i];
      }

    this.callbacks.fire({ cmd: 'setting.init' });
  };
  this.add = function(item, options) {
    if (!inited)
      return;

    var m_idx = setting.map_idx;
    if (!setting.config || !setting.config.maps[m_idx] || !setting.config.maps[m_idx].items)
      return;

    var map = setting.config.maps[m_idx];
    var baseX = map.width / 2;
    var baseY = map.height / 2;
    var ritem = item;
    if (!ritem)
      {
        var x1, y1, x2, y2;

        switch (options.type)
          {
          case 0: // box
            x1 = options.x1 ? options.x1 : baseX + 40;
            y1 = options.y1 ? options.y1 : baseY + 40;
            x2 = options.x2 ? options.x2 : baseX + 79;
            y2 = options.y2 ? options.y2 : baseY + 65;
            break;
          case 1: // circle
            x1 = options.x1 ? options.x1 : baseX + 40;
            y1 = options.y1 ? options.y1 : baseY + 40;
            x2 = options.x2 ? options.x2 : baseX + 70;
            y2 = options.y2 ? options.y2 : baseY + 70;
            break;
          default:
            console.log ("failed to add item (unknown item type:" + options.type + ")");
            return;
          }

        ritem = {
          id : 'map-' + m_idx + '-item-' + setting.config.maps[m_idx].items.length,
          valid: true,
          name: options.name ? options.name : 100 + setting.config.maps[m_idx].items.length + "",
          type: options.type,
          x1 : x1,
          y1 : y1,
          x2 : x2,
          y2 : y2
        };
        setting.config.maps[m_idx].items.push(ritem);
        setting.callbacks.fire({
          cmd  : 'item.add',
          id   : ritem.id,
          item : ritem
        });

        if (options.select)
          this.select(ritem.id);  /* drawing event is occurred */

        return;
      }

    setting.callbacks.fire({
      cmd  : 'item.add',
      id   : ritem.id,
      item : ritem
    });
  };

  // Set object type in canvas
  this.setObjectType = function(type) {
    switch (type) {
      case 'labeledRect': // box
        return 0;
      case 'labeledCircle': // circle
        return 1;
    }
  };

  this.load = function() {
    inited = true;
    if (!app.window.menu.items[1].enabled)
      app.window.menu.items[1].enabled = true;

    var config = setting.config;
    var i;
    for (i = 0; i < config.maps.length; i++)
      {
        var map = config.maps[i];

        map.valid = true;
        map.id = 'map-' + i;

        if (!map.background_color)
          map.background_color = app.defaultBackgroundColor;

        this.addMap(map, {});
      }

    for (var m_idx = 0; m_idx < config.maps.length; m_idx++)
      {
        if (config.maps[m_idx].backgrounds)
          {
            var files = config.maps[m_idx].backgrounds;
            for (i = 0; i < files.length; i++) {
              if (!files[i] ||
                  files[i] === "" ||
                  files[i] == "empty")
                continue;

              // Apply current map index.
              setting.map_idx = m_idx;

              this.addBackground(i, files[i]);
            }
          }

        var items = config.maps[m_idx].items;
        for (i = 0; i < items.length; i++)
          {
            var item = items[i];
            item.id = "map-" + m_idx + "-item-" + i;
            item.valid = true;
            this.add(item, {});
          }
      }

    if (config.maps.length > 0)
      this.selectMap('map-0');
  };
  this.selectMap = function(mapID) {
    var elms = mapID.split('-');

    setting.map_idx = parseInt(elms[1]);
    this.callbacks.fire({
      cmd  : 'map.selected',
      id   : mapID,
      name : setting.config.maps[setting.map_idx].name
    });

    setting.select(null);
  };
  this.zoom = function(scale) {
    if (!inited)
      return;

    this.callbacks.fire({
      cmd   : 'setting.zoom',
      id    : "map-" + setting.map_idx,
      value : scale
    });
  };
  this.zoomIn = function(current_scale) {
    switch (current_scale)
      {
      case 4:
        viewMenu.items[0].click();
        break;
      case 2:
        viewMenu.items[1].click();
        break;
      case 1:
        viewMenu.items[2].click();
        break;
      case 0.5:
        viewMenu.items[3].click();
        break;
      default:
        break;
      }
  };
  this.zoomOut = function(current_scale) {
    switch (current_scale)
      {
      case 8:
        viewMenu.items[1].click();
        break;
      case 4:
        viewMenu.items[2].click();
        break;
      case 2:
        viewMenu.items[3].click();
        break;
      case 1:
        viewMenu.items[4].click();
        break;
      default:
        break;
      }
  };
  this.select = function(c_id) {
    var id;

    if (c_id)
      id = c_id;
    else
      id = "map-" + setting.map_idx + "-item-null";

    if (this.selectedID == id)
      return;

    this.selectedID = id;
    this.callbacks.fire({ cmd: 'item.selected', id: id });
  };

  // Save group objects of canvas
  this.groupSelect = function(group) {
    if (!group)
      return;

    var id = [];
    var i = 0;

    group.forEachObject(function (e) {
      if (e.c_id)
        id[i] = e.c_id;
      i++;
    });
    this.groupObject = group;
    this.groupSelectedID = id;
    this.selectedID = "map-" + setting.map_idx + "-item-group";
  };
  this.modify = function(c_id, key, value) {
    var k = c_id.split('-');

    var changed = false;
    if (k.length == 2)  /* map-0 */
      {
        var map;

        map = setting.config.maps[k[1]];
        switch (key)
          {
          case 'name':
            if (map[key] != value)
              {
                map[key] = value;
                changed = true;
              }
            break;
          case 'background_color':
            if (map[key] != value)
              {
                if ((value.length == 7 || value.length == 9) && value[0] == '#') {
                  map[key] = value;
                } else {
                  value = map[key];
                }

                changed = true;
              }
            break;
          }

        if (changed)
          {
            //console.log('modify ' + c_id + '-' + key + ' => ' + value);
            this.callbacks.fire({
              cmd   : 'map.modified',
              id    : c_id,
              key   : key,
              value : value
            });
          }
      }
  };

  this.removeSelected = function() {
    if (!inited)
      return;

    if (setting.groupSelectedID.length) {
      var i = 0;
      var id = setting.groupSelectedID;
      for (i; i < id.length ; i++)
        removeItemData(id[i]);
      setting.callbacks.fire({ cmd: 'group.removed', id: id[0] });
    } else {
      removeItemData(setting.selectedID);
    }
    setting.callbacks.fire({ cmd: 'canvas.rendering' });
  };

  // Remove data to selected item on canvas
  function removeItemData(id) {
    if (id && id !== '') {
      var elms = id.split('-');
      if (elms[3] == 'null')
        return;

      if (setting.config.maps[elms[1]].items[elms[3]]) {
        setting.config.maps[elms[1]].items[elms[3]].valid = false;
        setting.callbacks.fire({
          cmd   : 'item.removed',
          id    : id
        });
        setting.select(null);
      }
    }
  }

  this.addBackground = function(bgIndex, filename) {
    if (!inited)
      return;

    var m_idx = setting.map_idx;
    if (!setting.config ||
        !setting.config.maps[m_idx] ||
        !setting.config.maps[m_idx].items)
      return;

    var valid = true;
    var ext = filename.substr(filename.lastIndexOf('.') + 1);
    if (!ext || (ext != "png" && ext != "jpg")) {
      valid = false;
      ext = "png";
    }

    var elms = filename.split('-');
    if (elms.length != 3 || elms[0] != "map")
      valid = false;

    if (isNaN(parseInt(elms[1]), 10))
      valid = false;

    if (isNaN(parseInt(elms[2]), 10))
      valid = false;

    var fname = "";
    if (valid)
      fname = filename;
    else {
      fname = "map-" + setting.map_idx + "-" + bgIndex + "." + ext;

      var oldPath = app.path.join(setting.imageDir, filename);
      if (!app.fs.existsSync(oldPath))
        return;

      var newPath = app.path.join(setting.imageDir, fname);

      try {
        app.fs.renameSync(oldPath, newPath);
      } catch(e) {
        console.log("there is no '" + filename + "'");
        return;
      }

      console.log("change name: " + filename + " to " + fname);
    }

    setting.config.maps[m_idx].backgrounds[bgIndex] = fname;

    this.callbacks.fire({
      cmd  : 'item.addBackground',
      id   : "map-" + m_idx + "-bg-" + bgIndex,
      file : fname
    });
  };
  this.genBackgroundName = function(bgIndex, ext) {
    if (!inited)
      return;

    var m_idx = setting.map_idx;
    if (!setting.config ||
        !setting.config.maps[m_idx] ||
        !setting.config.maps[m_idx].items)
      return;

    if (!ext)
      ext = "png";

    return "map-" + setting.map_idx + "-" + bgIndex + "." + ext;
  };

  this.removeBackground = function(bgIndex) {
    if (!inited)
      return;

    var m_idx = setting.map_idx;
    if (!setting.config ||
        !setting.config.maps[m_idx] ||
        !setting.config.maps[m_idx].items)
      return;

    setting.config.maps[m_idx].backgrounds[bgIndex] = "empty";

    this.callbacks.fire({
      cmd  : 'item.removeBackground',
      id   : "map-" + m_idx + "-bg-" + bgIndex
    });
  };

  this.addMap = function(m, options) {
    if (!inited)
      return;

    var map = m;
    if (!map)
      {
        map = {
          'valid'  : true,
          'id'     : 'map-' + this.config.maps.length,
          'name'   : options.name,
          'width'  : options.width,
          'height' : options.height,
          'background_color' : app.defaultBackgroundColor,
          'background_images' : [],
          'backgrounds' : ["", "", "", "", ""],
          'items' : []
        };
        this.config.maps.push(map);

        this.callbacks.fire({
          cmd : 'map.added',
          id  : map.id,
          map : map
        });
        this.selectMap(map.id);
        return;
      }

    this.callbacks.fire({
      cmd : 'map.added',
      id  : map.id,
      map : map
    });
  };

  this.removeMap = function(mapID) {
    for (var i = 0; i < this.config.maps.length; i++)
      {
        if (this.config.maps[i].id == mapID)
          {
            this.config.maps[i].valid = false;
            this.callbacks.fire({
              cmd : 'map.removed',
              id : mapID
            });
            break;
          }
      }
  };

  this.openZipFile = function(zipPath) {
    if (app.path.extname(zipPath).toLowerCase() != '.zip')
      {
        alert ("'" + zipPath + "' is not a E-MAP file.");
        return;
      }

    if (!app.fs.existsSync(zipPath)) {
      console.log("there is no '" + zipPath + "', create a new file.");
      this.newZipFile(zipPath);
      return;
    }

    var loadingObj = $('#app-loading-overlay');
    loadingObj.show();

    var rdata = app.fs.readFileSync(zipPath, 'binary');
    var unzip = new require('node-zip')(rdata, {
      base64: false, checkCRC32: true
    });

    var tmpDir = app.requestTemporaryDir();
    $.each(unzip.files, function (index, entry) {
      var tmpPath = app.path.join(tmpDir, entry.name);
      if (entry.options.dir)
        app.fs.mkdirSync(tmpPath);
      else
        app.fs.writeFileSync(tmpPath, entry.data, 'binary');
    });

    var mapPath = app.path.join(tmpDir, app.mapFilename);
    if (!app.fs.existsSync(mapPath))
      {
        alert("there is no '" + app.mapFilename + "' file");
        app.releaseTemporaryDir(tmpDir);
        loadingObj.hide();
        return;
      }

    rdata = app.fs.readFileSync(mapPath);
    setting.originMapFile = rdata;
    var config;
    try {
      config = JSON.parse(rdata);
      if (!config) {
        alert('invalid map file1 : ' + zipPath);
        app.releaseTemporaryDir(tmpDir);
        loadingObj.hide();
        return;
      }
    } catch(e) {
      alert('invalid map file2 : ' + zipPath);
      app.releaseTemporaryDir(tmpDir);
      loadingObj.hide();
      return;
    }

    if (!config.maps) {
      alert('invalid map format : ' + zipPath);
      app.releaseTemporaryDir(tmpDir);
      loadingObj.hide();
      return;
    }

    var imageDir = app.path.join(tmpDir, 'images');
    if (!app.fs.existsSync(imageDir))
      app.fs.mkdirSync(imageDir);

    setting.init(config, zipPath, tmpDir);
    setting.load();
    loadingObj.hide();
  };
  this.newZipFile = function(zipPath) {
    var mapData = {
      'format' : 1,
      'maps' : []
    };

    var mapJson = JSON.stringify(mapData, null, 2);
    setting.originMapFile = mapJson;
    var zip = new require('node-zip')();
    zip.file(app.mapFilename, mapJson);
    var zipFolder = zip.folder('images');
    var data = zip.generate( { base64: false } );
    app.fs.writeFileSync(zipPath, data, 'binary');

    this.openZipFile(zipPath);
  };

  this.generateMap = function() {
    var config = {};

    config.format = setting.config.format;
    config.maps = [];
    for (var m = 0; m < setting.config.maps.length; m++) {
      var map = setting.config.maps[m];
      if (!map.valid)
        continue;

      var new_map = {};
      new_map.name = map.name;
      new_map.width = map.width;
      new_map.height = map.height;
      if (map.background_color)
        new_map.background_color = map.background_color;

      new_map.background_images = [];
      for (var i = 0; i < map.backgrounds.length; i++)
        {
          if (!map.backgrounds[i] ||
              map.backgrounds[i] === "" ||
              map.backgrounds[i] == "empty")
            continue;

          new_map.background_images.push(map.backgrounds[i]);
        }

      if (map.text_font)
        new_map.text_font = map.text_font;

      if (map.text_color)
        new_map.text_color = map.text_color;

      new_map.items = [];
      for (i = 0; i < map.items.length; i++) {
          var item = map.items[i];
          if (!item.valid)
            continue;

          var new_item = {};
          new_item.name = item.name;
          new_item.type = item.type;
          new_item.x1 = item.x1;
          new_item.y1 = item.y1;
          new_item.x2 = item.x2;
          new_item.y2 = item.y2;
          new_item.camera_direction = Number(item.camera_direction);
          new_item.camera_range = Number(item.camera_range);
          new_map.items.push(new_item);
      }

      config.maps.push(new_map);
    }

    return config;
  };

  this.saveZipFile = function(filePath) {
    if (!inited)
      return;

    // Remove group selection be caused by changed coordinate as save.
    if (setting.groupSelectedID.length) {
      setting.callbacks.fire({ cmd: 'group.removed', id: setting.groupSelectedID[0] });
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    }

    setting.callbacks.fire({ cmd: 'setting.saveData' });

    var loadingObj = $('#app-loading-overlay');
    loadingObj.show();

    var mapData = setting.generateMap();
    var mapJson = JSON.stringify(mapData, null, 2);
    if (setting.originMapFile == mapJson) {
      loadingObj.hide();
      return;
    }
    setting.originMapFile = mapJson;
    var zip = new require('node-zip')();

    zip.file(app.mapFilename, mapJson);

    var images = [];
    var i;
    for (m = 0; m < mapData.maps.length; m++) {
      var map = mapData.maps[m];

      for (i = 0; i < map.background_images.length; i++)
        images.push(map.background_images[i]);
    }

    var lookupImage = function(filename) {
      if (images.length <= 0)
        return false;

      var i = 0;

      for (i; i < images.length; i++) {
        if (images[i] == filename)
          return true;
      }

      return false;
    };

    if (app.fs.existsSync(setting.imageDir))
      {
        var files = app.fs.readdirSync(setting.imageDir);
        var zipFolder = zip.folder('images');
        for (i = 0; i < files.length; i++)
          {
            if (!lookupImage(files[i]))
              continue;

            var imageFile = app.path.join(setting.imageDir, files[i]);
            zipFolder.file(files[i],
                           app.fs.readFileSync(imageFile).toString('base64'),
                           { base64: true, binary: true });
          }
      }
    var data = zip.generate({ base64: false });

    // Separate whether 'Savs As File' function as 'filePath' value.
    if (filePath) {
      app.fs.writeFileSync(filePath, data, 'binary');
      setting.zipPath = filePath;
    } else
      app.fs.writeFileSync(setting.zipPath, data, 'binary');

    loadingObj.hide();
  };
};

// Create menu bar.
var gui = require('nw.gui');
var menu = new gui.Menu({type: 'menubar'});
var fileMenu = new gui.Menu();
var viewMenu = new gui.Menu();

$(function() {
  var setting;
  var diagram;
  var sidebar;
  var validateInputValue = function(elem, min, max) {
    var val = parseInt($(elem).val());
    if (!val) val = 0;
    val = Math.max(min, Math.min(max, val));
    $(elem).val(val);
    return val;
  };

  // Use option value.
  var exceptFourNine = false;
  var descOrder = false;

  // Disable mouse wheel scroll.
  if (window.addEventListener) {
    window.addEventListener('DOMMouseScroll', function(e) {
      e.preventDefault();
      e.returnValue = false;
    }, false);
  }
  window.onmousewheel = document.onmousewheel = function(e) {
    e.preventDefault();
    e.returnValue = false;
  };

  app.window = app.gui.Window.get();

  setting = new app.Setting();
  diagram = new app.Diagram('app-diagram', setting);
  sidebar = new app.Sidebar('app-sidebar', setting);
  sidebar.setItemEditible(false);

  fileMenu.append(new gui.MenuItem({
    label: 'New file...',
    click: function() {
      $('#app-map-new-file').trigger('click');
    },
    key: 'n',
    modifiers: 'ctrl'
  }));
  fileMenu.append(new gui.MenuItem({
    label: 'Open file...',
    click: function() {
      $('#app-map-open-file').trigger('click');
    },
    key: 'o',
    modifiers: 'ctrl'
  }));
  fileMenu.append(new gui.MenuItem({
    label: 'Save',
    click: function() {
      setting.saveZipFile();
    },
    key: 's',
    modifiers: 'ctrl'
  }));
  fileMenu.append(new gui.MenuItem({
    label: 'Save As...',
    click: function() {
      if (!setting.zipPath)
      return;

      $('#app-map-save-as-file').attr('nwsaveas', setting.zipPath);
      $('#app-map-save-as-file').trigger('click');
    }
  }));
  fileMenu.append(new gui.MenuItem({
    label: 'Quit',
    click: function() {
      app.window.close();
    },
    key: 'q',
    modifiers: 'ctrl'
  }));

  viewMenu.append(new gui.MenuItem({
    type: 'checkbox',
    label: '800%',
    click: function() {
      clearCheckViewMenu();
      this.checked = true;
      setting.zoom('8.0');
    }
  }));
  viewMenu.append(new gui.MenuItem({
    type: 'checkbox',
    label: '400%',
    click: function() {
      clearCheckViewMenu();
      this.checked = true;
      setting.zoom('4.0');
    }
  }));
  viewMenu.append(new gui.MenuItem({
    type: 'checkbox',
    label: '200%',
    click: function() {
      clearCheckViewMenu();
      this.checked = true;
      setting.zoom('2.0');
    }
  }));
  viewMenu.append(new gui.MenuItem({
    type: 'checkbox',
    checked: true,
    label: '100%',
    click: function() {
      clearCheckViewMenu();
      this.checked = true;
      setting.zoom('1.0');
    }
  }));
  viewMenu.append(new gui.MenuItem({
    type: 'checkbox',
    label: '50%',
    click: function() {
      clearCheckViewMenu('50%');
      this.checked = true;
      setting.zoom('0.5');
    }
  }));
  viewMenu.append(new gui.MenuItem({
    type: 'separator',
    label: '-',
    click: function() {}
  }));
  viewMenu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Developer Tools',
    click: function() {
      if (this.checked)
        app.window.showDevTools();
      else
        app.window.closeDevTools();
    }
  }));

  menu.append(new gui.MenuItem({
    label: 'File',
    submenu: fileMenu
  }));
  menu.append(new gui.MenuItem({
    label: 'View',
    enabled: false,
    submenu: viewMenu
  }));
  app.window.menu = menu;

  var app_sidebar_width = parseInt($('#app-sidebar').css('width'));
  $('#app-diagram-container').css('width', (1280 - app_sidebar_width) + "px");
  $('#app-diagram-container').css('left', app_sidebar_width + "px");
  $('#app-diagram').css('width', (1280 - app_sidebar_width) + "px");
  $('#app-diagram').css('left', app_sidebar_width + "px");

  $('#app-overlay').show();

  function clearCheckViewMenu() {
    var i;

    viewMenu.items.forEach(function (item) {
      if (item.type == 'checkbox' && item.label.indexOf('%') >= 0)
        item.checked = false;
    });
  }

  $('#app-map-new-file').on('change', function(e) {
    var path = $.trim($(this).val());
    if (path === '')
      return;

    var zipPath = path;
    var ext = zipPath.substr(zipPath.lastIndexOf('.') + 1);
    if (!ext || ext == zipPath)
      zipPath += ".zip";

    setting.newZipFile(zipPath);
    $(this).val("");
  });

  $('#app-map-open-file').on('change', function(e) {
    var path = $.trim($(this).val());
    if (path === '')
      return;

    setting.openZipFile(path);
    $(this).val("");
  });

  $('#app-sidebar-bg-file').on('change', function(e) {
    var path = $.trim($(this).val());
    if (path === '')
      return;
    $(this).val('');

    var filename = app.path.basename(path);
    if (!filename || filename === "")
      return;

    var ext = filename.toLowerCase().substr(filename.lastIndexOf('.') + 1);
    if (!ext || (ext != "png" && ext != "jpg"))
      {
        console.log(path + " is not supported image file");
        return;
      }
    var bgIndex = app.curBgTarget.split('-')[5];
    var fname = setting.genBackgroundName(bgIndex, ext);
    var imagePath = app.path.join(setting.imageDir, fname);
    app.fs.writeFileSync(imagePath, app.fs.readFileSync(path), 'binary');
    setting.addBackground(bgIndex, fname);
  });

  $('#app-map-save-as-file').on('change', function(e) {
    var path = $.trim($(this).val());
    if (path === '')
      return;

    var zipPath = path;
    var ext = zipPath.substr(zipPath.lastIndexOf('.') + 1);
    if (!ext || ext == zipPath)
      zipPath += ".zip";

    setting.saveZipFile(zipPath);
    $(this).val("");
  });

  $('#app-sidebar-map-add').click(function(e) {
    $('#app-modal-map').modal('show');
  });

  $('#app-sidebar-item-add-rect').click(function(e) {
    setting.add(null, { type: 0, select: true });
  });
  $('#app-sidebar-item-add-circle').click(function(e) {
    setting.add(null, { type: 1, select: true });
  });
  $('#app-sidebar-item-remove').click(function(e) {
    setting.removeSelected();
  });

  $('#app-modal-map-ok').click(function(e) {
    $('#app-modal-map').modal('hide');
    var name = $.trim($('#app-modal-map-name').val());
    if (name === '')
      return;

    var width = parseInt($('#app-modal-map-width').val());
    if (width < 100 || width > 9999)
      return;

    var height = parseInt($('#app-modal-map-height').val());
    if (width < 100 || width > 9999)
      return;

    setting.addMap(null, {
      name   : name,
      width  : width,
      height : height
    });
  });

  var confirmFunc = null;
  var confirm = function (msg, title, func) {
    confirmFunc = func;
    $('#app-modal-confirm-title').html(title || 'Confirm');
    $('#app-modal-confirm-message').html(msg || 'Hello~');
    $('#app-modal-confirm').modal();
  };
  $('#app-modal-confirm .btn-primary').on('click', function () {
    $('#app-modal-confirm').hide();
    if (confirmFunc) {
      confirmFunc();
      confirmFunc = null;
    }
  });
  $('#app-modal-confirm-quit').click(function(e) {
    $('#app-modal-confirm').hide();
    setting.originMapFile = null;
    app.window.close();
  });

  $('#app-sidebar-item-info-name').change(function(e) {
    var name = $.trim($(this).val());
    if (name === '')
      return;

    setting.callbacks.fire({
      cmd   : 'item.modified',
      id    : setting.selectedID,
      key   : 'name',
      value : name
    });
  });

  $('#app-sidebar-item-info-coordinate').change(function(e) {
    var coords = $.trim($(this).val());
    if (coords === '')
      return;

    var length = coords.split(',').length;
    if (length != 4)
      return;

    setting.callbacks.fire({
      cmd   : 'item.modified',
      id    : setting.selectedID,
      key   : 'points',
      value : coords
    });
  });

  $('#app-sidebar-item-info-direction').change(function(e) {
    var direction = $.trim($(this).val());
    if (direction === '')
      return;

    var length = direction.split(',').length;
    if (length != 2)
      return;

    var value = direction.split(',');

    // Camera direction
    if (value[0] < -1)
      value[0] = -1;
    else if (value[0] > 359)
      value[0] = 359;

    // Camera range
    if (value[1] < -1)
      value[1] = -1;
    else if (value[1] === 0)
      value[1] = 1;
    else if (value[1] > 360)
      value[1] = 360;

    if (setting.groupSelectedID.length) {
      var i = 0;

      setting.groupObject.forEachObject(function (item) {
        if (!item.c_id)
          return;

        item.camera_direction = Number(value[0]);
        item.camera_range = Number(value[1]);
      });
      $('#app-sidebar-item-info-direction').val(value[0] + ',' + value[1]);
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    } else {
      var item = setting.currentObject;
      if (!item)
        return;

      setting.callbacks.fire({
        cmd   : 'item.modified',
        id    : setting.selectedID,
        key   : 'direction',
        value : value
      });
    }
  });

  $('#app-sidebar-item-info-fill-zero').change(function(e) {
    $('#app-sidebar-item-info-fill-zero-button').click();
  });

  $('#app-sidebar-item-info-fill-zero-button').click(function(e) {
    var num = $.trim($('#app-sidebar-item-info-fill-zero').val());
    if (num === '')
      return;
    Fillzero(num);
  });

  // Fill zero as digit number for item name in group.
  function Fillzero(length) {
    if (setting.groupSelectedID.length) {
      var i = 0;

      setting.groupObject.forEachObject(function (item) {
        if (!item.c_id)
          return;

        var item_name = item.get('label');
        var nameLength = item_name.length;
        var char_name = item_name.replace(/[\d]+/g,'');
        var num_name = item_name.replace(/[\D]+/g,'');

        if (nameLength < length) {
          for (i = 0; i < (length - nameLength); i++)
            num_name = '0' +  num_name;
          item.set('label', char_name + num_name);
        } else if (nameLength > length) {
          for (i = 0; i < (nameLength - length); i++) {
            if (num_name.indexOf('0') === 0)
              num_name = num_name.substring(1);
            else
              break;
          }
          item.set('label', char_name + num_name);
        }
      });
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    }
  }

  // window width(1280)/height(720) of package.json
  var diff_w = 1280 - $('#app-diagram').width();
  var diff_h = 720 - $('#app-diagram').height();

  // change position of scrollbar according to window size
  function resize_real() {
    var width = $(window).width() - diff_w;
    var height = $(window).height() - diff_h;

    $('#app-diagram-container').css('width', width + 'px');
    $('#app-diagram-container').css('height', height + 'px');
    $('#app-diagram').css('width', width + 'px');
    $('#app-diagram').css('height', height + 'px');
    diagram.reflectSizeChaged();
  }

  $(window).resize(function() {
    clearTimeout(this.rtid);
    this.rtid = setTimeout(resize_real, 100);
  });

  app.window.on('close', function() {
    // Check whether the data is changed.
    if (setting.originMapFile)
    {
      // Remove group selection be caused by changed coordinate as save.
      if (setting.groupSelectedID.length) {
        setting.callbacks.fire({ cmd: 'group.removed', id: setting.groupSelectedID[0] });
        setting.callbacks.fire({ cmd: 'canvas.rendering' });
      }

      setting.callbacks.fire({ cmd: 'setting.saveData' });

      var mapData = setting.generateMap();
      var mapJson = JSON.stringify(mapData, null, 2);
      if (setting.originMapFile != mapJson) {
        confirm('Do you want to save changes before closing?',
                'Quit the program',
                function () {
                  setting.saveZipFile();
                  app.window.close();
                });
        return;
      }
    }

    // cleanup temporary directories
    if (setting.tmpDir && app.fs.existsSync(setting.tmpDir))
      app.releaseTemporaryDir(setting.tmpDir);
    setting.tmpDir = null;

    if (app.tmpDir && app.fs.existsSync(app.tmpDir))
      app.releaseTemporaryDir(app.tmpDir);
    app.tmpDir = null;

    this.close(true);
  });

  // Check the focus in sidebar and navbar.
  var checkFocusSidebar = false;

  $('.app-container').focusin(function() {
    checkFocusSidebar = true;
  });
  $('.app-container').focusout(function() {
    checkFocusSidebar = false;
  });

  // Move item of canvas by key event
  $('body').keydown(function(e) {

    // Setting zoom in / out
    if (e.keyCode == 187) {
      setting.zoomIn(setting.currentScale);
      return;
    }
    if (e.keyCode == 189) {
      setting.zoomOut(setting.currentScale);
      return;
    }

    if (checkFocusSidebar)
      return;
    var elms = setting.selectedID.split('-');
    if (elms.length != 4 || elms[3] == 'null')
      return;

    e.preventDefault();

    if (setting.groupSelectedID.length)
      item = setting.groupObject;
    else
      item = setting.currentObject;

    if (!item)
      return;

    modifyItemCoordinate(item, e.keyCode);
  });

  // Change coordinate for object on canvas.
  function modifyItemCoordinate(obj, keyCode) {

    if (keyCode == 37) {
      obj.left -= setting.currentScale;
    } else if (keyCode == 38) {
      obj.top -= setting.currentScale;
    } else if (keyCode == 39) {
      obj.left += setting.currentScale;
    } else if (keyCode == 40) {
      obj.top += setting.currentScale;
    } else if (keyCode == 46) {
      setting.removeSelected();
      return;
    } else {
      return;
    }
    obj.setCoords();

    if (!setting.groupSelectedID.length) {
      var points = [];

      points.push(Math.floor(obj.oCoords.tl.x / setting.currentScale));
      points.push(Math.floor(obj.oCoords.tl.y / setting.currentScale));
      points.push(Math.floor(obj.oCoords.br.x / setting.currentScale));
      points.push(Math.floor(obj.oCoords.br.y / setting.currentScale));

      $('#app-sidebar-item-info-coordinate').val(points.join(','));
    }

    setting.callbacks.fire({ cmd: 'canvas.rendering' });
  }

  $('#app-sidebar-repeat-count').change(function(e) {
    var v = $.trim($(this).val());
    var vi = parseInt(v);
    if (vi < 1)
      vi = 1;
    if (vi > 100)
      vi = 100;

    $(this).val(vi.toString());
  });

  $('#app-sidebar-repeat-add-right').click(function(e) {
    var elms = setting.selectedID.split('-');
    if (elms.length != 4 || elms[3] == 'null')
      return;

    var baseItem = setting.currentObject;
    if (!baseItem)
      return;

    var map = setting.config.maps[elms[1]];
    var total = parseInt($('#app-sidebar-repeat-count').val());
    var sn = baseItem.get('label');
    var width = baseItem.getWidth() / setting.currentScale;
    var idx = 0;
    var count = 1;
    var change = false;
    var char_name = sn.replace(/[\d]+/g,'');
    var num_name = parseInt(sn.replace(/[\D]+/g,''));

    while (count <= total) {
      idx = checkDesc(idx);

      var n = num_name + idx;
      var name = n.toString();
      if (exceptName(name))
        continue;

      name = fillZeroLikeBaseItem(name, char_name, baseItem);
      name = char_name + name;

      var options = {
        type  : setting.setObjectType(baseItem.type),
        name  : name,
        x1    : (baseItem.left / setting.currentScale) + (width * count),
        y1    : baseItem.top / setting.currentScale,
        x2    : ((baseItem.left + baseItem.getWidth()) / setting.currentScale) + (width * count),
        y2    : (baseItem.top + baseItem.getHeight()) / setting.currentScale,
        select: false
      };

      if ((options.x1 >= 0 && options.x1 <= map.width) &&
          (options.y1 >= 0 && options.y1 <= map.height) &&
          (options.x2 >= 0 && options.x2 <= map.width) &&
          (options.y2 >= 0 && options.y2 <= map.height)) {
        setting.add(null, options);
      } else {
        break;
      }

      count++;
      change = true;
    }

    if (change) {
      setting.select(null);
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    }
  });

  $('#app-sidebar-repeat-add-left').click(function(e) {
    var elms = setting.selectedID.split('-');
    if (elms.length != 4 || elms[3] == 'null')
      return;

    var baseItem = setting.currentObject;
    if (!baseItem)
      return;

    var map = setting.config.maps[elms[1]];
    var total = parseInt($('#app-sidebar-repeat-count').val());
    var sn = baseItem.get('label');
    var width = baseItem.getWidth() / setting.currentScale;
    var idx = 0;
    var count = 1;
    var change = false;
    var char_name = sn.replace(/[\d]+/g,'');
    var num_name = parseInt(sn.replace(/[\D]+/g,''));

    while (count <= total) {
      idx = checkDesc(idx);

      var n = num_name + idx;
      var name = n.toString();
      if (exceptName(name))
        continue;

      name = fillZeroLikeBaseItem(name, char_name, baseItem);
      name = char_name + name;

      var options = {
        type  : setting.setObjectType(baseItem.type),
        name  : name,
        x1    : (baseItem.left / setting.currentScale) - (width * count),
        y1    : baseItem.top / setting.currentScale,
        x2    : ((baseItem.left + baseItem.getWidth()) / setting.currentScale) - (width * count),
        y2    : (baseItem.top + baseItem.getHeight()) / setting.currentScale,
        select: false
      };

      if ((options.x1 >= 0 && options.x1 <= map.width) &&
          (options.y1 >= 0 && options.y1 <= map.height) &&
          (options.x2 >= 0 && options.x2 <= map.width) &&
          (options.y2 >= 0 && options.y2 <= map.height)) {
        setting.add(null, options);
      } else {
        break;
      }

      count++;
      change = true;
    }

    if (change) {
      setting.select(null);
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    }
  });

  $('#app-sidebar-repeat-add-up').click(function(e) {
    var elms = setting.selectedID.split('-');
    if (elms.length != 4 || elms[3] == 'null')
      return;

    var baseItem = setting.currentObject;
    if (!baseItem)
      return;

    var map = setting.config.maps[elms[1]];
    var total = parseInt($('#app-sidebar-repeat-count').val());
    var sn = baseItem.get('label');
    var height = baseItem.getHeight() / setting.currentScale;
    var idx = 0;
    var count = 1;
    var change = false;
    var char_name = sn.replace(/[\d]+/g,'');
    var num_name = parseInt(sn.replace(/[\D]+/g,''));

    while (count <= total) {
      idx = checkDesc(idx);

      var n = num_name + idx;
      var name = n.toString();
      if (exceptName(name))
        continue;

      name = fillZeroLikeBaseItem(name, char_name, baseItem);
      name = char_name + name;

      var options = {
        type  : setting.setObjectType(baseItem.type),
        name  : name,
        x1    : baseItem.left / setting.currentScale,
        y1    : (baseItem.top / setting.currentScale) - (height * count),
        x2    : (baseItem.left + baseItem.getWidth()) / setting.currentScale,
        y2    : ((baseItem.top + baseItem.getHeight()) / setting.currentScale) - (height * count),
        select: false
      };

      if ((options.x1 >= 0 && options.x1 <= map.width) &&
          (options.y1 >= 0 && options.y1 <= map.height) &&
          (options.x2 >= 0 && options.x2 <= map.width) &&
          (options.y2 >= 0 && options.y2 <= map.height)) {
        setting.add(null, options);
      } else {
        break;
      }

      count++;
      change = true;
    }

    if (change) {
      setting.select(null);
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    }
  });

  $('#app-sidebar-repeat-add-down').click(function(e) {
    var elms = setting.selectedID.split('-');
    if (elms.length != 4 || elms[3] == 'null')
      return;

    var baseItem = setting.currentObject;
    if (!baseItem)
      return;

    var map = setting.config.maps[elms[1]];
    var total = parseInt($('#app-sidebar-repeat-count').val());
    var sn = baseItem.get('label');
    var height = baseItem.getHeight() / setting.currentScale;
    var idx = 0;
    var count = 1;
    var change = false;
    var char_name = sn.replace(/[\d]+/g,'');
    var num_name = parseInt(sn.replace(/[\D]+/g,''));

    while (count <= total) {
      idx = checkDesc(idx);

      var n = num_name + idx;
      var name = n.toString();
      if (exceptName(name))
        continue;

      name = fillZeroLikeBaseItem(name, char_name, baseItem);
      name = char_name + name;

      var options = {
        type  : setting.setObjectType(baseItem.type),
        name  : name,
        x1    : baseItem.left / setting.currentScale,
        y1    : (baseItem.top / setting.currentScale) + (height * count),
        x2    : (baseItem.left + baseItem.getWidth()) / setting.currentScale,
        y2    : ((baseItem.top + baseItem.getHeight()) / setting.currentScale) + (height * count),
        select: false
      };

      if ((options.x1 >= 0 && options.x1 <= map.width) &&
          (options.y1 >= 0 && options.y1 <= map.height) &&
          (options.x2 >= 0 && options.x2 <= map.width) &&
          (options.y2 >= 0 && options.y2 <= map.height)) {
        setting.add(null, options);
      } else {
        break;
      }

      count++;
      change = true;
    }

    if (change) {
      setting.select(null);
      setting.callbacks.fire({ cmd: 'canvas.rendering' });
    }

  });

  // Fill zero as digit number for item name like length of baseitem name.
  function fillZeroLikeBaseItem(name, char_name, baseItem) {
    var baseLength = baseItem.get('label').length - char_name.length;

    if (name.length == baseLength || name.length > baseLength)
      return name;

    for(var i = name.length; i < (baseLength); i++) {
      name = '0' + name;
    }
    return name;
  }

  // Except name include of '4,9' according to 'exceptFourNine' option
  function exceptName(name) {
    if ((name.indexOf('4') >= 0 || name.indexOf('9') >= 0) && exceptFourNine)
      return true;

    return false;
  }

  // Set increase or decrease according to 'descOrder' option
  function checkDesc(idx) {
    if (descOrder)
      idx -= 1;
    else
      idx += 1;
    return idx;
  }

  $('#app-sidebar-repeat-option-except-number').click(function(e) {
    exceptFourNine = setActive($(this));
    $(this).blur();
  });

  $('#app-sidebar-repeat-option-descending').click(function(e) {
    descOrder = setActive($(this));
    $(this).blur();
  });

  // Set active for button class.
  function setActive(target) {
    var active = !target.hasClass('active');
    if (active)
      target.addClass('active');
    else
      target.removeClass('active');
    return active;
  }

  // Set double click event for item on canvas.
  $('#app-diagram').on('dblclick', function() {
    var elms = setting.selectedID.split('-');
    if (elms[3] == 'null')
      return;

    // Set autofocus to name text by selected item.
    $('#app-sidebar-item-info-name').focus();
  });

  if (0) app.window.showDevTools();
  app.window.show();

  setTimeout(function () {
    if (app.gui.App.argv.length >= 1) {
      setting.openZipFile(app.gui.App.argv[0]);
    }

    // Listen to `open` event
    app.gui.App.on('open', function(cmdline) {
      setting.openZipFile(cmdline.split(' ').reverse()[0]);
    });
  }, 1000);
});

});
