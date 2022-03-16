import type { Config } from '@jest/types';

// const { defaults: tsjPreset } = require('ts-jest/presets')

// Sync object
const config: Config.InitialOptions = {
    preset: 'ts-jest',
    // preset: '@shelf/jest-mongodb',
    testEnvironment: 'node',
    moduleFileExtensions: [
        'ts',
        'js',
        'json'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__mocks__/',
        '/__tests__/',
        '/scripts/',
        '/coverage/'
    ],
    testResultsProcessor: 'jest-sonar-reporter',
    setupFiles: [
        'dotenv/config'
    ],
    // transform: tsjPreset.transform,
}

module.exports = { ...config }
