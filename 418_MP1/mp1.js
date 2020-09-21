var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

/*Buffer for vertex colors*/
var vertexColorBuffer;

var mvMatrix = mat4.create();
var rotAngle = 0;
var lastTime = 0;

/*degrees to radians conversion*/
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}/*end of degreeRadConversion*/

/*send matrices to shader*/
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/*GL canvas*/
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

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
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

/*set up shaders*/
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix"); 
}

/*set up necessary buffers*/
var num = 132;
function setupBuffers() {
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
    var triangleVertices=[
     /*   
      1 __________________2
        |                |
       3|__4 5______6 7__|8, so on
          |   |_  _|   |
          |     ||     |
          |     ||     |
          |    _||_    |
          |____|  |____|
          __ __ __ __ __
          || || || || ||
           | || || || |
              | || |
                |
       */
        
        //1, 3, 4
        -0.75, 0.9, 0.0,
        -0.75, 0.6, 0.0,
        -0.55, 0.9, 0.0,
        -0.55, 0.9, 0.0,
        -0.75, 0.6, 0.0,
        -0.55, 0.6, 0.0,
        
        //4, 5
        -0.55, 0.6, 0.0,
        -0.55, 0.9, 0.0,
        -0.25, 0.6, 0.0,
        -0.25, 0.6, 0.0,
        -0.55, 0.6, 0.0,
        -0.25, 0.9, 0.0,
        
        //5, 6
        -0.25, 0.9, 0.0,
        -0.25, 0.6, 0.0,
        0.25, 0.9, 0.0,
        0.25, 0.9, 0.0,
        -0.25, 0.6, 0.0,
        0.25, 0.6, 0.0,
        
        //6, 7
        0.55, 0.6, 0.0,
        0.55, 0.9, 0.0,
        0.25, 0.6, 0.0,
        0.25, 0.6, 0.0,
        0.55, 0.6, 0.0,
        0.25, 0.9, 0.0,
        
        //2, 7, 8
        0.75, 0.9, 0.0,
        0.75, 0.6, 0.0,
        0.55, 0.9, 0.0,
        0.55, 0.9, 0.0,
        0.75, 0.6, 0.0,
        0.55, 0.6, 0.0,
        
        //4, 5, 9
        -0.55, 0.6, 0.0,
        -0.25, 0.6, 0.0,
        -0.25, 0.4, 0.0,
        -0.25, 0.4, 0.0,
        -0.55, 0.6, 0.0,
        -0.55, 0.4, 0.0,
        
        //9, 13
        -0.55, 0.4, 0.0,
        -0.25, 0.4, 0.0, 
        -0.25, -0.1, 0.0,
        -0.25, -0.1, 0.0,
        -0.55, 0.4, 0.0,
        -0.55, -0.1, 0.0,
        
        //9, 10, 13, 14
        -0.25, 0.4, 0.0, 
        -0.15, 0.4, 0.0, 
        -0.25, -0.1, 0.0,
        -0.25, -0.1, 0.0,
        -0.15, -0.1, 0.0,
        -0.15, 0.4, 0.0,
        
        //13, 17, 18
        -0.25, -0.1, 0.0,
        -0.25, -0.3, 0.0,
        -0.55, -0.1, 0.0,
        -0.55, -0.1, 0.0,
        -0.55, -0.3, 0.0,
        -0.25, -0.3, 0.0,
        
        //6, 7, 12
        0.55, 0.6, 0.0,
        0.25, 0.6, 0.0,
        0.25, 0.4, 0.0,
        0.25, 0.4, 0.0,
        0.55, 0.6, 0.0,
        0.55, 0.4, 0.0,
        
        //12, 16
        0.55, 0.4, 0.0,
        0.25, 0.4, 0.0, 
        0.25, -0.1, 0.0,
        0.25, -0.1, 0.0,
        0.55, 0.4, 0.0,
        0.55, -0.1, 0.0,
        
        //11, 12, 15, 16
        0.25, 0.4, 0.0, 
        0.15, 0.4, 0.0, 
        0.25, -0.1, 0.0,
        0.25, -0.1, 0.0,
        0.15, -0.1, 0.0,
        0.15, 0.4, 0.0,
        
        //16, 19, 20
        0.25, -0.1, 0.0,
        0.25, -0.3, 0.0,
        0.55, -0.1, 0.0,
        0.55, -0.1, 0.0,
        0.55, -0.3, 0.0,
        0.25, -0.3, 0.0,
        
        //small orange left
        -0.55, -0.4, 0.0,
        -0.45, -0.4, 0.0,
        -0.45, -0.5, 0.0,
        -0.45, -0.5, 0.0,
        -0.55, -0.4, 0.0,
        -0.55, -0.5, 0.0,
        -0.55, -0.5, 0.0,
        -0.45, -0.5, 0.0,
        -0.45, -0.6, 0.0,
        
        //small orange right
        0.55, -0.4, 0.0,
        0.45, -0.4, 0.0,
        0.45, -0.5, 0.0,
        0.45, -0.5, 0.0,
        0.55, -0.5, 0.0,
        0.55, -0.4, 0.0,
        0.55, -0.5, 0.0,
        0.45, -0.5, 0.0,
        0.45, -0.6, 0.0,
        
        //medium orange left
        -0.35, -0.4, 0.0,
        -0.25, -0.4, 0.0,
        -0.25, -0.65, 0.0,
        -0.25, -0.65, 0.0,
        -0.35, -0.65, 0.0,
        -0.35, -0.4, 0.0,
        -0.25, -0.65, 0.0,
        -0.35, -0.65, 0.0,
        -0.25, -0.75, 0.0,
        
        //medium orange right
        0.35, -0.4, 0.0,
        0.25, -0.4, 0.0,
        0.25, -0.65, 0.0,
        0.25, -0.65, 0.0,
        0.35, -0.65, 0.0,
        0.35, -0.4, 0.0,
        0.25, -0.65, 0.0,
        0.35, -0.65, 0.0,
        0.25, -0.75, 0.0,
        
        //long orange left
        -0.15, -0.4, 0.0,
        -0.05, -0.4, 0.0,
        -0.05, -0.8, 0.0,
        -0.05, -0.8, 0.0,
        -0.15, -0.4, 0.0,
        -0.15, -0.8, 0.0,
        -0.15, -0.8, 0.0,
        -0.05, -0.8, 0.0,
        -0.05, -0.9, 0.0,
        
        //long orange right
        0.15, -0.4, 0.0,
        0.05, -0.4, 0.0,
        0.05, -0.8, 0.0,
        0.05, -0.8, 0.0,
        0.15, -0.4, 0.0,
        0.15, -0.8, 0.0,
        0.15, -0.8, 0.0,
        0.05, -0.8, 0.0,
        0.05, -0.9, 0.0
        
    ];//end of triangle vertices
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = num;
    
    //Buffer for colors
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
    var colors=[
        //blue for 13 rectangles (26 triangles)
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,

        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,

        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,

        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,

        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
        0.05, 0.15, 0.35, 1.0,
      
        //orange for 18 triangles
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,

        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,

        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
    
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0,
        0.90, 0.35, 0.10, 1.0
    ];//end color of triangles
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = num;
}//end setupBuffers

