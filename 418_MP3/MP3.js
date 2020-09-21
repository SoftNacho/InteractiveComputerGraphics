/*
 * Author: Lisa Gentil
 * File Description: This file is the main file of the MP
 *
 */


//creating variables
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// create a place to store the texture coords for the mesh
var cubeTCoordBuffer;

// Create a place to store terrain geometry
var cubeVertexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

//setting view parameters
var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//backing up initial up vector and eyePt vector
var initEyePt = vec3.fromValues(0.0, 0.0, 10.0);
var initUp = vec3.fromValues(0.0, 1.0, 0.0);

//creating normal vect
var nMatrix = mat3.create();

//creating ModelView mat
var mvMatrix = mat4.create();

//creating projection mat
var pMatrix = mat4.create();

//creating new var
var mvMatrixStack = [];

//creating quaternion for moving teapot
var mainQuat = quat.create();

//creating new var for user interaction
var currentlyPressedKeys = {};

//creating vars to store images for skybox
var cubeTexture;

//signal to allow teapot to be drawn
teapot_ready = false;

// For animation 
var then = 0;
var modelYRotationRadians = degToRad(0);


/*
 * Function:    uploadModelViewMatrixToShader
 * Description: sending Modelview matrix to shader
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function uploadModelViewMatrixToShader() 
{
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}//end uploadModelViewMatrixToShader


/*
 * Function:    uploadProjectionMatrixToShader
 * Description: sending projection matrix to shader
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function uploadProjectionMatrixToShader() 
{
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}//end uploadProjectionMatrixToShader


/*
 * Function:    uploadNormalMatrixToShader
 * Description: generating and sending normal matrix to shader
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function uploadNormalMatrixToShader() 
{
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}//end uploadNormalMatrixToShader


/*
 * Function:    uploadLightsToShader
 * Description: sending light info to shader
 * Inputs:      Location of light source, ambient light strength, diffuse light strength, specular light strength
 * Outputs:     NONE
 * Return:      NONE
 */
function uploadLightsToShader(loc,a,d,s) 
{
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}// end uploadLightsToShader


/*
 * Function:    mvPushMatrix
 * Description: pushing matrix onto modelview matrix stack
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function mvPushMatrix() 
{
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}//end mvPushMatrix


/*
 * Function:    mvPopMatrix
 * Description: poping matrix off of modelview matrix stack
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function mvPopMatrix() 
{
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}//end mvPopMatrix


/*
 * Function:    setMatrixUniforms
 * Description: sending projection/modelview matrices to shader
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setMatrixUniforms() 
{
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}//end setMatrixUniforms


/*
 * Function:    degToRad
 * Description: translating degrees to radians
 * Inputs:      degree input to function
 * Outputs:     NONE
 * Return:      radians corresponding to degree input
 */
function degToRad(degrees) 
{
        return degrees * Math.PI / 180;
}//end degToRad


/*
 * Function:    createGLContext
 * Description: creating context for WebGL
 * Inputs:      WebGL canvas
 * Outputs:     NONE
 * Return:      WebGL context
 */
function createGLContext(canvas) 
{
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
}//end createGLContext


/*
 * Function:    loadShaderFromDOM
 * Description: loading shaders
 * Inputs:      ID string for shader to load. Either vertex shader/fragment shader
 * Outputs:     NONE
 * Return:      NONE
 */
function loadShaderFromDOM(id) 
{
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
}//end loadShaderFromDOM


/*
 * Function:    setupShaders
 * Description: setting up fragment and vertex shaders
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupShaders() 
{
    /*
    if (document.getElementById("shaded").checked)
    {
        vertexShader = loadShaderFromDOM("shaded-shader-vs");
        fragmentShader = loadShaderFromDOM("shaded-shader-fs");
    }//if user selects reflecting
  
    else 
    {    
        vertexShader = loadShaderFromDOM("shader-vs");
        fragmentShader = loadShaderFromDOM("shader-fs");
    }//end if user slects reflecting
    */
    
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  
}//end setupShaders


