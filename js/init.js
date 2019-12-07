var ListaImagenes = function()
{
	this.lista = [];
}

ListaImagenes.prototype.agregar = function(imagen)
{
	this.lista.push(imagen);
	this.imagenes = undefined;
}

ListaImagenes.prototype.eliminar = function(indice)
{
	this.lista.splice(indice, 1);	
}

ListaImagenes.prototype.getImagen = function(indice)
{
	return this.lista[indice];
}

ListaImagenes.prototype.getImagenes = function ()
{
	if (!this.imagenes)
		this.imagenes = new Blob(this.lista, {type: "text/plain"});
	
	return this.imagenes;
}

ListaImagenes.prototype.getCount = function()
{
	return this.lista.length;
}

ListaImagenes.prototype.vaciar = function ()
{	
	while(this.lista.length) 	
		this.lista.shift(); 	
}

var imagenes = new ListaImagenes();
var saveWork = new saveWork();
var selImagen = -1;			//imagen seleccionada
var idImagen=0;
var canvas;
var textura;
var server = "ws://localhost:8181/";
	
var defaultConfig = {
	dpi: 300,
	escala: "gris", //gris - blancoNegro - color
	deshabilitarEscalas: false,
	deshabilitarResolucion: true,	
	contImagen: "#imagen",				//id que contendra la imagen
	inputImpImagen: "#importarImagen",	//id del input file para importar imagenes
	listaImagenes: ".listaImagenes",		//div que contiene la lista de imagenes
	btnGuardar: "#btnGuardar",			//id del boton para guardar
	btnEliminar: "#btnEliminar",			//id del boton para eliminar
	btnEscanear: "#btnEscanear",	//id del boton Escanear
	btnEditar: "#btnEditar",		//id del boton editar
	btnCortar: "#btnCortar",		//id del boton cortar
	type: "image/tiff",	
	hojas: [
		{nombre: "Carta", ancho: 21.6, alto: 27.9, unidad: 'cm'}, //cm, mm, in		
		{nombre: "Junior Legal", ancho: 12.7, alto: 20.3, unidad: 'cm'},
		{nombre: "Media Carta", ancho: 14, alto: 21.6, unidad: 'cm'},
		{nombre: "Oficio Legal", ancho: 21.6, alto: 35.6, unidad: 'cm'},		
		{nombre: "Titulo", ancho: 27.9, alto: 39.9, unidad: 'cm'},		
		{nombre: "Todo", ancho: 0, alto: 0, unidad: 'cm'}
	]
};