function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  mat4.identity(mvMatrix);
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle)); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

var scalar=0;
function animate(){
    
    var curTime = new Date().getTime();
    
    if (lastTime != 0)
    {
        var elapsedTime = curTime - lastTime;
        rotAngle = (rotAngle+1.0)%360;
    }//end if
    
    lastTime = curTime;
    
    scalar += 0.1;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var triangleVertices=[
        
        //1, 3, 4
        -0.75, 0.9, 0.0,
        -0.75, 0.6, 0.0,
        -0.55, 0.9, 0.0,
        -0.55, 0.9, 0.0,
        -0.75, 0.6, 0.0,
        -0.55, 0.6, 0.0,
        
        //4, 5
        -0.55, 0.6, 0.0,
        -0.55, 0.9, 0.0,
        -0.25, 0.9, 0.0,
        -0.25, 0.9, 0.0,
        -0.55, 0.6, 0.0,
        -0.25, 0.6, 0.0,
        
        //5, 6
        -0.25, 0.9, 0.0,
        -0.25, 0.6, 0.0,
        0.25, 0.9, 0.0,
        0.25, 0.9, 0.0,
        -0.25, 0.6, 0.0,
        0.25, 0.6, 0.0,
        
        //6, 7
        0.55, 0.6, 0.0,
        0.55, 0.9, 0.0,
        0.25, 0.9, 0.0,
        0.25, 0.9, 0.0,
        0.55, 0.6, 0.0,
        0.25, 0.6, 0.0,
        
        //2, 7, 8
        0.75, 0.9, 0.0,
        0.75, 0.6, 0.0,
        0.55, 0.9, 0.0,
        0.55, 0.9, 0.0,
        0.75, 0.6, 0.0,
        0.55, 0.6, 0.0,
        
        //4, 5, 9
        -0.55, 0.6, 0.0,
        -0.25, 0.6, 0.0,
        -0.25, 0.4, 0.0,
        -0.25, 0.4, 0.0,
        -0.55, 0.6, 0.0,
        -0.55, 0.4, 0.0,
        
        //9, 13
        -0.55, 0.4, 0.0,
        -0.25, 0.4, 0.0, 
        -0.25, -0.1, 0.0,
        -0.25, -0.1, 0.0,
        -0.55, 0.4, 0.0,
        -0.55, -0.1, 0.0,
        
        //9, 10, 13, 14
        -0.25, 0.4, 0.0, 
        -0.15, 0.4, 0.0, 
        -0.25, -0.1, 0.0,
        -0.25, -0.1, 0.0,
        -0.15, -0.1, 0.0,
        -0.15, 0.4, 0.0,
        
        //13, 17, 18
        -0.25, -0.1, 0.0,
        -0.25, -0.3, 0.0,
        -0.55, -0.1, 0.0,
        -0.55, -0.1, 0.0,
        -0.55, -0.3, 0.0,
        -0.25, -0.3, 0.0,
        
        //6, 7, 12
        0.55, 0.6, 0.0,
        0.25, 0.6, 0.0,
        0.25, 0.4, 0.0,
        0.25, 0.4, 0.0,
        0.55, 0.6, 0.0,
        0.55, 0.4, 0.0,
        
        //12, 16
        0.55, 0.4, 0.0,
        0.25, 0.4, 0.0, 
        0.25, -0.1, 0.0,
        0.25, -0.1, 0.0,
        0.55, 0.4, 0.0,
        0.55, -0.1, 0.0,
        
        //11, 12, 15, 16
        0.25, 0.4, 0.0, 
        0.15, 0.4, 0.0, 
        0.25, -0.1, 0.0,
        0.25, -0.1, 0.0,
        0.15, -0.1, 0.0,
        0.15, 0.4, 0.0,
        
        //16, 19, 20
        0.25, -0.1, 0.0,
        0.25, -0.3, 0.0,
        0.55, -0.1, 0.0,
        0.55, -0.1, 0.0,
        0.55, -0.3, 0.0,
        0.25, -0.3, 0.0,
        
        
        
        //ANIMATION
        -0.60+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.50+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.50+Math.cos(scalar)*0.5, -0.55, 0.0,

        -0.50+Math.cos(scalar)*0.5, -0.55, 0.0,
        -0.60+Math.cos(scalar)*0.5, -0.55, 0.0,
        -0.60+Math.cos(scalar)*0.5, -0.40, 0.0,

        -0.60+Math.cos(scalar)*0.5, -0.55, 0.0,
        -0.50+Math.cos(scalar)*0.5, -0.55, 0.0,
        -0.50+Math.cos(scalar)*0.5, -0.60, 0.0,

        0.60+Math.cos(scalar)*0.5, -0.55, 0.0,
        0.60+Math.cos(scalar)*0.5, -0.40, 0.0,
        0.5+Math.cos(scalar)*0.5, -0.55, 0.0,

        0.50+Math.cos(scalar)*0.5, -0.55, 0.0,
        0.60+Math.cos(scalar)*0.5, -0.40, 0.0,
        0.50+Math.cos(scalar)*0.5, -0.40, 0.0,

        0.60+Math.cos(scalar)*0.5, -0.55, 0.0,
        0.50+Math.cos(scalar)*0.5, -0.60, 0.0,
        0.5+Math.cos(scalar)*0.5, -0.55, 0.0,

        -0.40+Math.cos(scalar)*0.5, -0.65, 0.0,
        -0.40+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.3+Math.cos(scalar)*0.5, -0.65, 0.0,

        -0.30+Math.cos(scalar)*0.5, -0.65, 0.0,
        -0.40+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.30+Math.cos(scalar)*0.5, -0.40, 0.0,

        -0.40+Math.cos(scalar)*0.5, -0.65, 0.0,
        -0.30+Math.cos(scalar)*0.5, -0.70, 0.0,
        -0.3+Math.cos(scalar)*0.5, -0.65, 0.0,

        0.40+Math.cos(scalar)*0.5, -0.65, 0.0,
        0.40+Math.cos(scalar)*0.5, -0.40, 0.0,
        0.3+Math.cos(scalar)*0.5, -0.65, 0.0,

        0.30+Math.cos(scalar)*0.5, -0.65, 0.0,
        0.40+Math.cos(scalar)*0.5, -0.40, 0.0,
        0.30+Math.cos(scalar)*0.5, -0.40, 0.0,

        0.40+Math.cos(scalar)*0.5, -0.65, 0.0,
        0.30+Math.cos(scalar)*0.5, -0.70, 0.0,
        0.3+Math.cos(scalar)*0.5, -0.65, 0.0,

        -0.2+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.065+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.065+Math.cos(scalar)*0.5, -0.75, 0.0,

        -0.065+Math.cos(scalar)*0.5, -0.75, 0.0,
        -0.2+Math.cos(scalar)*0.5, -0.40, 0.0,
        -0.2+Math.cos(scalar)*0.5, -0.75, 0.0,

        -0.2+Math.cos(scalar)*0.5, -0.75, 0.0,
        -0.065+Math.cos(scalar)*0.5, -0.75, 0.0,
        -0.065+Math.cos(scalar)*0.5, -0.80, 0.0,

          
        0.2+Math.cos(scalar)*0.5, -0.75, 0.0,
        0.2+Math.cos(scalar)*0.5, -0.40, 0.0,
        0.065+Math.cos(scalar)*0.5, -0.75, 0.0,

        0.065+Math.cos(scalar)*0.5, -0.75, 0.0,
        0.2+Math.cos(scalar)*0.5, -0.40, 0.0,
        0.065+Math.cos(scalar)*0.5, -0.40, 0.0,

        0.2+Math.cos(scalar)*0.5, -0.75, 0.0,
        0.065+Math.cos(scalar)*0.5, -0.80,0.0,
        0.065+Math.cos(scalar)*0.5, -0.75, 0.0
        
    ];
    
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.numberOfItems = num;
}//end animate

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
    dance();
}