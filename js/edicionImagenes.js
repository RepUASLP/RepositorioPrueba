var EdicionImagenes = function (idImagen)
{
	this.idImagen = idImagen;					//id del contenedor de la imagen
	this.$imagen = $(idImagen);					//contenedor de la imagen
	
	this.URL = window.URL || window.webkitURL;			
	this.tipoImagenCargada = "image/tiff";
	this.URLImagenCargada;				
	
	this.opciones = {
		preview: '.img-preview',
		autoCrop: true,
		ready: function (e) {
			$(this).cropper('enable');						
	
			//mostrar datos de la imagen
			var data = $(this).cropper('getImageData');					
			var ancho = (data.naturalWidth * 2.54)/300;				
			var alto = (data.naturalHeight * 2.54)/300;
			$("#diAncho").html(ancho.toFixed(2) + " cm");				
			$("#diAlto").html(alto.toFixed(2) + " cm");
		},			
		crop: function (e) {
			
			//mostrar datos del corte	
			var ancho = (e.width * 2.54)/300;
			var alto = (e.height * 2.54)/300;
			$("#diAnchoCorte").html(ancho.toFixed(2) + " cm");
			$("#diAltoCorte").html(alto.toFixed(2) + " cm");
		},
		zoom: function (e) {
			console.log(e.type, e.ratio);
		}
	};
}

EdicionImagenes.prototype.cargarImagen = function (imagen, tipo)
{
	this.tipoImagenCargada = tipo;		
	
	if (this.URL) 
	{
		if (this.URLImagenCargada)
			this.URL.revokeObjectURL(this.URLImagenCargada);
				
		this.URLImagenCargada = this.URL.createObjectURL(imagen);
		
		//para cargar imagen dentro de un img y no usar canvas, solo se usa esta linea, el resto del codigo de la funcion se omite.
		//this.$imagen.cropper('destroy').attr('src', this.URLImagenCargada).cropper(this.opciones);
		
		this.$imagen.cropper('destroy');

		//imagenes tiff, trato especial
		if (tipo == "image/tiff")
		{				
			var reader = new FileReader();
			
			reader.onload = (function (archivo, idImagen, opcionesImagen) {					
				return function (e) {
					var buffer = e.target.result;
					var tiff = new Tiff({buffer: buffer});
					var canvas = tiff.toCanvas();						
					var width = tiff.width();
					var height = tiff.height();
					
					$(canvas).attr("id", idImagen.substr(1));												
					
					if (canvas) {						
						$(".imagen").empty().append(canvas);
						$(canvas).cropper(opcionesImagen);	
					}						
				};
			})(imagen, this.idImagen, this.opciones);

			reader.readAsArrayBuffer(imagen);				
		}
		else
		{
			//cargar imagen dentro de un canvas
			var img = new Image();
			img.src = this.URLImagenCargada;				
			img.canvas = this.$imagen;
			img.opcionesCanvas = this.opciones;
			
			img.onload = function(){
				var width = this.width;
				var height = this.height;
				var canvas = this.canvas[0];					
				var cropper;
				canvas.width = width;
				canvas.height = height;										
				
				canvas.getContext('2d').drawImage(
					this,
					0, 0, this.naturalWidth, this.naturalHeight,
					0, 0, width, height
				);
			
				this.canvas.cropper(img.opcionesCanvas);					
			};
		}	
	}
}

EdicionImagenes.prototype.activo = function()
{
	if (this.$imagen.data('cropper'))
		return this.$imagen.data('cropper').cropped;
}
	
EdicionImagenes.prototype.seleccionarImagen = function (imagen, tipo) 
{	
	this.$imagen = $(this.idImagen);	
	this.cargarImagen(imagen, tipo);
}
	
EdicionImagenes.prototype.rotar = function (grados)
{				
	(this.activo()) ? this.$imagen.cropper('rotate', grados) : '';
}
	
EdicionImagenes.prototype.voltearX = function (giro)
{		
	(this.activo()) ? this.$imagen.cropper('scaleX', giro) : '';
}
	
EdicionImagenes.prototype.voltearY = function(giro)
{		
	(this.activo()) ? this.$imagen.cropper('scaleY', giro) : '';
}
	
EdicionImagenes.prototype.mover = function(posicionX, posicionY)
{	
	(this.activo()) ? this.$imagen.cropper('move', posicionX, posicionY) : '';
}
	
