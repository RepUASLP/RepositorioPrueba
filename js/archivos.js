var saveWork = function()
{
	this.archivo = undefined;
	this.tamCabecera = 10;		//en bytes	
}

saveWork.prototype.guardar = function(imagenes)
{
	var tams = [];

	if (imagenes.getCount()>0)
	{
		for (var i=0; i<imagenes.getCount(); i++) 
		{		
			tams.push(imagenes.getImagen(i).size);
			tams.push('.');
		}
	
		tams = new Blob(tams);
		imagenes.agregar(tams);
		
		var size = tams.size;
		size = size.toString();
	
		for (var i=size.length; i<10; i++)
			size = "0" + size;
	
		var size = new Blob([size]);
		imagenes.agregar(size);
		
		var nWork = Math.round( (new Date()).getTime() / 1000 );
		var nombre = "workEditor" + nWork + ".txt";	
		saveAs(imagenes.getImagenes(), nombre);
	}	
}

saveWork.prototype.divideArchivo = function (inicio, fin)
{
	var blob = undefined;
	
	if (this.archivo.webkitSlice) 
		blob = this.archivo.webkitSlice(inicio, fin);
	else 
	{
		if (this.archivo.mozSlice) 
			blob = this.archivo.mozSlice(inicio, fin);
		else
			blob = this.archivo.slice(inicio, fin);
	}
	
	return blob;
}

saveWork.prototype.cargarArchivo = function (archivo, listaImagenes)
{
	this.archivo = archivo;
	this.listaImagenes = listaImagenes;
	var start = archivo.size-this.tamCabecera;
	var end = archivo.size;		
	
	//obtener cabecera
	var cabecera = this.divideArchivo(start, end);
	
	var reader = new FileReader();	
	reader.saveWork = this;
	reader.abort = this.handleFileReadAbort; 
	reader.onerror = this.handleFileReadError; 
	reader.onloadend = this.getSizeArchivo;
		
	reader.readAsText(cabecera);
}

saveWork.prototype.getSizeArchivo = function(evt)
{
	var tam = parseInt(evt.target.result);
	
	if (Number.isInteger(tam))
	{
		this.saveWork.getListaTams(tam);
	}
}

//obtener tamaños de los archivos guardados	
saveWork.prototype.getListaTams = function(tam)
{	
	var start = this.archivo.size-this.tamCabecera-tam;
	var end = this.archivo.size-this.tamCabecera;		
	
	var tams = this.divideArchivo(start, end);
	
	var reader = new FileReader();
	reader.saveWork = this;	
	reader.abort = this.handleFileReadAbort; 
	reader.onerror = this.handleFileReadError; 
	reader.onloadend = this.getScaneos;
	
	reader.readAsText(tams);
}

saveWork.prototype.getScaneos = function (evt)
{
	var tams = evt.target.result.split(".");
	var start = 0, end=0;
	var imagenes = [];
	
	for (var i=0; i<tams.length-1; i++)
	{
		end += parseInt(tams[i]);		
		var imagen = (this.saveWork.divideArchivo(start, end));
		imagen.name = "Imagen_" + (i+1);
		this.saveWork.listaImagenes.agregar(imagen);
		start=end;		
	}
	
	verImagenes();
}
 
saveWork.prototype.handleFileReadAbort = function (evt) 
{
	alert("Lectura de archivo abortada");
}

saveWork.prototype.handleFileReadError = function (evt) 
{
	switch (evt.target.error.name) 
	{
		case "NotFoundError":
			alert("El archivo no pudo encontrarse al momento de hacer la lectura.");
		break;
		
		case "SecurityError":
			alert("Error de seguridad.");
		break;
		
		case "NotReadableError":
			alert("El archivo no puede ser leido. Tal vez el archivo esta siendo usado por otra aplicacion.");
		break;
		
		case "EncodingError":
			alert("La direccion del archivo es muy larga.");
		break;
		
		default: alert("Codigo de error: " + evt.target.error.name);
	}
}