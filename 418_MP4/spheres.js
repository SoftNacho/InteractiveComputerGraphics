/*   Author:    Lisa Gentil
*    File:      spheres.js
*    Function:  
*    Note:       
*/


//creating variables
var gl;
var canvas;
var shaderProgram;

//creating buffer for terrain geometry
var sphereVertexPositionBuffer;

//creating buffer for normals needed for shading
var sphereVertexNormalBuffer;

//setting view parameters
var eyePt = vec3.fromValues(0.0,0.0,160.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

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

//creating arrays necessary for moving particles
var spherePositionX = [];
var spherePositionY = [];
var sphereSpeedX = [];
var sphereSpeedY = [];

//creating variables needed for particles
var currSphereNum;
var maxSphereNum = 75;

var initTime = 0;

var friction = 0.85;
var gravity = -0.01;
 


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
 * Function:    uploadMaterialToShader
 * Description: 
 * Inputs:      ambient light strength, diffuse light strength, specular light strength
 * Outputs:     NONE
 * Return:      NONE
 */
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}


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
    
      shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMatColor");  
      shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMatColor");
      shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMatColor"); 
  
}//end setupShaders



/*
 * Function:    setupBuffers
 * Description: calls setupSphereBuffers
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupBuffers() 
{
    setupSphereBuffers();
}//end setupBuffers


/*
 * Function:    setupSphereBuffers
 * Description: populating buffers with data
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function setupSphereBuffers()
{
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}


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
        console.log("Up arrow")
        currSphereNum = 0;
    }//end up arrow
    
    if (currentlyPressedKeys[40])
    {
        console.log("Down arrow")
        if (currSphereNum < maxSphereNum)
        {
            currSphereNum += 1;
            //creating speed for new particle
            sphereSpeedX.push(0.01);
            sphereSpeedY.push(0.001);
            
            //updating particles position
            posX = Math.floor(Math.random() * -70) + 70;
            if (posX > 30)
            {
                posX = -posX;
            }//end posX
            
            posY = Math.floor(Math.random() * -40) + 40;
            if (posY > 30)
            {
                posY = -posY;
            }//end posY 
            
            
            spherePositionX.push(posX);
            spherePositionY.push(posY);
        }//end if enough
    }//end down arrow  
}//end handleKeys


/*
 * Function:    drawSphere
 * Description: drawSphere creates the particles to display
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function drawSphere()
{
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}


/*
 * Function:    draw
 * Description: draw call that applies matrix transformations to model and draws model in frame. draw() also calls drawBox and drawTeapot if the teapot is ready to be rendered
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function draw() 
{ 
    var transformVec = vec3.create();
    //vector to keep track of position of particle in movement
    var sphereMovemtVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    // Set up light parameters
    var Ia = vec3.fromValues(1.0,1.0,1.0);
    var Id_1 = vec3.fromValues(1.5,1.5,1.5);
    var Id_2 = vec3.fromValues(1.75,0.45,0.875);
    var Id_3 = vec3.fromValues(0.957,0.0,0.12);
    var Is = vec3.fromValues(1.0,1.0,1.0);
    
    var lightPosEye4 = vec4.fromValues(0.0,0.0,50.0,1.0);
    lightPosEye4 = vec4.transformMat4(lightPosEye4,lightPosEye4,mvMatrix);
    var lightPosEye = vec3.fromValues(lightPosEye4[0],lightPosEye4[1],lightPosEye4[2]);

    for (var i = 0; i < currSphereNum; i++)
    {
        // Set up material parameters    
        var ka = vec3.fromValues(0.3,0.3,0.0);
        var kd = vec3.fromValues(0.5,0.5,0.0);
        var ks = vec3.fromValues(0.2,0.2,0.0);
        mvPushMatrix();
        vec3.set(transformVec,10,10,10);

        //particle
        vec3.set(sphereMovemtVec, spherePositionX[i], spherePositionY[i], 0);
        mat4.translate(mvMatrix, mvMatrix, sphereMovemtVec)

        if (i % 3 == 0)
        {
            mat4.scale(mvMatrix, mvMatrix, [8, 8, 8]);
            uploadLightsToShader(lightPosEye,Ia,Id_1,Is);
        }//end if 
        
        else if (i % 3 == 1)
        {
            mat4.scale(mvMatrix, mvMatrix, [3, 3, 3]);
            uploadLightsToShader(lightPosEye,Ia,Id_2,Is);
        }//end else if
        
        else if (i % 3 == 2)
        {
            mat4.scale(mvMatrix, mvMatrix, [5, 5, 5]);
            uploadLightsToShader(lightPosEye,Ia,Id_3,Is);
        }//end else if
        
        uploadMaterialToShader(ka,kd,ks);
        setMatrixUniforms();
        drawSphere();
        mvPopMatrix();

        mvPushMatrix();         
    }//end for loop 
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
    if (initTime == 0)
    {
        then = Date.now();
        initTime = 1;
    }//enf if
    
    move();
    
    then = Date.now();
}//end animate


/*
 * Function:    move
 * Description: animates the particles
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function move()
{
    for (var i = 0; i < currSphereNum; i ++)
    {
        if (spherePositionY[i] > 60)
        {
            sphereSpeedY[i] = -0.03;
            spherePositionY[i] = 60;
        }//end if collision with ceiling
        
        else if (spherePositionY[i] < -60)
        {
            sphereSpeedY[i] = 0.3;
            spherePositionY[i] = -60;
        }//end if collision with floor
        
        spherePositionY[i] += (sphereSpeedY[i] * friction + gravity * (Date.now() - then)) * (Date.now() - then);
    }//end for i
        
    for (var i = 0; i < currSphereNum; i ++)
    {
        if (spherePositionX[i] > 70)
        {
            sphereSpeedX[i] = -0.05;
            spherePositionX[i] = 70;
        }//end if collision with right
        
        else if (spherePositionX[i] < -70)
        {
            sphereSpeedX[i] = 0.2;
            spherePositionX[i] = -70;
        }//end if collision with left
        
        spherePositionX[i] += sphereSpeedX[i] * (Date.now() - then) * friction;
        
    }//end for i
}//end move


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
    
    gl.clearColor(1.0, 0.855, 0.725, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    //creating first particle
    currSphereNum += 1;
    
    sphereSpeedX.push(0.15);
    sphereSpeedY.push(0.015);
    
    spherePositionX.push(1.0);
    spherePositionY.push(2.0);
    
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