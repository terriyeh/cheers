/** Allow TypeScript to resolve GIF imports — esbuild inlines them as base64 data URLs at build time. */
declare module '*.gif' {
	const src: string;
	export default src;
}
