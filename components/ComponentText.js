import {config} from '../config'

import * as THREE from 'three';


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

export default class ComponentText {

    constructor(){

        this.time = new THREE.Clock()

        this._grow     = false
        this._exploded = false

        var loader = new THREE.FontLoader();

        let container = new THREE.Group()

        loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {

            let geometry = new THREE.TextGeometry('There is no one around you.', {
                font: font,
                size: .075,
                height: .001,
                curveSegments: 12,
                bevelEnabled: false,
            } );

            let material = new THREE.MeshBasicMaterial({
                color: config.text.color,
                transparent: true,
                opacity: .85,
                side: THREE.DoubleSide
            })
    
    
            let mesh = new THREE.Mesh(geometry, material)

            let box = new THREE.Box3().setFromObject(mesh);
    
            mesh.position.set(-box.getSize().x/2,0,-1)
           

            container.add(mesh)

            geometry = new THREE.TextGeometry('Open your arms to see more people.', {
                font: font,
                size: .055,
                height: .001,
                curveSegments: 12,
                bevelEnabled: false,
            } );

            material = new THREE.MeshBasicMaterial({
                color: config.text.color,
                transparent: true,
                opacity: .85,
                side: THREE.DoubleSide
            })
    
    
            mesh = new THREE.Mesh(geometry, material)

            box = new THREE.Box3().setFromObject(mesh);
    
            mesh.position.set(-box.getSize().x/2,-.125,-1)
           
            container.add(mesh)


            //Logo

            const textureLoader = new THREE.TextureLoader()
            textureLoader.crossOrigin = "Anonymous"
            textureLoader.load(

                'models/tinder.png',

                ( texture ) => {

                    geometry  = makeRoundedCornerPlane(.1, .1, 0.05)


                    material = new THREE.MeshStandardMaterial({
                        color: config.text.color,
                        transparent: true,
                        opacity: 1,
                        side: THREE.DoubleSide,
                        map: texture
                    })

                    mesh = new THREE.Mesh(geometry, material)

                    box = new THREE.Box3().setFromObject(mesh);
            
                    mesh.position.set(0,.25,-1)
                   
                    container.add(mesh)    


            })    
    
    
           
          

        } );

        return container

    }

    update(){


    }

}