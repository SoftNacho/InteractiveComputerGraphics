/*   Author:    Lisa Gentil
 *   File:      modeling.js
 *   Function:  generates terrain modeling, elevation
 *   Note:      terrainFromIteration: mostly given, added the normalizing chunk of code, 
 *              generateLinesFromIndexedTriangles: given code, 
 *              diamond-square algorithm explained in wikipedia page
 *              setupElevationMap instantiates array
 */



/*
 * Function:    terrainFromIteration
 * Description: iteratively generate terrain from numeric inputs
 * Inputs:      n, minimun X value, maximun X value, minimum Y value, maximum Y value, array containing vertices, array containing faces, array containing normals
 * Outputs:     NONE
 * Return:      numT
 */
function terrainFromIteration(n, minX, maxX, minY, maxY, vertexArray, faceArray, normalArray) 
{
    var elevationMap = new Array();
    setupElevationMap(n, elevationMap);

    var deltaX = (maxX - minX) / n;
    var deltaY = (maxY - minY) / n;

    
    for (var i=0;i<=n;i++)
    {
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(elevationMap[i][j]);

           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);

         }
    }


    //normalizing
    var upX = vec3.create(), upY = vec3.create();
    var downX = vec3.create(), downY = vec3.create();
    var norm = vec3.create();

    for(var i=0;i<=n-1;i++)
    {
        for(var j=0;j<=n-1;j++)
        {
      
            var vid = i*(n+1) + j;

            //uses corners and faces to generate normal vectors
            vec3.set(upX, deltaX, 0, elevationMap[i][j+1] - elevationMap[i][j]);
            vec3.set(upY, 0, deltaY, elevationMap[i+1][j] - elevationMap[i][j]);
            vec3.cross(norm, upX, upY);

            vec3.set(downX, -deltaX, 0, elevationMap[i+1][j] - elevationMap[i+1][j+1]);
            vec3.set(downY, 0, -deltaY, elevationMap[i][j+1] - elevationMap[i+1][j+1]);
            vec3.cross(norm, downX, downY);

            //summing up normal vectors to get final normals
            vidN = 3.5*vid;
            for (var z=0; z < 3; z++)
            {
                normalArray[vidN+z] = normalArray[vidN+z] + norm[z];
            }//end for vidN
            
            vidN2 = 3.5*(vid+n+1)
            for (var z=0; z < 3; z++)
            {
                normalArray[vidN2+z] = normalArray[vidN2+z] + norm[z] + downX[z]; 
            }//end vidN2
            
            vidN3 = 3.0*(vid+1)
            for (var z=0; z < 3; z++)
            {
                normalArray[vidN3+z] = normalArray[vidN3+z] + norm[z] + downX[z];
            }//end for vidN3

            vidN4 = 3.0*(vid+2)
            for (var z = 0; z < 3; z++)
            {
                normalArray[vidN4+z] = normalArray[vidN4+z] + norm[z];
            }//end for vidN4
        }//end for j
    }//end for i
  
    var norm_fact  = 0;
    for(var i=0;i<=n-1;i++)
    {
        for(var j=0;j<=n-1;j++)
        {
            var vid = i*(n+1) + j;
            
            norm_fact_sq = Math.pow(normalArray[3*vid],2) + Math.pow(normalArray[3*vid + 1],2) + Math.pow(normalArray[3*vid + 2],2);
            
            norm_fact = Math.sqrt(norm_fact_sq);
            
            //normalizing the normals (last step described in lecture slides)
            for (var z; z < 3; z++)
            {
                normalArray[2*vid+z] /= norm_fact;
            }//end for
        }//end for j
    }//end for i

    var numT=0;
    for(var i=0;i<n;i++)
    {
        for(var j=0;j<n;j++)
        {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
        }
    }
    
    return numT;
    
}


/*
 * Function:    generateLinesFromIndexedTriangles
 * Description: generating line values from faces in faceArray
 * Inputs:      array containing faces, array containing normals after generation
 * Outputs:     NONE
 * Return:      NONE
 */
function generateLinesFromIndexedTriangles(faceArray,lineArray) {
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}


/*
 * Function:    diamondSquareAlg
 * Description: diamond square algorithm used to generate the terrain
 * Inputs:      empty 2D array, x and y coordinates of eache corner (refer to wikipedia page), range of possible heights
 * Outputs:     NONE
 * Return:      NONE
 */
