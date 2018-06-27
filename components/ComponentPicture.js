/** 
 * This represents a profile as a framed painting.
*/

import * as config from '../config.json'

import * as THREE from 'three';

const materialGold = new THREE.MeshPhongMaterial( {
    side: THREE.DoubleSide,
    color: 0x564100,
    specular:0x937300,
    emissive:0xffffff,
    emissiveIntensity:.1,
    //envMap: reflectionCube,
    //displacementMap: reflectionCube,
    //combine: THREE.MixOperation,
    reflectivity: .25
});

function remapUVs(geo) {

    let max, min, offset, size, v1, v2, v3;
	
    geo.computeBoundingBox();

    min = geo.boundingBox.min;
    max = geo.boundingBox.max;

    offset = new THREE.Vector2(0 - min.x, 0 - min.y);
    size = new THREE.Vector2(max.x - min.x, max.y - min.y);
	
    geo.faceVertexUvs[0] = [];

    geo.faces.forEach(face => {
		
      v1 = geo.vertices[face.a];
      v2 = geo.vertices[face.b];
	  v3 = geo.vertices[face.c];
	  
      geo.faceVertexUvs[0].push([new THREE.Vector2((v1.x + offset.x) / size.x, (v1.y + offset.y) / size.y), new THREE.Vector2((v2.x + offset.x) / size.x, (v2.y + offset.y) / size.y), new THREE.Vector2((v3.x + offset.x) / size.x, (v3.y + offset.y) / size.y)]);
	
	});

    return geo.uvsNeedUpdate = true;
  };

function makeRoundedCornerPlane(width=1, height=1.7, radius=1, smooth=16){

	const geometry = new THREE.Geometry()

	const _width = width
	const _height = height

	const _radius = .125
	const _smooth = 16

	const cornerA = new THREE.CircleGeometry(radius, smooth, (Math.PI * 2 / 4) * 1, Math.PI * 2 / 4);
	const matrixA = new THREE.Matrix4();
	matrixA.makeTranslation(-width/2, height/2, 0)
	geometry.merge(cornerA, matrixA)

	const cornerB = new THREE.CircleGeometry(radius, smooth, (Math.PI * 2 / 4) * 0, Math.PI * 2 / 4);
	const matrixB = new THREE.Matrix4();
	matrixB.makeTranslation(width/2, height/2, 0)
        geometry.merge(cornerB, matrixB)

	const cornerC = new THREE.CircleGeometry(radius, smooth, (Math.PI * 2 / 4) * 2, Math.PI * 2 / 4);
	const matrixC = new THREE.Matrix4();
	matrixC.makeTranslation(-width/2, -height/2, 0)
	geometry.merge(cornerC, matrixC)

	const cornerD = new THREE.CircleGeometry(radius, smooth, (Math.PI * 2 / 4) * 3, Math.PI * 2 / 4);
	const matrixD = new THREE.Matrix4();
	matrixD.makeTranslation(width/2, -height/2, 0)
	geometry.merge(cornerD, matrixD)

	const planeHorizontal = new THREE.PlaneGeometry(width+radius*2, height)
	geometry.merge(planeHorizontal)

	const planeVertical = new THREE.PlaneGeometry(width, height+radius*2)
	geometry.merge(planeVertical)
    
    remapUVs(geometry)
    
    return geometry
}

let count = 0



let geo  = makeRoundedCornerPlane(1, 1.7, 0.125)
let mat  = new THREE.MeshBasicMaterial()
const roundedCornerPlane = new THREE.Mesh( geo, mat )
roundedCornerPlane.material.side = THREE.DoubleSide

export default class ComponentPicture {

    constructor(props) {

        this.pictures = [];

        this.meshContainer;
        this.meshFrame;
        this.meshPicture;


        this.meshTexture;
        this.meshTextures = [];
        this.meshTexturesPointer = 0;

        return this.init(props)

    }

