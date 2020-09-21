/*   Author:    Lisa Gentil
*    File:      MP2_1.js
*    Function:  Creates terrain, handles keys, creates movements
*    Note:       
*/

//creating variables
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

//creating buffer for terrain geometry
var tVertexPositionBuffer;

//creating buffer for normals needed for shading
var tVertexNormalBuffer;

//creating buffer for terrain triangles
var tIndexTriBuffer;

//creating buffer for triangle edges
var tIndexEdgeBuffer;

//setting view parameters
var eyePt = vec3.fromValues(5.0,3.0,0.0);
var viewDir = vec3.fromValues(0.0,-0.25,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(500.0,200.0,0.0);

//creating normal vect
var nMatrix = mat3.create();

//creating ModelView mat
var mvMatrix = mat4.create();

//creating projection mat
var pMatrix = mat4.create();

//creating new var
var mvMatrixStack = [];

//creating new var for user interaction
var currentlyPressedKeys = {};

//initial value of fog
var fog = 1;

//initial speed of plane
var speed = 0.025;

/*
 * Function:    setupTerrainBuffers
 * Description: fills terrain buffers for terrain generation
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupTerrainBuffers() 
{
    
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var gridN=128;
    
    var numT = terrainFromIteration(gridN, -50,50,-50,50, vTerrain, fTerrain, nTerrain);
    console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain), gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain), gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain), gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
   
}//end setupTerrainBuffers


/*
 * Function:    drawTerrain
 * Description: drawing terrain from filled buffers
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function drawTerrain()
{
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}//end drawTerrain


/*
 * Function:    drawTerrainEdges
 * Description: drawing edges of terrain from the edge buffer
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function drawTerrainEdges()
{
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}//end drawTerrainEdges


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
  shaderProgram.uniformFog = gl.getUniformLocation(shaderProgram, "fog");
}//end setupShaders



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
  gl.uniform1f(shaderProgram.uniformFog, fog);
}// end uploadLightsToShader


/*
 * Function:    setupBuffers
 * Description: populating buffers with data
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupBuffers() 
{
    setupTerrainBuffers();
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
 * Function:    fogKey
 * Description: setting fog to NOT value when space bar pressed
 * Inputs:      event
 * Outputs:     NONE
 * Return:      NONE
 */
function fogKey(event)
{
    if(event.keyCode == "32")
    {
        fog = !fog;
    }//end if fog
}//end fogKey

/*
 * Function:    handleKeys
 * Description: making plane "move" up, down, right, left and rolling arounf Y-axis, faster, slower
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function handleKeys() 
{
    //if up arrow key pressed, pitches up
    if (currentlyPressedKeys[38]) 
    {
        eyePt[1] += 0.2; 
    }//end pitch up
    
    //if down arrow pressed, pitches down
    else if (currentlyPressedKeys[40]) 
    {
        eyePt[1] -= 0.2;
    }//end pitch down 
    
    //if left arrow key pressed, rolls left
    if (currentlyPressedKeys[37]) 
    {
        var radian_val = -degToRad(0.2);
        var curr_quaternion = quat.create([0.0, 0.0, 0.0, 1.0]);
        quat.setAxisAngle(curr_quaternion, viewDir, radian_val);
        vec3.transformQuat(up, up, curr_quaternion);
        vec3.normalize(up, up);
    }//end rolls left 
    
    //if right arrow key pressed, rolls right
    else if (currentlyPressedKeys[39]) 
    {
        var radian_val = degToRad(0.2);
        var curr_quaternion = quat.create([0.0, 0.0, 0.0, 1.0]);
        quat.setAxisAngle(curr_quaternion, viewDir, radian_val);
        vec3.transformQuat(up, up, curr_quaternion);
        vec3.normalize(up, up);
    }//end rolls right 
    
    //if + key is pressed, increase speed by 1.05
    if (currentlyPressedKeys[187])
    {
        speed *= 1.05;
    }//end faster
    
    //if - key pressed, decrease speed by 1.05
    else if (currentlyPressedKeys[189])
    {
        speed /= 1.05;
        
    }//end slower
    
    //if A key pressed, moves left horizontally
    if (currentlyPressedKeys[65]) 
    {
        eyePt[0]-= 0.2;
    }//end left
    
    //if D key pressed, moves right horizontally
    else if (currentlyPressedKeys[68]) 
    {
        eyePt[0]+= 0.2;
    }//end right
    
}//end handleKeys


/*
 * Function:    draw
 * Description: draw call that applies matrix transformations to model and draws model in frame
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function draw() 
{ 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,-45.0,-80.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-55));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(5));     
    setMatrixUniforms();
   
    uploadLightsToShader([0,1,1],[0.30,0.30,0.30],[0.40,0.40,0.40],[0.20,0.20,0.20]);
    drawTerrain();
    
    uploadLightsToShader([0,1,1],[0.80,0.80,0.80],[0.80,0.80,0.80],[0.80,0.80,0.80]);
    //drawTerrainEdges();     //TO ERASE EDGES, COMMENT LINE OUT
    
    mvPopMatrix();  
}//end draw


/*
 * Function:    animate
 * Description: animation to be called from tick; updating eyeview for each tick call, looks like it moves forward unless speed too slow.
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function animate() 
{
    //if speed too close to 0.0, goes backwards
    if (speed < 0.02)
    {
        eyePt[2] += 0.2;
    }//end go backwards if too slow
    
    else
    {
       eyePt[2] -= 0.2 * speed; 
    }//end go forward  
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
    setupShaders();
    setupBuffers();
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.enable(gl.DEPTH_TEST);
    window.addEventListener('keydown', fogKey, false);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
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
