/*
 * Author: Lisa Gentil
 * File Description: This file takes care of the rendering of the teapot
 *
 */


/*
 * Function:    setupBuffersForTeapot
 * Description: Sets up buffers and create normals for teapot rendering
 * Inputs:      teapot_text_file, obj file
 * Outputs:     NONE
 * Return:      teapot_ready, allows rendering of the rest of the box
 */
function setupBuffersForTeapot(teapot_text_file){
    var vertexBuf = [];
    var faceBuf = [];
    var normalBuf = [];
    var faceNormalVect = [];
    var baseArray = [];
    var faceBufLen = 0;
    var vertexBufLen = 0;
    var i;
    var j;
    
	//making use of the input file
	var total_lines = teapot_text_file.split("\n");
    var total_num_lines = total_lines.length;

    
    for (i = 0; i < total_num_lines; i++){
		lines_array = total_lines[i].trim().split(' ');
		
		//if it is a vertex populate vertexBuf
		if (lines_array[0] == 'v')
        {
            for (j = 1; j < 4; j++)
            {
                vertexBuf.push(parseFloat(lines_array[j]));
                normalBuf.push(0);
            }//end for k 
		}//end if vertex
        
		//if it is a face populate faceBuf
		else if(lines_array[0] == 'f')
        {
            for (j = 2; j < 5; j++)
            {
               faceBuf.push(parseInt(lines_array[j])-1); 
            }//enf for j
		}//end if face
	}//end for i
	
    //taking length of buffer to use as number of items when binding buffers
    vertexBufLen = vertexBuf.length; 
    faceBufLen = faceBuf.length;

    
    for (i = 0; i < vertexBufLen; i++)
    {
        baseArray.push(0);
    }//end for i
        
    
    //creating normals
    for (i = 0; i < faceBufLen; i++)
    {
        //creating frequently used components
        var component1 = faceBuf[i*3];
        var component2 = faceBuf[i*3 + 1];
        var component3 = faceBuf[i*3 + 2];
        
        //creating frequently used components
        var genComponent1 = vertexBuf[3*component2]-vertexBuf[3*component1];
        var genComponent2 = vertexBuf[3*component2+1]-vertexBuf[3*component1+1];
        var genComponent3 = vertexBuf[3*component2+2]-vertexBuf[3*component1+2];
        
        //creating vector from values
        var vert1 = vec3.fromValues(genComponent1, genComponent2, genComponent3);
        
        //creating frequently used components
        var genComponent1 = vertexBuf[3*component3]-vertexBuf[3*component1];
        var genComponent2 = vertexBuf[3*component3+1]-vertexBuf[3*component1+1];
        var genComponent3 = vertexBuf[3*component3+2]-vertexBuf[3*component1+2];
        
        //creating vector from values
        var vert2 = vec3.fromValues(genComponent1, genComponent2, genComponent3);
        
        //creating normal verctor
        var normal = vec3.create();
        vec3.cross(normal, vert1, vert2);
		
        //populating faceNormals buffer
        for (j = 0; j < 3; j++)
        {
            faceNormalVect.push(normal[j]);
        }//enf for j
    }
    
//STARTING CREATION OF NORMALS    
    //summing up normals
    for (i = 0; i < faceBufLen; i++)
    {
        var v1 = faceBuf[i*3 + 0];
        baseArray[v1] += 1;
        
        var v2 = faceBuf[i*3 + 1];
        baseArray[v2] += 1;
        
        var v3 = faceBuf[i*3 + 2];
        baseArray[v3] += 1;

        for (j = 0; j < 3; j++)
        {
            normalBuf[3*v1 + j] += faceNormalVect[i*3 + j];
            normalBuf[3*v2 + j] += faceNormalVect[i*3 + j];
            normalBuf[3*v3 + j] += faceNormalVect[i*3 + j];
        }//end for j
    }
	    

    //using sum and normals of each to create average
    for (i = 0; i < vertexBufLen; i++)
    {
        for (j = 0; j < 3; j++)
        {
            normalBuf[3*i + j] = normalBuf[3*i + j] / baseArray[i];
        }//end for j
        
        var component1 = normalBuf[i*3];
        var component2 = normalBuf[i*3 + 1];
        var component3 = normalBuf[i*3 + 2];
        var normal = vec3.fromValues(component1, component2, component3);
        vec3.normalize(normal, normal);
        
        for (j = 0; j < 3; j++)
        {
            normalBuf[i*3 + j] = normal[j];
        }//end for j
    } 
	
    //binding vertices
	teapotVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexBuf), gl.STATIC_DRAW);
	teapotVertexBuffer.numItems = vertexBufLen/3;
    
	//binding faces
	teapotVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuf), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = faceBufLen/3;
	
	//binding normals
    teapotTriIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotTriIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faceBuf), gl.STATIC_DRAW);
	teapotTriIndexBuffer.numItems = faceBufLen/3;
	
    //console.log(normalBuf.length);
    
	//teapot_ready signal is high, can print rest
	teapot_ready = true;
}//end setupBuffersForTeapot


/*
 * Function:    drawTeapot
 * Description: Similar as drawBox() taken from given drawCube()
 * Inputs:      NONE
 * Outputs:     NONE
 * Return:      NONE
 */
function drawTeapot(){
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "skybox"), false);
	gl.uniform3fv(gl.getUniformLocation(shaderProgram, "viewDir"), viewDir);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);  

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotTriIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 6768, gl.UNSIGNED_SHORT, 0);
}

