/** 
 * This represents a profile as a framed painting.
*/

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

export default class ComponentPicture {

    constructor(props) {

        this.pictures = [];

        this.meshContainer;
        this.meshFrame;
        this.meshPicture;

        return this.init(props)

    }

    init(props){

        //Init ContainerMesh
        const geometry = new THREE.BoxBufferGeometry(1.5,0.1,2.1)
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0x0000ff,
            roughness: 0.7,
            metalness: 0.0,
            transparent: true,
            opacity: 1,
            wireframe: props.container!==undefined?props.container:true
        });
        this.meshContainer = new THREE.Mesh( geometry, material );

        //Init FrameMesh

        //Load model
        new THREE.OBJLoader().load( 
            
            'models/frames/frame.obj', 
            
            ( object ) => {

            //Load texture
		    new THREE.TextureLoader().load(

                props.photo,
                
                ( texture ) => {
				
				    object.traverse((obj) => { 

					    obj.castShadow = true

                        if(obj.name=='picture') {

                            obj.material.transparent = true
                            obj.material.opacity = 0

                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;

                            let geo  = new THREE.PlaneGeometry(1,1.7)
                            let mat  = new THREE.MeshBasicMaterial()
                            let mes  = new THREE.Mesh( geo, mat )
                                //mes.material.side = THREE.DoubleSide
                                mes.material.map = texture
                                mes.scale.set(1.1,1.1,1.1)
                                mes.position.set(0,0.001,0)

                                mes.rotation.x = - Math.PI / 2;

                            object.add( mes )
                            
                        }else{
                            obj.material  = materialGold
                        }
                    })
            
                    //Add FrameMesh to container
                    this.meshContainer.add( object );

                },

                // onProgress callback currently not supported
                undefined,

                // onError callback
                function ( err ) {
                    console.error( 'An error happened.' );
                }
            );
        

        } );

        return this.meshContainer;
    }

    setPicture(){

    }
}