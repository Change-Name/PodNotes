<script lang="ts">
	import { Playlist } from "src/types/Playlist";
	import { PodcastFeed } from "src/types/PodcastFeed";
	import PlaylistCard from "./PlaylistCard.svelte";
	import PodcastGridCard from "./PodcastGridCard.svelte";
	import { createEventDispatcher } from "svelte";

	export let feeds: PodcastFeed[] = [];
	export let playlists: Playlist[] = [];

	const dispatch = createEventDispatcher();

	function forwardClickPlaylist({detail: {playlist, event}}: CustomEvent<{event: MouseEvent, playlist: Playlist}>) {
		dispatch("clickPlaylist", { playlist, event });
	}
</script>

<div class="podcast-grid">
	{#if playlists.length > 0}
		{#each playlists as playlist}
			<PlaylistCard playlist={playlist} on:clickPlaylist={forwardClickPlaylist} />
		{/each}
	{/if}

	{#if feeds.length > 0}
		{#each feeds.slice().sort((a, b) => {
 			const numberA = parseInt(a.title, 10);
 			const numberB = parseInt(b.title, 10);
 			const isNumA = !isNaN(numberA);
 			const isNumB = !isNaN(numberB);
 			if (isNumA && isNumB) {
 				return numberB - numberA || b.title.localeCompare(a.title, undefined, { numeric: true, sensitivity: "base" });
 			}
 			if (isNumA) return -1;
 			if (isNumB) return 1;
 			return b.title.localeCompare(a.title, undefined, { numeric: true, sensitivity: "base" });
 		}) as feed}
			<PodcastGridCard
				feed={feed}
				on:clickPodcast
			/>
		{/each}
	{:else}
		<div>
			<p>No saved podcasts.</p>
		</div>
	{/if}
</div>

<style>
	.podcast-grid {
		display: grid;
 		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		grid-auto-flow: row;
		grid-auto-rows: 1fr;
		grid-gap: 0rem;
	}
</style>
