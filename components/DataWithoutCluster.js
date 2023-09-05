import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const dark = 'mapbox://styles/benryan/clkuv54ck000u01po9b59cvgr';

let mapboxMap;

const responsiveMapDesign = 'h-screen w-screen mt-5';

const DataWithoutCluster = ({ mapboxToken }) => {
	const [coords, setCoords] = useState({
		lng: -103.5917,
		lat: 40.6699,
		zoom: 3
	});

	const mapNode = useRef(null);

	useEffect(() => {
		const node = mapNode.current;

		if (typeof window === 'undefined') return;

		mapboxMap = new mapboxgl.Map({
			container: node,
			accessToken: mapboxToken,
			style: dark,
			center: [coords.lng, coords.lat],
			zoom: coords.zoom
		});

		mapboxMap.on('move', () => {
			setCoords((currentCoords) => ({
				...currentCoords,
				lng: mapboxMap.getCenter().lng.toFixed(4),
				lat: mapboxMap.getCenter().lat.toFixed(4),
				zoom: mapboxMap.getZoom().toFixed(2)
			}));
		});

		// mapboxMap.on('style.load', () => {
		// 	mapboxMap.setFog({}); // Set the default atmosphere style
		// });

		mapboxMap.on('load', () => {
			if (!mapboxMap.getSource('earthquakes')) {
				mapboxMap.addSource('earthquakes', {
					type: 'geojson',
					// Use a URL for the value for the `data` property.
					data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
				});

				mapboxMap.addLayer({
					id: 'earthquakes-layer',
					type: 'circle',
					source: 'earthquakes',
					paint: {
						'circle-radius': 7,
						'circle-stroke-width': 2,
						'circle-color': '#51bbd6',
						'circle-stroke-color': 'white'
					}
				});
				mapboxMap.on('mouseenter', 'earthquakes-layer', () => {
					mapboxMap.getCanvas().style.cursor = 'pointer';
				});
				mapboxMap.on('mouseleave', 'earthquakes-layer', () => {
					mapboxMap.getCanvas().style.cursor = '';
				});
				mapboxMap.on('click', 'earthquakes-layer', (e) => {
					const coords = e.features[0].geometry.coordinates;
					console.log(coords);

					const features = mapboxMap.queryRenderedFeatures(e.point, {
						layers: ['earthquakes-layer']
					});

					console.log(features);

					const propertyId = features[0]?.properties?.id;
					new mapboxgl.Popup()
						.setLngLat(coords)
						.setHTML(
							`<div class="mx-auto w-52"><p class="text-center text-lg text-light">${propertyId}</p></div>`
						)
						.addTo(mapboxMap);
				});
			}
		});

		return () => {
			mapboxMap.remove();
			// mapboxMap.off('load', generateNewMarker);
		};
	}, []);

	return (
		<>
			<p className="lg:text-3xl md:text-3xl text-md mb-5">
				Longitude: {coords.lng} | Latitude: {coords.lat} | Zoom: {coords.zoom}
			</p>
			<div ref={mapNode} className={responsiveMapDesign} />
		</>
	);
};

export default DataWithoutCluster;
