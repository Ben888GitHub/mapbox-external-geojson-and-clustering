import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const dark = 'mapbox://styles/benryan/clkuv54ck000u01po9b59cvgr';

let mapboxMap;

const responsiveMapDesign = 'h-screen w-screen mt-5';

const geojsonUrl =
	'https://api.mapbox.com/datasets/v1/benryan/clm6kfpqh0edv2pqlj5ivt191/features?access_token=pk.eyJ1IjoiYmVucnlhbiIsImEiOiJja3ltcjM4M2YxM3doMm51ZnVpZGlldDY1In0.loY8zy26I0UH9S6CJP2wQg';

const AirportsCluster = ({ mapboxToken }) => {
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

		mapboxMap.on('load', () => {
			if (!mapboxMap.getSource('airports.data')) {
				console.log('Load Airports');
				// #4182C4
				mapboxMap.addSource('airports.data', {
					type: 'geojson', // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
					data: geojsonUrl,
					cluster: true, // to enable cluster numbers and its dynamic styling
					clusterMaxZoom: 14, // Max zoom to cluster points on
					clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
				});

				mapboxMap.addLayer({
					id: 'clusters', // unique identifier that you define, must be the same as click or mouse events
					type: 'circle',
					source: 'airports.data',
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': '#4182C4',
						'circle-radius': [
							'step',
							['get', 'point_count'],
							20,
							100,
							30,
							750,
							40
						],
						// 'circle-opacity': 0.75,
						// 'circle-stroke-width': 1.5,
						'circle-stroke-color': '#fff'
						// 'circle-stroke-opacity': 0.5
					}
				});

				mapboxMap.addLayer({
					id: 'cluster-count',
					type: 'symbol',
					source: 'airports.data',
					filter: ['has', 'point_count'],
					layout: {
						'text-field': ['get', 'point_count_abbreviated'],
						'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
						'text-size': 16
					},
					paint: {
						'text-color': 'white'
					}
				});

				mapboxMap.on('mouseenter', 'clusters', () => {
					mapboxMap.getCanvas().style.cursor = 'pointer';
				});
				mapboxMap.on('mouseleave', 'clusters', () => {
					mapboxMap.getCanvas().style.cursor = '';
				});

				mapboxMap.on('click', 'clusters', (e) => {
					const features = mapboxMap.queryRenderedFeatures(e.point, {
						layers: ['clusters']
					});

					const clusterId = features[0].properties.cluster_id;
					const clusterCoords = features[0].geometry.coordinates;

					mapboxMap
						.getSource('airports.data')
						.getClusterExpansionZoom(clusterId, (err, zoom) => {
							if (err) return;

							mapboxMap.easeTo({
								center: clusterCoords,
								zoom
							});
						});
				});

				mapboxMap.addLayer({
					id: 'unclustered-point',
					type: 'circle',
					source: 'airports.data',
					filter: ['!', ['has', 'point_count']],
					paint: {
						'circle-color': '#11b4da',
						'circle-radius': 12, // the size of an individual circle layer
						'circle-stroke-width': 1, // the border size of an circle layer
						'circle-stroke-color': '#fff' // the border color of an circle layer
					}
				});

				mapboxMap.on('mouseenter', 'unclustered-point', () => {
					mapboxMap.getCanvas().style.cursor = 'pointer';
				});
				mapboxMap.on('mouseleave', 'unclustered-point', () => {
					mapboxMap.getCanvas().style.cursor = '';
				});

				mapboxMap.on('click', 'unclustered-point', (e) => {
					const features = mapboxMap.queryRenderedFeatures(e.point, {
						layers: ['unclustered-point']
					});
					console.log(e);

					const coords = e.features[0].geometry.coordinates;
					console.log(coords);
					console.log(features);
					console.log(features[0].properties);

					const properties = features[0].properties;

					new mapboxgl.Popup()
						.setLngLat(coords)
						.setHTML(
							`<div class="mx-auto w-52">
                            <p class="text-center text-lg text-light">IATA: ${properties.iata_code}</p>
                            <p class="text-center text-lg text-light">Name: ${properties.name}</p>
                            <p class="text-center text-lg text-light">Coordinates: ${e.lngLat.lng}, ${e.lngLat.lat}</p>
                            </div>`
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

export default AirportsCluster;