$(document).ready(function (){	

	//Configuracion inicial
	//Selector de escala
	$("input[name='escala']").prop("disabled", defaultConfig.habilitarEscalas); 
	$("#" + defaultConfig.escala).prop("checked", true);

	//selector de resolucion
	$("#dpi").prop("disabled", defaultConfig.habilitarResolucion);	

	//selector tamaño de hojas
	setTams("#tam");

	//iniciar webSocket
	iniciaWebSocket();
	
	//clase que controla la edicion de imagenes
	var editor = new EdicionImagenes(defaultConfig.contImagen); 		
	
	//Botones
	$('.botones').on('click', '[data-method]', function(){
			
		var data = $(this).data();
		
		switch(data.method)
		{
			case 'escanear': escanear();							
			break;
			
			case 'guardarImagenes': guardarImagenes();									
			break;
			
			case 'borrarImagen':	editor.limpiar();			
									borrarImagen();
			break;
			
			case 'editar':	if(imagenes.getCount() > 0 && selImagen >= 0)
							{
								try {
									canvas = fx.canvas();
								} catch (e) {
									console.log(e);
									return;
								}
								
								image = document.getElementById('imagen');							
								
								textura = canvas.texture(image);
								canvas.draw(textura).update();
								cambiarFiltro(1);
								
								$(canvas).attr("id", "imagen");
								$("#imagen").cropper('destroy');
		
								$("#imagen").replaceWith(canvas);														
							}
			break;			
			
			case 'ok':	if(imagenes.getCount() > 0 && selImagen >= 0)
						{			
							if (typeof canvas !== 'undefined' && canvas != null)
							{
								textura = canvas.contents();
								canvas.draw(textura).update();									
							
								canvas.toBlob(function (blob){
									agregarImagen(blob, defaultConfig.type);							
								}, defaultConfig.type);	
							
								$("#imagen").replaceWith('<canvas id="imagen"></canvas>');
								$("#puntos").empty();
								
								canvas = null;
								textura = null;
								
								//Eliminar los sliders de filtros anteriores
								var i = 0;
								$('#propiedades tr').each(function() {
									if (i > 0)
										$(this).remove();
									i++;
								});
							}
							else
							{
								var img = editor.getImagen();
								img.toBlob(function (blob){
									agregarImagen(blob, defaultConfig.type);
								}, defaultConfig.type);	
							}
						}
			break;
			
			case 'ocr':	OCR();
			break;
			
			case 'rotar':	editor.rotar(data.option);
			break;
			
			case 'volteoX':	editor.voltearX(data.option);
							$(this).data('option', -data.option);
			break;
			
			case 'volteoY':	editor.voltearY(data.option);
							$(this).data('option', -data.option);
			break;
			
			case 'mover': 	editor.mover(data.option, data.secondOption);
			break;
			
			case 'zoom':	editor.zoom(data.option);
			break;
			
			case 'deshabilitar':	editor.habilitarEdicion(false);
			break;
			
			case 'habilitar':	editor.habilitarEdicion(true)
			break;
			
			case 'reset':	editor.reset();
			break;
			
			case 'posicionarImagen':	editor.posicionarImagen();
			break;
			
			case 'posicionarCorte':		editor.posicionarCorte();
			break;
		}
	});
	
	//Importar archivos
	$(defaultConfig.inputImpImagen).change(function () 
	{
		if (this.files && this.files.length)
		{
			var archivo = this.files[0];
			
			//es un archivo de imagen
			if (/^image\/\w+$/.test(archivo.type)) 
			{
				agregarImagen(archivo, archivo.type);					
			}
			else
				window.alert('Solo se pueden procesar archivos de imagen');
		}		
		
		$(this).val('');				
	});
	
	//Importar trabajo de escaneo
	$('#importarWork').change(function (){	
		if (this.files && this.files.length)
		{	
			var archivo = this.files[0]; 			
			
			if (!archivo.type.match('text/.*')) 
			{
				alert("No se puede acceder a " + file.name.toUpperCase() + " por que el tipo es desconocido. Intenta seleccionado otro archivo");
				return;
			}
					
			imagenes.vaciar();
			saveWork.cargarArchivo(archivo, imagenes);
		}	
	});

	//Click en un elemento de la lista de imaagenes
	$("body").on("click", ".selFile", function(){
		
		$(".seleccion").removeClass("seleccion").addClass("noSeleccion");
		$(this).parent().removeClass("noSeleccion");	
		$(this).parent().addClass("seleccion");	
		
		var archivo = $(this).data("file");

		for (var i = 0; i < imagenes.getCount(); i++) {
			if (imagenes.getImagen(i).name === archivo) {
				
				selImagen = i;
				
				$("#imagen").cropper('destroy');
				$("#imagen").replaceWith('<canvas id="imagen"></canvas>');
				$("#puntos").empty();
				
				editor.seleccionarImagen(imagenes.getImagen(i), imagenes.getImagen(i).type);	
				console.log('Contenido blob: ', imagenes.getImagen(i));	
			}
		}
	});

	//Seleccionar dispositivo del listado
	$("#dispositivos").change(function(){
		seleccionarDispositivo($(this).val());
	});
	
	//Seleccionar tamaño de hoja
	$("#tam").change(function(){
		var opcion = $(this).val();
		var dpi = ($("#dpi").val())==null?defaultConfig.dpi:$("#dpi").val();				
		
		editor.setTamCorte(defaultConfig.hojas[opcion].ancho, defaultConfig.hojas[opcion].alto, defaultConfig.hojas[opcion].unidad, dpi);		
	});

	//teclas de movimiento
	$(document.body).on('keydown', function (e) {

		if (!editor.activo())
			return;

		switch (e.which) 
		{
			//izquierda
			case 37:	e.preventDefault();
						editor.mover(-1, 0);
			break;

			//arriba
			case 38:	e.preventDefault();
						editor.mover(0, -1);
			break;

			//derecha
			case 39:	e.preventDefault();
						editor.mover(1, 0);
			break;

			//abajo
			case 40:	e.preventDefault();
						editor.mover(0, 1);
			break;
		}
	});
	
	editor.cargaFiltros("#filtros");
	
	$("#filtros").change(function() {		
		cambiarFiltro(this.selectedIndex);
	});	
});

