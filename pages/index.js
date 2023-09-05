import Image from 'next/image';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

const MapWithData = dynamic(() => import('@/components/MapWithData'), {
	ssr: false,
	loading: () => <p className="text-lg text-center mt-5">Loading...</p>
});

const inter = Inter({ subsets: ['latin'] });

export default function Home({ mapboxToken }) {
	return (
		<main
			className={`flex flex-col items-center justify-between p-16 ${inter.className}`}
		>
			<p className="text-xl lg:text-3xl md:text-3xl mb-5">
				Mapbox External GeoJSON with Clustering
			</p>
			<MapWithData mapboxToken={mapboxToken} />
		</main>
	);
}

export const getStaticProps = async () => {
	const mapboxToken = process.env.NEXT_MAPBOX_TOKEN;

	return {
		props: {
			mapboxToken
		}
	};
};
