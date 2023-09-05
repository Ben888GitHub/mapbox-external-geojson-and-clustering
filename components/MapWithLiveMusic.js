import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

const dark = 'mapbox://styles/benryan/clkuv54ck000u01po9b59cvgr';

let mapboxMap;

const responsiveMapDesign = 'h-screen w-screen mt-5';

const MapWithLiveMusic = ({ mapboxToken }) => {
	const [coords, setCoords] = useState({
		lng: -77.02,
		lat: 38.887,
		zoom: 12.5
	});

	const [musicData, setMusicData] = useState({});

	const mapNode = useRef(null);

	const fetchLiveMusic = async () => {
		const { data } = await axios.get('/api/live-music');
		setMusicData(data);
		// return data
	};

	useEffect(() => {
		// fetchLiveMusic();
		const node = mapNode.current;

		if (typeof window === 'undefined') return;

		mapboxMap = new mapboxgl.Map({
			container: node,
			accessToken: mapboxToken,
			style: dark,
			center: [coords.lng, coords.lat],
			zoom: coords.zoom,
			pitch: 45,
			maxBounds: [
				[-77.875588, 38.50705], // Southwest coordinates
				[-76.15381, 39.548764] // Northeast coordinates
			]
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
			// check if dcmusic.live source exists
			if (!mapboxMap.getSource('dcmusic.live')) {
				mapboxMap.addSource('dcmusic.live', {
					type: 'geojson',
					data: '/api/live-music',
					cluster: true, // to enable cluster numbers and its dynamic styling
					clusterMaxZoom: 14, // Max zoom to cluster points on
					clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50),
					clusterProperties: {
						sum: ['+', ['get', 'event_count']]
					}
				});
			} else {
				mapboxMap.getSource('dcmusic.live').setData(musicData);
			}

			if (!mapboxMap.getLayer('clusters')) {
				console.log(musicData);
				// add clusters layer on the dcmusic.live source in the map
				mapboxMap.addLayer({
					id: 'clusters',
					type: 'circle',
					source: 'dcmusic.live',
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': 'rgb(229, 36, 59)',
						'circle-radius': [
							'step',
							['get', 'point_count'],
							20,
							100,
							30,
							750,
							40
						],
						'circle-opacity': 0.75,
						'circle-stroke-width': 4,
						'circle-stroke-color': '#fff',
						'circle-stroke-opacity': 0.5
					}
				});

				mapboxMap.addLayer({
					id: 'cluster-count',
					type: 'symbol',
					source: 'dcmusic.live',
					filter: ['has', 'point_count'],
					layout: {
						'text-field': '{sum}',
						'text-font': ['Open Sans Bold'],
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
						.getSource('dcmusic.live')
						.getClusterExpansionZoom(clusterId, (err, zoom) => {
							if (err) return;

							mapboxMap.easeTo({
								center: clusterCoords,
								zoom
							});
						});
				});
			}

			// * adding individual event with styling and individual point
			if (!mapboxMap.getLayer('unclustered-point')) {
				// add unclusters layer on the dcmusic.live source in the map
				mapboxMap.addLayer({
					id: 'unclustered-point',
					type: 'circle',
					source: 'dcmusic.live',
					filter: ['!', ['has', 'point_count']],
					paint: {
						'circle-radius': [
							'step',
							['get', 'event_count'],
							20,
							100,
							30,
							750,
							40
						],
						'circle-color': 'rgb(229, 36, 59)',
						'circle-opacity': 0.75,
						'circle-stroke-width': 4,
						'circle-stroke-color': '#fff',
						'circle-stroke-opacity': 0.5
					}
				});

				mapboxMap.addLayer({
					id: 'event-count',
					type: 'symbol',
					source: 'dcmusic.live',
					filter: ['!', ['has', 'point_count']],
					layout: {
						'text-field': '{event_count}', // individual event count
						'text-font': ['Open Sans Bold'],
						'text-size': 16
					},
					paint: {
						'text-color': 'white'
					}
				});

				mapboxMap.on('mouseenter', 'unclustered-point', () => {
					mapboxMap.getCanvas().style.cursor = 'pointer';
				});
				mapboxMap.on('mouseleave', 'unclustered-point', () => {
					mapboxMap.getCanvas().style.cursor = '';
				});

				mapboxMap.on('click', 'unclustered-point', (e) => {
					const coords = e.features[0].geometry.coordinates;
					console.log(e);

					const features = mapboxMap.queryRenderedFeatures(e.point, {
						layers: ['unclustered-point']
					});

					const musicTitle = features[0]?.properties?.title;

					new mapboxgl.Popup()
						.setLngLat(coords)
						.setHTML(
							`<div class="mx-auto w-52"><p class="text-center text-lg text-light">${musicTitle}</p></div>`
						)
						.addTo(mapboxMap);
				});
			}
		});
	}, []);

	// useEffect(() => {

	// }, [musicData, setMusicData]);

	return (
		<>
			<p className="lg:text-3xl md:text-3xl text-md mb-5">
				Longitude: {coords.lng} | Latitude: {coords.lat} | Zoom: {coords.zoom}
			</p>
			<div ref={mapNode} className={responsiveMapDesign} />
		</>
	);
};

export default MapWithLiveMusic;
