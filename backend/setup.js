#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Prof Sale Backend...\n');

// Create necessary directories
const directories = [
  'logs',
  'uploads',
  'uploads/products',
  'uploads/profiles',
  'uploads/business',
  'uploads/receipts',
  'dist',
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory already exists: ${dir}`);
  }
});

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log(
      '⚠️  Please update the .env file with your actual configuration values',
    );
  } else {
    console.log('❌ .env.example file not found');
  }
} else {
  console.log('📄 .env file already exists');
}

// Create gitignore if it doesn't exist
const gitignorePath = path.join(process.cwd(), '.gitignore');
const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Uploads
uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
*.tmp
*.temp
`;

if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Created .gitignore file');
} else {
  console.log('📄 .gitignore file already exists');
}

// Create nodemon.json if it doesn't exist
const nodemonPath = path.join(process.cwd(), 'nodemon.json');
const nodemonConfig = {
  watch: ['src'],
  ext: 'ts,json',
  ignore: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
  exec: 'ts-node src/app.ts',
  env: {
    NODE_ENV: 'development',
  },
};

if (!fs.existsSync(nodemonPath)) {
  fs.writeFileSync(nodemonPath, JSON.stringify(nodemonConfig, null, 2));
  console.log('✅ Created nodemon.json configuration');
} else {
  console.log('📄 nodemon.json already exists');
}

// Create eslint config if it doesn't exist
const eslintPath = path.join(process.cwd(), '.eslintrc.json');
const eslintConfig = {
  extends: ['@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
};

if (!fs.existsSync(eslintPath)) {
  fs.writeFileSync(eslintPath, JSON.stringify(eslintConfig, null, 2));
  console.log('✅ Created .eslintrc.json configuration');
} else {
  console.log('📄 .eslintrc.json already exists');
}

// Create prettier config if it doesn't exist
const prettierPath = path.join(process.cwd(), '.prettierrc');
const prettierConfig = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
};

if (!fs.existsSync(prettierPath)) {
  fs.writeFileSync(prettierPath, JSON.stringify(prettierConfig, null, 2));
  console.log('✅ Created .prettierrc configuration');
} else {
  console.log('📄 .prettierrc already exists');
}

// Create jest config if it doesn't exist
const jestPath = path.join(process.cwd(), 'jest.config.js');
const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};
`;

if (!fs.existsSync(jestPath)) {
  fs.writeFileSync(jestPath, jestConfig);
  console.log('✅ Created jest.config.js');
} else {
  console.log('📄 jest.config.js already exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update your .env file with actual database credentials');
console.log('2. Create your MySQL database:');
console.log('   mysql -u root -p -e "CREATE DATABASE prof_sale;"');
console.log('3. Run the database schema:');
console.log('   mysql -u root -p prof_sale < database/schema.sql');
console.log('4. Install dependencies:');
console.log('   npm install');
console.log('5. Start the development server:');
console.log('   npm run dev');
console.log('\n💡 Pro tip: Check the logs/ directory for application logs');
console.log(
  '📚 API Documentation will be available at: http://localhost:5000/health',
);