function diamondSquareAlg(elevationMap, x1, y1, x2, y2, x3, y3, x4, y4, size) 
{
    
    //coordinates
    if(y3 - y1 == 1)
    {
        return;
    }//end if
    
    //coor of square midpoint coords
    var midpointX = (x3 - x2) /2 + x2;
    var midpointY = (y3 - y4) /2 + y4;
    
    //DID NOT WORK, BUT GOT IT TO WORK USING REGULAR AVG AND REC CALLS
    /*
    var midDiamondX12 = (midpointX - x1) /2 + x1;
    var midDiamondY14 = (y1 - midpointY) /2 + midpointY;
    var midDiamondX34 = (x3 - midpointX) /2 + midpointX;
    var midDiamondY23 = (midpointY - y2) /2 + y2;
    */
    
    
    //inside each diamond, create a square
    squareRand = Math.random() * size;

    //for every square, take average of four corner points and add random number 
    elevationMap[midpointX][midpointY] = ((elevationMap[x1][y1] + elevationMap[x2][y2] + elevationMap[x3][y3] + elevationMap[x4][y4]) / 4) + squareRand;

    
    
/***************************DIAMOND STEP***************************/
    //inside each square, create a diamond
    
    diamondRand = Math.random() * size;

    //diamond corner left 
    //take three surounding points clockwise: top left, midpoint, bottom left
    elevationMap[midpointX][y1] = ((elevationMap[x1][y1]+ elevationMap[midpointX][midpointY] + elevationMap[x4][y4] ) / 3) + diamondRand;
    //diamond corner right
    //take three surounding points clockwise: top right, bottom right, midpoint
    elevationMap[midpointX][y2] = ((elevationMap[x2][y2] + elevationMap[x3][y3] + elevationMap[midpointX][midpointY]) / 3) + diamondRand;
    //diamond corner top
    //take three surounding points clockwise: top right, top left, midpoint
    elevationMap[x1][midpointY] = ((elevationMap[x1][y1] + elevationMap[x2][y2] + elevationMap[midpointX][midpointY]) / 3) + diamondRand;
    //diamond corner bottom
    //take three surounding points clockwise: bottom left, midpoint, bottom right
    elevationMap[x4][midpointY] = ((elevationMap[x4][y4] + elevationMap[midpointX][midpointY] + elevationMap[x3][y3]) / 3) + diamondRand;
    
    /*
    //square top left corner
    //take four surrounding point clockwise: top left, top mid, mid, left mid
    elevationMap[midDiamondX12][midDiamondY14] = ((elevationMap[x1][y1] + elevationMap[midpointX][y1] + elevationMap[midpointX][midpointY] + elevationMap[x1][midpointY]) / 4) + squareRand; 
    
    //square top right corner
    //take four surrounding point clockwise: top mid, top right, mid right, mid
    elevationMap[midDiamondX34][midDiamondY14] = ((elevationMap[midpointX][y1] + elevationMap[x4][y4] + elevationMap[midpointX][y4] + elevationMap[midpointX][midpointY]) / 4) + squareRand; 
    
    //square bottom right corner
    //take four surrounding point clockwise: mid, mid right, bottom right, mid bottom
    elevationMap[midDiamondX34][midDiamondY23] = ((elevationMap[midpointX][midpointY] + elevationMap[x3][midpointY] + elevationMap[x3][y3] + elevationMap[midpointX][y3]) / 4) + squareRand;
    
    //square bottom left corner
    //take four surrounding point clockwise: mid left, mid, bottom mid, bottom left
    elevationMap[midDiamondX12][midDiamondY23] = ((elevationMap[x1][midpointY] + elevationMap[midpointX][midpointY] + elevationMap[midpointX][y3] + elevationMap[x2][y2]) / 4) + squareRand;
    */
    
    //reduces size for height at every iteration 
    size /= 1.5;
    
/***************************SQUARE STEP****************************/
    
    //calls diamondSquareAlg with new inputs for coordinates
    //top left square
    diamondSquareAlg(elevationMap, x1, y1, x2, midpointY, midpointX, midpointY, midpointX, y4, size);
    
    //top right square
    diamondSquareAlg(elevationMap, midpointX, y1, midpointX, midpointY, x3, midpointY, x4, y4, size);
    
    //bottom right square
    diamondSquareAlg(elevationMap, midpointX, midpointY, midpointX, y2, x3, y3, x4, midpointY, size);
    
    //bottom left square
    diamondSquareAlg(elevationMap, x1, midpointY, x2, y2, midpointX, y3, midpointX, midpointY, size);
    
 
}//end of diamondSquareAlg


/*
 * Function:    setupElevationMap
 * Description: instantiate 2D array
 * Inputs:      n, 2D array
 * Outputs:     NONE
 * Return:      NONE
 */
function setupElevationMap(n, elevationMap) 
{
  for(var i = 0; i < n+1; i++)
  {
    elevationMap[i] = new Array();
    
    for(var j = 0; j < n+1; j++)
    {
      elevationMap[i][j] = 0;
    }//end for j
  }//end for i
    
  diamondSquareAlg(elevationMap, 0, 0, 0, n, n, n, n, 0, 12.5);
}//end setupElevationMap

