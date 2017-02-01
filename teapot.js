//parse teapart date to get vertex and face
function parse(input) {
	var lines = input.split(/\r\n|\r|\n/g);
	var out = {};
	out.vertices = [];
	out.vertexNormals = [];
    out.colors=[];
	out.faceindex = [];
	for (var i=0; i < lines.length; i++) {
      var vals = (lines[i].trimRight().split(' '));
      if (vals.length >0) {
        // get vertex
        switch(vals[0]){
            case'v':
            out.vertices.push(parseFloat(vals[1]));
            out.vertices.push(parseFloat(vals[2]));
            out.vertices.push(parseFloat(vals[3]));
		break;
            case'f':
        // get texture coords
        	out.faceindex.push(parseFloat(vals[2]-1));
			    out.faceindex.push(parseFloat(vals[3]-1));
          out.faceindex.push(parseFloat(vals[4]-1));
            break;
        }
      }
    } 
    for(var i=0;i< out.vertices.length/3; i++){
       out.colors.push(1);
       out.colors.push(0);
        out.colors.push(0);
        out.colors.push(1);
    }
	return out;
}

//get data of teapot
function getTeapotdata(){
    $.get('teapot.obj', function(data) {
    handleLoadedModel(computeNormal(parse(data)));
    ready = true;
  });
}

//compute normals
function computeNormal(data) {
    var numVertices = data.vertices.length / 3;
    var numTris = data.faceindex.length / 3;
    var triangles = new Array(numTris);
    var vertexIndices = new Array(numVertices);
    for(var i = 0; i < vertexIndices.length; i++)
        vertexIndices[i] = new Array();
    var u = vec3.create();
    var v = vec3.create();
    for(var i = 0; i < numTris; i++) {
        var vi1 = data.faceindex[3 * i] * 3;
        var vi2 = data.faceindex[3 * i + 1] * 3;
        var vi3 = data.faceindex[3 * i + 2] * 3;
        // vertices
        var v1 = [data.vertices[vi1], data.vertices[vi1 + 1], data.vertices[vi1 + 2]];
        var v2 = [data.vertices[vi2], data.vertices[vi2 + 1], data.vertices[vi2 + 2]];
        var v3 = [data.vertices[vi3], data.vertices[vi3 + 1], data.vertices[vi3 + 2]];
        var normal = vec3.create();
        var normalized = vec3.create();
        vec3.subtract(u, v2, v1);
        vec3.subtract(v, v3, v1);
        vec3.cross(normal, u, v);
        vec3.normalize(normalized, normal);

        //store data
        triangles[i] = normalized;
        vertexIndices[vi1 / 3].push(i);
        vertexIndices[vi2 / 3].push(i);
        vertexIndices[vi3 / 3].push(i);
    }
      
    for(var i = 0; i < numVertices; i++) {
        var totalNormal = vec3.create();
        var temp = vec3.create();
        while(vertexIndices[i].length !== 0) {
            var currentTriangle = vertexIndices[i].pop();
            vec3.add(temp, totalNormal, triangles[currentTriangle]);
            vec3.copy(totalNormal, temp);
        }
        var normalized = vec3.create();
        vec3.normalize(normalized, totalNormal);
        data.vertexNormals[i * 3] = normalized[0];
        data.vertexNormals[i * 3 + 1] = normalized[1];
        data.vertexNormals[i * 3 + 2] = normalized[2];
        
    }
    return data;
}

function handleLoadedModel(data) {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numItems = data.vertices.length / 3;
  console.log("found " + vertexPositionBuffer.numItems + " vertices");

  vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexNormals), gl.STATIC_DRAW);
  vertexNormalBuffer.itemSize = 3;
  vertexNormalBuffer.numItems = data.vertexNormals.length / 3;
  console.log("found " + vertexNormalBuffer.numItems + " normals");

  vertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.faceindex), gl.STATIC_DRAW);
  vertexIndexBuffer.itemSize = 1;
  vertexIndexBuffer.numItems = data.faceindex.length;
  console.log("found " + vertexIndexBuffer.numItems / 1 + " indices");

  vertexColorBuffer= gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize=4;
  vertexColorBuffer.numItems=data.colors.length/4;
  console.log("found "+ vertexColorBuffer.numItems + " colors" );  
}

// setup shader for teapot
function setupteapotShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  console.log("Vex norm attrib: ", shaderProgram.vertexNormalAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  console.log("Vertex attrib: ", shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor"); 
  shaderProgram.cubeMapSampler = gl.getUniformLocation(shaderProgram, "uCubeSampler");
  
  gl.useProgram(shaderProgram);
  
}

function drawTeapotHelper(){
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, Environment);
  gl.uniform1i(shaderProgram.cubeMapSampler, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer); gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  // Set the texture coordinates 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
  // Draw the cube.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 6768, gl.UNSIGNED_SHORT, 0);

}

//draw teapot
function draw() { 
    var transformVec = vec3.create();
    mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200, pMatrix);
    mvPushMatrix();

    vec3.set(transformVec,0.0,0.0,-10.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateY(mvMatrix,mvMatrix,modelYRotationRadians);
    mat4.rotateX(mvMatrix,mvMatrix,modelXRotationRadians);
    setMatrixUniforms();    
    drawTeapotHelper();
    
    mvPopMatrix();
}

function initCubeMap() {
    Environment = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, Environment);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var cubeFaces = [
    ["rsz_posx.png", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
    ["rsz_negx.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
    ["rsz_posy.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
    ["rsz_negy.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
    ["rsz_posz.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
    ["rsz_negz.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
    ];

    for (var i = 0; i < cubeFaces.length; i++) {
       var image = new Image();
       image.src = cubeFaces[i][0];
       image.onload = function(texture, face, image) {
           return function() {
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
                        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
           }
        } (Environment, cubeFaces[i][1], image);
    }      
};

function uploadLightsTeapot(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
};