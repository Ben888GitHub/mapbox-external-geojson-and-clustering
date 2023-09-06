import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getAirports } from '@/utils';

import { useDebouncedCallback } from '@react-hookz/web';

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

	const [queryAirport, setQueryAirport] = useState('');

	const [loading, setLoading] = useState(false);

	const [filterAirports, setFilterAirports] = useState([]);

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

	const handleQueryAirports = useDebouncedCallback(
		async (value) => {
			// console.log(value);

			if (value.length >= 3) {
				const filteredAirports = await getAirports(value);
				// const { name, iata_code } = properties;
				// const { coordinates } = geometry;

				console.log(filteredAirports);
				setFilterAirports(filteredAirports);
			} else {
				setFilterAirports([]);
			}
			setLoading(false);
		},
		[],
		500,
		700
	);

	const handleSelectAirport = (coords) => {
		console.log(coords);
		setFilterAirports([]);
		setQueryAirport('');
		mapboxMap.flyTo({
			center: coords,
			zoom: 6, // Adjust the zoom level as needed
			essential: true // This option ensures that the animation is smooth
		});
		setCoords((currentCoords) => ({
			...currentCoords,
			lng: coords[0],
			lat: coords[1],
			zoom: 6
		}));
	};

	return (
		<>
			<p className="lg:text-3xl md:text-3xl text-md mb-5">
				Longitude: {coords.lng} | Latitude: {coords.lat} | Zoom: {coords.zoom}
			</p>
			<div className="mx-auto text-center">
				<div className="flex mx-auto align-center justify-center text-center">
					<input
						type="search"
						className="form-input rounded text-gray-700 text-xl"
						placeholder="Search Airport"
						onChange={({ currentTarget }) => {
							setQueryAirport(currentTarget.value);
							currentTarget.value.length >= 3 && setLoading(true);
							handleQueryAirports(currentTarget.value);
						}}
						value={queryAirport}
					/>
					{loading && (
						<svg
							aria-hidden="true"
							className="w-7  h-7 mt-2 ml-2 text-gray-200 animate-spin  fill-blue-600  "
							viewBox="0 0 100 101"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
								fill="currentColor"
							/>
							<path
								d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
								fill="currentFill"
							/>
						</svg>
					)}
				</div>
				{filterAirports?.length > 0 && (
					<div className=" mx-auto text-center w-64 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-b-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
						{filterAirports?.map(({ id, properties, geometry }) => (
							<button
								key={id}
								onClick={() => handleSelectAirport(geometry.coordinates)}
								type="button"
								className=" w-full px-4 py-2 font-light text-left border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white"
							>
								{properties.name}, {properties.iata_code}
							</button>
						))}
					</div>
				)}
			</div>
			<div ref={mapNode} className={responsiveMapDesign} />
		</>
	);
};

export default AirportsCluster;
