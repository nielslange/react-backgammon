export default async function RoomPage( {
	params,
}: {
	params: Promise< { code: string } >;
} ) {
	const { code } = await params;
	return (
		<section className="mx-auto max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
			<h1 className="mb-2 font-display text-2xl font-semibold">Room { code.toUpperCase() }</h1>
			<p className="text-muted">Online play is not available yet.</p>
		</section>
	);
}
