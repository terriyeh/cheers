import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const production = process.argv[2] === "production";

let context;

try {
	context = await esbuild.context({
		entryPoints: ["src/main.ts"],
		bundle: true,
		external: [
			"obsidian",
			"electron",
			"@codemirror/*",
			"moment"
		],
		format: "cjs",
		target: "es2018",
		logLevel: "info",
		sourcemap: production ? false : "inline",
		treeShaking: true,
		minify: production,
		outfile: "main.js",
		define: {
			"__DEV__": JSON.stringify(!production)
		},
		plugins: [
			sveltePlugin({
				preprocess: sveltePreprocess(),
				compilerOptions: {
					css: "injected",
					dev: !production
				}
			})
		]
	});

	if (production) {
		await context.rebuild();
		console.log("✓ Production build completed successfully");
		await context.dispose();
		process.exit(0);
	} else {
		await context.watch();
		console.log("👀 Watching for changes...");
	}

} catch (error) {
	console.error("❌ Build failed:", error.message);
	if (context) {
		await context.dispose();
	}
	process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
	console.log("\n⏹ Stopping build...");
	if (context) {
		await context.dispose();
	}
	process.exit(0);
});
