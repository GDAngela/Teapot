//Helper functions for unloadlightsTerrain 
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}


function uploadNormalMatrixToShader() {
  var a = mat3.create();
  var b = mat3.create();
  var nMatrix = mat3.create();
  mat3.fromMat4(a, mvMatrix);
  mat3.invert(b, a);
  mat3.transpose(nMatrix, b);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}


//set lights lit on the terrian
function uploadLightsTerrain(loc,a,d,s) {
  gl.uniform3fv(terrainProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(terrainProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(terrainProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(terrainProgram.uniformSpecularLightColorLoc, s);
}


//Helpers
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function mvPushMatrix1() {
   var copy =mat4.clone(mvMatrix1);
   mvMatrixStack1.push(copy);
}

function mvPopMatrix1() {
    if(mvMatrixStack1.length ==0){
      throw "Invalid popMatrix!";
    }
    mvMatrix1 = mvMatrixStack1.pop();
}

function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadNormalMatrixToShader();
}

function setMatrixUniformsforTerrain(){
    var nMatrix1= mat3.create();
    gl.uniformMatrix4fv(terrainProgram.mvMatrixUniform, false, mvMatrix1);
    gl.uniformMatrix4fv(terrainProgram.pMatrixUniform, false, pMatrix1);
    mat3.fromMat4(nMatrix1,mvMatrix1);
    mat3.transpose(nMatrix1,nMatrix1);
    mat3.invert(nMatrix1,nMatrix1);
    gl.uniformMatrix3fv(terrainProgram.nMatrixUniform, false, nMatrix1);

}

function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//init vertex and fragment shaders for terrian 
function setupterrianShaders(){
  var vertexShadert =loadShaderFromDOM("terrain-vs");
  var fragmentShadert =loadShaderFromDOM("terrain-fs");

  terrainProgram = gl.createProgram();
  gl.attachShader(terrainProgram, vertexShadert);
  gl.attachShader(terrainProgram, fragmentShadert);
  gl.linkProgram(terrainProgram);

  if (!gl.getProgramParameter(terrainProgram, gl.LINK_STATUS)){
    alert("Failed to setup terrainshaders");
  }

  gl.useProgram(terrainProgram);

  terrainProgram.vertexNormalAttribute =gl.getAttribLocation(terrainProgram, "aVertexNormalt");
  console.log("Vex norm attrib: ", terrainProgram.vertexNormalAttribute);
  gl.enableVertexAttribArray(terrainProgram.vertexNormalAttribute);

  terrainProgram.vertexPositionAttribute = gl.getAttribLocation(terrainProgram, "aVertexPositiont");
  console.log("Vertex Position attrib: ", terrainProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(terrainProgram.vertexPositionAttribute);

  terrainProgram.textureCoordAttribute = gl.getAttribLocation(terrainProgram, "aTexCoord");
  gl.enableVertexAttribArray(terrainProgram.textureCoordAttribute);

  terrainProgram.mvMatrixUniform = gl.getUniformLocation(terrainProgram, "uMVMatrixt");
  terrainProgram.pMatrixUniform = gl.getUniformLocation(terrainProgram, "uPMatrixt");
  terrainProgram.nMatrixUniform = gl.getUniformLocation(terrainProgram, "uNMatrixt");
  terrainProgram.uniformLightPositionLoc = gl.getUniformLocation(terrainProgram, "uLightPosition");    
  terrainProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(terrainProgram, "uAmbientLightColor");  
  terrainProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(terrainProgram, "uDiffuseLightColor");
  terrainProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(terrainProgram, "uSpecularLightColor");
  terrainProgram.TextureSamplerUniform = gl.getUniformLocation(terrainProgram, "uImage");

    
}

//setup buffer for terrian
function setupTerrainBuffers() {
    
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var gridN=20;
    
    var numT = terrainFromIteration(gridN, -2,2.5,-2,2.5, vTerrain, fTerrain, nTerrain);
    console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
     
   // Specify texture coordinates
    sceneTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generateTextureCoords(gridN)), gl.STATIC_DRAW);
    sceneTextureCoordBuffer.itemSize = 2;
    sceneTextureCoordBuffer.numItems = (gridN+1)*(gridN+1);
    console.log(sceneTextureCoordBuffer.numItems);

     
}

//get coordinates of the texture 
function generateTextureCoords(side) {
  var coords = [];
  for(var i = 0; i <=side; i++) { // y
    for(var j = 0; j<=side; j++) { // x
      coords[2*((side+1)*i+j)] = j / side;
      coords[2*((side+1)*i+j) + 1] = i / side;
      if(coords[2*(side*i+j)] < 0.0 || coords[2*((side+1)*i+j) + 1] < 0.0)
        console.log("texture coords are hard");
    }
  }
  return coords;
}


function setupTextures() {
  rockTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, rockTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 0, 0, 255]));
  var image = new Image();
  
  image.onload = function() {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, rockTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    handleLoadedTexture(image.width,image.height);
  }
  
   image.src = 'heightmap.jpg';
}

//process loaded texture
function handleLoadedTexture(width,height) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function drawTerrainHelper(){
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(terrainProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(terrainProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Bind texture coord
  gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
  gl.vertexAttribPointer(terrainProgram.textureCoordAttribute, sceneTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, rockTexture);
  gl.uniform1i(terrainProgram.TextureSamplerUniform, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
  gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}


// draw terrain
function drawTerrain(){
    var transformVec = vec3.create();
    mat4.perspective(pMatrix1,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0, pMatrix1);
    mvPushMatrix1();
    vec3.set(transformVec,0.0,-1.25,-8);
    mat4.translate(mvMatrix1, mvMatrix1,transformVec);
    mat4.rotateX(mvMatrix1, mvMatrix1, degToRad(-90));
    mat4.rotateZ(mvMatrix1, mvMatrix1, degToRad(25)); 

    setMatrixUniformsforTerrain();
    uploadLightsTerrain([0,-1,0],[0.0,0.5,1.0],[1.0,0.5,0.0],[0.0,0.0,0.0]);
    drawTerrainHelper();
    mvPopMatrix1();

}