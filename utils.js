export const getAirports = async (query) => {
	const axios = (await import('axios')).default;

	// console.log(query);
	const { data } = await axios.get(
		'https://api.mapbox.com/datasets/v1/benryan/clm6kfpqh0edv2pqlj5ivt191/features?access_token=pk.eyJ1IjoiYmVucnlhbiIsImEiOiJja3ltcjM4M2YxM3doMm51ZnVpZGlldDY1In0.loY8zy26I0UH9S6CJP2wQg'
	);

	// console.log(query);

	// console.log(data.features);
	const filteredAirports = data.features.filter(({ properties }) => {
		// console.log(properties);
		return properties?.name.toLowerCase().includes(query.toLowerCase());
	});

	// console.log(filteredAirports.slice(0, 5));
	return filteredAirports.slice(0, 5);
};
