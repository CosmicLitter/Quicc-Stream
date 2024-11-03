<script lang="ts">
	let { children, data } = $props();
</script>

<article>
	<!-- 	<pre> -->
	<!-- {JSON.stringify(data, null, 2)} -->
	<!-- 	</pre> -->

	{@render children()}
</article>
