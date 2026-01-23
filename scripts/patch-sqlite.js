/**
 * Post-install script to patch react-native-sqlite-storage for Gradle 9+ compatibility
 * Replaces deprecated jcenter() with mavenCentral()
 */

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-sqlite-storage',
  'platforms',
  'android',
  'build.gradle',
);

if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');

  if (content.includes('jcenter()')) {
    content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
    fs.writeFileSync(buildGradlePath, content);
    console.log(
      '✅ Patched react-native-sqlite-storage for Gradle 9+ compatibility',
    );
  } else {
    console.log('ℹ️  react-native-sqlite-storage already patched');
  }
} else {
  console.log('⚠️  react-native-sqlite-storage build.gradle not found');
}