function cambiarFiltro(index)
{			
	for (var categoria in filtros) 
	{
		index--;
		var lista = filtros[categoria];
		
		for (var i = 0; i < lista.length; i++) 
		{				
			if (index-- == 0) 
				lista[i].use(canvas, textura, $("#puntos"), "#propiedades");
		}
	}
}

function iniciaWebSocket(elemento)
{
	wsImpl = window.WebSocket || window.MozWebSocket;
	idImagen = 0; //Numero Imagen	
				
	window.ws = new wsImpl(server);
		
	ws.onmessage = function (e) {
		if (typeof e.data == "string")
		{			
			var datosJSON = JSON.parse(e.data);
						
			if (datosJSON.tipo == "listaDispositivos")
			{										
				setListaDispositivos("dispositivos", datosJSON.datos);				
				seleccionarDispositivo($("#dispositivos").val());				
				
			}else if (datosJSON.tipo == "dispositivo"){
				if (datosJSON.datos.length > 0) {
					setResoluciones("dpi", datosJSON.datos[0].datos);												
					$("#dpi").val(defaultConfig.dpi);														
				}
				else
					alert("No se puede cargar las características del dispositivo. Tal vez se encuentre apagado.");
			}
			
		}else if (e.data instanceof ArrayBuffer){
			//alert("ArrayBuffer");
		} else if (e.data instanceof Blob){
			
			if (e.data)
				agregarImagen(e.data, defaultConfig.type);
		}
	};
		
	ws.onopen = function(){
		ws.send("cargarDispositivos");		
	};
	
	ws.onclosse = function(){
	};	
	
	ws.onerror = function(e){
		console.log("Ocurrio un error. " + e.type );
	};
}

function setListaDispositivos(input, dispositivos)
{				
	setValoresOptions(input, dispositivos);
}

function setResoluciones(input, resoluciones)
{				
	setValoresOptions(input, resoluciones);
}

function setTams(input)
{
	$.each(defaultConfig.hojas, function(key, value){
		$(input).append("<option value=" + key + ">" + value.nombre + "</option>");	
	});
}

function setValoresOptions(input, valores)
{
	input = "#" + input;

	$.each(valores, function (key, value) {
		$(input).append("<option value=" + value.valor + ">" + value.campo + "</option>");							
	});
}

function seleccionarDispositivo(dispositivo)
{	
	if (dispositivo != "")
	{
		var mensaje = "seleccionarDispositivo:" + dispositivo;			
		ws.send(mensaje);
	}	
}

function escanear()
{
	if ($("#dispositivos").val() && $("#dpi").val())
	{
		var escala = $("input[name='escala']:checked").val(); 
		var resolucion = $("#dpi").val();
		var dCara = $("#dobleCara").prop('checked');
	
		$.blockUI({ message: '<h1><img src="img/busy.gif" /> Escaneando. Por favor espere...</h1>' });  
		ws.send("escanear:" + escala + ":" + resolucion + ":" + dCara);
	}
	else
		alert("Escaner no disponible");
}

function borrarImagen()
{
	if (selImagen >=0)
	{
		imagenes.eliminar(selImagen);	
		selImagen = -1;		
		verImagenes();
	}	
}

