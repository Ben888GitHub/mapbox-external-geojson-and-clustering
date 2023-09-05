import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const DataWithoutCluster = dynamic(
	() => import('@/components/DataWithoutCluster'),
	{
		ssr: false,
		loading: () => <p className="text-lg text-center mt-5">Loading...</p>
	}
);

const inter = Inter({ subsets: ['latin'] });

const WithoutCluster = ({ mapboxToken }) => {
	return (
		<main
			className={`flex flex-col items-center justify-between p-16 ${inter.className}`}
		>
			<div className="flex mb-5">
				<Link className="mr-7 underline cursor-pointer" href="/">
					Earthquakes Data
				</Link>
				<Link className="mr-7 underline cursor-pointer" href="/live-music">
					Live Music
				</Link>
				<Link className="underline cursor-pointer" href="/without-cluster">
					Earthquakes No Cluster
				</Link>
			</div>
			<DataWithoutCluster mapboxToken={mapboxToken} />
		</main>
	);
};

export default WithoutCluster;

export const getStaticProps = async () => {
	const mapboxToken = process.env.NEXT_MAPBOX_TOKEN;

	return {
		props: {
			mapboxToken
		}
	};
};
