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

        //Init FrameMesh

        //Load model
        new THREE.OBJLoader().load( 
            
            'models/frames/frame.obj', 
            
            ( object ) => {

            const textureLoader = new THREE.TextureLoader()
            textureLoader.crossOrigin = "Anonymous"
            textureLoader.load(

                props.photo,

                ( texture ) => {
				
				    object.traverse((obj) => { 

					    obj.castShadow = true

                        if(obj.name=='picture') {

                            obj.material.transparent = true
                            obj.material.opacity = 0

                            //Canvas
                            var geo  = new THREE.PlaneGeometry(1.25,1.7)
                            //var mat  = materialGold
                            var mat  = new THREE.MeshBasicMaterial({color:0xffffff})
                            var mes  = new THREE.Mesh( geo, mat )
                                mes.material.side = THREE.DoubleSide
                                mes.scale.set(1.1,1.1,1.1)
                                mes.position.set(0,0.006,0)

                                mes.rotation.x = - Math.PI / 2;

                            if(config.picture.frame)    
                            this.meshContainer.add( mes )

                            //Picture
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;

                            var geo  = new THREE.PlaneGeometry(1,1)
                            var mat  = new THREE.MeshBasicMaterial()
                            var mes  = new THREE.Mesh( geo, mat )
                                mes.material.side = THREE.DoubleSide
                                mes.material.map = texture
                                mes.scale.set(0.85, 0.85, 0.85)
                                mes.position.set(0,0.007,0)
                                mes.rotation.x = - Math.PI / 2;

                            this.meshContainer.add( mes )
                            
                        }else{
                            obj.material  = materialGold
                        }
                    })
            
                    //Add FrameMesh to container
                    if(config.picture.frame)    
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