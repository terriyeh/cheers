import { readFileSync, writeFileSync, renameSync, unlinkSync } from "fs";
import { resolve, basename } from "path";

/**
 * Validates a semver version string
 * @param {string} version - Version to validate
 * @returns {boolean} True if valid semver
 */
function isValidVersion(version) {
	if (!version || typeof version !== 'string') return false;
	const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
	return semverRegex.test(version);
}

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} Parsed JSON object
 * @throws {Error} If file cannot be read or parsed
 */
function readJSONFile(filePath) {
	try {
		// Prevent path traversal
		const resolvedPath = resolve(filePath);
		const fileName = basename(resolvedPath);
		if (!['manifest.json', 'versions.json'].includes(fileName)) {
			throw new Error(`Invalid file path: ${fileName}. Only manifest.json and versions.json are allowed.`);
		}

		const content = readFileSync(resolvedPath, "utf8");
		if (!content.trim()) {
			throw new Error(`File ${fileName} is empty`);
		}

		const parsed = JSON.parse(content);
		if (!parsed || typeof parsed !== 'object') {
			throw new Error(`File ${fileName} does not contain a valid JSON object`);
		}

		return parsed;
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw new Error(`File not found: ${filePath}`);
		}
		throw error;
	}
}

/**
 * Safely writes JSON to a file using atomic write
 * @param {string} filePath - Path to write to
 * @param {Object} data - Data to write
 * @throws {Error} If file cannot be written
 */
function writeJSONFile(filePath, data) {
	const resolvedPath = resolve(filePath);
	const fileName = basename(resolvedPath);
	const tempPath = `${resolvedPath}.tmp`;

	try {
		// Write to temporary file first
		writeFileSync(tempPath, JSON.stringify(data, null, "\t") + "\n", "utf8");

		// Atomic rename
		renameSync(tempPath, resolvedPath);
	} catch (error) {
		// Clean up temp file if it exists
		try {
			unlinkSync(tempPath);
		} catch {}
		throw new Error(`Failed to write ${fileName}: ${error.message}`);
	}
}

// Main execution
try {
	// Validate target version from environment
	const targetVersion = process.env.npm_package_version;
	if (!targetVersion) {
		throw new Error('npm_package_version environment variable is not set. Run this script via npm version command.');
	}

	if (!isValidVersion(targetVersion)) {
		throw new Error(`Invalid version format: "${targetVersion}". Expected semver format (e.g., 1.0.0)`);
	}

	console.log(`Bumping version to ${targetVersion}...`);

	// Update manifest.json
	const manifest = readJSONFile("manifest.json");

	if (!manifest.id || typeof manifest.id !== 'string') {
		throw new Error('manifest.json missing required "id" field');
	}

	if (!manifest.minAppVersion || !isValidVersion(manifest.minAppVersion)) {
		throw new Error('manifest.json missing or invalid "minAppVersion" field');
	}

	const { minAppVersion } = manifest;
	manifest.version = targetVersion;
	writeJSONFile("manifest.json", manifest);
	console.log(`✓ Updated manifest.json: version=${targetVersion}`);

	// Update versions.json
	const versions = readJSONFile("versions.json");

	if (Array.isArray(versions)) {
		throw new Error('versions.json should be an object, not an array');
	}

	versions[targetVersion] = minAppVersion;
	writeJSONFile("versions.json", versions);
	console.log(`✓ Updated versions.json: ${targetVersion} → ${minAppVersion}`);

	console.log('Version bump completed successfully!');
	process.exit(0);

} catch (error) {
	console.error('❌ Version bump failed:', error.message);
	process.exit(1);
}