/*
 * Function:    setupBuffers
 * Description: sets up the buffers for the skybox and the teapot
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupBuffers() 
{

    //THIS IS SETUP FOR SKYBOX
    //MOSTLY GIVEN CODE
    cubeVertexBuffer = gl.createBuffer();

    // Select the cubeVerticesBuffer as the one to apply vertex
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

      // Now create an array of vertices for the cube.
      var vertices = [
        // Front
        -100.0, -100.0,  100.0,
         100.0, -100.0,  100.0,
         100.0,  100.0,  100.0,
        -100.0,  100.0,  100.0,

        // Back
        -100.0, -100.0, -100.0,
        -100.0,  100.0, -100.0,
         100.0,  100.0, -100.0,
         100.0, -100.0, -100.0,

        // Top 
        -100.0,  100.0, -100.0,
        -100.0,  100.0,  100.0,
         100.0,  100.0,  100.0,
         100.0,  100.0, -100.0,

        // Bottom
        -100.0, -100.0, -100.0,
         100.0, -100.0, -100.0,
         100.0, -100.0,  100.0,
        -100.0, -100.0,  100.0,

        // Right
         100.0, -100.0, -100.0,
         100.0,  100.0, -100.0,
         100.0,  100.0,  100.0,
         100.0, -100.0,  100.0,

        // Left
        -100.0, -100.0, -100.0,
        -100.0, -100.0,  100.0,
        -100.0,  100.0,  100.0,
        -100.0,  100.0, -100.0
      ];

      // Now pass the list of vertices into WebGL to build the shape. We
      // do this by creating a Float32Array from the JavaScript array,
      // then use it to fill the current vertex buffer.
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      // Map the texture onto the cube's faces.
      cubeTCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);

      var textureCoordinates = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0
      ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                    gl.STATIC_DRAW);

      // Build the element array buffer; this specifies the indices
      // into the vertex array for each face's vertices.
      cubeTriIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

      // This array defines each face as two triangles, using the
      // indices into the vertex array to specify each triangle's
      // position.
      var cubeVertexIndices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
      ]

      // Now send the element array to GL
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
          new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

   //THIS IS SETUP FOR TEAPOT
    var teapotFile = new XMLHttpRequest();
    teapotFile.open("GET", "teapot.obj", true);
    teapotFile.onreadystatechange = function(){
        if ((teapotFile.readyState === 4 && teapotFile.status === 200) || (teapotFile.readyState === 4 && teapotFile.status == 0))
        {
            setupBuffersForTeapot(teapotFile.responseText);
        }//end if 
    }//end open file function
    teapotFile.send(null);
}//end setupBuffers


/************************** Code to handle user interaction **************************/
/*
 * Function:    handleKeyDown
 * Description: setting to true when a key is being pressed down
 * Inputs:      event
 * Outputs:     NONE
 * Return:      NONE
 */
function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;
}//end handleKeyDown


/*
 * Function:    handleKeyUp
 * Description: setting to false when no key is pressed
 * Inputs:      event
 * Outputs:     NONE
 * Return:      NONE
 */
function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
}//end handleKeyUp