EdicionImagenes.prototype.zoom = function(nivel)
{	
	(this.activo()) ? this.$imagen.cropper('zoom', nivel) : '';
}
	
EdicionImagenes.prototype.habilitarEdicion = function (habilitar)	
{	
	(this.activo()) ? ((habilitar) ? this.$imagen.cropper('enable') : this.$imagen.cropper('disable')) : '';		
}

EdicionImagenes.prototype.reset = function()
{
	(this.activo()) ? this.$imagen.cropper('reset') : '';
}	
	
EdicionImagenes.prototype.limpiar = function()
{
	this.$imagen.cropper('destroy');		
}
	
EdicionImagenes.prototype.getImagen = function()
{
	var result = null;
		
	if (this.activo())
		result = this.$imagen.cropper('getCroppedCanvas');
		
	return result;
}
	
EdicionImagenes.prototype.posicionarImagen = function()
{
	if (this.activo())
		this.$imagen.cropper('setDragMode', 'move');
}
	
EdicionImagenes.prototype.posicionarCorte = function()
{
	if (this.activo())
		this.$imagen.cropper('setDragMode', 'crop');
}
	
EdicionImagenes.prototype.setTamCorte = function(ancho, alto, unidad, ppp)
{
	var data = this.$imagen.cropper('getImageData');
	var rotacion = data.rotate;
	var escalaX = data.scaleX;
	var escalaY = data.scaleY;
	
	if (ancho == 0 && alto == 0)
	{
		ancho = data.naturalWidth;
		alto = data.naturalHeight;
	}		
	else
	{
		switch(unidad)
		{
			case 'cm':	unidad = 2.54;
			break;
			
			case 'mm':	unidad = 25.4;
			break;
			
			case 'in':	unidad = 1;
			break;
		}
		
		ancho = this.unidadToPixel(ancho, unidad, ppp);
		alto = this.unidadToPixel(alto, unidad, ppp);
	}
		
	if (this.activo())
	{			
		this.$imagen.cropper('setData', {"x":0, "y":0, "width":ancho, "height":alto, "rotate":rotacion, "scaleX":escalaX, "scaleY":escalaY});			
	}
}
	
EdicionImagenes.prototype.unidadToPixel = function(medida, unidad, ppp)
{		
	return (medida*ppp)/unidad;
}
	
EdicionImagenes.prototype.pixelToUnidad = function(medida, unidad, ppp)
{		
	return (medida*unidad)/ppp;
}




/*Filtros Glfx*/
function Filtro(nombre, init, actualizar) {
    this.nombre = nombre;
    this.actualizar = actualizar;
    this.sliders = [];
    this.puntos = [];
    init.call(this);
}

Filtro.prototype.agregarPunto = function(nombre, x, y) {
    this.puntos.push({ nombre: nombre, x: x, y: y });
};

Filtro.prototype.agregarSlider = function(nombre, etiqueta, min, max, valor, incremento) {
    this.sliders.push({ nombre: nombre, etiqueta: etiqueta, min: min, max: max, valor: valor, incremento: incremento });
};

Filtro.prototype.ejecutar = function(codigo) {   
    eval(codigo);
};

Filtro.prototype.use = function(canvas, textura, puntos, propiedades) {
    
	if (canvas)
	{
		canvas.draw(textura).update();		
				
		//Eliminar los sliders de filtros anteriores
		var tbody = $(propiedades + " > tbody");		
		
		var i = 0;
		$(propiedades + ' tr').each(function() {
			if (i > 0)
				$(this).remove();
			i++;
		});

		// Agregar renglon por cada slider que tenga el filtro
		for (var i = 0; i < this.sliders.length; i++) 
		{
			var slider = this.sliders[i];
			$('<tr><th>' + slider.etiqueta.replace(/ /g, '&nbsp;') + ':</th><td><div id="slider' + i + '"></div></td></tr>').appendTo(tbody);
		   
			var onchange = (function(this_, slider) { return function(event, ui) {
				this_[slider.nombre] = ui.value;
				this_.actualizar();
			}; })(this, slider);
			
			$('#slider' + i).slider({
				slide: onchange,
				change: onchange,
				min: slider.min,
				max: slider.max,
				value: slider.valor,
				step: slider.incremento
			});
			
			this[slider.nombre] = slider.valor;
		}

		// Agregar un div para cada punto, si el filtro los tiene
		puntos.empty();			
		
		for (var i = 0; i < this.puntos.length; i++) 
		{
			var punto = this.puntos[i];
			var x = punto.x * canvas.width;
			var y = punto.y * canvas.height;
			
			$('<div class="punto" id="punto' + i + '"></div>').appendTo(puntos);			
			
			var ondrag = (function(this_, nub) { return function(event, ui) {
				var offset = $(event.target.parentNode).offset();
				this_[punto.nombre] = { x: ui.offset.left - offset.left, y: ui.offset.top - offset.top };
				this_.actualizar();
			}; })(this, punto);
			
			$('#punto' + i).draggable({
				drag: ondrag,
				containment: '#imagen',
				scroll: true
			}).css({ left: x, top: y });
			this[punto.nombre] = { x: x, y: y };
		}
	
		this.actualizar();
	}
};

