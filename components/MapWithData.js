import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const dark = 'mapbox://styles/benryan/clkuv54ck000u01po9b59cvgr';

let mapboxMap;

const responsiveMapDesign = 'h-screen w-screen mt-5';

const MapWithData = ({ mapboxToken }) => {
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

		// * source by addSource() provides map data to render visually on the map
		mapboxMap.on('load', () => {
			// Add a new source from our GeoJSON data and set the 'cluster' option to true. GL-JS will
			// add the point_count property to your source data.
			// * source name can be anything, but it has to be the same with all Layers
			mapboxMap.addSource('earthquakes', {
				type: 'geojson', // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
				data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
				cluster: true, // to enable cluster numbers and its dynamic styling
				clusterMaxZoom: 14, // Max zoom to cluster points on
				clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
			});

			// * layer by addLayer() defines how data from addSource() will be styled
			// * https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer
			// * https://docs.mapbox.com/style-spec/reference/layers/
			mapboxMap.addLayer({
				id: 'clusters', // unique identifier that you define, must be the same as click or mouse events
				type: 'circle', // from layer types https://docs.mapbox.com/style-spec/reference/layers/#type
				source: 'earthquakes', // should be same source with addSource()

				filter: ['has', 'point_count'], // specify conditions on source features
				// https://docs.mapbox.com/style-spec/reference/layers/#filter
				// https://docs.mapbox.com/style-spec/reference/expressions/

				paint: {
					// with three steps to implement three types of circles (responsive colors):
					//   * Blue, 20px circles when point count is less than 100
					//   * Yellow, 30px circles when point count is between 100 and 750
					//   * Pink, 40px circles when point count is greater than or equal to 750
					// if you don't set color, then it will be black
					'circle-color': [
						'step', // step is the array of cluster points
						['get', 'point_count'], // to enable colors on different cluster numbers
						'#51bbd6',
						100,
						'#f1f075',
						750,
						'#f28cb1'
					],

					// * responsive colors' sizes of each cluster numbers
					'circle-radius': [
						'step',
						['get', 'point_count'],
						20,
						100,
						30,
						750,
						40
					]
				}
			});

			// * symbol layer is to represent an icon or numbers as icons
			// * the responsive circle radius (size) and colors are set in the paint
			mapboxMap.addLayer({
				id: 'cluster-count',
				type: 'symbol', // from layer types https://docs.mapbox.com/style-spec/reference/layers/#type
				source: 'earthquakes',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': ['get', 'point_count_abbreviated'],
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 16
				}
			});

			// * this is the layer that's not counted as point
			// * once you zoom in further and the points are hidden, then this will become an individual layer
			// * you can set this as a custom icon since it's individual
			mapboxMap.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'earthquakes',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#11b4da',
					'circle-radius': 7, // the size of an individual circle layer
					'circle-stroke-width': 1, // the border size of an circle layer
					'circle-stroke-color': '#fff' // the border color of an circle layer
				}
			});
		});

		// * ---

		// * function to click on any clustered circle layer
		mapboxMap.on('click', 'clusters', (e) => {
			console.log(e);

			// * Use queryRenderedFeatures to show properties of elements based on layers and filter.
			// * e.point is used as location params
			// * https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures
			const features = mapboxMap.queryRenderedFeatures(e.point, {
				layers: ['clusters']
			});

			const clusterId = features[0].properties.cluster_id;
			const clusterCoords = features[0].geometry.coordinates;
			const coords = e.features[0].geometry.coordinates;
			console.log(clusterCoords);
			console.log(coords);

			// * to get the zoom level based on specific cluster
			mapboxMap
				.getSource('earthquakes')
				.getClusterExpansionZoom(clusterId, (err, zoom) => {
					if (err) return;

					mapboxMap.easeTo({
						center: clusterCoords,
						zoom
					});
				});

			// * hardcoded zoom level
			// mapboxMap.easeTo({
			// 	center: features[0].geometry.coordinates,
			// 	zoom: 9
			// });
		});
		mapboxMap.on('mouseenter', 'clusters', () => {
			mapboxMap.getCanvas().style.cursor = 'pointer';
		});
		mapboxMap.on('mouseleave', 'clusters', () => {
			mapboxMap.getCanvas().style.cursor = '';
		});

		// * function to click on any individual circle layer
		mapboxMap.on('click', 'unclustered-point', (e) => {
			console.log(e);

			const coords = e.features[0].geometry.coordinates;
			console.log(coords);

			const features = mapboxMap.queryRenderedFeatures(e.point, {
				layers: ['unclustered-point']
			});
			console.log(features);

			new mapboxgl.Popup()
				.setLngLat(coords)
				.setHTML(`<p class="text-lg  text-center">${coords}</p>`)
				.addTo(mapboxMap);
		});

		mapboxMap.on('mouseenter', 'unclustered-point', () => {
			mapboxMap.getCanvas().style.cursor = 'pointer';
		});
		mapboxMap.on('mouseleave', 'unclustered-point', () => {
			mapboxMap.getCanvas().style.cursor = '';
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

export default MapWithData;
