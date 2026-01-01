import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA mode
			precompress: false,
			strict: true
		}),
		paths: {
			base: ''
		},
		prerender: {
			// Ignore dynamic routes that can't be prerendered
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
