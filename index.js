
var gl;
var canvas;

var shaderProgram;
var terrainProgram;

var vertexNormalBuffer
var vertexPositionBuffer;
var vertexIndexBuffer;
var vertexColorBuffer;

var rockTexture;
// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrix1 = mat4.create();

var pMatrix1 = mat4.create();

var mvMatrixStack = [];
var mvMatrixStack1 = [];
//terrain
var tVertexPositionBuffer;
var tVertexNormalBuffer;
var tIndexTriBuffer;
var sceneTextureCoordBuffer

// For animation 
var then =0;
var modelYRotationRadians = degToRad(0);
var modelXRotationRadians = degToRad(0);
var Environment;

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
function animate() {
    if (then==0)
    {
        then = Date.now();
    }
    else
    {
        now=Date.now();
        // Convert to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;

        //Animate the rotation
        modelYRotationRadians += 0.3 * deltaTime;
        modelXRotationRadians += 0.3 * deltaTime;
        //modelYRotationRadians += 0.7 * deltaTime;  
    }
}

//----------------------------------------------------------------------------------
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  setupteapotShaders();
  getTeapotdata();
  initCubeMap(); 

  setupterrianShaders();
  setupTerrainBuffers();
  setupTextures();
  tick();

    
}

//----------------------------------------------------------------------------------
function tick() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    requestAnimFrame(tick);
    gl.useProgram(shaderProgram);
    uploadLightsTeapot([0,-1,-1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.5,1.0])
    draw();

    gl.useProgram(terrainProgram);
    drawTerrain();
   
    animate();
}