    init(props){

        //Pass Images
        this.meshTextures = props.images!==undefined?props.images:[]

        //Init ContainerMesh
        const geometry = new THREE.BoxBufferGeometry(1,.1,1.7)
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0x0000ff,
            roughness: 0.7,
            metalness: 0.0,
            transparent: true,
            opacity: props.containerOpacity!==undefined?props.containerOpacity:0,
            wireframe: props.containerWireframe!==undefined?props.containerWireframe:true
        });
        this.meshContainer = new THREE.Mesh( geometry, material );

        //Apply position if given
        this.meshContainer.position.set(
            props.position.x,
            props.position.y,
            props.position.z      
        )

        //Apply rotation if given
        this.meshContainer.rotation.set(
            props.rotation.x,
            props.rotation.y,
            props.rotation.z      
        )

         //Apply rotation if given
         this.meshContainer.scale.set(
            props.scale.x,
            props.scale.y,
            props.scale.z      
        )

        //Init FrameMesh

        //Load model
        //new THREE.OBJLoader().load( 
            
        //    'models/frames/frame.obj', 
            
        //    ( object ) => {

            const textureLoader = new THREE.TextureLoader()
            textureLoader.crossOrigin = "Anonymous"
            textureLoader.load(

                this.meshTextures[this.meshTexturesPointer],

                ( texture ) => {
				
				    //object.traverse((obj) => { 

					    //obj.castShadow = true

                        //if(obj.name=='picture') {

                            //obj.material.transparent = true
                            //obj.material.opacity = 0

                            //Canvas
                            /*var geo  = new THREE.PlaneGeometry(1.25,1.7)
                            //var mat  = materialGold
                            var mat  = new THREE.MeshBasicMaterial({color:0xffffff})
                            var mes  = new THREE.Mesh( geo, mat )
                                mes.material.side = THREE.DoubleSide
                                mes.scale.set(1.1,1.1,1.1)
                                mes.position.set(0,0.006,0)

                                mes.rotation.x = - Math.PI / 2;

                            if(config.picture.frame)    
                            this.meshContainer.add( mes )*/

                            //Picture
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;

                            var geo  = makeRoundedCornerPlane(1, 1.7, 0.125)
                            var mat  = new THREE.MeshBasicMaterial()
                            
                            this.meshPicture  = new THREE.Mesh( geo, mat )
                            this.meshPicture.material.side = THREE.DoubleSide
                            
                            this.meshTexture = texture
                            
                            this.meshPicture.material.map = this.meshTexture
                            this.meshPicture.scale.set(.75,.75,.75)
                                //mes.position.set(0,0.007,0)
                                //mes.rotation.x = - Math.PI / 2;
                            this.meshPicture.rotation.x = - Math.PI / 2;
                            this.meshPicture.castShadow = true

                            this.meshContainer.add( this.meshPicture )
                            
                        //}else{
                        //    obj.material  = materialGold
                        //}
                    //})
            
                    //Add FrameMesh to container
                    //if(config.picture.frame)    
                    //this.meshContainer.add( object );

                },

                // onProgress callback currently not supported
                undefined,

                // onError callback
                function ( err ) {
                    console.error( 'An error happened.' );
                }
            
            );
        

        //} );

        this.meshContainer.userData.count = count
        count++

        return this;
    }

    getMesh(){
        return this.meshContainer;
    }

    setTexture(){

        this.meshTexturesPointer = this.meshTexturesPointer<this.meshTextures.length-1?this.meshTexturesPointer+1:0

        const textureLoader = new THREE.TextureLoader()
        textureLoader.crossOrigin = "Anonymous"

        textureLoader.load(

            this.meshTextures[this.meshTexturesPointer],

            ( texture ) => {

                this.meshTexture = texture

                this.meshPicture.material.map = this.meshTexture

                this.meshPicture.material.needsUpdate = true;
            
            }
        )

    }
}