/*
 * Function:    handleKeys
 * Description: Up and Down arraows spin the teapot, Left and Right makes the box turn
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function handleKeys()
{
    if (currentlyPressedKeys[38])
    {
        modelYRotationRadians += 0.005;
    }//end up arrow
    
    else if (currentlyPressedKeys[40])
    {
        modelYRotationRadians -= 0.005;

    }//end down arrow
    
    if (currentlyPressedKeys[37])
    {
        var quaternion = quat.create();
        quat.setAxisAngle(quaternion, initUp, -0.005);
        quat.normalize(quaternion, quaternion);
        quat.multiply(mainQuat, quaternion, mainQuat);
        quat.normalize(mainQuat, mainQuat);
        vec3.transformQuat(eyePt, initEyePt, mainQuat);
        vec3.normalize(viewDir, eyePt);
        vec3.scale(viewDir, viewDir, -1);
    }//end left arrow
    
    else if (currentlyPressedKeys[39])
    {
        var quaternion = quat.create();
        quat.setAxisAngle(quaternion, initUp, 0.005);
        quat.normalize(quaternion, quaternion);
        quat.multiply(mainQuat, quaternion, mainQuat);
        quat.normalize(mainQuat, mainQuat);
        vec3.transformQuat(eyePt, initEyePt, mainQuat);
        vec3.normalize(viewDir, eyePt);
        vec3.scale(viewDir, viewDir, -1);
    }//end right arrow
}//end handleKeys


/*
 * Function:    draw
 * Description: draw call that applies matrix transformations to model and draws model in frame. draw() also calls drawBox and drawTeapot if the teapot is ready to be rendered
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function draw() { 
    var transformVec = vec3.create();
    var scaleVec = vec3.create();
    //var rotationMatrix = mat4.create();
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
 
    //Draw 
    mvPushMatrix();
    
    var rotationMatrix = mat4.create();
    mat4.rotateY(rotationMatrix, rotationMatrix, modelYRotationRadians);
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uRotMatrix"), false, rotationMatrix);
    vec3.set(transformVec,0.0,0.0,-10.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    setMatrixUniforms();
    vec3.add(viewPt, eyePt, viewDir);
    mat4.lookAt(mvMatrix, eyePt, viewPt, up);
    uploadLightsToShader([0,15,0],[0.0, 0.0, 0.0],[0.5, 0.5, 0.5],[0.5, 0.5, 0.5]);
    
    drawBox();
    

    if (teapot_ready == true)
    {
        mat4.rotateY(mvMatrix, mvMatrix, modelYRotationRadians);
        drawTeapot();
    }//enf if ready to draw
    
    mvPopMatrix();
  
}//end draw


/*
 * Function:    drawBox
 * Description: Similar as given drawCube()
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function drawBox(){

    gl.uniform1f(gl.getUniformLocation(shaderProgram, "skybox"), true);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "cubeSampler"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}//end drawBox




/*
 * Function:    setupTextures
 * Description: Sets each box wall to an image and calls loadCubeMapFace
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupTextures()
{
    // initializing the cubeTexture
    cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture); 
	
	// texture parameters
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    
    // loading faces
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
          cubeTexture, "Yokohama/posx.jpg");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,    
         cubeTexture, "Yokohama/negx.jpg");    
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
        cubeTexture, "Yokohama/posy.jpg");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
       cubeTexture, "Yokohama/negy.jpg");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
       cubeTexture, "Yokohama/posz.jpg");  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
       cubeTexture, "Yokohama/negz.jpg");
  
}//end setupTextures


/*
 * Function:    loadCubeMapFace
 * Description: Loads images to each face of the box
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function loadCubeMapFace(gl, target, texture, url)
{
    var image = new Image();
    image.onload = function()
    {
    	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    image.src = url;
}//end loadCubeMapFace


/*
 * Function:    isPowerOf2
 * Description: checks wether the value passed in is a power of 2
 * Inputs:      value
 * Outputs:     NONE
 * Return:      0 on success
 */
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


/*
 * Function:    handleTextureLoaded
 * Description: texture handling. Generating mipmap and sets texture parameters.
 * Inputs:      image, Image for cube application; texture, texture Texture for cube application
 * Outputs:     NONE
 * Return:      NONE
 */
function handleTextureLoaded(image, texture) {
  console.log("handleTextureLoaded, image = " + image);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
     console.log("Loaded power of 2 texture");
  } else {
     // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     console.log("Loaded non-power of 2 texture");
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}


/*
 * Function:    animate
 * Description: animation to be called from tick; updating eyeview for each tick call, looks like it moves forward unless speed too slow.
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function animate() 
{
    if (then == 0)
    {
        then = Date.now();
    }//enf if
    
    else
    {
        now = Date.now();
        // Convert to seconds
        now *= 0.001;
        // Remember the current time for the next frame.
        then = now;
    }//end else
}//end animate


/*
 * Function:    startup
 * Description: called from html code to start program
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
 function startup() 
{
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    setupShaders();
    setupBuffers();
    setupTextures();
    
    tick();
}//end startup


/*
 * Function:    tick
 * Description: called for every animation frame
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function tick() 
{
    requestAnimFrame(tick);
    handleKeys();
    draw();
    animate();
}//end tick