var puntosPerspectiva = [175, 156, 496, 55, 161, 279, 504, 330];
			
var filtros = {
	'Ajustar': [
		new Filtro('Brillo / Contraste', function() {
			this.agregarSlider('brillo', 'Brillo', -1, 1, 0, 0.01);
			this.agregarSlider('contraste', 'Contraste', -1, 1, 0, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).brightnessContrast(' + this.brillo + ', ' + this.contraste + ').update();');
		}),
		new Filtro('Matiz / Saturaci&oacute;n', function() {
			this.agregarSlider('matiz', 'Matiz', -1, 1, 0, 0.01);
			this.agregarSlider('saturacion', 'Saturaci&oacute;n', -1, 1, 0, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).hueSaturation(' + this.matiz + ', ' + this.saturacion + ').update();');
		}),
		new Filtro('Vitalidad', function() {
			this.agregarSlider('cantidad', 'Cantidad', -1, 1, 0.5, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).vibrance(' + this.cantidad + ').update();');
		}),
		new Filtro('Eliminar Ruido', function() {
			this.agregarSlider('exponente', 'Exponente', 0, 50, 20, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).denoise(' + this.exponente + ').update();');
		}),
		new Filtro('M&aacute;scara de enfoque', function() {
			this.agregarSlider('radio', 'Radio', 0, 200, 20, 1);
			this.agregarSlider('intensidad', 'Intensidad', 0, 5, 2, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).unsharpMask(' + this.radio + ', ' + this.intensidad + ').update();');
		}),
		new Filtro('Ruido', function() {
			this.agregarSlider('cantidad', 'Cantidad', 0, 1, 0.5, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).noise(' + this.cantidad + ').update();');
		}),
		new Filtro('Sepia', function() {
			this.agregarSlider('cantidad', 'Cantidad', 0, 1, 1, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).sepia(' + this.cantidad + ').update();');
		}),
		new Filtro('Vi&ntilde;eta', function() {
			this.agregarSlider('tam', 'Tama&ntilde;o', 0, 1, 0.5, 0.01);
			this.agregarSlider('cantidad', 'Cantidad', 0, 1, 0.5, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).vignette(' + this.tam + ', ' + this.cantidad + ').update();');
		})
	],
	'Difuminar': [
		new Filtro('Enfocar', function() {
			this.agregarPunto('centro', 0.5, 0.5);
			this.agregarSlider('intensidad', 'Intensidad', 0, 1, 0.3, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).zoomBlur(' + this.centro.x + ', ' + this.centro.y + ', ' + this.intensidad + ').update();');
		}),
		new Filtro('Triangle Blur', function() {
			this.agregarSlider('radio', 'Radio', 0, 200, 50, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).triangleBlur(' + this.radio + ').update();');
		}),
		new Filtro('Tilt Shift', function() {
			this.agregarPunto('iniciar', 0.15, 0.75);
			this.agregarPunto('finalizar', 0.75, 0.6);
			this.agregarSlider('radioDesenfoque', 'Radio de desenfoque', 0, 50, 15, 1);
			this.agregarSlider('radioGradiente', 'Radio de gradiente', 0, 400, 200, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).tiltShift(' + this.iniciar.x + ', ' + this.iniciar.y + ', ' + this.finalizar.x + ', ' + this.finalizar.y + ', ' + this.radioDesenfoque + ', ' + this.radioGradiente + ').update();');
		}),
		new Filtro('Desenfoque de lente', function() {
			this.agregarSlider('radio', 'Radio', 0, 50, 10, 1);
			this.agregarSlider('brillo', 'Brillo', -1, 1, 0.75, 0.01);
			this.agregarSlider('angulo', 'Angulo', -Math.PI, Math.PI, 0, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).lensBlur(' + this.radio + ', ' + this.brillo + ', ' + this.angulo + ').update();');
		})
	],
	'Deformaci&oacute;n': [
		new Filtro('Remolino', function() {
			this.agregarPunto('centro', 0.5, 0.5);
			this.agregarSlider('angulo', 'Angulo', -25, 25, 3, 0.1);
			this.agregarSlider('radio', 'Radio', 0, 600, 200, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).swirl(' + this.centro.x + ', ' + this.centro.y + ', ' + this.radio + ', ' + this.angulo + ').update();');
		}),
		new Filtro('Abultamiento / Pellizco', function() {
			this.agregarPunto('centro', 0.5, 0.5);
			this.agregarSlider('intensidad', 'Intensidad', -1, 1, 0.5, 0.01);
			this.agregarSlider('radio', 'Radio', 0, 600, 200, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).bulgePinch(' + this.centro.x + ', ' + this.centro.y + ', ' + this.radio + ', ' + this.intensidad + ').update();');
		}),
		new Filtro('Perspectiva', function() {
			var w = 640, h = 425;
			this.agregarPunto('a', puntosPerspectiva[0] / w, puntosPerspectiva[1] / h);
			this.agregarPunto('b', puntosPerspectiva[2] / w, puntosPerspectiva[3] / h);
			this.agregarPunto('c', puntosPerspectiva[4] / w, puntosPerspectiva[5] / h);
			this.agregarPunto('d', puntosPerspectiva[6] / w, puntosPerspectiva[7] / h);
		}, function() {
			var antes = puntosPerspectiva;
			var despues = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
			this.ejecutar('canvas.draw(textura).perspective([' + antes + '], [' + despues + ']).update();');
		})
	],
	'Decorar': [
		new Filtro('Entintar', function() {
			this.agregarSlider('intensidad', 'Intensidad', 0, 1, 0.25, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).ink(' + this.intensidad + ').update();');
		}),
		new Filtro('Bordes', function() {
			this.agregarSlider('radio', 'Radio', 0, 200, 10, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).edgeWork(' + this.radio + ').update();');
		}),
		new Filtro('Pixelado Hexagonal', function() {
			this.agregarPunto('centro', 0.5, 0.5);
			this.agregarSlider('escala', 'Escala', 10, 100, 20, 1);
		}, function() {
			this.ejecutar('canvas.draw(textura).hexagonalPixelate(' + this.centro.x + ', ' + this.centro.y + ', ' + this.escala + ').update();');
		}),
		new Filtro('Pantalla de puntos', function() {
			this.agregarPunto('centro', 0.5, 0.5);
			this.agregarSlider('angulo', 'Angulo', 0, Math.PI / 2, 1.1, 0.01);
			this.agregarSlider('tam', 'Tama&ntilde;o', 3, 20, 3, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).dotScreen(' + this.centro.x + ', ' + this.centro.y + ', ' + this.angulo + ', ' + this.tam + ').update();');
		}),
		new Filtro('Semitonos', function() {
			this.agregarPunto('centro', 0.5, 0.5);
			this.agregarSlider('angulo', 'Angulo', 0, Math.PI / 2, 0.25, 0.01);
			this.agregarSlider('tam', 'Tama&ntilde;o', 3, 20, 4, 0.01);
		}, function() {
			this.ejecutar('canvas.draw(textura).colorHalftone(' + this.centro.x + ', ' + this.centro.y + ', ' + this.angulo + ', ' + this.tam + ').update();');
		})
	]
};


EdicionImagenes.prototype.cargaFiltros = function (idFiltros)
{
	//cargar filtros glfx
	var html = '';

	for (var category in filtros) {
		var list = filtros[category];
		html += '<option disabled="true">---- ' + category + ' -----</option>';
	
		for (var i = 0; i < list.length; i++) {
			html += '<option>' + list[i].nombre + '</option>';
		}
	}
	
	$(idFiltros).html(html);
}
	