//crea las imagenes en miniatura del lado izquierdo del editor
//recibe como parametro la imagen, y un indice que indica cual miniatura esta seleccionada
function getMiniatura(imagen, indice)
{
	var html = '';	
	idMiniatura = "mini_" + imagen.name.substring(7);
	
	if (indice >= 0 && selImagen == indice)	
		html += "<div class=\"seleccion\" id=\"" + idMiniatura + "\">";
	else
		html += "<div class=\"noSeleccion\" id=\"" + idMiniatura + "\">";

	
	//miniatura especial para formatos tiff
	if (imagen.type == 'image/tiff')
	{
		var reader = new FileReader();
				
		reader.onload = (function (archivo) {					
			return function (e) {
				var buffer = e.target.result;
				var tiff = new Tiff({buffer: buffer});
				var canvas = tiff.toCanvas();										
				
				$(canvas).css("width", "100%");
				$(canvas).css("height", "100%");
				$(canvas).attr("class", "selFile");
				$(canvas).attr("title", "Click para ver");
				$(canvas).attr("data-file", imagen.name);
				
				if (canvas) {						
					$("#" + idMiniatura).append(canvas);					
				}						
			};
		})(imagen);

		reader.readAsArrayBuffer(imagen);
	}
	else
	{
		html += "<img height=\"100%\" width=\"100%\" src=\"" + window.URL.createObjectURL(imagen) + "\" data-file='" + imagen.name + "' class='selFile' title='Click para ver'>";
	}
	
	html += "<br/><p class='nombreImagen'>" + imagen.name + "</p></div>";
	
	return html;	
}

function verImagenes()
{	
	$(defaultConfig.listaImagenes).empty();
	
	for(var i=0; i<imagenes.getCount(); i++)
	{		
		var html = this.getMiniatura(imagenes.getImagen(i), i);		
		$(defaultConfig.listaImagenes).append(html);		
	}	
}

function agregarImagen(archivo, tipo)
{	
	//si es archivo
	if (archivo instanceof File)
	{		
		//pasar a blob
		var reader = new FileReader();
		
		reader.onloadend = function (e) {
			var arrayBuffer = e.target.result;
			
			blobUtil.arrayBufferToBlob(arrayBuffer, tipo).then(function (blob) {				
				setImagen(blob, tipo);	
			}).catch(console.log.bind(console));
		};
		
		reader.readAsArrayBuffer(archivo);
	}
	else
    { 
        //si es escaneo
        $.unblockUI();
        setImagen(archivo, tipo);
    }
}

function setImagen(imagen, tipo)
{
	idImagen++;	
	imagen.name = "Imagen_" + idImagen;
	imagen.type = tipo;
	
	imagenes.agregar(imagen);

	var html = this.getMiniatura(imagen, -1);
	
	$(defaultConfig.listaImagenes).append(html);
}

function OCR()
{
	if (selImagen >= 0)
	{
		$.blockUI({ message: '<h1><img src="img/busy.gif" /> Por favor espere...</h1>' });			
		
		Tesseract.recognize(imagenes.getImagen(selImagen))
		.progress(function  (p) 
		{ 
			console.log('progress', p);
		})
		.then(function(data)
		{				
			$.unblockUI();
			alert(data.text);
		})
		.catch(err => {
			console.log('catch\n', err);
		})
		.finally(e => {
			console.log('finally\n');								
		});
	}
}

function guardarImagenes()
{
	if (imagenes.getCount() > 0)
	{
		if ($("#guardaLocal").prop('checked'))
			saveWork.guardar(imagenes);	
		
		var formData = new FormData();	
		
		for (var i = 0; i<imagenes.getCount(); i++) 
		{
			formData.append('datos'+i, imagenes.getImagen(i));	
		}
		
		var nombreImg = imagenes.getImagen(0).name = "img_" + $("#idRequisito").val();
		window.opener.getBlob($("#idRequisito").val(), imagenes.getImagen(0));

		close(); //cerrar editor

		/*$.ajax('localhost', {
			method: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success: function () {
				console.log('Upload success');
			},
			error: function () {
				console.log('Upload error');
			}
		});*/
	}
	else
		alert("No hay imagenes que guardar");
}

